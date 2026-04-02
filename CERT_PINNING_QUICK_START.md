# NET_NO_CERT_PINNING: Quick Implementation Guide

## 🚨 The Vulnerability

```
OWASP 2024 M3: Insecure Communication
❌ No certificate pinning = accepts ANY valid certificate from ANY CA
❌ Attacker can compromise a CA and intercept your connections
❌ You can't tell if certificate is from attacker or legitimate server
❌ Credentials, payments, data vulnerable to MITM
```

**Example**: Attacker compromises DigiCert, creates valid cert for your payment gateway, performs MITM → steals payment data

## ✅ The Solution

```
✓ Pin certificates/public keys = accept ONLY expected certificates
✓ Rejects certificates from rogue CAs
✓ Rogue CA = useless for MITM because pinning blocks them
✓ Even if entire CA compromised: your app is protected
```

---

## 🔧 5-Minute Setup

### 1. Extract Certificate Hash from Server

```bash
# Get the certificate from the server
openssl s_client -connect api.payment-gateway.com:443 -showcerts < /dev/null 2>/dev/null | \
  openssl x509 -outform DER | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64

# Copy the output, it will look like: AAAA...====
```

### 2. Save Certificate/CA Locally

```bash
# Get the certificate
openssl s_client -connect api.payment-gateway.com:443 -showcerts < /dev/null 2>/dev/null | \
  openssl x509 -outform PEM > certs/payment-gateway-ca.pem

# Get the CA certificate
openssl s_client -connect api.payment-gateway.com:443 -showcerts < /dev/null 2>/dev/null | \
  tail -1 | openssl x509 -outform PEM > certs/payment-gateway-root.pem
```

### 3. Add to Environment

```bash
# Update .env
echo "PAYMENT_CA_CERT_PATH=./certs/payment-gateway-ca.pem" >> .env
echo "PAYMENT_CERT_HASHES=sha256/YOUR_HASH_HERE" >> .env
```

### 4. Use in Your Code

```typescript
// In your service
constructor(private pinning: CertificatePinningService) {}

async processPayment(amount: number, token: string) {
  // This automatically validates certificate pinning
  const response = await this.pinning.request(
    'api.payment-gateway.com',
    'https://api.payment-gateway.com/payments',
    'POST',
    { amount, token }
  );
  return response.data;
}
```

### 5. Test It

```bash
# Should work (valid certificate)
curl --cacert certs/payment-gateway-ca.pem https://api.payment-gateway.com/health

# Should fail (invalid certificate)
curl --cacert certs/wrong-ca.pem https://api.payment-gateway.com/health
```

---

## 📊 Certificate Pinning Types

| Type | Protection | Survives Renewal | Complexity |
|------|-----------|-----------------|------------|
| **Certificate** | ✅ Very High | ❌ No | 🟢 Simple |
| **Public Key** | ✅ Very High | ✅ Yes | 🟠 Medium |
| **CA Cert** | ✅ High | ✅ Yes | 🟢 Simple |

**Recommended**: Public Key Pinning (survives certificate renewal)

---

## 🔐 Implementation Patterns

### Pattern 1: Simple CA Pinning (Easiest)

```typescript
const agent = new https.Agent({
  ca: [fs.readFileSync('./certs/payment-gateway-ca.pem')],
  rejectUnauthorized: true,
});

const client = axios.create({ httpsAgent: agent });
```

**When to use**: For services where you control the CA (internal services)

### Pattern 2: Service-Based Pinning (Enterprise)

```typescript
// Use the CertificatePinningService
constructor(private pinning: CertificatePinningService) {}

const response = await this.pinning.request(
  'api.payment-gateway.com',
  'https://api.payment-gateway.com/payments',
  'POST',
  data
);
```

**When to use**: For multiple third-party services, payment gateways, webhooks

### Pattern 3: Environment-Based Pinning (Flexible)

```typescript
// Load pins from environment variables
const pins = {
  domain: process.env.API_DOMAIN,
  caPath: process.env.CA_CERT_PATH,
  certHashes: process.env.CERT_HASHES?.split(','),
};
```

**When to use**: For different pins in dev/staging/production

---

## 📁 Which Domains Need Pinning?

### ✅ Always Pin

- **Payment Gateways** (Stripe, PayPal, etc.)
- **Authentication Services** (OAuth, SAML)
- **Banking Systems**
- **Critical APIs** (sensitive data)

### 🟡 Consider Pinning

- **Database Connections** (especially cloud DBs)
- **Email Services**
- **SMS Providers**
- **Analytics Services**
- **Webhook Receivers**

### ❌ Usually Don't Need

- **Public APIs** (weather, news)
- **CDNs** (caching services)
- **Non-sensitive external services**

---

## 🚀 Deployment Checklist

### Development
- [ ] Extract certificate from test server
- [ ] Save certificate to `certs/` directory
- [ ] Configure `.env` with certificate path
- [ ] Test connection works
- [ ] Test with wrong certificate (should fail)

