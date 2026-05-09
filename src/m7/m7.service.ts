import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeCustomer } from '../sqli/entities/safe-customer.entity';

@Injectable()
export class M7Service {
  /**
   * M7 — Insufficient Binary Protections
   * Demo: App hardening status checks
   * Now uses real customer data to show exploitation risks
   */

  constructor(
    @InjectRepository(SafeCustomer)
    private safeCustomerRepository: Repository<SafeCustomer>,
  ) {}

  async insecureCheckAppHardening() {
    // INSECURE: No hardening protections enabled
    return {
      warning:
        'Application has no hardening protections — easily reversible and debuggable',
      app_signing: {
        signed: false, // Not signed
      },
      debug_enabled: true, // Can be debugged
      debugger_status: 'Debuggable via lldb and Android Studio',
      code_obfuscation: {
        enabled: false,
        reason: 'Performance optimization (bad idea!)',
      },
      jailbreak_detection: {
        enabled: false,
        status: 'App runs on jailbroken/rooted devices without warning',
      },
      anti_tampering: {
        enabled: false,
        status: 'Binary can be modified without detection',
      },
      code_injection_protection: {
        enabled: false,
        status: 'Vulnerable to runtime code injection (frida, etc.)',
      },
      symbol_information: {
        retained: true,
        details: 'Full debug symbols included in binary',
        impact: 'Reverse engineering trivial',
      },
      string_literals: {
        encrypted: false,
        status: 'All strings visible in binary (grep-able)',
      },
      hardcoded_secrets: {
        status: 'Secrets findable via strings command',
        example: 'API keys, encryption keys embedded in code',
      },
      risks: [
        'Easy reverse engineering with Ghidra/IDA',
        'Runtime patching via Frida',
        'Code injection on jailbroken devices',
        'Secret extraction from binary',
      ],
    };
  }

  async safeCheckAppHardening() {
    // SAFE: All hardening protections enabled
    return {
      warning: 'Application has comprehensive hardening protections enabled',
      app_signing: {
        signed: true,
        algorithm: 'RSA-4096',
        certificate_pinning: true,
      },
      debug_enabled: false,
      debugger_status: 'Debugger detection enabled — app quits if debugged',
      code_obfuscation: {
        enabled: true,
        method: 'ProGuard (Android) / Swift obfuscation (iOS)',
        class_names: 'Obfuscated',
        method_names: 'Obfuscated',
        string_literals: 'Encrypted with per-app key',
      },
      jailbreak_detection: {
        enabled: true,
        checks: [
          'File system integrity',
          'Process inspection',
          'Cydia/Sileo presence',
          'App sandboxing validation',
        ],
        behavior: 'App refuses to run on jailbroken/rooted devices',
      },
      anti_tampering: {
        enabled: true,
        method: 'Runtime integrity verification',
        checks_per_minute: 'Multiple',
        behavior: 'Crashes app if tampering detected',
      },
      code_injection_protection: {
        enabled: true,
        method: 'Frida hardening + injectable library detection',
        status: 'Injection attempts detected and blocked',
      },
      symbol_information: {
        retained: false,
        details: 'Debug symbols stripped from production build',
      },
      string_encryption: {
        enabled: true,
        encryption_algorithm: 'AES-256',
        per_app_key: true,
      },
      hardcoded_secrets: {
        status: 'No secrets in binary — all from secure remote config',
        secure_enclave: true,
        keychain_integration: true,
      },
      hardening_features: [
        'Binary code signing + certificate pinning',
        'Debugger detection + termination',
        'Full code obfuscation',
        'Jailbreak/root detection',
        'Anti-tampering verification',
        'Frida/injection detection',
        'Symbol stripping',
        'String encryption',
      ],
    };
  }

  async insecureGetRuntimeInfo() {
    // INSECURE: Expose internal runtime details for exploitation
    let customerId = '12345';
    let username = 'admin';
    try {
      const customer = await this.safeCustomerRepository.findOne({
        select: ['customerId', 'username'],
      });
      if (customer?.customerId) {
        customerId = customer.customerId.substring(0, 8);
      }
      if (customer?.username) {
        username = customer.username;
      }
    } catch (e) {
      // Fallback
    }

    return {
      runtime_environment: 'Exposed for debugging (BAD)',
      process_info: {
        name: 'com.company.vulnerable.app',
        pid: 12345,
        ppid: 1,
        logged_in_user: username,
      },
      memory_layout: {
        base_address: '0x100000000', // ASLR disabled
        heap_start: '0x100010000',
        stack_start: '0x7ffee0000000',
      },
      loaded_libraries: [
        '/usr/lib/libSystem.B.dylib',
        '/usr/lib/libobjc.A.dylib',
        '/custom/lib/vulnerable_library.dylib',
      ],
      environment_variables: [
        'PATH=/usr/local/bin:/usr/bin:/bin',
        'LD_PRELOAD=/tmp/attacker_library.so', // Allows code injection
      ],
      capabilities: {
        nx_bit_enabled: false, // Code execution from data segment allowed
        aslr_enabled: false, // No address space randomization
        stack_canaries: false, // Buffer overflow attacks possible
      },
      risks: [
        'ASLR disabled — easier ROP attacks',
        'Stack canaries disabled — trivial buffer overflow',
        'LD_PRELOAD allows library injection',
      ],
    };
  }

  async safeGetRuntimeInfo() {
    // SAFE: Runtime info not exposed
    return {
      runtime_status: 'Protected — debug info restricted',
      process_info: {
        name: 'com.company.secure.app',
        process_info_access: 'Denied',
      },
      memory_layout: {
        aslr_enabled: true,
        details_hidden: true,
      },
      loaded_libraries: 'Hidden from user code',
      environment_variables: {
        access: 'Restricted',
        injection_detection: true,
      },
      capabilities: {
        nx_bit: true,
        aslr: true,
        stack_canaries: true,
        cfi: true, // Control flow integrity
      },
      security_features: [
        'ASLR enabled (address randomization)',
        'Stack canaries enabled',
        'NX bit enabled (code/data separation)',
        'CFI enabled (control flow integrity)',
        'Runtime info hidden',
        'No library injection possible',
      ],
    };
  }
}
