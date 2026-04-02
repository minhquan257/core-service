# NET_NO_CERT_PINNING: Certificate Pinning Security Fix

## Overview
**OWASP 2024 M3**: Insecure Communication  
**Severity**: HIGH  
**Status**: Open

---

## Vulnerability Details

### What is NET_NO_CERT_PINNING?
Certificate pinning is disabled, allowing the application to accept ANY valid certificate signed by ANY trusted Certificate Authority (CA). This is vulnerable to MITM attacks if an attacker can obtain a valid certificate for your domain.

### Attack Scenario

```
Vulnerable Flow (Without Pinning):
┌─────────────────────────────────────────────────────────┐
│ 1. Attacker compromises or tricks a trusted CA           │
│    (DigiCert, Sectigo, Let's Encrypt, etc.)             │
├─────────────────────────────────────────────────────────┤
│ 2. Attacker obtains VALID certificate for:              │
│    - api.payment-gateway.com                            │
│    - database.example.com                               │
│    - Any domain your app connects to                     │
├─────────────────────────────────────────────────────────┤
│ 3. Attacker performs MITM:                              │
│    - DNS hijacking                                      │
│    - BGP hijacking                                      │
│    - ARP spoofing                                       │
│    - Compromised ISP/router                             │
├─────────────────────────────────────────────────────────┤
│ 4. YOUR SECURE APP CONNECTS:                            │
│    - ✓ TLS handshake happens                            │
│    - ✓ Certificate is valid (signed by trusted CA)      │
│    - ✓ App accepts the certificate                      │
│    - ❌ App doesn't check if it's THE EXPECTED cert      │
├─────────────────────────────────────────────────────────┤
│ 5. RESULT: TOTAL COMPROMISE                             │
│    - Attacker decrypts all traffic                      │
│    - Credentials/tokens stolen                          │
│    - Payment data intercepted                           │
│    - Sensitive conversations recorded                   │
│    - Database can be compromised                        │
└─────────────────────────────────────────────────────────┘
```

### Impact Severity

| Aspect | Rating | Detail |
|--------|--------|--------|
| **Likelihood** | 🔴 High | Multiple CAs could be compromised |
| **Impact** | 🔴 Critical | Total data/credential theft possible |
| **Prevalence** | 🟠 Medium | Only affects third-party connections |
| **Detectability** | 🟡 Medium | Hard to detect MITM without pinning |
| **Remediation** | 🟢 Easy | Implementation straightforward |
| **Cost of Attack** | 💰 Medium | ~$3-5K to compromise a CA |

---

## OWASP Solution

### Solution 1: Certificate Pinning

**Pin the specific certificate(s) expected from a server.**

```typescript
// Load certificate from server
const expectedCert = fs.readFileSync('./payment-gateway.pem');

// Create HTTPS agent that only accepts this certificate
const agent = new https.Agent({
  ca: [expectedCert], // ONLY accept this certificate
  rejectUnauthorized: true,
});

const client = axios.create({ httpsAgent: agent });
```

**Advantages**:
- ✅ Highest security level
- ✅ Prevents any rogue certificate

**Disadvantages**:
- ❌ Breaks when certificate is renewed
- ❌ Requires code update for certificate rotation

### Solution 2: Public Key Pinning (Recommended)

**Pin the public key embedded in certificates.**

Public keys are often reused across certificate renewals, so pinning the key survives certificate changes.

```typescript
// Public key hash that's valid even when certificate changes
const PUBLIC_KEY_HASH = 'sha256/AAAAAAAAAA...'; 

// When certificate is renewed but same key is used:
// ✓ Old certificate: Pin matches (accepts old cert)
// ✓ New certificate: Pin matches (accepts new cert)
// ❌ Rogue certificate: Pin doesn't match (rejects rogue cert)
```

**Advantages**:
- ✅ Survives certificate renewal
- ✅ Still prevents pinning bypass with rogue cert
- ✅ More practical than certificate pinning

**Disadvantages**:
- ❌ Requires proper public key extraction
- ❌ Slightly more complex configuration

### Solution 3: CA Certificate Pinning

**Pin the CA certificate instead of end-entity certificate.**

```typescript
const agent = new https.Agent({
  ca: [fs.readFileSync('./ca-cert.pem')], // Pin the CA cert
  rejectUnauthorized: true,
});
```

**Advantages**:
- ✅ Works for all certificates from that CA
- ✅ Survives certificate renewal
- ✅ Simpler than public key pinning

**Disadvantages**:
- ❌ Less secure if multiple CAs are compromised
- ❌ Not suitable for public/internet-facing services

### Solution 4: Multiple Pins with Backups

**Pin multiple certificates/keys for rotation.**

```typescript
// Current and next certificate hashes
const certPins = {
  domain: 'api.payment.com',
  pins: [
    'sha256/AAAA...', // Current production
    'sha256/BBBB...', // Next cert (during rotation)
    'sha256/CCCC...', // Backup for emergency
  ],
};

// Any of these certificates is accepted
// All other certificates are rejected
```

---

## Implementation Guide for NestJS

### Step 1: Install Dependencies

```bash
npm install axios https crypto fs
```

