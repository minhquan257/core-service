import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SafeCustomer } from './entities/safe-customer.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { SafeCustomerResponse } from './response/safe-customer-response';
import * as bcrypt from 'bcrypt';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maskingPhoneNumber = (phone: string | undefined): string | undefined => {
  if (!phone) return phone;
  const visibleDigits = 4;
  const maskedSection = '*'.repeat(Math.max(0, phone.length - visibleDigits));
  return maskedSection + phone.slice(-visibleDigits);
};

@Injectable()
export class SqliService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SafeCustomer)
    private readonly safeCustomerRepo: Repository<SafeCustomer>,
  ) {}

  async unionBased(id: string): Promise<any[]> {
    const sql = `
      SELECT *
      FROM customers
      WHERE customer_id = ${id}
    `;
    return this.dataSource.query(sql);
  }

  async blindBased(name: string): Promise<{ exists: boolean }> {
    const sql = `
      SELECT 1 AS found
      FROM customers
      WHERE customer_name = '${name}'
      LIMIT 1
    `;
    const rows: unknown[] = await this.dataSource.query(sql);
    return { exists: rows.length > 0 };
  }

  async timeBased(id: string): Promise<any[]> {
    const sql = `
      SELECT *
      FROM customers
      WHERE customer_id = ${id}
    `;
    return this.dataSource.query(sql);
  }

  async safeUnionBased(id: string): Promise<SafeCustomerResponse> {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('id must be a valid UUID v4');
    }
    const customer = await this.safeCustomerRepo.findOne({
      where: { customerId: id },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, phoneNumber, ...safeData } = customer;
    return { ...safeData, phoneNumber: maskingPhoneNumber(phoneNumber) };
  }

  async safeBlindBased(name: string): Promise<{ exists: boolean }> {
    if (!name || name.length > 255) {
      throw new BadRequestException('name must be 1–255 characters');
    }
    const count = await this.safeCustomerRepo.count({
      where: { customerName: name },
    });
    return { exists: count > 0 };
  }

  async safeTimeBased(id: string): Promise<SafeCustomerResponse | null> {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('id must be a valid UUID v4');
    }
    const customer = await this.safeCustomerRepo.findOne({
      where: { customerId: id },
    });
    if (!customer) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, phoneNumber, ...safeData } = customer;
    return { ...safeData, phoneNumber: maskingPhoneNumber(phoneNumber) };
  }

  // ─── CREATE ─────────────────────────────────────────────────────────────────

  async unsafeCreate(body: Record<string, any>): Promise<any[]> {
    const {
      customerName,
      contactName,
      address,
      city,
      postalCode,
      country,
      password,
      username,
    } = body;
    const sql = `
      INSERT INTO customers (customer_name, contact_name, address, city, postal_code, country, password, username)
      VALUES ('${customerName}', '${contactName}', '${address}', '${city}', '${postalCode}', '${country}', '${password}', '${username}')
      RETURNING customer_id, customer_name, contact_name, address, city, postal_code, country, username
    `;
    return this.dataSource.query(sql);
  }

  async safeCreate(dto: CreateCustomerDto): Promise<SafeCustomerResponse> {
    if (!dto.customerName || dto.customerName.length > 255) {
      throw new BadRequestException(
        'customerName is required and must be ≤255 characters',
      );
    }
    if (!dto.username || dto.username.length > 100) {
      throw new BadRequestException(
        'username is required and must be ≤100 characters',
      );
    }
    if (!dto.password) {
      throw new BadRequestException('password is required');
    }
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltOrRounds);
    const customer = this.safeCustomerRepo.create({
      customerName: dto.customerName,
      contactName: dto.contactName,
      address: dto.address,
      city: dto.city,
      postalCode: dto.postalCode,
      country: dto.country,
      passwordHash: hashedPassword,
      username: dto.username,
      phoneNumber: dto.phoneNumber,
    });
    const saved = await this.safeCustomerRepo.save(customer);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, phoneNumber, ...safeData } = saved;
    return { ...safeData, phoneNumber: maskingPhoneNumber(phoneNumber) };
  }
}
