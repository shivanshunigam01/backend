const { body, param } = require('express-validator');
const { adminRoles, resourceTypes } = require('../constants/enums');

exports.mongoIdParam = [param('id').isMongoId().withMessage('Invalid id')];

exports.adminUserValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional({ nullable: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(adminRoles).withMessage('Invalid admin role'),
];

exports.productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('slug').trim().notEmpty().withMessage('Slug is required'),
];

exports.mediaValidator = [
  body('name').trim().notEmpty().withMessage('Media name is required'),
  body('url').trim().isURL().withMessage('Valid media url is required'),
  body('resourceType').optional().isIn(resourceTypes).withMessage('Invalid resource type'),
];

exports.slideReorderValidator = [
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
];