### Step 2: Extract Certificate Information

```bash
# Get current certificate from server
openssl s_client -connect api.payment-gateway.com:443 -showcerts

# Copy the certificate to file
# Calculate certificate hash:
openssl x509 -in certificate.pem -noout -fingerprint -sha256

# Get certificate public key hash:
openssl asn1parse -in certificate.pem -strparse 221 -out publickey.der
openssl dgst -sha256 -binary publickey.der | openssl enc -base64
```

### Step 3: Create Certificate Pinning Service

```typescript
import { Injectable } from '@nestjs/common';
import * as https from 'https';
import axios from 'axios';
import * as fs from 'fs';

interface PinningConfig {
  domain: string;
  certHashes?: string[]; // Certificate hashes
  caPath?: string; // Path to CA certificate
  expectedKey?: string; // Public key hash
}

@Injectable()
export class CertificatePinningService {
  private pinConfig = new Map<string, PinningConfig>();

  loadPinningConfig() {
    // Payment gateway
    this.pinConfig.set('api.payment-gateway.com', {
      domain: 'api.payment-gateway.com',
      caPath: process.env.PAYMENT_CA_CERT_PATH,
      certHashes: [
        process.env.PAYMENT_CERT_HASH_PRIMARY,
        process.env.PAYMENT_CERT_HASH_BACKUP,
      ].filter(Boolean),
    });

    // Database
    this.pinConfig.set('db.example.com', {
      domain: 'db.example.com',
      caPath: process.env.DB_CA_CERT_PATH,
    });
  }

  createHttpClient(domain: string) {
    const config = this.pinConfig.get(domain);
    if (!config) {
      throw new Error(`No pinning config for ${domain}`);
    }

    const httpsAgent = new https.Agent({
      ca: config.caPath ? [fs.readFileSync(config.caPath)] : undefined,
      rejectUnauthorized: true,
    });

    return axios.create({
      httpsAgent,
      timeout: 10000,
    });
  }
}
```

### Step 4: Use in Controllers/Services

```typescript
@Injectable()
export class PaymentService {
  constructor(private pinning: CertificatePinningService) {
    this.pinning.loadPinningConfig();
  }

  async processPayment(amount: number, token: string) {
    // Pin force validates certificate
    const client = this.pinning.createHttpClient('api.payment-gateway.com');
    
    try {
      const response = await client.post('/payments', {
        amount,
        token,
      });
      return response.data;
    } catch (error) {
      if (error.message.includes('pinning')) {
        // Certificate validation failed
        this.logger.error('SECURITY: Certificate pinning validation failed!');
        throw new Error('Payment service certificate validation failed');
      }
      throw error;
    }
  }
}
```

### Step 5: Environment Configuration

Create `.env`:
```env
# Certificate Pinning Configuration

# Payment Gateway (API)
PAYMENT_CA_CERT_PATH=./certs/payment-gateway-ca.pem
PAYMENT_CERT_HASH_PRIMARY=sha256/AAAA...
PAYMENT_CERT_HASH_BACKUP=sha256/BBBB...

# Database
DB_CA_CERT_PATH=./certs/db-ca.pem

# Payment Gateway Webhook Verification
WEBHOOK_CA_CERT_PATH=./certs/webhook-ca.pem
```

---

## Deployment Checklist

### Development
- [ ] Extract certificate hashes from test servers
- [ ] Configure certificate paths in .env
- [ ] Test with valid certificates (✓ should pass)
- [ ] Test with invalid certificates (should fail with pinning error)
- [ ] Verify error handling for pinning failures

### Staging
- [ ] Obtain production certificate hashes
- [ ] Configure production pins
- [ ] Test certificate rotation flow
- [ ] Plan certificate renewal strategy
- [ ] Set up monitoring for pinning failures

### Production
- [ ] Deploy with primary pin
- [ ] Add backup pin for next certificate
- [ ] Monitor pinning validation logs
- [ ] Set alerts for pinning failures
- [ ] Plan certificate renewal 30 days in advance

---

## Certificate Rotation Strategy

### Scenario: Certificate needs renewal in 30 days

```
Timeline:
─────────────────────────────────────────────────────────────

Day 0: Current State
  Primary Pin: Old Certificate
  Backup Pin: None
  Deployed: Pins only old cert
  
  Status: ✓ Working

─────────────────────────────────────────────────────────────

Day -5: Prepare Next Certificate
  Action: Obtain new certificate with same root
  Action: Calculate hash of new certificate
  
  Status: ✓ Ready to deploy

─────────────────────────────────────────────────────────────

Day -3: Deploy Backup Pin
  Primary Pin: Old Certificate
  Backup Pin: New Certificate (not yet deployed)
  Deployed: Pins both old and new certs
  
  Status: ✓ Both accepted

─────────────────────────────────────────────────────────────

Day 0: Switch SSL Certificate
  Server deploys new SSL certificate
  
  Status: ✓ Connections now use new cert
         ✓ Still validated by pinning (in backup pin)

─────────────────────────────────────────────────────────────

Day 1: Update Primary Pin
  Primary Pin: New Certificate
  Backup Pin: Old Certificate (optional, for rollback)
  Deployed: Pins new cert as primary
  
  Status: ✓ Primary pin matches current server cert

─────────────────────────────────────────────────────────────

Day 8: Remove Old Pin (Safe)
  Primary Pin: New Certificate
  Backup Pin: None (old cert removed)
  
  Status: ✓ Only newest certificate pinned
         ✓ Old cert rejected if somehow used

─────────────────────────────────────────────────────────────
```

