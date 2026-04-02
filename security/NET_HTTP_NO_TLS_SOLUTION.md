## NET_HTTP_NO_TLS: Insecure Communication Vulnerability

### Overview
**OWASP 2024 M3**: Insecure Communication  
**Severity**: HIGH  
**Status**: Open  

---

## Vulnerability Details

### What is NET_HTTP_NO_TLS?
This vulnerability occurs when an application uses HTTP instead of HTTPS for network communication, allowing cleartext traffic without TLS/SSL encryption.

### Impact

#### Data Exposure
- **Passwords & Credentials**: Transmitted in plain text
- **Authentication Tokens**: Vulnerable to interception
- **Personal Data**: API keys, user information exposed
- **Session Data**: Session cookies can be captured

#### Attack Vectors

1. **Man-in-the-Middle (MITM) Attacks**
   - Attacker intercepts network traffic
   - Can read, modify, or inject data

2. **Packet Sniffing**
   - Passive interception of unencrypted traffic
   - Tools like Wireshark can capture all data

3. **Session Hijacking**
   - Steal JWT tokens or session cookies
   - Impersonate users

4. **Network Interception**
   - On public WiFi networks
   - Through compromised routers
   - ISP-level monitoring

### Risk Assessment

| Factor | Rating |
|--------|--------|
| **Likelihood** | High |
| **Impact** | High |
| **Overall Risk** | **CRITICAL** |
| **Affected OWASP Category** | M3: Insecure Communication |
| **Compliance** | GDPR, PCI-DSS, HIPAA violations |

---

## OWASP Solution: Enforce HTTPS & HSTS

### 1. **Implement HTTPS/TLS**

#### Prerequisites
- Valid SSL/TLS certificate (from CA like Let's Encrypt, DigiCert, etc.)
- Private key file
- Certificate file

#### Implementation Steps

**Step 1: Load SSL Certificates**
```typescript
import * as fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};
```

**Step 2: Create HTTPS Server**
```typescript
const app = await NestFactory.create(AppModule, { httpsOptions });
```

**Step 3: Run on HTTPS Port**
```typescript
await app.listen(443); // HTTPS standard port
```

### 2. **Enable HSTS (HTTP Strict-Transport-Security)**

HSTS forces browsers to always use HTTPS for your domain:

```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

**HSTS Parameters**:
- `max-age=31536000`: 1 year in seconds (recommended minimum: 1 month)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Register domain with HSTS preload list

### 3. **Additional Security Headers**

```typescript
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
```

### 4. **HTTP to HTTPS Redirect**

```typescript
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

---

## Implementation Guide for This Project

### 1. Install Required Dependencies
```bash
npm install fs https
```

### 2. Environment Variables Setup

Create `.env.production`:
```env
NODE_ENV=production
PORT=443
HTTPS_PORT=443
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secure_password
DB_DATABASE=demo
DB_SSL=true
```

### 3. Certificate Generation

#### Option A: Self-Signed Certificate (Development Only)
```bash
# Generate private key
openssl genrsa -out private-key.pem 2048

# Generate certificate (valid for 365 days)
openssl req -new -x509 -key private-key.pem \
  -out certificate.pem \
  -days 365 \
  -subj "/CN=localhost"
```

#### Option B: Let's Encrypt (Production - Recommended)
```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates location:
# - Private key: /etc/letsencrypt/live/yourdomain.com/privkey.pem
# - Certificate: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

#### Option C: Use Reverse Proxy (Recommended for Production)
Use Nginx/Apache as reverse proxy handling HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 4. Updated main.ts

The `src/main.ts` file now includes:
- ✅ HTTPS/TLS configuration
- ✅ HSTS headers
- ✅ Security middleware
- ✅ HTTP to HTTPS redirect
- ✅ Production/Development modes

### 5. Database Configuration

Ensure database SSL is also enabled in `src/app.module.ts`:
```typescript
ssl: process.env.DB_SSL === 'true' 
  ? { rejectUnauthorized: false } 
  : false,
```

---

## Verification & Testing

### 1. Check HSTS Header
```bash
curl -i https://yourdomain.com
# Look for: Strict-Transport-Security header
```

### 2. Test HTTP Redirect
```bash
curl -L http://yourdomain.com
# Should redirect to HTTPS
```

### 3. SSL/TLS Test
```bash
openssl s_client -connect yourdomain.com:443
```

### 4. SSL Labs Test
Visit: https://www.ssllabs.com/ssltest/

---

## Best Practices

| Practice | Benefit |
|----------|---------|
| **Use TLS 1.2 or higher** | Prevents known vulnerabilities |
| **Certificate from trusted CA** | Prevents self-signed warnings |
| **HSTS preload list** | Browser-level HTTPS enforcement |
| **Auto-renewal (Let's Encrypt)** | Prevents certificate expiration |
| **Pin HTTPS port 443** | Standard, expected by clients |
| **Secure database connections** | Extra encryption layer |

---

## Code Files Reference

| File | Purpose |
|------|---------|
| `security/samples/NET_HTTP_NO_TLS_insecure.ts` | ❌ Vulnerable code example |
| `security/samples/NET_HTTP_NO_TLS_secure.ts` | ✅ Secure code example |
| `src/main.ts` | ✅ Updated with HTTPS implementation |

---

## Resources

- [OWASP 2024 Top 10 - M3](https://owasp.org/Top10/)
- [NestJS HTTPS Documentation](https://docs.nestjs.com/recipes/https)
- [Let's Encrypt](https://letsencrypt.org/)
- [HSTS Preload List](https://hstspreload.org/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

## Compliance

This fix addresses compliance requirements for:
- ✅ GDPR (Data Protection)
- ✅ PCI-DSS (Payment Card Data)
- ✅ HIPAA (Healthcare Data)
- ✅ SOC 2 (Security Controls)
- ✅ ISO 27001 (Information Security)

---

## Troubleshooting

### Issue: "Certificate not valid" error
**Solution**: Use certificate from trusted CA (not self-signed in production)

### Issue: "Port 443 already in use"
**Solution**: 
```bash
# Run on different port
npm start -- --port 3443

# Or kill process using port 443
sudo lsof -i :443 | grep LISTEN
sudo kill -9 <PID>
```

### Issue: "HSTS preload error"
**Solution**: Register at https://hstspreload.org/

---

## Next Steps

1. ✅ Review the secure implementation in `src/main.ts`
2. ✅ Obtain SSL/TLS certificates
3. ✅ Configure environment variables
4. ✅ Test HTTPS connection and headers
5. ✅ Deploy to production with HSTS enabled
6. ✅ Monitor certificate expiration (set reminders)

**Status**: READY FOR IMPLEMENTATION
