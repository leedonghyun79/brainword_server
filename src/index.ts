import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import aiRouter from './routes/ai';
import { HttpError } from './utils/HttpError';

const app: Express = express();
import serverless from 'serverless-http';
const PORT = process.env.PORT || 3005;

app.use(
  cors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/ai', aiRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err instanceof HttpError ? err.status : 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Brain Word Server is running on port ${PORT}`);
  });
}

export const handler = serverless(app);
export default app;
