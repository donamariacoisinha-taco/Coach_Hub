var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new import_genai.GoogleGenAI({
    apiKey: apiKey || ""
  });
  const getGenAI = () => {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing. Please set it in the platform Settings > Secrets panel.");
    }
    return ai;
  };
  async function retryWithBackoff(fn, retries = 3, delay = 1e3) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      const errorMsg = error.message || (typeof error === "string" ? error : JSON.stringify(error));
      const status = error.status || error.code || 500;
      const isTransient = status === 503 || status === 429 || errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand") || errorMsg.includes("ResourceAssembling") || errorMsg.includes("Too Many Requests") || errorMsg.includes("rate limit");
      if (isTransient) {
        console.warn(`[GEMINI] Transient error encountered: ${errorMsg}. Retrying in ${delay}ms... (Remaining retries: ${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }
  const handleAIError = (error, res, prefix) => {
    console.error(`[${prefix}] Error:`, error);
    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      return res.status(401).json({
        error: "The provided GEMINI_API_KEY is invalid. Please check and update your API key in the Settings > Secrets panel."
      });
    }
    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({
      error: error.message || "An unexpected error occurred in the AI service.",
      details: error.toString()
    });
  };
  app.post("/api/intelligence/optimize", async (req, res) => {
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
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING },
              description: { type: import_genai.Type.STRING },
              instructions: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              },
              secondary_muscles: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              },
              equipment: { type: import_genai.Type.STRING },
              difficulty_level: {
                type: import_genai.Type.STRING,
                enum: ["Iniciante", "Intermedi\xE1rio", "Avan\xE7ado", "Elite"]
              },
              quality_score_v3: { type: import_genai.Type.NUMBER },
              technical_tips: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              }
            },
            required: ["name", "description", "instructions", "quality_score_v3"]
          }
        }
      }));
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      handleAIError(error, res, "Optimize API");
    }
  });
  app.post("/api/intelligence/find-media", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const genAI = getGenAI();
      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        tools: [{ googleSearch: {} }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              main_images: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    url: { type: import_genai.Type.STRING },
                    title: { type: import_genai.Type.STRING },
                    quality_score: { type: import_genai.Type.NUMBER },
                    source: { type: import_genai.Type.STRING }
                  }
                }
              },
              videos: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    url: { type: import_genai.Type.STRING },
                    title: { type: import_genai.Type.STRING },
                    quality_score: { type: import_genai.Type.NUMBER },
                    source: { type: import_genai.Type.STRING }
                  }
                }
              },
              guides: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    url: { type: import_genai.Type.STRING },
                    title: { type: import_genai.Type.STRING },
                    quality_score: { type: import_genai.Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      }));
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      handleAIError(error, res, "MediaFinder API");
    }
  });
  app.post("/api/intelligence/proxy", async (req, res) => {
    try {
      const genAI = getGenAI();
      const { prompt, systemInstruction, responseSchema, model: modelName = "gemini-3.5-flash" } = req.body;
      const config = {
        responseMimeType: responseSchema ? "application/json" : "text/plain"
      };
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }
      const resolvedModelName = modelName === "gemini-3-flash-preview" ? "gemini-3.5-flash" : modelName;
      const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: resolvedModelName,
        contents: prompt,
        config: {
          ...config,
          systemInstruction
        }
      }));
      if (responseSchema) {
        res.json(JSON.parse(response.text || "{}"));
      } else {
        res.json({ text: response.text });
      }
    } catch (error) {
      handleAIError(error, res, "AI Proxy API");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
