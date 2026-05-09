import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { M9Controller } from './m9.controller';
import { M9Service } from './m9.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [M9Controller],
  providers: [M9Service],
})
export class M9Module {}
