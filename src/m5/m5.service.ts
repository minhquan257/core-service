import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { SafeCustomer } from 'src/sqli/entities/safe-customer.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SafeCustomerResponse } from 'src/sqli/response/safe-customer-response';

const TOKEN_STORE: Record<string, string> = {};

@Injectable()
export class M5Service {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SafeCustomer)
    private readonly safeCustomerRepo: Repository<SafeCustomer>,
    private readonly jwtService: JwtService,
  ) {}

  async loginViaQueryParams(username: string, password: string) {
    const sql = `
      SELECT customer_id, username, password, customer_name, address, city, country
      FROM customers
      WHERE username = '${username}'
        AND password = '${password}'
      LIMIT 1
    `;
    const rows: any[] = await this.dataSource.query(sql);
    if (!rows.length) {
      return { success: false, message: 'Invalid credentials' };
    }
    const customer = rows[0];
    // Predictable, unsigned token transmitted over HTTP — interceptable
    const token = `token_${customer.username}_plaintext_${Math.random().toString(36).slice(2, 8)}`;
    TOKEN_STORE[token] = customer.customer_id;
    return {
      success: true,
      token,
      username: customer.username,
      password_echoed: password,
    };
  }

  async getProfileViaTokenInUrl(token: string) {
    const customerId = TOKEN_STORE[token];
    if (!customerId) {
      return { error: 'Invalid token' };
    }
    const sql = `
      SELECT customer_id, username, password, customer_name,
             contact_name, address, city, postal_code, country
      FROM customers
      WHERE customer_id = '${customerId}'
      LIMIT 1
    `;
    const rows: any[] = await this.dataSource.query(sql);
    if (!rows.length) {
      return { error: 'Customer not found' };
    }
    const c = rows[0];
    return {
      customer_id: c.customer_id,
      username: c.username,
      password_plaintext: c.password, // PII in plaintext response
      customer_name: c.customer_name,
      contact_name: c.contact_name,
      address: c.address,
      city: c.city,
      postal_code: c.postal_code,
      country: c.country,
      token_in_response: token, // token reflected back, will appear in logs
    };
  }

  async getSensitiveData() {
    const sql = `
      SELECT customer_id, username, password,
             customer_name, contact_name, address,
             city, postal_code, country
      FROM customers
    `;
    const rows: any[] = await this.dataSource.query(sql);
    return {
      warning: 'This response contains no transport-security headers',
      customers: rows.map((c) => ({
        customer_id: c.customer_id,
        username: c.username,
        password_plaintext: c.password,
        customer_name: c.customer_name,
        contact_name: c.contact_name,
        address: c.address,
        city: c.city,
        postal_code: c.postal_code,
        country: c.country,
      })),
    };
  }

  getMixedContentResponse() {
    return {
      warning: 'Page loads secure assets over HTTP (mixed content)',
      page_loaded_over: 'http',
      assets: [
        { type: 'script', url: 'http://cdn.example.com/app.js' },
        { type: 'image', url: 'http://static.example.com/logo.png' },
        { type: 'iframe', url: 'http://payment.example.com/checkout' },
      ],
      session_cookie:
        'session=abc123; HttpOnly=false; Secure=false; SameSite=None',
    };
  }

  getDownstreamInsecureCallInfo() {
    return {
      description: 'This server would call the downstream API over plain HTTP',
      downstream_url: 'http://internal-payment-api:8080/charge',
      tls_verification: false, // equivalent to rejectUnauthorized: false
      auth_header_sent_over_http:
        'Authorization: Bearer supersecret_api_key_12345',
      risk: [
        'API key transmitted in plaintext — interceptable by any network observer',
        'Man-in-the-middle can replace the response',
        'No server identity verification',
      ],
    };
  }

  async safeLogin(username: string, password: string) {
    const user = await this.safeCustomerRepo.findOne({ where: { username } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.customerId,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMyProfile(): Promise<SafeCustomerResponse[]> {
    const user = await this.safeCustomerRepo.find();
    if (!user) {
      throw new UnauthorizedException('Customer not found');
    }
    const safeUsers: SafeCustomerResponse[] = user.map((c) => ({
      customerId: c.customerId,
      username: c.username,
      customerName: c.customerName,
      contactName: c.contactName,
      address: c.address,
      city: c.city,
      postalCode: c.postalCode,
      country: c.country,
      phoneNumber: undefined,
    }));
    return safeUsers;
  }
}
