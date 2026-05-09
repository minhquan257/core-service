import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { M7Service } from './m7.service';

/**
 * M7 — Insufficient Binary Protections (OWASP Mobile Top 10)
 */
@ApiTags('m7-binary-protections')
@Controller('m7')
export class M7Controller {
  constructor(private readonly m7Service: M7Service) {}

  @Get('insecure-hardening')
  @ApiOperation({
    summary: '[VULN] Check app hardening — no protections',
    description:
      'App is compiled without hardening protections, making it vulnerable to reverse engineering and tampering.',
  })
  async insecureCheckAppHardening() {
    return this.m7Service.insecureCheckAppHardening();
  }

  @Get('safe-hardening')
  @ApiOperation({
    summary: '[SAFE] Check app hardening — all protections enabled',
    description:
      'App includes comprehensive hardening: obfuscation, debugger detection, jailbreak detection, anti-tampering.',
  })
  async safeCheckAppHardening() {
    return this.m7Service.safeCheckAppHardening();
  }

  @Get('insecure-runtime-info')
  @ApiOperation({
    summary: '[VULN] Return exposed runtime information',
    description: 'Exposes process memory layout and runtime details for exploitation.',
  })
  async insecureGetRuntimeInfo() {
    return this.m7Service.insecureGetRuntimeInfo();
  }

  @Get('safe-runtime-info')
  @ApiOperation({
    summary: '[SAFE] Return protected runtime status',
    description:
      'Runtime details are hidden; ASLR, stack canaries, and CFI are enabled.',
  })
  async safeGetRuntimeInfo() {
    return this.m7Service.safeGetRuntimeInfo();
  }
}
