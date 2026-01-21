import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestProductsController } from './testproducts.controller';
import { TestProductsService } from './testproducts.service';
import { TestProduct } from './testproduct.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TestProduct])],
  controllers: [TestProductsController],
  providers: [TestProductsService],
})
export class TestProductsModule {}
