import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { M6Service } from './m6.service';

/**
 * M6 — Inadequate Privacy Controls (OWASP Mobile Top 10)
 */
@ApiTags('m6-privacy-controls')
@Controller('m6')
export class M6Controller {
  constructor(private readonly m6Service: M6Service) {}

  @Get('insecure-profile')
  @ApiOperation({
    summary: '[VULN] Return user profile with all PII (no consent)',
    description:
      'Returns comprehensive user data including sensitive PII without user consent.',
  })
  @ApiQuery({ name: 'userId', example: '123' })
  async insecureGetUserProfile(@Query('userId') userId: string) {
    return this.m6Service.insecureGetUserProfile(userId);
  }

  @Get('safe-profile')
  @ApiOperation({
    summary: '[SAFE] Return minimal user profile with consent controls',
    description:
      'Returns only necessary data with explicit consent tracking and data minimization.',
  })
  @ApiQuery({ name: 'userId', example: '123' })
  async safeGetUserProfile(@Query('userId') userId: string) {
    return this.m6Service.safeGetUserProfile(userId);
  }

  @Get('insecure-data-sharing')
  @ApiOperation({
    summary:
      '[VULN] Return user data shared with third parties (no consent)',
    description:
      'Data is shared with advertising/analytics partners without explicit user consent.',
  })
  @ApiQuery({ name: 'userId', example: '123' })
  async insecureGetUserDataWithoutConsent(@Query('userId') userId: string) {
    return this.m6Service.insecureGetUserDataWithoutConsent(userId);
  }

  @Get('safe-data-sharing')
  @ApiOperation({
    summary: '[SAFE] Return data sharing status (consent-based)',
    description:
      'Shows only data shared with user consent; all other data sharing is blocked.',
  })
  async safeGetUserDataSharing() {
    return this.m6Service.safeGetUserDataSharing();
  }
}
