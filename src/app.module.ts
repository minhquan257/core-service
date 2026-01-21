import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestProductsModule } from './testproducts/testproducts.module';
import { TestProduct } from './testproducts/testproduct.entity';

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
      entities: [TestProduct],
      synchronize: true,
    }),
    TestProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
