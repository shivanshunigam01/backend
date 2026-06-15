require('../models/tdModels');

const TDVehicle = require('../models/TDVehicle');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');
const { buildPagination } = require('../utils/queryBuilder');

function formatVehicle(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const branch = plain.branchId && typeof plain.branchId === 'object' ? plain.branchId : null;
  return {
    _id: plain._id,
    vehicleId: plain.vehicleId,
    model: plain.model,
    variant: plain.variant,
    registrationNo: plain.registrationNo,
    vinNo: plain.vinNo,
    color: plain.color,
    batteryPercent: plain.batteryPercent ?? 0,
    currentOdometer: plain.currentOdometer ?? 0,
    status: plain.status,
    totalTestDriveKM: plain.totalTestDriveKM ?? 0,
    totalTestDrives: plain.totalTestDrives ?? 0,
    isLocked: Boolean(plain.isLocked),
    branchId: branch
      ? { _id: branch._id, name: branch.name, code: branch.code }
      : plain.branchId || null,
    insuranceValidity: plain.insuranceValidity,
    serviceDueDate: plain.serviceDueDate,
    availableAgainAt: plain.availableAgainAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function buildVehicleQuery(req) {
  const query = {};
  if (req.query.status) query.status = String(req.query.status).toUpperCase();
  if (req.query.model) query.model = String(req.query.model).trim();
  if (req.query.branchId) query.branchId = req.query.branchId;
  return query;
}

function nextVehicleId() {
  return `TDV-${Date.now().toString(36).toUpperCase()}`;
}

exports.listVehicles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const query = buildVehicleQuery(req);
  const [docs, total] = await Promise.all([
    TDVehicle.find(query)
      .populate('branchId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TDVehicle.countDocuments(query),
  ]);
  return successResponse(res, docs.map(formatVehicle), undefined, 200, { page, limit, total });
});

exports.createVehicle = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const doc = await TDVehicle.create({
    vehicleId: body.vehicleId || nextVehicleId(),
    model: body.model,
    variant: body.variant,
    registrationNo: body.registrationNo,
    vinNo: body.vinNo,
    color: body.color,
    batteryPercent: body.batteryPercent ?? 100,
    currentOdometer: body.currentOdometer ?? 0,
    status: body.status || 'AVAILABLE',
    branchId: body.branchId || undefined,
    insuranceValidity: body.insuranceValidity || undefined,
    serviceDueDate: body.serviceDueDate || undefined,
    availableAgainAt: body.availableAgainAt || undefined,
  });
  await doc.populate('branchId', 'name code');
  return successResponse(res, formatVehicle(doc), 'Vehicle created', 201);
});

exports.updateVehicle = asyncHandler(async (req, res) => {
  const doc = await TDVehicle.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Vehicle not found');

  const body = req.body || {};
  const fields = [
    'model',
    'variant',
    'registrationNo',
    'vinNo',
    'color',
    'batteryPercent',
    'currentOdometer',
    'branchId',
    'insuranceValidity',
    'serviceDueDate',
    'availableAgainAt',
  ];
  for (const key of fields) {
    if (body[key] !== undefined) doc[key] = body[key];
  }

  await doc.save();
  await doc.populate('branchId', 'name code');
  return successResponse(res, formatVehicle(doc), 'Vehicle updated');
});

exports.updateVehicleStatus = asyncHandler(async (req, res) => {
  const doc = await TDVehicle.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Vehicle not found');

  const { status, battery, availableAgainAt } = req.body || {};
  if (!status) throw new ApiError(400, 'status is required');

  doc.status = String(status).toUpperCase();
  if (battery !== undefined) doc.batteryPercent = Number(battery);
  if (availableAgainAt !== undefined) {
    doc.availableAgainAt = availableAgainAt ? new Date(availableAgainAt) : null;
  }
  if (doc.status === 'AVAILABLE') {
    doc.isLocked = false;
    doc.availableAgainAt = null;
  }

  await doc.save();
  await doc.populate('branchId', 'name code');
  return successResponse(res, formatVehicle(doc), 'Vehicle status updated');
});
