const { body } = require('express-validator');
const { enquiryInterests } = require('../constants/enums');

const mobileRule = body('mobile')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Invalid mobile');

exports.leadValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  mobileRule,
  body('model').isIn(['VF 6', 'VF 7', 'Both']).withMessage('Model must be VF 6, VF 7 or Both'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('otherCity').custom((value, { req }) => {
    if (req.body.city === 'Other' && !String(value || '').trim()) {
      throw new Error('otherCity is required when city is Other');
    }
    return true;
  }),
];

exports.testDriveValidator = [
  body('customerName').trim().isLength({ min: 2 }).withMessage('Customer name is required'),
  mobileRule,
  body('model').isIn(['VF 6', 'VF 7']).withMessage('Model must be VF 6 or VF 7'),
  body('preferredDate').isISO8601().withMessage('Preferred date is required'),
];

exports.enquiryValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  mobileRule,
  body('interest')
    .optional()
    .isIn(enquiryInterests)
    .withMessage('Invalid interest type'),
];
