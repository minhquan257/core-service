/**
 * INSECURE: NET_NO_CERT_PINNING Vulnerability
 * Issue: Certificate pinning disabled - accepts any valid CA chain
 * OWASP 2024 M3: Insecure Communication
 * Severity: HIGH
 * 
 * This code demonstrates INSECURE practices that don't validate
 * certificate or public key pinning.
 */

import { HttpModule } from '@nestjs/axios';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

/**
 * ❌ VULNERABLE: HTTP Client without Certificate Pinning
 * 
 * Problems:
 * - Accepts any certificate signed by any trusted CA
 * - Vulnerable to MITM with rogue but valid CA-signed certificate
 * - No verification of expected certificate/public key
 * - Attacker with compromised CA can intercept traffic
 */
export function createInsecureHttpClient(): AxiosInstance {
  // Standard HTTPS agent - accepts ANY valid certificate
  const httpsAgent = new https.Agent({
    rejectUnauthorized: true, // Only checks if cert is valid, not if it's THE EXPECTED cert
  });

  return axios.create({
    httpsAgent,
    // ❌ No certificate pinning
    // ❌ No public key pinning
    // ❌ No validation of certificate thumbprint/hash
    // ❌ No validation of certificate issuer
    validateStatus: () => true,
  });
}

/**
 * ❌ VULNERABLE: Database Connection without Certificate Pinning
 */
export const insecureDatabaseConfig = {
  host: process.env.DB_HOST || 'db.example.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: true, // Only validates CA chain, not specific certificate
    // ❌ No certificate pinning
    // ❌ Vulnerable to rogue CA attack
    // ❌ If attacker compromises CA, they can intercept DB connections
  },
};

/**
 * ❌ VULNERABLE: Third-party API Client
 * 
 * Scenario: Calling payment gateway API (e.g., Stripe, PayPal)
 * - Even though API uses HTTPS, without pinning:
 *   - Compromised CA = compromised payment system
 *   - Attacker intercepts API calls
 *   - Credentials/sensitive data exposed
 *   - Transactions can be manipulated
 */
export class InsecurePaymentClient {
  private client: AxiosInstance;

  constructor() {
    // ❌ INSECURE: Standard HTTPS without pinning
    this.client = axios.create({
      baseURL: 'https://api.payment-gateway.com',
      httpsAgent: new https.Agent({
        rejectUnauthorized: true, // Not enough!
      }),
    });
  }

  async processPayment(amount: number, token: string) {
    // ⚠️ Payment data transmitted without certificate verification
    // If MITM attacker has valid cert: fraud possible
    return this.client.post('/payments', {
      amount,
      token, // Sensitive data unprotected from rogue CA MITM
    });
  }
}

/**
 * ❌ VULNERABLE: WebSocket Connection
 */
export function createInsecureWebSocketClient() {
  // ❌ INSECURE: No certificate pinning on WebSocket connections
  const wsAgent = new https.Agent({
    rejectUnauthorized: true, // Still vulnerable to rogue CA
  });

  return axios.create({
    httpsAgent: wsAgent,
    // Used for WebSocket upgrade requests
    // ❌ No pinning verification
  });
}

console.warn(`
  ⚠️  WARNING: Certificate Pinning NOT Implemented
  
  Vulnerabilities:
  ❌ Vulnerable to MITM with rogue but CA-signed certificate
  ❌ If attacker compromises any trusted CA: TOTAL COMPROMISE
  ❌ All encrypted communications can be intercepted
  ❌ Payment/sensitive data at risk
  ❌ No protection against certificate authority compromise
  
  Example Attack Scenario:
  1. Attacker compromises/tricks certificate authority
  2. Attacker obtains valid cert for your domain
  3. Attacker performs MITM (DNS hijacking, BGP hijacking, etc.)
  4. Your app accepts this "valid" cert
  5. All traffic is decrypted by attacker
  6. Credentials, data, payments compromised
  
  Cost to attacker: ~$3-5K to compromise a CA
  Impact: TOTAL SYSTEM COMPROMISE
`);
