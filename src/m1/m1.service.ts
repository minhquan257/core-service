import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class M1Service {
  /**
   * M1 — Improper Credential Usage
   * Demo: Hardcoded API keys / long-lived tokens exposed in response
   * Now uses real customer data from database
   */

  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async insecureGetApiKey() {
    // INSECURE: Return hardcoded API key and long-lived token
    let username = 'admin';
    try {
      const customer = await this.safeCustomerRepository.findOne({
        select: ['username'],
      });
      if (customer?.username) {
        username = customer.username;
      }
    } catch (e) {
      // Fallback to default
    }

    return {
      warning:
        'This API key and token are hardcoded and exposed in the response',
      username: username,
      api_key: `sk_live_${username}_hardcoded_no_expiry`,
      api_key_created_at: '2023-01-01T00:00:00Z',
      api_key_expires: 'NEVER',
      bearer_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZGMtYWRtaW4iLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MCwiYWRtaW4iOnRydWUsImJhY2tzcG9ydDphY2Nlc3MiOmZhbHNlfQ.HARDCODED_LONG_LIVED_TOKEN',
      security_risks: [
        'API key visible in plaintext in server logs',
        'Token never expires and cannot be revoked',
        'If discovered, attacker has unlimited access',
      ],
    };
  }

  async safeGetApiKey() {
    // SAFE: Return short-lived token with proper scope
    const expiresInSeconds = 3600; // 1 hour
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return {
      warning: 'This is a temporary, short-lived access token',
      access_token: `temp_token_${Date.now()}_with_expiry`,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      expires_at: expiresAt.toISOString(),
      scopes: ['read:profile', 'write:data'],
      refresh_token_required: 'yes',
      security_features: [
        'Token expires in 1 hour',
        'Can be revoked server-side at any time',
        'Scope-limited access (not admin)',
        'Separate refresh token mechanism recommended',
      ],
    };
  }

  async insecureGetStoredCredentials() {
    // INSECURE: Return stored plaintext credentials
    let username = 'user1';
    let customerId = 'unknown';
    try {
      const customer = await this.safeCustomerRepository.findOne({
        select: ['customerId', 'username'],
        order: { customerName: 'ASC' },
      });
      if (customer?.username) {
        username = customer.username;
      }
      if (customer?.customerId) {
        customerId = customer.customerId;
      }
    } catch (e) {
      // Fallback
    }

    return {
      database_connection: {
        host: 'db.neon.tech',
        port: 5432,
        username: username,
        password: `plaintext_password_for_${username}`,
        ssl: false,
      },
      customer_info: {
        customer_id: customerId,
        username: username,
        stored_plaintext: true,
      },
      third_party_api_credentials: {
        service: 'payment-gateway',
        api_key: `pk_live_${customerId.substring(0, 8)}_stored_plaintext`,
        api_secret: `sk_live_${customerId.substring(8, 16)}_stored_plaintext`,
        webhook_secret: `whsec_${customerId.substring(16, 24)}_plaintext_secret`,
      },
      risks: [
        'All credentials visible in logs/audit trail',
        'No encryption at rest or in transit',
        'Real customer credentials exposed',
      ],
    };
  }

  async safeGetStoredCredentials() {
    // SAFE: Return credential metadata without secrets
    return {
      database_connection: {
        host: 'db.internal.company.com',
        port: 5432,
        username: 'app_service_role', // Non-admin, least-privilege
        ssl: true,
        password_status: 'encrypted_in_vault',
        password_last_rotated: '2026-05-01',
        password_rotation_required_every: '90 days',
      },
      third_party_api_credentials: {
        service: 'payment-gateway',
        key_id: 'key_20260501_v2',
        key_status: 'active',
        secret_status: 'stored_in_aws_secrets_manager',
        encryption_key: 'kms-arn:aws:kms:us-east-1:xxxx:key/xxxx',
        last_rotated: '2026-05-01',
        next_rotation: '2026-08-01',
      },
      security_features: [
        'Secrets stored in external vault (AWS Secrets Manager)',
        'Credentials rotated every 90 days',
        'Encryption at rest with KMS',
        'Access audited and logged',
      ],
    };
  }
}
