import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './server/src/config/env.ts';
import { connectDatabase } from './server/src/config/database.ts';
import { dbStore } from './server/src/services/dbStore.ts';
import apiRouter from './server/src/routes/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = ENV.PORT || 3000;

  // Initialize DB & Seed Data
  await connectDatabase();
  await dbStore.initSeed(false);

  // Middleware
  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // In development, hook into Vite's middleware
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd || !fs.existsSync(distPath)) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️ Airport Cargo & Warehouse Management System running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
