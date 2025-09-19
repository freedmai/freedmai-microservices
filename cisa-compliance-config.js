// CISA (Cybersecurity and Infrastructure Security Agency) Compliance Configuration
// Essential Eight Cybersecurity Controls Implementation

module.exports = {
  // CISA Essential Eight Controls
  essentialEight: {
    // 1. Application Control
    applicationControl: {
      enabled: true,
      whitelistingEnabled: true,
      allowedApplications: [
        'node',
        'npm',
        'docker',
        'nginx',
      ],
      blockedExecutables: [
        '*.exe',
        '*.bat',
        '*.cmd',
        '*.scr',
        '*.vbs',
      ],
      macroSettings: {
        officeDocuments: 'disabled',
        webBrowsers: 'restricted',
      },
    },

    // 2. Patch Applications
    patchManagement: {
      enabled: true,
      automaticUpdates: true,
      criticalPatchWindow: '48 hours',
      regularPatchWindow: '1 month',
      vulnerabilityScanning: {
        frequency: 'daily',
        tools: ['npm audit', 'trivy', 'snyk'],
      },
      patchTesting: {
        required: true,
        environment: 'staging',
        rollbackPlan: true,
      },
    },

    // 3. Configure Microsoft Office Macro Settings
    macroSecurity: {
      enabled: true,
      defaultSetting: 'disabled',
      trustedLocations: [],
      digitalSignatureRequired: true,
      antivirusScanning: true,
    },

    // 4. User Application Hardening
    applicationHardening: {
      webBrowsers: {
        adBlockingEnabled: true,
        javaDisabled: true,
        flashDisabled: true,
        popupBlockingEnabled: true,
        downloadRestrictions: true,
      },
      pdfViewers: {
        javascriptDisabled: true,
        embeddedContentBlocked: true,
      },
      officeApplications: {
        macrosDisabled: true,
        activeXDisabled: true,
        ddeDisabled: true,
      },
    },

    // 5. Restrict Administrative Privileges
    privilegeRestriction: {
      enabled: true,
      principleOfLeastPrivilege: true,
      administrativeAccounts: {
        separateFromStandard: true,
        regularReview: true,
        mfaRequired: true,
      },
      privilegedAccessManagement: {
        justInTimeAccess: true,
        sessionRecording: true,
        approvalWorkflow: true,
      },
      serviceAccounts: {
        minimumPrivileges: true,
        regularRotation: true,
        monitoring: true,
      },
    },

    // 6. Patch Operating Systems
    operatingSystemPatching: {
      enabled: true,
      automaticUpdates: true,
      criticalPatchWindow: '48 hours',
      securityUpdates: {
        priority: 'high',
        testingRequired: true,
        rollbackPlan: true,
      },
      vulnerabilityAssessment: {
        frequency: 'weekly',
        tools: ['nessus', 'openvas'],
      },
    },

    // 7. Multi-factor Authentication
    multifactorAuthentication: {
      enabled: true,
      required: true,
      methods: [
        'TOTP',
        'SMS',
        'Email',
        'Hardware Token',
        'Biometric',
      ],
      enforcement: {
        allUsers: true,
        privilegedAccounts: 'mandatory',
        remoteAccess: 'mandatory',
        cloudServices: 'mandatory',
      },
      backupCodes: {
        enabled: true,
        singleUse: true,
        secureStorage: true,
      },
    },

    // 8. Regular Backups
    backupStrategy: {
      enabled: true,
      frequency: {
        full: 'weekly',
        incremental: 'daily',
        differential: 'daily',
      },
      retention: {
        daily: '30 days',
        weekly: '12 weeks',
        monthly: '12 months',
        yearly: '7 years',
      },
      testing: {
        frequency: 'monthly',
        fullRestore: 'quarterly',
        documentation: true,
      },
      offlineBackups: {
        enabled: true,
        frequency: 'weekly',
        secureStorage: true,
      },
      encryption: {
        enabled: true,
        algorithm: 'AES-256',
        keyManagement: 'secure',
      },
    },
  },

  // CISA Security Controls Framework
  securityControls: {
    // Access Control
    accessControl: {
      authentication: {
        strongPasswords: true,
        passwordPolicy: {
          minLength: 12,
          complexity: true,
          expiration: 90,
          history: 12,
          lockoutThreshold: 5,
        },
        sessionManagement: {
          timeout: 30, // minutes
          concurrentSessions: 1,
          secureTokens: true,
        },
      },
      authorization: {
        roleBasedAccess: true,
        principleOfLeastPrivilege: true,
        regularAccessReview: true,
      },
    },

    // Audit and Accountability
    auditAccountability: {
      logging: {
        enabled: true,
        events: [
          'authentication',
          'authorization',
          'data_access',
          'data_modification',
          'system_access',
          'configuration_changes',
          'privilege_escalation',
        ],
        retention: '1 year',
        protection: 'tamper-resistant',
      },
      monitoring: {
        realTime: true,
        alerting: true,
        anomalyDetection: true,
      },
    },

    // Configuration Management
    configurationManagement: {
      baselineConfiguration: true,
      changeControl: {
        approvalRequired: true,
        testing: true,
        documentation: true,
        rollbackPlan: true,
      },
      inventoryManagement: {
        hardwareInventory: true,
        softwareInventory: true,
        regularUpdates: true,
      },
    },

    // Contingency Planning
    contingencyPlanning: {
      businessContinuity: {
        planExists: true,
        regularTesting: true,
        staffTraining: true,
      },
      disasterRecovery: {
        planExists: true,
        backupSites: true,
        recoveryTimeObjective: '4 hours',
        recoveryPointObjective: '1 hour',
      },
      incidentResponse: {
        planExists: true,
        responseTeam: true,
        communicationPlan: true,
        forensicCapability: true,
      },
    },

    // Identification and Authentication
    identificationAuthentication: {
      userIdentification: {
        uniqueIdentifiers: true,
        identityVerification: true,
      },
      deviceIdentification: {
        uniqueIdentifiers: true,
        certificateBasedAuth: true,
      },
      multifactorAuthentication: {
        enabled: true,
        required: true,
      },
    },

    // Incident Response
    incidentResponse: {
      preparation: {
        policies: true,
        procedures: true,
        training: true,
        tools: true,
      },
      detection: {
        monitoring: true,
        alerting: true,
        analysis: true,
      },
      containment: {
        procedures: true,
        isolation: true,
        evidence: true,
      },
      eradication: {
        rootCause: true,
        vulnerabilities: true,
        malware: true,
      },
      recovery: {
        restoration: true,
        monitoring: true,
        validation: true,
      },
      lessonsLearned: {
        documentation: true,
        improvements: true,
        sharing: true,
      },
    },

    // Maintenance
    maintenance: {
      systemMaintenance: {
        scheduled: true,
        documented: true,
        approved: true,
      },
      maintenanceTools: {
        controlled: true,
        monitored: true,
        removed: true,
      },
      maintenancePersonnel: {
        authorized: true,
        supervised: true,
        background: true,
      },
    },

    // Media Protection
    mediaProtection: {
      mediaAccess: {
        restricted: true,
        authorized: true,
        logged: true,
      },
      mediaMarking: {
        classification: true,
        handling: true,
      },
      mediaSanitization: {
        procedures: true,
        verification: true,
        documentation: true,
      },
      mediaTransport: {
        encryption: true,
        custody: true,
        accountability: true,
      },
    },

    // Physical and Environmental Protection
    physicalProtection: {
      physicalAccess: {
        controlled: true,
        monitored: true,
        logged: true,
      },
      physicalSafeguards: {
        equipment: true,
        media: true,
        workstations: true,
      },
      environmentalControls: {
        temperature: true,
        humidity: true,
        power: true,
        fire: true,
      },
    },

    // Planning
    planning: {
      securityPlanning: {
        systemSecurityPlan: true,
        rulesOfBehavior: true,
        informationTypes: true,
      },
      systemSecurityPlan: {
        current: true,
        approved: true,
        distributed: true,
      },
    },

    // Personnel Security
    personnelSecurity: {
      positionCategorization: {
        riskLevels: true,
        criteria: true,
      },
      personnelScreening: {
        backgroundChecks: true,
        reinvestigation: true,
      },
      personnelTermination: {
        procedures: true,
        accessRevocation: true,
        propertyReturn: true,
      },
      personnelTransfer: {
        procedures: true,
        accessReview: true,
      },
    },

    // Risk Assessment
    riskAssessment: {
      securityCategorization: {
        informationTypes: true,
        impactLevels: true,
      },
      riskAssessment: {
        threats: true,
        vulnerabilities: true,
        likelihood: true,
        impact: true,
      },
      vulnerabilityScanning: {
        frequency: 'weekly',
        tools: true,
        remediation: true,
      },
    },

    // System and Communications Protection
    systemProtection: {
      boundaryProtection: {
        firewalls: true,
        intrusion: true,
        monitoring: true,
      },
      communicationsProtection: {
        encryption: true,
        integrity: true,
        availability: true,
      },
      networkSecurity: {
        segmentation: true,
        monitoring: true,
        controls: true,
      },
    },

    // System and Information Integrity
    systemIntegrity: {
      flawRemediation: {
        identification: true,
        reporting: true,
        correction: true,
      },
      maliciousCodeProtection: {
        detection: true,
        eradication: true,
        updates: true,
      },
      informationSystemMonitoring: {
        intrusion: true,
        unauthorized: true,
        malicious: true,
      },
      securityAlertsAdvisories: {
        receipt: true,
        dissemination: true,
        implementation: true,
      },
    },
  },

  // Compliance Reporting
  reporting: {
    cisaReporting: {
      incidentReporting: {
        required: true,
        timeframe: '24 hours',
        contact: 'cisa@dhs.gov',
      },
      vulnerabilityReporting: {
        required: true,
        timeframe: '72 hours',
        severity: 'high',
      },
    },
    complianceMetrics: {
      patchingCompliance: true,
      backupSuccess: true,
      incidentResponse: true,
      accessControl: true,
    },
  },

  // Implementation Timeline
  implementation: {
    phase1: {
      duration: '30 days',
      priority: 'critical',
      controls: [
        'Multi-factor Authentication',
        'Patch Management',
        'Backup Strategy',
        'Access Control',
      ],
    },
    phase2: {
      duration: '60 days',
      priority: 'high',
      controls: [
        'Application Control',
        'Privilege Restriction',
        'Audit Logging',
        'Incident Response',
      ],
    },
    phase3: {
      duration: '90 days',
      priority: 'medium',
      controls: [
        'Configuration Management',
        'Risk Assessment',
        'Personnel Security',
        'Physical Protection',
      ],
    },
  },
};
