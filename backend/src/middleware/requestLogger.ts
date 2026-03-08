import { Request, Response, NextFunction } from 'express';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function statusColor(status: number): string {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  if (status >= 300) return COLORS.cyan;
  return COLORS.green;
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health checks to reduce noise
  if (req.path === '/api/health') { next(); return; }

  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

  // Capture original end to log after response
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = statusColor(status);

    const userId = (req as any).user?.id?.slice(0, 8) || '-';
    const method = req.method.padEnd(6);
    const path = req.originalUrl;

    console.log(
      `${COLORS.dim}${timestamp}${COLORS.reset} ${color}${status}${COLORS.reset} ${COLORS.magenta}${method}${COLORS.reset} ${path} ${COLORS.dim}${formatDuration(duration)}${COLORS.reset} ${COLORS.dim}[${userId}]${COLORS.reset}`,
    );

    // Log slow requests (>3s)
    if (duration > 3000) {
      console.warn(`[SLOW] ${method} ${path} took ${formatDuration(duration)}`);
    }

    return originalEnd.apply(res, args as any);
  } as any;

  next();
}
