import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { M5Controller } from './m5.controller';
import { M5Service } from './m5.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SafeCustomer } from 'src/sqli/entities/safe-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafeCustomer]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'safe-demo-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [M5Controller],
  providers: [M5Service, JwtAuthGuard],
})
export class M5Module {}
