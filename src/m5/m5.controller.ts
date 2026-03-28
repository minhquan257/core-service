/**
 * ⚠️  INTENTIONALLY VULNERABLE — FOR EDUCATIONAL / CTF USE ONLY
 *
 * M5 — Insecure Communication (OWASP Mobile Top 10)
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { M5Service } from './m5.service';

@ApiTags('m5-insecure-communication')
@Controller('m5')
export class M5Controller {
  constructor(private readonly m5Service: M5Service) {}

  // ─── VULN #1 ─────────────────────────────────────────────────────────────
  @Get('login')
  @ApiOperation({
    summary: '[VULN] Credentials in URL query parameters',
    description:
      'Accepts username & password as GET query params. ' +
      'Credentials appear in server access logs, browser history, proxy logs, ' +
      'and any Referer header on the next request. ' +
      'Sniff with: `tcpdump -i lo0 -A port 3000 | grep -i "GET /m5/login"`',
  })
  @ApiQuery({ name: 'username', example: 'alice' })
  @ApiQuery({ name: 'password', example: 'password123' })
  @ApiResponse({
    status: 200,
    description: 'Login result including echoed credentials and token.',
  })
  async loginViaQueryParams(
    @Query('username') username: string,
    @Query('password') password: string,
  ) {
    return this.m5Service.loginViaQueryParams(username, password);
  }

  // ─── VULN #2 ─────────────────────────────────────────────────────────────
  @Get('profile')
  @ApiOperation({
    summary: '[VULN] Session token passed in URL (not in Authorization header)',
    description:
      'Token is passed as a query parameter instead of a header. ' +
      'This causes the token to leak into server access logs, CDN logs, ' +
      'browser history, and Referer headers sent to third parties. ' +
      'Use any token from VULN#1 or the pre-seeded ones: ' +
      '`token_alice_plaintext_abc123`, `token_admin_plaintext_000000`',
  })
  @ApiQuery({ name: 'token', example: 'token_alice_plaintext_abc123' })
  @ApiResponse({
    status: 200,
    description: 'Profile including PII in plaintext.',
  })
  async getProfileViaTokenInUrl(@Query('token') token: string) {
    return this.m5Service.getProfileViaTokenInUrl(token);
  }

  // ─── VULN #3 ─────────────────────────────────────────────────────────────
  @Get('sensitive-data')
  @ApiOperation({
    summary: '[VULN] Sensitive data dump — no HSTS, no transport security',
    description:
      'Returns PII and credentials with no Strict-Transport-Security header. ' +
      'An HTTP response like this can be downgraded from HTTPS by a MITM attacker. ' +
      'Compare response headers — notice the absence of HSTS.',
  })
  @ApiResponse({
    status: 200,
    description: 'All user records including passwords, credit cards, SSNs.',
  })
  async getSensitiveData(@Res() res: Response) {
    // Deliberately omitting Strict-Transport-Security and security headers
    res.setHeader('Content-Type', 'application/json');
    // No: Strict-Transport-Security, X-Content-Type-Options, etc.
    return res.json(await this.m5Service.getSensitiveData());
  }

  // ─── VULN #4 ─────────────────────────────────────────────────────────────
  // @Get('mixed-content')
  // @ApiOperation({
  //   summary: '[VULN] Mixed-content response — HTTP assets on a "secure" page',
  //   description:
  //     'Simulates a page that serves sensitive resources (scripts, iframes, payment widgets) ' +
  //     'over plain HTTP even when the parent page is loaded over HTTPS. ' +
  //     'A MITM attacker can inject malicious JS by responding to the HTTP asset requests. ' +
  //     'Cookie in response also has Secure=false, making it accessible over HTTP.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Mixed-content asset list and insecure cookie.',
  // })
  // getMixedContent() {
  //   return this.m5Service.getMixedContentResponse();
  // }

  // ─── VULN #5 ─────────────────────────────────────────────────────────────
  // @Get('downstream-call')
  // @ApiOperation({
  //   summary:
  //     '[VULN] Server-to-server call over HTTP with disabled TLS verification',
  //   description:
  //     'Simulates this server calling a downstream service over plain HTTP ' +
  //     'and with certificate validation disabled (`rejectUnauthorized: false`). ' +
  //     'Any network observer between the two servers can read the API key and ' +
  //     'modify the response (MITM).',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Shows the insecure downstream call configuration.',
  // })
  // getDownstreamCall() {
  //   return this.m5Service.getDownstreamInsecureCallInfo();
  // }

  // ─── SAFE REFERENCE ──────────────────────────────────────────────────────
  @Post('safe-login')
  @ApiOperation({
    summary: '[SAFE] Reference — credentials in POST body over HTTPS',
    description:
      'Demonstrates the correct approach: credentials sent in the request body ' +
      '(not URL), and this endpoint would only be reachable over HTTPS with HSTS enforced. ' +
      'Compare with VULN#1.',
  })
  @ApiBody({
    schema: {
      example: { username: 'alice', password: 'password123' },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Safe login — credentials never appear in URL or logs.',
  })
  async safeLogin(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    const result = await this.m5Service.safeLogin(username, password);
    // Credentials in body (not URL), HSTS enforced, JWT signed
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.json({
      ...result,
      note: 'Safe: credentials in body (not URL), bcrypt comparison, signed JWT.',
    });
  }

  // ─── PROTECTED ENDPOINT ──────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[SAFE] Get my profile — requires valid JWT',
    description:
      'Pass the access_token from POST /m5/safe-login in the Authorization header: ' +
      '`Authorization: Bearer <token>`. ' +
      'The guard validates the signature and expiry; the endpoint returns the ' +
      "caller's own customer record (password hash excluded).",
  })
  @ApiResponse({ status: 200, description: 'Authenticated customer profile.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT.' })
  async getMe() {
    return this.m5Service.getMyProfile();
  }
}
