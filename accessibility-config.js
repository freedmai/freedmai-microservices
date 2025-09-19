// VPAT (Voluntary Product Accessibility Testing) Configuration
// WCAG 2.1 AA Compliance

module.exports = {
  // WCAG 2.1 Level AA Requirements
  wcag: {
    version: '2.1',
    level: 'AA',
    guidelines: {
      // 1. Perceivable
      perceivable: {
        textAlternatives: true,
        captions: true,
        audioDescriptions: true,
        adaptable: true,
        distinguishable: true,
        colorContrast: {
          normal: 4.5, // 4.5:1 for normal text
          large: 3.0,  // 3:1 for large text
        },
      },
      
      // 2. Operable
      operable: {
        keyboardAccessible: true,
        noSeizures: true,
        navigable: true,
        inputModalities: true,
        timing: {
          adjustable: true,
          pausable: true,
          noTimeouts: false,
        },
      },
      
      // 3. Understandable
      understandable: {
        readable: true,
        predictable: true,
        inputAssistance: true,
        language: 'en-US',
      },
      
      // 4. Robust
      robust: {
        compatible: true,
        markup: {
          valid: true,
          semantic: true,
        },
      },
    },
  },

  // Accessibility Features
  features: {
    screenReader: true,
    keyboardNavigation: true,
    highContrast: true,
    textScaling: true,
    focusIndicators: true,
    skipLinks: true,
    headingStructure: true,
    altText: true,
    ariaLabels: true,
    errorMessages: true,
  },

  // Testing Requirements
  testing: {
    automated: ['axe-core', 'lighthouse'],
    manual: true,
    screenReaders: ['NVDA', 'JAWS', 'VoiceOver'],
    browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    devices: ['desktop', 'tablet', 'mobile'],
  },
};
