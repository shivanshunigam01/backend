const { errorResponse } = require('../utils/apiResponse');

exports.notFound = (req, res) => errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
