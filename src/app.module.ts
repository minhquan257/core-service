import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestProductsModule } from './testproducts/testproducts.module';
import { TestProduct } from './testproducts/testproduct.entity';
import { SqliModule } from './sqli/sqli.module';
import { SafeCustomer } from './sqli/entities/safe-customer.entity';
import { M5Module } from './m5/m5.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1',
      database: process.env.DB_DATABASE || 'demo',
      entities: [TestProduct, SafeCustomer],
      synchronize: true,
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    TestProductsModule,
    SqliModule,
    M5Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
