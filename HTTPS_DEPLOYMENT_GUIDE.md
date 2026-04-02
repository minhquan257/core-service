# NET_HTTP_NO_TLS: Production Deployment Guide

## Quick Start - Implementation Checklist

### ✅ Phase 1: Code Updates
- [x] Updated `src/main.ts` with HTTPS/TLS configuration
- [x] Added security middleware (`src/common/middleware/https-security.middleware.ts`)
- [x] Created certificate generation script (`scripts/generate-certificates.sh`)
- [x] Added environment configuration (``.env.example`)
- [x] Created comprehensive documentation

### ✅ Phase 2: Development Setup

```bash
# 1. Generate development certificates
chmod +x scripts/generate-certificates.sh
./scripts/generate-certificates.sh

# 2. Create .env file
cp .env.example .env
# Edit .env with your certificate paths

# 3. Install dependencies (if needed)
npm install

# 4. Start development server
npm run start:dev

# 5. Verify HTTPS is working
curl -k https://localhost:3001
```

### ✅ Phase 3: Test HTTPS Configuration

```bash
# Check HSTS header
curl -i https://localhost:3001 | grep Strict-Transport-Security

# Test all security headers
curl -i https://localhost:3001 | grep -E "^X-|Strict-Transport-Security|Content-Security-Policy"

# Verify certificate
openssl s_client -connect localhost:3001
```

---

## Production Deployment Options

### Option 1: Direct HTTPS (NestJS with Certificates)

**Best for**: Small to medium deployments

```typescript
// main.ts with direct HTTPS
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};
const app = await NestFactory.create(AppModule, { httpsOptions });
await app.listen(443);
```

**Pros**:
- Simple setup
- Full control
- Direct HTTPS

**Cons**:
- Requires root access (port 443)
- Manual certificate renewal
- Single point of failure

### Option 2: Reverse Proxy (Recommended)

**Best for**: Production, high-traffic, scalability

```nginx
# Nginx Configuration
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

**Pros**:
- Separation of concerns
- Easy certificate management (Let's Encrypt)
- Horizontal scaling
- Load balancing capability
- Automatic renewal

**Cons**:
- Additional infrastructure
- Nginx configuration learning curve

### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose HTTPS port
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('https').get('https://localhost:443/health', {rejectUnauthorized: false}, (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "443:443"
    environment:
      NODE_ENV: production
      SSL_KEY_PATH: /app/certs/private-key.pem
      SSL_CERT_PATH: /app/certs/certificate.pem
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: secure_password
      DB_DATABASE: production_db
      DB_SSL: "true"
    volumes:
      - ./certs:/app/certs:ro
    depends_on:
      - postgres
    restart: always
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: production_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
```

**Deploy**:
```bash
# With environment file
docker-compose --env-file .env.production up -d

# Logs
docker-compose logs -f app
```

---

## Let's Encrypt (Automated Certificate Management)

### Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get install certbot python3-certbot-nginx

# macOS
brew install certbot
```

### Generate Certificate

```bash
# Standalone mode
sudo certbot certonly --standalone -d yourdomain.com

# Webroot mode (with existing web server)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com

# Certificate location:
# /etc/letsencrypt/live/yourdomain.com/
# - fullchain.pem (certificate)
# - privkey.pem (private key)
```

### Auto-Renewal

```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer && sudo systemctl start certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

### Update Environment

```env
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

---

## AWS Deployment (Recommended)

### AWS Certificate Manager (ACM)

```bash
# No manual certificate management
# AWS handles validation and renewal
# Use with Application Load Balancer (ALB)
```

**ALB Configuration**:
```bash
# 1. Create ALB with HTTPS listener
# 2. Select ACM certificate
# 3. Configure target group to application (HTTP port 3000)
# 4. ALB handles SSL/TLS termination

# Application sees X-Forwarded-Proto: https from ALB
# Update main.ts to trust proxy headers
```

**Benefits**:
- Free certificates
- Auto-renewal
- Managed by AWS
- Automatic failover

---

## Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: core-service
  template:
    metadata:
      labels:
        app: core-service
    spec:
      containers:
      - name: core-service
        image: youraccount/core-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: SSL_KEY_PATH
          value: /etc/tls/private/tls.key
        - name: SSL_CERT_PATH
          value: /etc/tls/certs/tls.crt
        volumeMounts:
        - name: tls-certs
          mountPath: /etc/tls
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: tls-certs
        secret:
          secretName: core-service-tls
---
apiVersion: v1
kind: Service
metadata:
  name: core-service
spec:
  selector:
    app: core-service
  ports:
  - protocol: TCP
    port: 443
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: core-service-ingress
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: core-service-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: core-service
            port:
              number: 443
```

---

## Monitoring HTTPS Health

### Monitor Certificate Expiration

```typescript
// src/health/certificate.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

@Injectable()
export class CertificateHealthIndicator extends HealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    const certPath = process.env.SSL_CERT_PATH;

    if (!certPath || !fs.existsSync(certPath)) {
      return this.getStatus('certificate', false, {
        message: 'Certificate file not found',
      });
    }

    try {
      const execAsync = promisify(exec);
      const expiryDate = await this.getCertificateExpiryDate(certPath);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const isHealthy = daysUntilExpiry > 7; // Alert if < 7 days

      return this.getStatus('certificate', isHealthy, {
        expiresIn: `${daysUntilExpiry} days`,
        expiryDate: expiryDate.toISOString(),
      });
    } catch (error) {
      return this.getStatus('certificate', false, { error: error.message });
    }
  }

  private async getCertificateExpiryDate(certPath: string): Promise<Date> {
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(
      `openssl x509 -enddate -noout -in ${certPath}`
    );
    const expiryStr = stdout.replace('notAfter=', '').trim();
    return new Date(expiryStr);
  }
}
```

### Monitoring Commands

```bash
# Check certificate expiry
openssl x509 -enddate -noout -in certificate.pem

# Monitor logs
docker logs -f core-service | grep -E "HTTPS|TLS|SSL|Security"

# Check HSTS header
curl -i https://yourdomain.com | grep Strict-Transport-Security
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 443 in use | `sudo lsof -i :443` then kill the process |
| Certificate expired | Renew with `sudo certbot renew` |
| HSTS redirect loop | Check reverse proxy configuration |
| Mixed content warning | Ensure all resources load over HTTPS |
| Certificate not trusted | Use CA signed cert, not self-signed |

---

## Next Steps

1. **Generate Certificates**: Run `scripts/generate-certificates.sh`
2. **Configure Environment**: Copy and customize `.env.example`
3. **Test Locally**: `npm run start:dev` and verify HTTPS
4. **Deploy Staging**: Use reverse proxy setup
5. **Production**: Configure with Let's Encrypt + Nginx/ALB
6. **Monitor**: Set up certificate expiry alerts

---

**Status**: READY FOR PRODUCTION DEPLOYMENT ✅
