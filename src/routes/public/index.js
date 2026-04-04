const router = require('express').Router();
const validate = require('../../middleware/validate');
const { formLimiter } = require('../../middleware/rateLimiter');
const publicController = require('../../controllers/publicController');
const formController = require('../../controllers/formController');
const { leadValidator, testDriveValidator, enquiryValidator } = require('../../validators/formValidators');

router.get('/public/site-config', publicController.getSiteConfig);
router.get('/public/hero-slides', publicController.getHeroSlides);
router.get('/public/products', publicController.getProducts);
router.get('/public/products/:slug', publicController.getProductBySlug);
router.get('/public/offers', publicController.getOffers);
router.get('/public/banners', publicController.getBanners);
router.get('/public/faqs', publicController.getFAQs);
router.get('/public/testimonials', publicController.getTestimonials);
router.get('/public/dealer-settings', publicController.getDealerSettings);

router.post('/leads', formLimiter, leadValidator, validate, formController.createLead);
router.post('/test-drives', formLimiter, testDriveValidator, validate, formController.createTestDrive);
router.post('/enquiries', formLimiter, enquiryValidator, validate, formController.createEnquiry);

module.exports = router;
