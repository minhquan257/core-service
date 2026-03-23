/**
 * ⚠️  INTENTIONALLY VULNERABLE — FOR EDUCATIONAL / CTF USE ONLY
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SqliService } from './sqli.service';

@ApiTags('sqli-demo')
@Controller('sqli')
export class SqliController {
  constructor(private readonly sqliService: SqliService) {}

  @Get('union')
  @ApiOperation({
    summary: '[VULN] Union-based SQLi',
    description:
      'Injects raw `id` into SELECT … WHERE testproduct_id = <id>. ' +
      'Attack: id=0 UNION SELECT 1,table_name,3 FROM information_schema.tables--',
  })
  @ApiQuery({ name: 'id', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Rows returned by the injected query.',
  })
  async unionSqli(@Query('id') id: string) {
    return this.sqliService.unionBased(id);
  }

  @Get('blind')
  @ApiOperation({
    summary: '[VULN] Boolean-blind SQLi',
    description:
      "Injects raw `name` inside single quotes: WHERE product_name = '<name>'. " +
      'Only returns { exists: true|false }, so data is leaked via boolean inference. ' +
      "Attack: name=' OR SUBSTRING(current_database(),1,1)='d'--",
  })
  @ApiQuery({ name: 'name', example: 'Widget' })
  @ApiResponse({ status: 200, schema: { example: { exists: true } } })
  async blindSqli(@Query('name') name: string) {
    return this.sqliService.blindBased(name);
  }

  @Get('time')
  @ApiOperation({
    summary: '[VULN] Time-based blind SQLi',
    description:
      'Injects raw `id` into SELECT … WHERE testproduct_id = <id>. ' +
      'Attacker uses pg_sleep() to infer data from response latency. ' +
      "Attack: id=1 AND 1=(SELECT CASE WHEN SUBSTRING(current_database(),1,1)='d' THEN pg_sleep(5) ELSE pg_sleep(0) END)--",
  })
  @ApiQuery({ name: 'id', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Rows returned (delayed when payload fires).',
  })
  async timeSqli(@Query('id') id: string) {
    return this.sqliService.timeBased(id);
  }

  // ─── SAFE COUNTERPARTS ──────────────────────────────────────────────────────

  @Get('safe/union')
  @ApiOperation({
    summary: '[SAFE] Parameterised union-based query (UUID)',
    description:
      'Queries safe_products using a parameterised statement ($1). ' +
      'UUID format is validated before the query runs — UNION payloads are impossible.',
  })
  @ApiQuery({
    name: 'id',
    example: '123e4567-e89b-4d3c-a456-426614174000',
    description: 'Must be a valid UUID v4',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching safe_products row (or empty array).',
  })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID v4.' })
  async safeUnionQuery(@Query('id') id: string) {
    return this.sqliService.safeUnionBased(id);
  }

  @Get('safe/blind')
  @ApiOperation({
    summary: '[SAFE] Parameterised boolean-blind query',
    description:
      'Queries safe_products using a parameterised statement ($1). ' +
      'The driver escapes the name value — single-quote breakout is impossible.',
  })
  @ApiQuery({ name: 'name', example: 'Safe Widget' })
  @ApiResponse({
    status: 200,
    schema: { example: { exists: true } },
    description: 'Boolean existence check — no data leakage via inference.',
  })
  @ApiResponse({ status: 400, description: 'name is missing or too long.' })
  async safeBlindQuery(@Query('name') name: string) {
    return this.sqliService.safeBlindBased(name);
  }

  @Get('safe/time')
  @ApiOperation({
    summary: '[SAFE] Parameterised time-based query (UUID)',
    description:
      'Queries safe_products using a parameterised statement ($1). ' +
      'UUID validation rejects pg_sleep() payloads before they reach the database.',
  })
  @ApiQuery({
    name: 'id',
    example: '123e4567-e89b-4d3c-a456-426614174000',
    description: 'Must be a valid UUID v4',
  })
  @ApiResponse({
    status: 200,
    description:
      'Matching safe_products row (response is never artificially delayed).',
  })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID v4.' })
  async safeTimeQuery(@Query('id') id: string) {
    return this.sqliService.safeTimeBased(id);
  }
}
