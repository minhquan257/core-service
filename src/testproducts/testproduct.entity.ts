import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('testproducts')
export class TestProduct {
  @PrimaryGeneratedColumn({ name: 'testproduct_id' })
  testproductId: number;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string;

  @Column({ name: 'category_id', type: 'integer' })
  categoryId: number;
}
