import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { M9Service } from './m9.service';

/**
 * M9 — Insecure Data Storage (OWASP Mobile Top 10)
 */
@ApiTags('m9-data-storage')
@Controller('m9')
export class M9Controller {
  constructor(private readonly m9Service: M9Service) {}

  @Get('insecure-storage-status')
  @ApiOperation({
    summary: '[VULN] Check storage encryption — plaintext storage',
    description:
      'Reveals that sensitive data is stored in plaintext on device and server.',
  })
  async insecureGetStorageStatus() {
    return this.m9Service.insecureGetStorageStatus();
  }

  @Get('safe-storage-status')
  @ApiOperation({
    summary: '[SAFE] Check storage encryption — AES-256 encrypted',
    description:
      'Demonstrates proper encryption at rest with platform-native encryption (Keystore/Keychain).',
  })
  async safeGetStorageStatus() {
    return this.m9Service.safeGetStorageStatus();
  }

  @Get('insecure-cache-status')
  @ApiOperation({
    summary: '[VULN] Check cache security — plaintext, long-lived cache',
    description: 'Reveals sensitive data in plaintext cache that persists.',
  })
  async insecureGetCacheStatus() {
    return this.m9Service.insecureGetCacheStatus();
  }

  @Get('safe-cache-status')
  @ApiOperation({
    summary: '[SAFE] Check cache security — encrypted cache, auto-cleared',
    description:
      'Demonstrates proper cache management: encrypted, cleared on app close.',
  })
  async safeGetCacheStatus() {
    return this.m9Service.safeGetCacheStatus();
  }
}
