import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { M7Controller } from './m7.controller';
import { M7Service } from './m7.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [M7Controller],
  providers: [M7Service],
})
export class M7Module {}
