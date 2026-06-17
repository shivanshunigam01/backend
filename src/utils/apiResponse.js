exports.successResponse = (res, data, message = undefined, statusCode = 200, meta = undefined) => {
  const payload = { success: true, data };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

exports.errorResponse = (res, message, statusCode = 400, errors = undefined) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