### Staging
- [ ] Get production certificate hashes
- [ ] Configure production pins
- [ ] Test with real payment gateway
- [ ] Verify no connection errors
- [ ] Monitor pinning validation logs

### Production
- [ ] Deploy with certificate pins
- [ ] Monitor for pinning failures
- [ ] Set up alerts for failures
- [ ] Plan for certificate rotation
- [ ] Add backup pins 30 days before expiry

---

## ⚠️ Certificate Rotation Planning

```
Current Flow (Rogue CA can intercept):
1. Server has certificate A
2. App accepts any valid certificate
3. Attacker gets certificate B (same domain, valid CA)
4. Attacker intercepts traffic
5. ❌ App accepts certificate B

Pinning Flow (Rogue CA cannot intercept):
1. Server has certificate A (pinned)
2. App only accepts certificate A
3. Attacker gets certificate B (same domain, valid CA)
4. Attacker intercepts traffic
5. ✅ App REJECTS certificate B
```

### When Certificate Expires (Plan 30 Days Ahead)

```
Day -30: Get new certificate
         Calculate new hash
         
Day -7:  Deploy: Primary = Old, Backup = New
         Both certificates accepted
         
Day 0:   Server uses new certificate
         Still accepted (via backup pin)
         
Day +1:  Deploy: Primary = New, Backup = Old
         
Day +7:  Deploy: Only primary = New
         Old certificate rejected
         
Day +14: Certificate rotation complete
         Only new certificate accepted
```

---

## 🐛 Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Certificate pinning failed" | Rogue CA or misconfigured pin | Verify certificate hash |
| "CA cert not found" | Wrong path to certificate file | Check file path in .env |
| "Connection refused" | Service down or blocked | Check service health |
| "TLS version error" | Old TLS version | Update to TLS 1.2+ |
| "Public key mismatch" | Key rotation without backup pin | Add backup pin |

---

## ✔️ Verification Commands

### Check Certificate Hash

```bash
openssl x509 -in certificate.pem -noout -fingerprint -sha256
#Output: sha256/AAAA...
```

### Verify Pinning Works

```bash
# Should succeed
curl --cacert certs/payment-gateway-ca.pem https://api.payment-gateway.com

# Should fail
curl --cacert certs/wrong-ca.pem https://api.payment-gateway.com
# Error: certificate verify failed
```

### Extract Public Key Hash

```bash
openssl x509 -in certificate.pem -pubkey -noout | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/common/services/certificate-pinning.service.ts` | ✅ Main implementation |
| `security/samples/NET_NO_CERT_PINNING_insecure.ts` | ❌ Vulnerable example |
| `security/samples/NET_NO_CERT_PINNING_secure.ts` | ✅ Secure example |
| `security/NET_NO_CERT_PINNING_SOLUTION.md` | 📚 Full documentation |
| `.env.example` | ⚙️ Configuration template |

---

## 🎯 Success Criteria

After implementation:

- ✅ Certificate pinning is configured for payment gateway
- ✅ Pinning validation happens on every request
- ✅ Invalid certificates are rejected with clear error
- ✅ Monitoring detects pinning failures
- ✅ Certificate rotation plan is documented
- ✅ Team knows how to update pins

---

## 📊 OWASP Compliance

| Requirement | Status | Evidence |
|------------|--------|----------|
| Prevent rogue CA MITM | ✅ | Pinning blocks rogue CA |
| Certificate validation | ✅ | Pins validate certificate |
| Multi-layer protection | ✅ | Backup pins for rotation |
| Monitoring | ✅ | Pinning failure alerts |
| Documentation | ✅ | All rotation steps documented |

---

## 💡 Pro Tips

1. **Start Simple**: Use CA certificate pinning for your first service
2. **Monitor Everything**: Log all pinning validations
3. **Plan Rotation**: Add backup pins 30 days before expiry
4. **Test Regularly**: Verify pinning works with test requests
5. **Document Everything**: Keep certificate info in comments
6. **Alert Immediately**: Any pinning failure = potential attack

---

## 📞 Need Help?

- **❓ How pinning works** → See `security/NET_NO_CERT_PINNING_SOLUTION.md`
- **💻 Code examples** → See `security/samples/NET_NO_CERT_PINNING_*.ts`
- **⚙️ Configuration** → See `.env.example` for all options
- **🔧 Implementation** → See `src/common/services/certificate-pinning.service.ts`

---

## ⚡ TL;DR

```bash
# Get certificate hash
openssl s_client -connect api.payment.com:443 -showcerts < /dev/null | \
  openssl x509 -outform DER | openssl dgst -sha256 -binary | openssl enc -base64

# Add to .env
PAYMENT_CA_CERT_PATH=./certs/payment-gateway-ca.pem
PAYMENT_CERT_HASHES=sha256/YOUR_HASH_HERE

# Use in code
await this.pinning.request('api.payment.com', url, 'POST', data);

# Done! Rogue CAs are now blocked 🔐
```

---

**Remember**: No pinning = vulnerable to CA compromise ❌  
**With pinning** = secure against even compromised CAs ✅
