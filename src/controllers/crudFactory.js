const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');
const { buildPagination, buildSearchQuery } = require('../utils/queryBuilder');

exports.getAll = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req);
    const query = {};

    if (options.activeOnly) query.active = true;
    if (options.defaultSort) {
      req._sort = options.defaultSort;
    }

    if (options.searchFields && req.query.search) {
      Object.assign(query, buildSearchQuery(req.query.search, options.searchFields));
    }

    if (options.filterMapper) {
      Object.assign(query, options.filterMapper(req));
    }

    const [data, total] = await Promise.all([
      Model.find(query)
        .sort(req._sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Model.countDocuments(query),
    ]);

    return successResponse(res, data, undefined, 200, { page, limit, total });
  });

exports.getOne = (Model, populate = '') =>
  asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) throw new ApiError(404, 'Document not found');
    return successResponse(res, doc);
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.create(req.body);
    return successResponse(res, doc, 'Created successfully', 201);
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new ApiError(404, 'Document not found');
    return successResponse(res, doc, 'Updated successfully');
  });

exports.deleteOne = (Model, hardDelete = true) =>
  asyncHandler(async (req, res) => {
    const doc = hardDelete
      ? await Model.findByIdAndDelete(req.params.id)
      : await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) throw new ApiError(404, 'Document not found');
    return successResponse(res, doc, hardDelete ? 'Deleted successfully' : 'Soft-deleted successfully');
  });
