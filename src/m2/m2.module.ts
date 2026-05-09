import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { M2Controller } from './m2.controller';
import { M2Service } from './m2.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [M2Controller],
  providers: [M2Service],
})
export class M2Module {}
