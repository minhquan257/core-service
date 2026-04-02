/**
 * Production-Ready HTTPS Implementation with NestJS
 * Implements OWASP 2024 M3: Insecure Communication Fix
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. HTTPS Configuration - Only in production
  let httpsOptions: Record<string, string | Buffer> | undefined;

  if (process.env.NODE_ENV === 'production') {
    // Load SSL certificates
    if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) {
      throw new Error(
        'SSL_KEY_PATH and SSL_CERT_PATH environment variables are required in production'
      );
    }

    httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };
  }

  // 2. Create NestJS application with HTTPS if available
  const app = httpsOptions
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);

  // 3. Security Middleware - HSTS and security headers
  app.use((req, res, next) => {
    // HSTS: Force HTTPS for 1 year
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Disable HTTP caching for sensitive data
    if (req.path.includes('auth') || req.path.includes('login')) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });

  // 4. Enforce HTTPS redirect (redirect HTTP to HTTPS)
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      // Check if connection is not secure
      if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.get('host')}${req.url}`);
      }
      next();
    });
  }

  // 5. Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('core-service')
    .setDescription('The core-service API')
    .setVersion('1.0')
    .addTag('core-service')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // 6. Start server
  const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 443 : 3000);
  const protocol = httpsOptions ? 'HTTPS' : 'HTTP';

  await app.listen(port, '0.0.0.0');

  console.log(`
    ✅ Application started successfully
    Protocol: ${protocol}
    Port: ${port}
    Environment: ${process.env.NODE_ENV}
    ${httpsOptions ? '✓ TLS/SSL Enabled' : '⚠️ Running on HTTP (dev mode)'}
    ${process.env.NODE_ENV === 'production' ? '✓ HSTS enabled' : ''}
  `);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
