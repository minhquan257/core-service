import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class M6Service {
  /**
   * M6 — Inadequate Privacy Controls
   * Demo: Over-collection and over-sharing of user data
   * Now using real database records instead of static data
   */

  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async insecureGetUserProfile(userId: string) {
    // INSECURE: Return all PII without consent/minimization
    // Try to get real customer from database
    let customerName = 'John Doe';
    let city = 'Springfield';
    let country = 'USA';

    try {
      const customer = await this.safeCustomerRepository.findOne({
        where: { customerId: userId },
      });
      if (customer) {
        customerName = customer.customerName || customerName;
        city = customer.city || city;
        country = customer.country || country;
      }
    } catch (e) {
      // Fallback to defaults if query fails
    }

    return {
      warning: 'All available user data collected and shared without consent',
      user_id: userId,
      full_name: customerName,
      email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone_number: '+1-555-123-4567',
      date_of_birth: '1990-05-15',
      ssn: '123-45-6789', // Sensitive!
      home_address: `123 Main St, ${city}, ${country}`,
      credit_card: {
        number: '4532-1111-2222-3333', // Sensitive!
        cvv: '123',
        expiry: '05/28',
      },
      medical_history: [
        'Diabetes',
        'High blood pressure',
        'Previous surgeries',
      ],
      employment: {
        company: 'TechCorp Inc',
        title: 'Senior Engineer',
        salary_range: '$150k-$200k',
      },
      location_history: [
        { lat: 39.7817, lng: -89.6501, timestamp: '2026-05-01T10:00:00Z' },
        { lat: 39.7814, lng: -89.6505, timestamp: '2026-05-01T11:00:00Z' },
      ],
      browsing_history: [
        'medical-conditions.com',
        'job-search-sites.com',
        'financial-advice.com',
      ],
      data_shared_with_partners: [
        'marketing-agency',
        'data-broker',
        'insurance-company',
      ],
      risks: [
        'All PII collected even if not needed',
        'Data shared with third parties without explicit consent',
        'Location history tracked indefinitely',
        'Sensitive financial and medical data exposed',
      ],
    };
  }

  async safeGetUserProfile(userId: string) {
    // SAFE: Minimal data collection with proper consent
    // Get real customer from database
    let displayName = 'User';
    let city = 'Unknown';

    try {
      const customer = await this.safeCustomerRepository.findOne({
        where: { customerId: userId },
      });
      if (customer) {
        // Minimize data: just first name
        const name = customer.customerName || 'User';
        displayName = name.split(' ')[0] + ' ' + name.split(' ')[1]?.[0]?.toUpperCase() + '.';
        city = customer.city || 'Unknown';
      }
    } catch (e) {
      // Fallback to defaults
    }

    return {
      warning: 'Only necessary data collected with user consent',
      user_id: userId,
      profile: {
        display_name: displayName, // Minimized
        email_for_notifications: '[email redacted]', // Masked
        account_created: '2025-01-01',
        location: city, // Only city, no coordinates
      },
      data_collection_consents: {
        basic_profile: { consent_given: true, purpose: 'Account management' },
        marketing_emails: {
          consent_given: false,
          purpose: 'Not applicable',
        },
        location_tracking: { consent_given: false, purpose: 'Not applicable' },
        third_party_sharing: {
          consent_given: false,
          purpose: 'Not applicable',
        },
      },
      data_retention_policy: {
        basic_profile: 'Retained until account deletion',
        activity_logs: 'Deleted after 90 days',
        location_data: 'Not collected',
        payment_info: 'Not stored; processed via PCI-compliant provider',
      },
      data_rights: {
        access: 'User can download their data (GDPR)',
        deletion: 'User can request full deletion (Right to be Forgotten)',
        portability: 'User can export in standard format',
      },
      third_party_sharing: 'None', // No data shared without explicit consent
      security_features: [
        'Data minimization applied',
        'Explicit consent for each use case',
        'Audit log of all data access',
        'Encryption at rest and in transit',
      ],
    };
  }

  async insecureGetUserDataWithoutConsent(userId: string) {
    // INSECURE: Share data via third-party without asking
    // Get customer data from database for more realistic demo
    let customerName = 'John Doe';
    let country = 'USA';

    try {
      const customer = await this.safeCustomerRepository.findOne({
        where: { customerId: userId },
      });
      if (customer) {
        customerName = customer.customerName || customerName;
        country = customer.country || country;
      }
    } catch (e) {
      // Fallback to defaults
    }

    return {
      message: 'User data shared with third-party partners',
      shared_with: ['analytics-platform', 'advertising-network', 'data-broker'],
      data_shared: {
        user_id: userId,
        name: customerName,
        email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: '+1-555-123-4567',
        device_id: 'aabbccdd11223344',
        device_model: 'iPhone 14 Pro',
        os_version: 'iOS 16.5',
        app_version: '1.0.0',
        installation_timestamp: '2025-01-01T00:00:00Z',
        app_usage_patterns: [
          'Opened app 247 times',
          'Average session duration: 8 minutes',
          'Most used features: Shopping, Search',
        ],
        network_info: {
          country: country,
          ip_address: '192.168.1.100',
          carrier: 'Verizon',
        },
        location_data: [
          'Home country: ' + country,
          'Work address coordinates',
          'Frequent locations',
        ],
        browsing_history_within_app: ['luxury-goods', 'dating-apps'],
      },
      third_party_usage: [
        'Used for ad profiling',
        'Sold to marketing agencies',
        'Combined with other users for behavioral analysis',
      ],
      risks: [
        'No explicit user consent',
        'Sensitive device and location data exposed',
        'Data sold to third parties',
      ],
    };
  }

  async safeGetUserDataSharing() {
    // SAFE: No data sharing without explicit consent
    return {
      message:
        'User data sharing status — no third-party access without consent',
      data_sharing_status: 'NONE',
      third_party_partners: [
        {
          name: 'Payment Processor',
          access_level: 'Payment information only (PCI-compliant)',
          data_shared: ['transaction_id', 'amount', 'date'],
          access_type: 'Tokenized (no full card details)',
        },
      ],
      user_controls: {
        opt_in_marketing: false,
        opt_in_analytics: false,
        opt_in_location_tracking: false,
        opt_in_third_party_ads: false,
      },
      privacy_policy: {
        version: '2.0',
        last_updated: '2026-05-01',
        accessible_at: 'https://company.com/privacy',
        user_notified: true,
        consent_required_for_changes: true,
      },
      data_protection_features: [
        'No data shared beyond essential partners',
        'All data transfers authenticated and encrypted',
        'Regular audits of third-party access',
        'User can revoke access anytime',
      ],
    };
  }
}
