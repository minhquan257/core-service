import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { M6Controller } from './m6.controller';
import { M6Service } from './m6.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [M6Controller],
  providers: [M6Service],
})
export class M6Module {}
