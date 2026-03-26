# M5 — Insecure Communication (OWASP Mobile Top 10)

> ⚠️ These demonstrations are for use **only** against this intentionally vulnerable project.
> Do **not** use against any system you do not own or have explicit permission to test.

Base URL: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api`

---

## What is M5?

**Insecure Communication** occurs when a mobile app or server transmits sensitive data (credentials, tokens, PII) in a way that can be intercepted or tampered with. This includes:

- Using HTTP instead of HTTPS
- Sending credentials or tokens in URL query parameters
- Missing `Strict-Transport-Security` (HSTS) headers
- Accepting any TLS certificate (`rejectUnauthorized: false`)
- Mixed-content: loading HTTP resources from an HTTPS page
- Sending API keys over unencrypted server-to-server channels

---

## VULN #1 — Credentials in URL Query Parameters

**Endpoint:** `GET /m5/login?username=alice&password=password123`

The credentials travel in the URL, which means they appear in:

- Server access logs (nginx, Apache, NestJS request logger)
- Browser history
- Proxy / firewall / CDN logs
- `Referer` header sent to third-party resources on the next page

### Attack — Sniff the request with tcpdump

```bash
# Terminal 1: start the sniffer on loopback
sudo tcpdump -i lo0 -A -s 0 'tcp port 3000' 2>/dev/null | grep -i "GET /m5/login"

# Terminal 2: send the vulnerable request
curl -s "http://localhost:3000/m5/login?username=alice&password=password123"
```

Expected output in tcpdump:

```
GET /m5/login?username=alice&password=password123 HTTP/1.1
```

### Attack — Read the credentials from server logs

NestJS (and every HTTP server) logs the full request URI by default.  
Check the terminal where you ran `npm run start` — the password is right there.

### Pre-seeded credentials

| username | password    |
| -------- | ----------- |
| alice    | password123 |
| bob      | hunter2     |
| admin    | admin       |

---

## VULN #2 — Session Token in URL Parameter

**Endpoint:** `GET /m5/profile?token=token_alice_plaintext_abc123`

Passing a session token as a GET parameter instead of `Authorization: Bearer <token>` causes the token to leak everywhere a URL leaks.

### Pre-seeded tokens

| token                          | user  |
| ------------------------------ | ----- |
| `token_alice_plaintext_abc123` | alice |
| `token_bob_plaintext_xyz789`   | bob   |
| `token_admin_plaintext_000000` | admin |

### Attack — Steal token from Referer header

```bash
# Fetch a page with the token in the URL, then follow a link to an external site.
# The browser sends: Referer: http://localhost:3000/m5/profile?token=token_alice_...
# The external server now has alice's session token in its access log.

curl -s "http://localhost:3000/m5/profile?token=token_admin_plaintext_000000"
```

### Attack — Find token in access log

```bash
# If you have access to the server log, tokens are trivially visible
sudo tcpdump -i lo0 -A -s 0 'tcp port 3000' 2>/dev/null | grep -i "token"
```

---

## VULN #3 — No HSTS / No Transport Security Headers

**Endpoint:** `GET /m5/sensitive-data`

```bash
curl -si "http://localhost:3000/m5/sensitive-data" | head -20
```

Notice the response has **no** `Strict-Transport-Security` header.  
A MITM attacker can force an HTTP downgrade (e.g., SSL-strip attack):

```
HTTPS page → MITM strips TLS → victim gets HTTP → all data in plaintext
```

**Safe endpoint for comparison:**

```bash
curl -si -X POST http://localhost:3000/m5/safe-login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | grep -i "strict-transport"
# → Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

## VULN #4 — Mixed Content

**Endpoint:** `GET /m5/mixed-content`

```bash
curl -s "http://localhost:3000/m5/mixed-content"
```

Even if the main page is served over HTTPS, loading scripts or iframes over HTTP
allows a MITM to inject arbitrary JavaScript into the response:

```
Attacker intercepts: GET http://cdn.example.com/app.js
Attacker responds with: <malicious JS that steals the session cookie>
```

The session cookie returned by this endpoint also has `Secure=false`, meaning the
browser sends it over HTTP — easily captured with tcpdump.

---

## VULN #5 — Server-to-Server Call over HTTP / Disabled TLS

**Endpoint:** `GET /m5/downstream-call`

```bash
curl -s "http://localhost:3000/m5/downstream-call"
```

Simulates code that does:

```typescript
// WRONG — never do this in production
const response = await fetch('http://internal-payment-api:8080/charge', {
  headers: { Authorization: 'Bearer supersecret_api_key_12345' },
});

// Also wrong — disabling certificate validation
const agent = new https.Agent({ rejectUnauthorized: false });
```

Any host on the network path between this server and the payment API can read
the API key and silently modify the charge amount.

---

## Mitigation Checklist

| Vulnerability               | Fix                                                                           |
| --------------------------- | ----------------------------------------------------------------------------- |
| Credentials in URL          | Use `POST` with credentials in the request body                               |
| Token in URL                | Send tokens in `Authorization: Bearer <token>` header                         |
| No HSTS                     | Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| HTTP instead of HTTPS       | Terminate TLS at the load balancer; redirect all HTTP → HTTPS                 |
| Mixed content               | Use protocol-relative or `https://` URLs for all assets                       |
| `rejectUnauthorized: false` | Never disable TLS verification; pin certificates for internal services        |
| Token in logs               | Never log full request URLs; redact sensitive headers                         |
