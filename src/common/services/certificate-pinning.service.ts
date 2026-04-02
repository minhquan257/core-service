/**
 * Certificate Pinning Service for NestJS
 * Implements OWASP 2024 M3: Insecure Communication
 * 
 * Provides certificate pinning capabilities for:
 * - Third-party APIs (Payment, SMS, Email gateways)
 * - Database connections
 * - Webhook verification
 * - Any external HTTPS connections
 */

import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

/**
 * Certificate or Public Key Pin Configuration
 */
export interface CertificatePin {
  domain: string;
  // Certificate or public key hashes (SHA256) - optional if using caPath
  hashes?: string[];
  // CA certificate file path (alternative to hashes)
  caPath?: string;
  // Certificate issuer name (for logging)
  issuer?: string;
  // Certificate expiry date (for monitoring)
  expiryDate?: string;
}

/**
 * Service for managing certificate pinning across the application
 */
@Injectable()
export class CertificatePinningService {
  private readonly logger = new Logger('CertificatePinning');
  private readonly pins = new Map<string, CertificatePin>();
  private readonly clients = new Map<string, AxiosInstance>();

  constructor() {
    this.loadPinningConfiguration();
  }

  /**
   * Load certificate pinning configuration from environment
   * Configuration format: PINNING_<DOMAIN>=hash1,hash2|capath|issuer|expiry
   */
  private loadPinningConfiguration() {
    // Payment Gateway
    if (process.env.PAYMENT_GATEWAY_DOM) {
      this.addPin({
        domain: process.env.PAYMENT_GATEWAY_DOMAIN || 'api.payment.com',
        hashes: (process.env.PAYMENT_CERT_HASHES || '').split(',').filter(Boolean),
        caPath: process.env.PAYMENT_CA_CERT_PATH,
        issuer: 'DigiCert',
        expiryDate: process.env.PAYMENT_CERT_EXPIRY,
      });
    }

    // Database
    if (process.env.DB_HOST) {
      this.addPin({
        domain: process.env.DB_HOST,
        caPath: process.env.DB_CA_CERT_PATH,
        issuer: 'Internal CA',
        expiryDate: process.env.DB_CERT_EXPIRY,
      });
    }

    // Webhook Service
    if (process.env.WEBHOOK_HOST) {
      this.addPin({
        domain: process.env.WEBHOOK_HOST,
        hashes: (process.env.WEBHOOK_CERT_HASHES || '').split(',').filter(Boolean),
        caPath: process.env.WEBHOOK_CA_CERT_PATH,
      });
    }

    this.logger.log(`Certificate pinning configured for ${this.pins.size} domain(s)`);
  }

  /**
   * Add a certificate pin for a domain
   */
  addPin(pin: CertificatePin) {
    this.pins.set(pin.domain, pin);
    // Clear cached client to regenerate with new pin
    this.clients.delete(pin.domain);
    this.logger.debug(`Added/updated pin for ${pin.domain}`);
  }

  /**
   * Create HTTPS agent with certificate pinning
   */
  private createPinningAgent(domain: string): https.Agent {
    const pin = this.pins.get(domain);

    if (!pin) {
      this.logger.warn(`No pin configuration for ${domain}, creating standard agent`);
      return new https.Agent({ rejectUnauthorized: true });
    }

    // Load CA certificate if specified
    const tlsOptions: any = {
      rejectUnauthorized: true,
    };

    if (pin.caPath && fs.existsSync(pin.caPath)) {
      try {
        tlsOptions.ca = [fs.readFileSync(pin.caPath)];
      } catch (error) {
        this.logger.error(`Failed to load CA certificate from ${pin.caPath}: ${error.message}`);
      }
    }

    // Add custom certificate validation
    if (pin.hashes && pin.hashes.length > 0) {
      tlsOptions.checkServerIdentity = (servername: string, cert: any) => {
        return this.validateCertificatePin(servername, cert, pin);
      };
    }

    return new https.Agent(tlsOptions);
  }

  /**
   * Validate certificate against pinned hashes
   */
  private validateCertificatePin(
    servername: string,
    cert: any,
    pin: CertificatePin
  ): Error | undefined {
    try {
      // If no hashes defined, skip hash validation (using caPath instead)
      if (!pin.hashes || pin.hashes.length === 0) {
        this.logger.debug(`No hash pins defined for ${servername}, using CA certificate pinning`);
        return undefined;
      }

      // Calculate certificate hash
      const certHash = this.getCertificateHash(cert);

      // Check if any pinned hash matches
      const isValid = pin.hashes.some((hash) => {
        const match = this.hashesMatch(certHash, hash);
        if (match) {
          this.logger.debug(`Certificate hash matched for ${servername}`);
        }
        return match;
      });

      if (!isValid) {
        const message =
          `Certificate pinning FAILED for ${servername}. ` +
          `Expected one of: [${pin.hashes.join(', ')}], ` +
          `but got: ${certHash}. ` +
          `This may indicate a MITM attack or misconfigured pins.`;

        this.logger.error(`🔴 SECURITY ALERT: ${message}`);

        // Send alert to monitoring system
        this.alertSecurityIncident({
          type: 'CERTIFICATE_PINNING_FAILURE',
          domain: servername,
          expectedHashes: pin.hashes,
          receivedHash: certHash,
          timestamp: new Date(),
          severity: 'CRITICAL',
        });

        return new Error(message);
      }

      return undefined; // Validation passed
    } catch (error) {
      this.logger.error(`Certificate validation error for ${servername}: ${error.message}`);
      return error as Error;
    }
  }

