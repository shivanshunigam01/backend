const router = require('express').Router();
const { metaLeadsLimiter } = require('../middleware/rateLimiter');
const metaLeadsController = require('../controllers/metaLeadsController');

/** All paths are public — no JWT. */
router.get('/public/All_leads', metaLeadsLimiter, metaLeadsController.getAllMetaLeads);
router.get('/meta-leads', metaLeadsLimiter, metaLeadsController.getAllMetaLeads);

// Provider push: service can POST its response here; backend stores and serves on GET.
router.post('/public/All_leads', metaLeadsLimiter, metaLeadsController.upsertMetaLeadsPayload);
router.post('/meta-leads', metaLeadsLimiter, metaLeadsController.upsertMetaLeadsPayload);

module.exports = router;
