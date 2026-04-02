/**
 * INSECURE: NET_HTTP_NO_TLS Vulnerability
 * Issue: Using HTTP instead of HTTPS for network communication
 * OWASP 2024 M3: Insecure Communication
 * Severity: HIGH
 * 
 * This code demonstrates INSECURE practices that allow cleartext traffic
 * without TLS/SSL encryption.
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';

async function bootstrapInsecure() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('core-service')
    .setDescription('The core-service API')
    .setVersion('1.0')
    .addTag('core-service')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, documentFactory);

  // ❌ VULNERABILITY: Running on plain HTTP without TLS
  // No HTTPS enforcement, no SSL/TLS certificates
  // Network communication is unencrypted (cleartext traffic allowed)
  // Sensitive data (passwords, tokens, PII) transmitted in plain text
  // Vulnerable to:
  //   - Man-in-the-Middle (MITM) attacks
  //   - Packet sniffing
  //   - Session hijacking
  //   - Data interception
  await app.listen(process.env.PORT ?? 3000);

  console.log(`
    ⚠️  WARNING: Application running on INSECURE HTTP
    - No TLS/SSL encryption
    - Cleartext traffic allowed
    - Vulnerable to MITM attacks
    - Data can be intercepted
  `);
}

bootstrapInsecure();