  /**
   * Calculate SHA256 hash of certificate
   */
  private getCertificateHash(cert: any): string {
    try {
      // Certificate in DER format
      const certBuffer = cert instanceof Buffer ? cert : Buffer.from(cert, 'utf8');

      // Calculate SHA256 hash
      const hash = crypto.createHash('sha256').update(certBuffer).digest('base64');

      return `sha256/${hash}`;
    } catch (error) {
      this.logger.error(`Failed to calculate certificate hash: ${error.message}`);
      throw new Error('Certificate hash calculation failed');
    }
  }

  /**
   * Check if two certificate hashes match
   * Supports formats: sha256/xxx, sha256:xxx, xxx
   */
  private hashesMatch(hash1: string, hash2: string): boolean {
    // Normalize hashes
    const normalize = (h: string) => h.replace(/^sha256[:\/]/, '').trim();
    return normalize(hash1) === normalize(hash2);
  }

  /**
   * Get or create HTTP client with pinning for domain
   */
  getClient(domain: string): AxiosInstance {
    if (!this.clients.has(domain)) {
      const agent = this.createPinningAgent(domain);

      const client = axios.create({
        httpsAgent: agent,
        timeout: parseInt(process.env.HTTP_TIMEOUT || '10000', 10),
        validateStatus: () => true, // Don't throw on any status code
      });

      // Add request logging
      client.interceptors.request.use((config) => {
        this.logger.debug(`Pinned request to ${domain} via certificate validation`);
        return config;
      });

      // Add response logging for errors
      client.interceptors.response.use((response) => {
        if (response.status >= 400) {
          this.logger.warn(
            `Request to ${domain} failed with status ${response.status}`
          );
        }
        return response;
      });

      this.clients.set(domain, client);
    }

    return this.clients.get(domain)!;
  }

  /**
   * Make HTTP request with certificate pinning
   */
  async request(
    domain: string,
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ) {
    const client = this.getClient(domain);

    try {
      return await client({
        url,
        method,
        data,
        headers,
      });
    } catch (error) {
      // Check if error is certificate-related
      if (error instanceof Error && error.message.includes('Certificate pinning')) {
        this.logger.error(`🔴 SECURITY: Certificate pinning failed for ${domain}`);
        throw new Error(
          `Certificate validation failed for ${domain}. ` +
          'This connection is not trusted.'
        );
      }

      throw error;
    }
  }

  /**
   * Extract certificate hash from PEM file
   * Useful for populating pin configuration
   */
  extractCertificateHash(certPath: string): string {
    try {
      const certPem = fs.readFileSync(certPath, 'utf8');

      // Parse PEM to get certificate data
      const certData = certPem
        .replace(/-----BEGIN CERTIFICATE-----/, '')
        .replace(/-----END CERTIFICATE-----/, '')
        .replace(/\n/g, '');

      const certBuffer = Buffer.from(certData, 'base64');
      const hash = crypto.createHash('sha256').update(certBuffer).digest('base64');

      return `sha256/${hash}`;
    } catch (error) {
      this.logger.error(`Failed to extract certificate hash from ${certPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get certificate information from file (for monitoring/alerting)
   */
  getCertificateInfo(certPath: string) {
    try {
      // In production: use proper X.509 parsing library
      // For now: provide file-based info
      const stats = fs.statSync(certPath);

      return {
        path: certPath,
        size: stats.size,
        modified: stats.mtime,
        hash: this.extractCertificateHash(certPath),
      };
    } catch (error) {
      this.logger.error(`Failed to get certificate info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Alert security incident (integrates with monitoring system)
   */
  private alertSecurityIncident(incident: any) {
    // Integration points for your monitoring/alerting system:
    // - Send to Sentry
    // - Send email alert
    // - Post to Slack
    // - Write to security log
    // - Trigger incident response

    this.logger.error(`SECURITY INCIDENT: ${JSON.stringify(incident)}`);

    // TODO: Integrate with your monitoring system
    // Example: this.monitoringService.alert(incident);
    // Example: this.emailService.sendSecurityAlert(incident);
  }

  /**
   * Health check: verify certificate pins are valid
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    pins: Array<{
      domain: string;
      status: 'valid' | 'warning' | 'expired';
      expiryDate?: string;
    }>;
  }> {
    const pinStatus = Array.from(this.pins.values()).map((pin) => {
      // Check if certificate is expiring soon (within 30 days)
      const isExpiringSoon = pin.expiryDate
        ? new Date(pin.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
        : false;

      return {
        domain: pin.domain,
        status: isExpiringSoon ? ('warning' as const) : ('valid' as const),
        expiryDate: pin.expiryDate,
      };
    });

    const hasWarning = pinStatus.some((p) => p.status === 'warning');

    return {
      status: hasWarning ? 'warning' : 'healthy',
      message: `Certificate pinning active for ${this.pins.size} domain(s)${
        hasWarning ? '. Some certificates expiring soon.' : ''
      }`,
      pins: pinStatus,
    };
  }
}

/**
 * Example usage in a service
 */
@Injectable()
export class PaymentApiService {
  constructor(
    private pinning: CertificatePinningService,
    private logger: Logger
  ) {}

  async processPayment(amount: number, token: string) {
    try {
      const response = await this.pinning.request(
        process.env.PAYMENT_GATEWAY_DOMAIN || 'api.payment.com',
        `${process.env.PAYMENT_GATEWAY_URL}/payments`,
        'POST',
        { amount, token },
        { 'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}` }
      );

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Payment API error: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Certificate')) {
        // Certificate validation failed - DO NOT PROCESS
        this.logger.error('Payment request rejected due to certificate validation failure');
        throw new Error('Payment service is not secure. Transaction cancelled.');
      }
      throw error;
    }
  }
}
