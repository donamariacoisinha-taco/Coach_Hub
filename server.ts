import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_JSON_BODY = "1mb";
const MAX_PROMPT_CHARS = 12_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 4_000;
const ALLOWED_MODELS = new Set(["gemini-3.5-flash"]);
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 20;

type AuthenticatedRequest = Request & {
  kyronUser?: {
    id: string;
    email?: string;
  };
};

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getEnv(name: string, fallback = "") {
  return process.env[name] || process.env[`VITE_${name}`] || fallback;
}

function getSupabaseServerClient() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY are required to protect AI endpoints.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const bucketKey = authHeader.startsWith("Bearer ") ? authHeader.slice(0, 48) : getClientIp(req);
  const now = Date.now();
  const current = rateLimitBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (current.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Rate limit exceeded. Please wait before making more AI requests." });
  }

  current.count += 1;
  return next();
}

async function requireAuthenticatedUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowDevBypass = process.env.NODE_ENV !== "production" && process.env.ENABLE_UNAUTHENTICATED_AI_DEV === "true";
  if (allowDevBypass) {
    req.kyronUser = { id: "dev-user", email: "dev@kyron.local" };
    return next();
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required for AI endpoints." });
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const supabaseServer = getSupabaseServerClient();
    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session." });
    }

    req.kyronUser = {
      id: data.user.id,
      email: data.user.email,
    };
    return next();
  } catch (error) {
    console.error("[AI_SECURITY] Auth guard failed:", error);
    return res.status(500).json({ error: "AI authentication guard failed." });
  }
}

function sanitizeAIInput(req: Request, res: Response, next: NextFunction) {
  const { prompt, systemInstruction, model } = req.body || {};

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "prompt is required." });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: `prompt exceeds ${MAX_PROMPT_CHARS} characters.` });
  }

  if (systemInstruction !== undefined && typeof systemInstruction !== "string") {
    return res.status(400).json({ error: "systemInstruction must be a string when provided." });
  }

  if (typeof systemInstruction === "string" && systemInstruction.length > MAX_SYSTEM_INSTRUCTION_CHARS) {
    return res.status(413).json({ error: `systemInstruction exceeds ${MAX_SYSTEM_INSTRUCTION_CHARS} characters.` });
  }

  if (model !== undefined && !ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: "Requested model is not allowed." });
  }

  return next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: MAX_JSON_BODY }));

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
        console.warn(`[GEMINI] Transient error encountered. Retrying in ${delay}ms... (Remaining retries: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  const handleAIError = (error: any, res: Response, prefix: string) => {
    console.error(`[${prefix}] Error:`, error?.message || error);
    
    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      return res.status(401).json({ error: "The configured GEMINI_API_KEY is invalid." });
    }

    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || "An unexpected error occurred in the AI service." });
  };

  const protectAI = [aiRateLimit, requireAuthenticatedUser, sanitizeAIInput];

  // AI Intelligence Routes
  app.post("/api/intelligence/optimize", protectAI, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const genAI = getGenAI();
      
      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              secondary_muscles: { type: Type.ARRAY, items: { type: Type.STRING } },
              equipment: { type: Type.STRING },
              difficulty_level: { type: Type.STRING, enum: ['Iniciante', 'Intermediário', 'Avançado', 'Elite'] },
              quality_score_v3: { type: Type.NUMBER },
              technical_tips: { type: Type.ARRAY, items: { type: Type.STRING } }
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

  app.post("/api/intelligence/find-media", protectAI, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const genAI = getGenAI();

      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        tools: [{ googleSearch: {} }] as any,
        config: {
          systemInstruction,
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

  app.post("/api/intelligence/proxy", protectAI, async (req: AuthenticatedRequest, res) => {
    try {
      const genAI = getGenAI();
      const { prompt, systemInstruction, responseSchema } = req.body;
      
      const config: any = {
        responseMimeType: responseSchema ? "application/json" : "text/plain",
      };

      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { ...config, systemInstruction }
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();