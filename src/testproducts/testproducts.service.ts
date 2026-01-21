import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestProduct } from './testproduct.entity';

@Injectable()
export class TestProductsService {
  constructor(
    @InjectRepository(TestProduct)
    private readonly testProductRepository: Repository<TestProduct>,
  ) {}

  async findAll(): Promise<TestProduct[]> {
    return await this.testProductRepository.find();
  }
}
