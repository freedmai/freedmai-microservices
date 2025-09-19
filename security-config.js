// CISA Cybersecurity Compliance Configuration
module.exports = {
  // Security Headers (CISA Essential Eight)
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
  },

  // Rate Limiting (CISA DDoS Protection)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS Configuration (CISA Access Control)
  cors: {
    origin: process.env.CORS_ORIGIN || false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // JWT Security (CISA Authentication)
  jwt: {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'freedmai-api',
    audience: 'freedmai-client',
  },

  // Password Policy (CISA Identity Management)
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    historyCount: 12,
  },

  // Session Security (CISA Session Management)
  session: {
    name: 'freedmai.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 3600000, // 1 hour
      sameSite: 'strict',
    },
  },

  // Logging Configuration (CISA Audit Requirements)
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    auditEvents: [
      'authentication',
      'authorization',
      'data_access',
      'data_modification',
      'system_access',
      'configuration_changes',
    ],
  },

  // Input Validation (CISA Data Validation)
  validation: {
    sanitizeInput: true,
    maxRequestSize: '10mb',
    allowedFileTypes: ['.pdf', '.jpg', '.png', '.doc', '.docx'],
    maxFileSize: '5mb',
  },

  // Database Security (CISA Data Protection)
  database: {
    ssl: process.env.NODE_ENV === 'production',
    connectionTimeout: 30000,
    idleTimeout: 300000,
    maxConnections: 10,
    encryptionAtRest: true,
  },
};
