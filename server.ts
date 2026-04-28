import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getGenAI = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is missing. Please set it in the platform Settings.");
    }
    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI({ apiKey });
  };

  const handleAIError = (error: any, res: any, prefix: string) => {
    console.error(`[${prefix}] Error:`, error);
    if (error.message?.includes("API key not valid")) {
      return res.status(401).json({ 
        error: "The provided GEMINI_API_KEY is invalid. Please check your API key in Settings." 
      });
    }
    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  };

  // AI Intelligence Routes
  app.post("/api/intelligence/optimize", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const { Type } = await import("@google/genai");
      const genAI = await getGenAI();
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
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
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      handleAIError(error, res, "Optimize API");
    }
  });

  app.post("/api/intelligence/find-media", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const { Type } = await import("@google/genai");
      const genAI = await getGenAI();

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
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
      } as any);

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      handleAIError(error, res, "MediaFinder API");
    }
  });

  app.post("/api/intelligence/proxy", async (req, res) => {
    try {
      const genAI = await getGenAI();
      const { prompt, systemInstruction, responseSchema, model: modelName = "gemini-1.5-flash" } = req.body;
      
      const config: any = {
        responseMimeType: responseSchema ? "application/json" : "text/plain",
      };

      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          ...config,
          systemInstruction,
        }
      });

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
