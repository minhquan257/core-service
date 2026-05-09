import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { M2Service } from './m2.service';

/**
 * M2 — Inadequate Supply Chain Security (OWASP Mobile Top 10)
 */
@ApiTags('m2-supply-chain-security')
@Controller('m2')
export class M2Controller {
  constructor(private readonly m2Service: M2Service) {}

  @Get('insecure-dependencies')
  @ApiOperation({
    summary: '[VULN] Check dependencies — includes known vulnerable packages',
    description:
      'Returns a list of dependencies with known security vulnerabilities.',
  })
  async insecureCheckDependencies() {
    return this.m2Service.insecureCheckDependencies();
  }

  @Get('safe-dependencies')
  @ApiOperation({
    summary: '[SAFE] Check dependencies — all verified and up-to-date',
    description:
      'Returns a list of dependencies with no known vulnerabilities, all up-to-date.',
  })
  async safeCheckDependencies() {
    return this.m2Service.safeCheckDependencies();
  }

  @Get('insecure-build-info')
  @ApiOperation({
    summary: '[VULN] Return build info with unsigned artifacts',
    description:
      'Exposes build artifacts without signing or verification, stored insecurely.',
  })
  async insecureGetBuildInfo() {
    return this.m2Service.insecureGetBuildInfo();
  }

  @Get('safe-build-info')
  @ApiOperation({
    summary: '[SAFE] Return build info with signed, verified artifacts',
    description:
      'Build artifacts are cryptographically signed and verified with supply chain attestation.',
  })
  async safeGetBuildInfo() {
    return this.m2Service.safeGetBuildInfo();
  }
}
