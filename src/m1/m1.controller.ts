import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { M1Service } from './m1.service';

/**
 * M1 — Improper Credential Usage (OWASP Mobile Top 10)
 */
@ApiTags('m1-improper-credential-usage')
@Controller('m1')
export class M1Controller {
  constructor(private readonly m1Service: M1Service) {}

  @Get('insecure-api-key')
  @ApiOperation({
    summary: '[VULN] Return hardcoded API key and long-lived token',
    description:
      'Returns credentials that are hardcoded, long-lived, and exposed in plaintext.',
  })
  async insecureGetApiKey() {
    return this.m1Service.insecureGetApiKey();
  }

  @Get('safe-api-key')
  @ApiOperation({
    summary: '[SAFE] Return short-lived, scoped access token',
    description:
      'Returns a temporary token with expiry, limited scope, and proper lifecycle management.',
  })
  async safeGetApiKey() {
    return this.m1Service.safeGetApiKey();
  }

  @Get('insecure-stored-credentials')
  @ApiOperation({
    summary: '[VULN] Return stored plaintext credentials',
    description:
      'Returns database and third-party credentials in plaintext without encryption.',
  })
  async insecureGetStoredCredentials() {
    return this.m1Service.insecureGetStoredCredentials();
  }

  @Get('safe-stored-credentials')
  @ApiOperation({
    summary: '[SAFE] Return credential metadata (secrets not exposed)',
    description:
      'Returns credential management status without exposing secrets; secrets stored in vault.',
  })
  async safeGetStoredCredentials() {
    return this.m1Service.safeGetStoredCredentials();
  }
}
