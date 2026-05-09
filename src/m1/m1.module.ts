import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { M1Controller } from './m1.controller';
import { M1Service } from './m1.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [M1Controller],
  providers: [M1Service],
})
export class M1Module {}
