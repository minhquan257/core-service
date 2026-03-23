import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SafeProduct } from './safe-product.entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SqliService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SafeProduct)
    private readonly safeProductRepo: Repository<SafeProduct>,
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
      WHERE name = '${name}'
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

  async safeUnionBased(id: string): Promise<SafeProduct | null> {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('id must be a valid UUID v4');
    }
    return this.safeProductRepo.findOne({ where: { productId: id } });
  }

  async safeBlindBased(name: string): Promise<{ exists: boolean }> {
    if (!name || name.length > 255) {
      throw new BadRequestException('name must be 1–255 characters');
    }
    const count = await this.safeProductRepo.count({
      where: { productName: name },
    });
    return { exists: count > 0 };
  }

  async safeTimeBased(id: string): Promise<SafeProduct | null> {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('id must be a valid UUID v4');
    }
    return this.safeProductRepo.findOne({ where: { productId: id } });
  }
}
