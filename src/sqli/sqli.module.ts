import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqliController } from './sqli.controller';
import { SqliService } from './sqli.service';
import { SafeProduct } from './safe-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SafeProduct])],
  controllers: [SqliController],
  providers: [SqliService],
})
export class SqliModule {}
