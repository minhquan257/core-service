import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';
import { SamplesController } from './samples.controller';
import { SamplesService } from './samples.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [SamplesController],
  providers: [SamplesService],
})
export class SamplesModule {}
