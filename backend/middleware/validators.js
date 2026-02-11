const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// User registration validation
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    handleValidationErrors
];

// Login validation
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// OTP verification validation
const validateOTP = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('Invalid OTP format'),

    handleValidationErrors
];

// User update validation
const validateUserUpdate = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('status')
        .optional()
        .isIn(['active', 'banned', 'shadowBanned', 'suspended'])
        .withMessage('Invalid status value'),

    body('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Invalid role value'),

    handleValidationErrors
];

// Game creation validation
const validateGameCreation = [
    body('whitePlayer')
        .isMongoId()
        .withMessage('Invalid white player ID'),

    body('blackPlayer')
        .isMongoId()
        .withMessage('Invalid black player ID'),

    body('timeControl')
        .optional()
        .isObject()
        .withMessage('Time control must be an object'),

    body('timeControl.initial')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Initial time must be a positive integer'),

    body('timeControl.increment')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Increment must be a positive integer'),

    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),

    query('sort')
        .optional()
        .isIn(['createdAt', '-createdAt', 'username', '-username', 'email', '-email', 'status', '-status'])
        .withMessage('Invalid sort field'),

    handleValidationErrors
];

// ID parameter validation
const validateMongoId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),

    handleValidationErrors
];

// Broadcast message validation
const validateBroadcast = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 500 })
        .withMessage('Message must be between 1 and 500 characters'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority level'),

    handleValidationErrors
];

// Settings update validation
const validateSettings = [
    body('maintenanceMode')
        .optional()
        .isBoolean()
        .withMessage('Maintenance mode must be a boolean'),

    body('allowRegistration')
        .optional()
        .isBoolean()
        .withMessage('Allow registration must be a boolean'),

    body('maxConcurrentGames')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Max concurrent games must be between 1 and 1000'),

    handleValidationErrors
];

// Tournament creation validation
const validateTournament = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tournament name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Tournament name must be between 3 and 100 characters'),

    body('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date')
        .toDate(),

    body('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date')
        .toDate()
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('maxParticipants')
        .optional()
        .isInt({ min: 2, max: 1000 })
        .withMessage('Max participants must be between 2 and 1000'),

    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateOTP,
    validateUserUpdate,
    validateGameCreation,
    validatePagination,
    validateMongoId,
    validateBroadcast,
    validateSettings,
    validateTournament,
    handleValidationErrors
};
