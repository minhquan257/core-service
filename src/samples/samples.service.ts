import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class SamplesService {
  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async getCustomerIds(): Promise<{ customerIds: string[] }> {
    try {
      const customers = await this.safeCustomerRepository.find({
        select: ['customerId'],
        take: 10,
      });
      return {
        customerIds: customers.map((c) => c.customerId).filter(Boolean) as string[],
      };
    } catch (e) {
      return { customerIds: [] };
    }
  }

  async getInitialFieldValues(): Promise<Record<string, any>> {
    const ts = Date.now().toString().slice(-6);

    try {
      const customers = await this.safeCustomerRepository.find({
        select: ['customerId', 'username'],
        take: 3,
      });

      const customerIds = customers
        .map((c) => c.customerId)
        .filter(Boolean) as string[];
      const firstCustomerId = customerIds[0] || null;
      const firstUsername = customers[0]?.username || 'user1';

      return {
        // M6 Privacy Controls - needs userId
        M6: {
          userId: firstCustomerId || 'user-123',
        },
        // M1 Improper Credential Usage - doesn't need DB
        M1: {
          api_key: 'demo-api-key',
        },
        // M2 Supply Chain Security - doesn't need DB
        M2: {
          package_name: 'lodash',
        },
        // M3-M5 and M7-M10 can use static data
        // Override any case that needs real data here
        PASSCODE_RATE_LIMIT_OFF: {
          username: firstUsername || 'admin',
          password: 'takasecurity',
        },
        UNVALIDATED_EXTERNAL_INPUT: {
          customerName: `test_${ts}`,
          username: `sqli_${ts}`,
          password: 'testpass',
        },
        NET_HTTP_NO_TLS: {
          username: firstUsername || 'admin',
          password: 'takasecurity',
          token: 'token_alice_plaintext_abc123',
        },
        CRYPTO_MD5_NO_SALT: {
          username: `cryptotest_${ts}`,
          password: 'plaintextpass',
        },
        SQLI_UNION_BASED: {
          unionPayload:
            '0 UNION SELECT 1,username,password,NULL,NULL,NULL,NULL,NULL,NULL FROM customers--',
          safeId: customerIds[0] || '123e4567-e89b-4d3c-a456-426614174000',
        },
      };
    } catch (e) {
      // Fallback to static values if DB query fails
      return {
        M6: { userId: 'user-123' },
        M1: { api_key: 'demo-api-key' },
        M2: { package_name: 'lodash' },
        PASSCODE_RATE_LIMIT_OFF: {
          username: 'admin',
          password: 'takasecurity',
        },
        UNVALIDATED_EXTERNAL_INPUT: {
          customerName: `test_${ts}`,
          username: `sqli_${ts}`,
          password: 'testpass',
        },
        NET_HTTP_NO_TLS: {
          username: 'admin',
          password: 'takasecurity',
          token: 'token_alice_plaintext_abc123',
        },
        CRYPTO_MD5_NO_SALT: {
          username: `cryptotest_${ts}`,
          password: 'plaintextpass',
        },
        SQLI_UNION_BASED: {
          unionPayload:
            '0 UNION SELECT 1,username,password,NULL,NULL,NULL,NULL,NULL,NULL FROM customers--',
          safeId: '123e4567-e89b-4d3c-a456-426614174000',
        },
      };
    }
  }
}
