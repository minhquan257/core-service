import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class M2Service {
  /**
   * M2 — Inadequate Supply Chain Security
   * Demo: Check for known vulnerable dependencies
   * Now uses real customer data to show supply chain impacts
   */

  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async insecureCheckDependencies() {
    // INSECURE: Include known-vulnerable package versions
    let customerCount = 91;
    try {
      customerCount = await this.safeCustomerRepository.count();
    } catch (e) {
      // Fallback
    }

    return {
      warning: 'This application uses outdated and vulnerable dependencies',
      dependencies: [
        {
          name: 'lodash',
          installed_version: '4.17.15', // CVE-2019-10744
          latest_version: '4.17.21',
          vulnerabilities: 1,
          severity: 'HIGH',
          cve: 'CVE-2019-10744',
        },
        {
          name: 'axios',
          installed_version: '0.18.0', // CVE-2020-28168
          latest_version: '0.21.4',
          vulnerabilities: 1,
          severity: 'MEDIUM',
          cve: 'CVE-2020-28168',
        },
        {
          name: 'express',
          installed_version: '4.16.2', // Multiple CVEs
          latest_version: '4.18.2',
          vulnerabilities: 5,
          severity: 'HIGH',
          cves: ['CVE-2019-5413', 'CVE-2020-8130', 'CVE-2021-24409'],
        },
        {
          name: 'cryptojs',
          installed_version: '3.1.9', // Weak cryptography
          latest_version: '4.1.0',
          vulnerabilities: 1,
          severity: 'CRITICAL',
          note: 'Known weak cryptographic implementation',
        },
      ],
      risks: [
        'Known RCE vulnerabilities in express',
        'Prototype pollution in lodash',
        'SSRF in axios',
        'Weak encryption in cryptojs',
      ],
      affected_systems: `${customerCount} customers potentially impacted`,
      recommendation: 'Update dependencies immediately',
    };
  }

  async safeCheckDependencies() {
    // SAFE: All dependencies up-to-date with no known vulnerabilities
    return {
      warning:
        'All dependencies checked against known vulnerability database',
      dependencies: [
        {
          name: 'lodash',
          installed_version: '4.17.21',
          latest_version: '4.17.21',
          vulnerabilities: 0,
          severity: 'NONE',
        },
        {
          name: 'axios',
          installed_version: '0.21.4',
          latest_version: '1.7.7',
          vulnerabilities: 0,
          severity: 'NONE',
        },
        {
          name: 'express',
          installed_version: '4.18.2',
          latest_version: '4.18.2',
          vulnerabilities: 0,
          severity: 'NONE',
        },
        {
          name: '@noble/curves',
          installed_version: '1.6.0',
          latest_version: '1.6.0',
          vulnerabilities: 0,
          severity: 'NONE',
          note: 'Cryptography library with modern, audited algorithms',
        },
      ],
      security_measures: [
        'Dependencies locked via package-lock.json',
        'Weekly automated vulnerability scanning',
        'All dependencies from official npm registry',
        'Code signing and artifact verification enabled',
        'Supply chain SBOM generated and signed',
      ],
      status: 'OK - All dependencies secure',
    };
  }

  async insecureGetBuildInfo() {
    // INSECURE: Expose build details and unsafe artifact handling
    return {
      build: {
        version: '1.0.0-insecure',
        built_at: '2026-05-01T10:00:00Z',
        built_by: 'jenkins-ci',
        build_server: 'internal-ci.company.local',
      },
      artifacts: {
        source_repo: 'git@github.com:internal/app.git',
        commit_hash: 'a1b2c3d4e5f6...',
        branch: 'main',
        source_url:
          'http://internal-git-server/raw/main/src/', // HTTP, not HTTPS
      },
      build_artifacts: {
        unsigned: true,
        checksum_present: false,
        encrypted_before_storage: false,
        storage_location: 'public-s3-bucket',
      },
      risks: [
        'No artifact signing or verification',
        'Build artifacts publicly accessible',
        'Internal git URL exposed',
        'Unencrypted build pipeline',
      ],
    };
  }

  async safeGetBuildInfo() {
    // SAFE: Secure build with signed artifacts
    return {
      build: {
        version: '1.0.0-secure',
        built_at: '2026-05-01T10:00:00Z',
        built_by: 'github-actions',
        build_status: 'passed',
      },
      artifacts: {
        signature_algorithm: 'RSA-4096',
        signature_public_key_id: 'key_20260501',
        signed_at: '2026-05-01T10:05:00Z',
        checksum_algorithm: 'SHA256',
        checksum: 'sha256:abc123def456...',
      },
      build_security: [
        'Artifacts signed with company GPG key',
        'Checksums computed and verified',
        'Built in isolated, ephemeral environment',
        'Build logs encrypted and archived',
        'Supply chain integrity verified via SLSA L3',
      ],
      attestation: {
        format: 'in-toto',
        signed_by: 'build-trust@company.com',
        verified_at: '2026-05-01T10:05:00Z',
      },
      status: 'VERIFIED - Artifact integrity confirmed',
    };
  }
}
