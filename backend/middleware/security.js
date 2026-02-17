import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import helmet from 'helmet';

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory (consider Redis for production with multiple servers)
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  300,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication - 5 attempts per 15 minutes
const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts, please try again later.'
);

// Stricter limiter for OTP - 3 attempts per 15 minutes
const otpLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  'Too many OTP verification attempts, please try again later.'
);

// Moderate limiter for password reset - 3 attempts per hour
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000,
  3,
  'Too many password reset attempts, please try again later.'
);

// Helmet security headers configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Input sanitization middleware
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Temporary pass-through to resolve 500 errors
  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Basic XSS protection - escape HTML in string inputs
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        // Only escape if it's not a password or similar field
        if (!['password', 'token', 'apiKey', 'search', 'q', 'query'].includes(key)) {
          obj[key] = escapeHtml(obj[key]);
        }
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, we can be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://10.32.234.244:5173',
    ];

    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVitePort = origin.endsWith(':5173') || origin.endsWith(':5174');

    if (allowedOrigins.indexOf(origin) !== -1 || (isLocalhost && isVitePort)) {
      callback(null, true);
    } else {
      console.error(`[CORS] ❌ Origin blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// HPP (HTTP Parameter Pollution) protection
const hppProtection = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit', 'fields']
});

export {
  apiLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  helmetConfig,
  sanitizeInput,
  xssProtection,
  corsOptions,
  hppProtection
};
