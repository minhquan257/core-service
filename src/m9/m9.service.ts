import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class M9Service {
  /**
   * M9 — Insecure Data Storage
   * Demo: Plaintext sensitive data stored on device/server
   * Now uses real customer data from database
   */

  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async insecureGetStorageStatus() {
    // INSECURE: Sensitive data stored in plaintext
    let customerId = 'unknown';
    let customerName = 'John Doe';
    let city = 'Springfield';
    try {
      const customer = await this.safeCustomerRepository.findOne({
        select: ['customerId', 'customerName', 'city'],
      });
      if (customer?.customerId) {
        customerId = customer.customerId;
      }
      if (customer?.customerName) {
        customerName = customer.customerName;
      }
      if (customer?.city) {
        city = customer.city;
      }
    } catch (e) {
      // Fallback
    }

    return {
      warning: 'Sensitive data stored in plaintext — easily accessible',
      device_storage: {
        user_prefs: {
          storage_location: 'SharedPreferences (Android)',
          encryption: 'NONE',
          contents: {
            'user_id': customerId.substring(0, 8),
            'username': customerName,
            'location': city,
            'auth_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'api_key': `sk_test_${customerId.substring(0, 8)}`,
            'password_hint': 'mothers_maiden_name',
          },
          accessibility: 'Readable by any app on device',
        },
        sqlite_database: {
          storage_location: '/data/data/com.app/databases/app.db',
          encryption: 'NONE',
          tables: [
            `users (id=${customerId.substring(0, 8)}, name=${customerName}, city=${city}, password_plaintext, credit_card)`,
            'credentials (service, username, password)',
            'api_keys (service, key, secret)',
          ],
          accessibility: 'Readable by any app with file access',
        },
        files: {
          storage_location:
            '/data/data/com.app/files/ or NSDocumentDirectory (iOS)',
          encryption: 'NONE',
          files: [
            'auth_token.txt (plaintext)',
            'user_session.json (plaintext)',
            'api_credentials.plist (plaintext)',
            'private_keys.pem (plaintext)',
          ],
          accessibility: 'Accessible via file manager if device is rooted/jailbroken',
        },
        cache: {
          storage_location: '/data/data/com.app/cache/',
          encryption: 'NONE',
          contents: 'Session tokens, recent API responses with PII',
          accessibility: 'Persists even after app uninstall',
        },
      },
      server_storage: {
        database: {
          storage: 'PostgreSQL unencrypted',
          sensitive_columns: [
            'users.password (plaintext)',
            'users.ssn',
            'users.credit_card_number',
            'users.api_key',
          ],
          encryption: 'NONE',
          backups: 'Stored unencrypted on shared file server',
        },
        logs: {
          log_files: 'contain plaintext sensitive data',
          examples: [
            'User login logs with passwords',
            'API logs with auth tokens',
            'Error logs with stack traces including secrets',
          ],
          retention: 'Indefinite (sent to CloudWatch without encryption)',
        },
      },
      risks: [
        'Rooted/jailbroken devices can read all data',
        'Unencrypted backups expose all secrets',
        'Log files permanently expose auth credentials',
        'Attackers can extract keys after device theft',
      ],
    };
  }

  async safeGetStorageStatus() {
    // SAFE: Sensitive data encrypted at rest
    return {
      warning: 'Sensitive data encrypted with platform-native encryption',
      device_storage: {
        user_prefs: {
          storage_location: 'EncryptedSharedPreferences (Android)',
          encryption: {
            algorithm: 'AES-256-GCM',
            key_storage: 'Android Keystore (hardware-backed if available)',
            master_key: 'Derived from device PIN/biometric',
          },
          sensitive_contents: 'Only non-sensitive preferences stored (theme, language)',
          sensitive_data: 'Stored in Keychain (iOS) / Keystore (Android)',
          accessibility: 'Only accessible to app itself',
        },
        sqlite_database: {
          storage_location: '/data/data/com.app/databases/app.db',
          encryption: {
            algorithm: 'SQLCipher (AES-256)',
            password_derived_from: 'Android Keystore master key',
          },
          tables: [
            'users (id, email, password_hash (bcrypt))',
            'credentials (encrypted_service, encrypted_username, encrypted_password)',
            'api_keys (encrypted)',
          ],
          accessibility: 'Requires database password to read',
        },
        files: {
          storage_location: 'Keychain (iOS) / EncryptedFile (Android)',
          encryption: {
            algorithm: 'AES-256-GCM per file',
            key_per_file: true,
            master_key: 'Android Keystore / iOS Secure Enclave',
          },
          contents: [
            'auth_token (encrypted)',
            'session_keys (encrypted)',
            'api_credentials (encrypted)',
            'private_keys (encrypted in Secure Enclave)',
          ],
          accessibility: 'Inaccessible without device unlock',
        },
        biometric_storage: {
          storage_type: 'iOS Secure Enclave / Android StrongBox',
          contents: 'High-value secrets (private keys, master passwords)',
          encryption: 'Hardware-backed encryption',
          accessibility: 'Requires biometric/PIN authentication',
        },
      },
      server_storage: {
        database: {
          storage: 'PostgreSQL with encryption at rest',
          encryption: {
            algorithm: 'AES-256',
            key_management: 'AWS KMS / HashiCorp Vault',
            per_column_encryption: true,
          },
          sensitive_columns: [
            'users.password (bcrypt hash)',
            'users.ssn (encrypted)',
            'users.credit_card_number (tokenized + encrypted)',
            'users.api_key (encrypted)',
          ],
          backups: 'Encrypted with same key management',
        },
        logs: {
          log_files: 'do not contain sensitive data',
          redaction: [
            'Auth tokens replaced with [REDACTED]',
            'Credit cards replaced with [REDACTED]',
            'SSN replaced with [REDACTED]',
          ],
          encryption: 'Encrypted before sending to CloudWatch',
          retention: '30 days (then deleted)',
        },
        key_management: {
          kms_provider: 'AWS KMS / HashiCorp Vault',
          key_rotation: '90 days',
          key_audit_logging: true,
          access_control: 'IAM-based, minimal privilege',
        },
      },
      security_features: [
        'Device encryption with Keystore/Keychain',
        'Database encryption with SQLCipher',
        'Per-file encryption for sensitive data',
        'Hardware-backed encryption (Secure Enclave/StrongBox)',
        'Encrypted backups with KMS',
        'Log redaction and encryption',
        'Key rotation policies',
        'Audit logging of key access',
      ],
    };
  }

  async insecureGetCacheStatus() {
    // INSECURE: Cache stores sensitive data indefinitely
    return {
      warning:
        'App cache contains sensitive data — persists even after app close',
      cache_locations: {
        app_cache: {
          path: '/data/data/com.app/cache',
          contents: [
            'API responses with user PII',
            'Session tokens',
            'Auth headers from previous requests',
          ],
          encryption: 'NONE',
          cleared_on_uninstall: false, // Data persists!
        },
        webview_cache: {
          path: '/data/data/com.app/cache/webview',
          contents: [
            'Cached pages with forms (usernames filled in)',
            'Session cookies',
            'Cached screenshots',
          ],
          encryption: 'NONE',
        },
        http_cache: {
          library: 'OkHttp Cache (Android)',
          contents: 'Cached API responses with personal data',
          encryption: 'NONE',
          max_age: '2592000 seconds (30 days)',
        },
        image_cache: {
          library: 'Glide / Picasso',
          contents: 'Downloaded images including profile photos',
          encryption: 'NONE',
          size: 'Can grow to 100MB+ over time',
        },
      },
      risks: [
        'All cached data readable after device rooting',
        'Persists even if app is uninstalled',
        'Forensic tools can recover cache even after deletion',
        'Shared device users can see cached content',
      ],
    };
  }

  async safeGetCacheStatus() {
    // SAFE: Cache encrypted and cleared properly
    return {
      warning: 'App cache encrypted and cleared on app close',
      cache_locations: {
        app_cache: {
          path: '/data/data/com.app/cache',
          encryption: {
            algorithm: 'AES-256-GCM',
            key_storage: 'Android Keystore',
          },
          contents: [
            'API responses (encrypted)',
            'Session tokens (encrypted)',
          ],
          lifecycle: 'Cleared when app is closed',
          cleared_on_uninstall: true,
        },
        webview_cache: {
          path: 'In-memory only',
          encryption: 'AES-256',
          lifecycle: 'Cleared on app backgrounding',
          contents_encrypted: true,
        },
        http_cache: {
          library: 'OkHttp with encrypted cache',
          encryption: {
            algorithm: 'AES-256-GCM',
            per_response_key: true,
          },
          cache_policy: 'No-cache for sensitive endpoints',
          lifecycle: 'Cleared on app close',
        },
        image_cache: {
          library: 'Glide with encrypted cache',
          encryption: 'AES-256',
          non_sensitive_images_only: true,
          lifecycle: 'Cleared periodically',
        },
      },
      cache_management: {
        cache_clearing: 'On app backgrounding',
        sensitive_endpoints: 'Not cached',
        cache_size_limit: '10MB max',
        encryption_key: 'Derived from Android Keystore',
      },
      security_features: [
        'All cache encrypted',
        'Cache cleared on app close/background',
        'Sensitive endpoints never cached',
        'Cache size limited',
        'Encryption key from Keystore',
        'Encrypted data unreadable even if extracted',
      ],
    };
  }
}
