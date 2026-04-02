

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader(
      'Strict-Transport-Security',
      [
        `max-age=${process.env.HSTS_MAX_AGE || 31536000}`, // 1 year default
        process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false' ? 'includeSubDomains' : '',
        process.env.HSTS_PRELOAD !== 'false' ? 'preload' : '',
      ]
        .filter(Boolean)
        .join('; ')
    );

    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader('X-Frame-Options', 'DENY');

    res.setHeader('X-XSS-Protection', '1; mode=block');

    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
    );

    if (this.isSensitivePath(req.path)) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    res.setHeader('Server', 'Application/1.0');

    if (process.env.NODE_ENV === 'production') {
      if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        const originalUrl = req.originalUrl;
        return res.redirect(301, `https://${req.get('host')}${originalUrl}`);
      }
    }

    next();
  }

  private isSensitivePath(path: string): boolean {
    const sensitivePaths = [
      '/auth',
      '/login',
      '/register',
      '/password',
      '/token',
      '/api/auth',
      '/api/users/me',
      '/api/profile',
    ];

    return sensitivePaths.some((sensitive) => path.includes(sensitive));
  }
}


export class ProxyTrustConfig {
  static configure(app: any) {

    if (process.env.NODE_ENV === 'production') {
      app.set('trust proxy', 1);
    }
  }
}


export const HttpsCorsConfig = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600, 
};


export const RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === '/health';
  },
};

export const HelmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HSTS_PRELOAD !== 'false',
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
};
