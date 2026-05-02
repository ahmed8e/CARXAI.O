import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── API Routes Wrapper ──────────────────────────────────────────────────────
// This helper allows us to run Vercel-style handlers in Express
const handleVercel = (handlerPath: string) => async (req: any, res: any) => {
  try {
    const handler = (await import(handlerPath)).default;
    await handler(req, res);
  } catch (err: any) {
    console.error(`[API Error] ${handlerPath}:`, err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

// Dynamically register all routes in the api directory
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
  const files = fs.readdirSync(apiDir);
  for (const file of files) {
    if (file.endsWith('.ts') && !file.includes('tsconfig')) {
      const routeName = file.replace('.ts', '');
      const fullPath = `./api/${file}`;
      
      // Register both POST and GET for all handlers to be safe
      app.all(`/api/${routeName}`, handleVercel(fullPath));
      console.log(`[Server] Registered route: /api/${routeName}`);
    }
  }
}

// ─── Static Files ────────────────────────────────────────────────────────────
// Serve the built frontend from the dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Handle SPA routing: redirect all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log(`[Server] Serving static files from: ${distPath}`);
} else {
  console.warn(`[Server] Warning: dist directory not found. Did you run 'npm run build'?`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
});