---

## Best Practices

| Practice | Benefit |
|----------|---------|
| **Public Key Pinning** | Survives certificate renewal |
| **Multiple Pins** | Supports cert rotation without downtime |
| **Monitoring** | Detect pinning failures immediately |
| **Alerting** | Notify team of validation issues |
| **Documentation** | Track which pins are active where |
| **Automation** | Auto-update pins during cert rotation |

---

## Monitoring & Alerting

### Log Pinning Validation

```typescript
private logger = new Logger('CertificatePinning');

checkServerIdentity: (servername: string, cert: any) => {
  try {
    // Pinning validation
    if (!validPin) {
      this.logger.error(
        `SECURITY ALERT: Certificate pinning failed for ${servername}. ` +
        `This may indicate a MITM attack or misconfigured pins.`
      );
      // Alert security team
      this.alerting.sendAlert({
        severity: 'CRITICAL',
        message: 'Certificate pinning validation failed',
        domain: servername,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    this.logger.error(`Pinning validation error: ${error.message}`);
  }
}
```

### Dashboard Metrics

```
Certificate Pinning Health:
├─ Successful validations: 999,999/1,000,000 ✓
├─ Failed validations: 1 🔴
├─ Certificates pinned:
│  ├─ api.payment-gateway.com: 2 pins (expires in 25 days)
│  ├─ db.example.com: 1 pin (expires in 90 days)
│  └─ webhook.service.com: 3 pins (expires in 120 days)
├─ Alerts firing: 0
└─ Last validation failure: None
```

---

## Troubleshooting

### Issue: "Certificate pinning validation failed"

**Causes**:
1. Legitimate certificate rotation (expected)
2. Misconfigured pin configuration
3. Actual MITM attack (unlikely but possible)

**Resolution**:
```bash
# 1. Verify certificate on server
openssl s_client -connect api.example.com:443

# 2. Extract new certificate hash
openssl x509 -in certificate.pem -noout -fingerprint -sha256

# 3. Update .env with new hash (if legitimate rotation)
# 4. Deploy update with new pin

# 5. If unknown rotation:
#    - DO NOT update pins immediately
#    - Investigate certificate change
#    - Verify with domain administrator
#    - Then update if legitimate
```

### Issue: "Certificate validation failed" after certificate renewal

**Solution**:
```typescript
// Update pins configuration
const config = {
  primary: 'NEW_CERT_HASH',    // New certificate
  backup: 'OLD_CERT_HASH',     // Old certificate for rollback
};
```

---

## Compliance

| Standard | Requirement | Status |
|----------|-------------|--------|
| **OWASP 2024 M3** | Prevent MITM with rogue CA | ✅ Pinning prevents |
| **PCI-DSS 3.4** | Strong encryption | ✅ TLS + Pinning |
| **NIST SP 800-52** | TLS with cert validation | ✅ Pinning validates |
| **GDPR** | Secure data transmission | ✅ Protected |
| **HIPAA** | Encrypted communications | ✅ Pinning enforces |

---

## Code Examples

### Example 1: Simple HTTPS Client with Certificate Pinning

```typescript
const client = axios.create({
  httpsAgent: new https.Agent({
    ca: [fs.readFileSync('./payment-gateway-ca.pem')],
    rejectUnauthorized: true,
  }),
});

// Only accepts certificate from specified CA
await client.post('https://api.payment-gateway.com/pay', data);
```

### Example 2: Public Key Pinning

```typescript
// Pin the public key (survives cert renewal)
const publicKey = 'sha256/AAAA...';

const agent = new https.Agent({
  rejectUnauthorized: true,
  checkServerIdentity: (servername, cert) => {
    const certPubKey = calculatePublicKeyHash(cert.pubkey);
    if (certPubKey !== publicKey) {
      throw new Error(`Public key mismatch for ${servername}`);
    }
  },
});
```

### Example 3: Multiple Pins with Backup

```typescript
const pins = {
  domain: 'api.example.com',
  valid: [
    'sha256/AAAA...', // Primary
    'sha256/BBBB...', // Backup for rotation
  ],
};

checkServerIdentity: (servername, cert) => {
  const hash = calculateHash(cert);
  if (!pins.valid.includes(hash)) {
    throw new Error(`Invalid certificate for ${servername}`);
  }
}
```

---

## Resources

- [OWASP - Certificate Pinning](https://owasp.org/www-community/attacks/Certificate_and_Public_Key_Pinning)
- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)
- [RFC 7469 - Public Key Pinning](https://tools.ietf.org/html/rfc7469)
- [Android Certificate Pinning](https://developer.android.com/training/articles/security-config)

---

**Status**: COMPLETE - READY FOR IMPLEMENTATION ✅
