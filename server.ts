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

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes: Vercel-style handlers wrapped in Express ────────────────────
// Each file in /api exports a default handler(req, res) function.
// We wrap them so they work with Express on a VPS.

async function loadAndCall(filePath: string, req: express.Request, res: express.Response) {
  try {
    // Use absolute URL for dynamic import to work correctly with tsx
    const absolutePath = path.resolve(__dirname, filePath);
    const fileUrl = `file://${absolutePath.replace(/\\/g, '/')}`;
    const mod = await import(fileUrl);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      throw new Error(`No default export found in ${filePath}`);
    }
    await handler(req, res);
  } catch (err: any) {
    console.error(`[API Error] ${filePath}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
}

// Register all API routes from the api/ directory
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
  const files = fs.readdirSync(apiDir).filter(f =>
    f.endsWith('.ts') && !f.startsWith('_') && f !== 'tsconfig.json'
  );
  for (const file of files) {
    const routeName = file.replace('.ts', '');
    const filePath = `api/${file}`;
    app.all(`/api/${routeName}`, (req, res) => loadAndCall(filePath, req, res));
    console.log(`[Server] Mounted: /api/${routeName}`);
  }
} else {
  console.warn('[Server] No api/ directory found');
}

// ── Static Frontend ─────────────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  // 1. Serve hashed assets with aggressive caching
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
    fallthrough: false // If an asset is missing, don't fall through to index.html
  }));

  // 2. Serve other static files (public folder content)
  app.use(express.static(distPath, { 
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      }
    }
  }));

  // 3. SPA fallback — ONLY for routes without extensions
  app.get('*', (req, res) => {
    // Avoid API and file requests
    const isApi = req.path.startsWith('/api/');
    const hasExtension = path.extname(req.path) !== '';
    
    if (!isApi && !hasExtension) {
      res.sendFile(path.join(distPath, 'index.html'), {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    } else if (!isApi) {
      // If it has an extension but wasn't caught by express.static, it's a 404
      res.status(404).send('Not Found');
    }
  });
  console.log(`[Server] Serving frontend from: ${distPath}`);
} else {
  console.warn('[Server] dist/ not found — run: npm run build');
}

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Server] NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`[Server] OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? '✓ set' : '✗ MISSING'}`);
  console.log(`[Server] VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL ? '✓ set' : '✗ MISSING'}`);
});
