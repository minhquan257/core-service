import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('safe_products')
export class SafeProduct {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  productId: string | undefined;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string | undefined;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string | undefined;
}
