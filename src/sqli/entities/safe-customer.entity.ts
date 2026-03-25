import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('safe_customers')
@Unique(['username'])
export class SafeCustomer {
  @PrimaryGeneratedColumn('uuid', { name: 'customer_id' })
  customerId: string | undefined;

  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  customerName: string | undefined;

  @Column({
    name: 'contact_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contactName: string | undefined;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | undefined;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | undefined;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode: string | undefined;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | undefined;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string | undefined;

  @Column({ type: 'varchar', length: 100 })
  username: string | undefined;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | undefined;
}
