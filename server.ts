import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AuthenticatedRequest = Request & {
  user?: { id: string; email?: string | null };
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_BODY_BYTES = 20_000;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 30;
const allowedModels = new Set(["gemini-3.5-flash"]);
const rateLimitStore = new Map<string, RateLimitEntry>();

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return "";
};

const isDev = process.env.NODE_ENV !== "production";

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function sanitizePromptValue(value: unknown, fieldName: string, maxLength = MAX_BODY_BYTES): string {
  if (typeof value !== "string") return "";
  if (value.length > maxLength) {
    throw new Error(`${fieldName} is too large. Maximum allowed length is ${maxLength} characters.`);
  }
  return value;
}

function createRateLimiter() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.user?.id || req.ip || "anonymous";
    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
      next();
      return;
    }

    if (existing.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({ error: "AI request limit reached. Try again shortly." });
      return;
    }

    existing.count += 1;
    next();
  };
}

function createAuthMiddleware() {
  const supabaseUrl = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);

    if (!token) {
      if (isDev) {
        req.user = { id: "dev-user" };
        next();
        return;
      }
      res.status(401).json({ error: "Missing Authorization bearer token." });
      return;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).json({ error: "Supabase server auth configuration is missing." });
      return;
    }

    try {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: "Invalid or expired session." });
        return;
      }
      req.user = { id: data.user.id, email: data.user.email };
      next();
    } catch (err) {
      res.status(401).json({ error: "Unable to validate session." });
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "32kb" }));

  // Gemini Client Initialization
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || ""
  });

  const getGenAI = () => {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing. Please set it in the platform Settings > Secrets panel.");
    }
    return ai;
  };

  async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;
      const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      const status = error.status || error.code || 500;
      const isTransient = status === 503 || status === 429 ||
                          errorMsg.includes("503") ||
                          errorMsg.includes("UNAVAILABLE") ||
                          errorMsg.includes("high demand") ||
                          errorMsg.includes("ResourceAssembling") ||
                          errorMsg.includes("Too Many Requests") ||
                          errorMsg.includes("rate limit");
      if (isTransient) {
        if (isDev) console.warn(`[GEMINI] Transient error encountered. Retrying in ${delay}ms... (Remaining retries: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  const handleAIError = (error: any, res: Response, prefix: string) => {
    console.error(`[${prefix}] Error:`, error?.message || error);

    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      return res.status(401).json({
        error: "The configured GEMINI_API_KEY is invalid."
      });
    }

    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      return res.status(401).json({ error: error.message });
    }

    if (error.message?.includes("too large") || error.message?.includes("not allowed")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || "An unexpected error occurred in the AI service."
    });
  };

  const requireAuth = createAuthMiddleware();
  const rateLimitAI = createRateLimiter();
  app.use("/api/intelligence", requireAuth, rateLimitAI);

  // AI Intelligence Routes
  app.post("/api/intelligence/optimize", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const safePrompt = sanitizePromptValue(prompt, "prompt");
      const safeSystemInstruction = sanitizePromptValue(systemInstruction, "systemInstruction", 10_000);
      const genAI = getGenAI();

      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: safePrompt,
        config: {
          systemInstruction: safeSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              secondary_muscles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              equipment: { type: Type.STRING },
              difficulty_level: {
                type: Type.STRING,
                enum: ['Iniciante', 'Intermediário', 'Avançado', 'Elite']
              },
              quality_score_v3: { type: Type.NUMBER },
              technical_tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['name', 'description', 'instructions', 'quality_score_v3']
          }
        }
      }));

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      handleAIError(error, res, "Optimize API");
    }
  });

  app.post("/api/intelligence/find-media", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const safePrompt = sanitizePromptValue(prompt, "prompt");
      const safeSystemInstruction = sanitizePromptValue(systemInstruction, "systemInstruction", 10_000);
      const genAI = getGenAI();

      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: safePrompt,
        tools: [{ googleSearch: {} }] as any,
        config: {
          systemInstruction: safeSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              main_images: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING },
                    title: { type: Type.STRING },
                    quality_score: { type: Type.NUMBER },
                    source: { type: Type.STRING }
                  }
                }
              },
              videos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING },
                    title: { type: Type.STRING },
                    quality_score: { type: Type.NUMBER },
                    source: { type: Type.STRING }
                  }
                }
              },
              guides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING },
                    title: { type: Type.STRING },
                    quality_score: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      } as any));

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      handleAIError(error, res, "MediaFinder API");
    }
  });

  app.post("/api/intelligence/proxy", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const genAI = getGenAI();
      const { prompt, systemInstruction, responseSchema, model: requestedModel = "gemini-3.5-flash" } = req.body;
      const safePrompt = sanitizePromptValue(prompt, "prompt");
      const safeSystemInstruction = sanitizePromptValue(systemInstruction, "systemInstruction", 10_000);
      const resolvedModelName = requestedModel === "gemini-3-flash-preview" ? "gemini-3.5-flash" : requestedModel;

      if (!allowedModels.has(resolvedModelName)) {
        throw new Error(`Model ${resolvedModelName} is not allowed for this endpoint.`);
      }

      const config: any = {
        responseMimeType: responseSchema ? "application/json" : "text/plain",
      };

      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: resolvedModelName,
        contents: safePrompt,
        config: {
          ...config,
          systemInstruction: safeSystemInstruction,
        }
      }));

      if (responseSchema) {
        res.json(JSON.parse(response.text || '{}'));
      } else {
        res.json({ text: response.text });
      }
    } catch (error: any) {
      handleAIError(error, res, "AI Proxy API");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 catch-all pattern
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();