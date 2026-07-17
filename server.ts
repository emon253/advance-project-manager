import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // API route for AI text enhancement
  app.post("/api/enhance", async (req, res) => {
    try {
      const { text, type, action } = req.body; // type can be 'title', 'description', 'checklist', 'comment'
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text field is required and must be a string." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      let systemInstruction = "You are an AI assistant that improves writing. You make texts grammatically correct, professional, and clear. Avoid adding conversational filler or introduction—only return the final improved text. Keep the format concise.";
      
      if (type === "title") {
        systemInstruction = "You are a professional task/project titles editor. Given a draft title, correct any grammar or spelling mistakes, and make it clear, professional, action-oriented, and extremely concise (maximum 6-8 words). Return ONLY the clean, corrected title without any surrounding quotes, preambles, or conversational text.";
      } else if (type === "description") {
        systemInstruction = "You are an AI assistant that enhances project/task descriptions. Correct spelling/grammar, format it professionally with neat phrasing, and make it crisp and clear. Return ONLY the enhanced description without any comments, introduction, or quotes.";
      } else if (type === "checklist") {
        systemInstruction = "You are a task checklist editor. Improve the draft checklist item to be active, action-oriented, and concise. Correct grammar, typos, and style. Return ONLY the improved checklist item text (no checkboxes, no bullet symbols, no intro).";
      } else if (type === "comment") {
        systemInstruction = "You are a professional communication assistant. Refine the given project feedback or comment to be polite, constructive, clear, and professional, while preserving its core message and mentions (e.g., keeping @username intact). Return ONLY the refined comment text.";
      }

      // Apply action modifier to system instructions
      if (action === "concise") {
        systemInstruction += " STRICT REQUIREMENT: Make the output extremely short, concise, direct and to-the-point, removing any unnecessary words.";
      } else if (action === "expand") {
        systemInstruction += " STRICT REQUIREMENT: Expand the text, fleshing out core concepts with clear, professional bullet points or detailed sentences where appropriate.";
      } else if (action === "professional") {
        systemInstruction += " STRICT REQUIREMENT: Make the tone highly polished, corporate, articulate, and professional, suitable for executive communication.";
      } else if (action === "grammar") {
        systemInstruction += " STRICT REQUIREMENT: Focus strictly on correcting typos, grammar issues, punctuation, and slight phrasing improvements while maintaining the original length, tone, and core style.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Improve the following text: "${text}"`,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const enhancedText = response.text?.trim() || text;
      res.json({ enhancedText });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to process text with AI." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
