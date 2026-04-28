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

  // AI Intelligence Routes
  app.post("/api/intelligence/optimize", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const { GoogleGenAI, Type } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
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
      console.error("[Optimize API] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/intelligence/find-media", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const { GoogleGenAI, Type } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      console.error("[MediaFinder API] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/intelligence/proxy", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseSchema, model: modelName = "gemini-1.5-flash" } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
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
      console.error("[AI Proxy API] Error:", error);
      res.status(500).json({ error: error.message });
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
