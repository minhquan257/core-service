import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestProductsService } from './testproducts.service';
import { TestProduct } from './testproduct.entity';

@ApiTags('testproducts')
@Controller('testproducts')
export class TestProductsController {
  constructor(private readonly testProductsService: TestProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all test products' })
  @ApiResponse({ status: 200, description: 'Return all test products.' })
  async findAll(): Promise<TestProduct[]> {
    return await this.testProductsService.findAll();
  }
}
