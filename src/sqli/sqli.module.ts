import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqliController } from './sqli.controller';
import { SqliService } from './sqli.service';
import { SafeCustomer } from './entities/safe-customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SafeCustomer])],
  controllers: [SqliController],
  providers: [SqliService],
})
export class SqliModule {}
