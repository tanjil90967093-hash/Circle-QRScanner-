import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser for base64 image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// OCR and Document Intelligence Endpoint
app.post('/api/gemini/ocr', async (req: Request, res: Response) => {
  try {
    const { imageBase64, language = 'bn,en' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    if (!ai) {
      // Graceful fallback if no API key is provided
      return res.json({
        text: 'নোটবুক / ডকুমেন্টের টেক্সট এক্সট্রাকশন সফল হয়েছে। (Gemini API key configure করলে ফুল AI OCR সক্রিয় হবে)।',
        title: 'নথি_' + new Date().toLocaleDateString('bn-BD').replace(/\//g, '-'),
        isDemo: true,
      });
    }

    // Strip data prefix if present (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `You are an expert Document OCR and Transcription engine specialized in Bengali and English documents, handwriting, receipts, and notebook pages.
1. Transcribe ALL visible text precisely from this scanned document. Support handwritten Bengali and English accurately.
2. Suggest a concise document title (maximum 4 words, e.g. "বাংলা নোটবুক অধ্যায় ৩", "দোকানের রসিদ", "গণিত সূত্রাবলি").
3. Format your output strictly in JSON:
{
  "title": "Short Document Title",
  "text": "Full transcribed text formatted nicely with line breaks",
  "summary": "Brief 1-line summary of document contents"
}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text || '{}';
    try {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } catch {
      return res.json({
        title: 'স্ক্যান করা নথি',
        text: resultText,
        summary: 'নথির বিষয়বস্তু',
      });
    }
  } catch (error: any) {
    console.error('OCR Error:', error);
    return res.status(500).json({
      error: 'Failed to process document with OCR',
      message: error?.message || 'Unknown error',
    });
  }
});

// AI Edge / Corner Refinement Endpoint (Optional smart fallback)
app.post('/api/gemini/detect-corners', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || !ai) {
      return res.status(400).json({ error: 'Image or Gemini client unavailable' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Identify the four corners of the main paper/document/notebook in this photo, excluding background bed/table/desk surfaces.
Return the coordinates as normalized percentages (0 to 100) from top-left:
{
  "tl": {"x": 5, "y": 8},
  "tr": {"x": 94, "y": 9},
  "br": {"x": 92, "y": 92},
  "bl": {"x": 6, "y": 90}
}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Document Scanner Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
