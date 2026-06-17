/**
 * Import demo fleet from legacy Mongo collections into TDVehicle.
 *
 * Usage on server:
 *   IMPORT_TD_VEHICLES_CONFIRM=yes npm run import:td-vehicles
 */
require('dotenv').config();
const connectDB = require('../config/db');
require('../models/tdModels');
const TDVehicle = require('../models/TDVehicle');
const { importLegacyTdVehiclesIfEmpty } = require('../utils/tdVehicleLegacyImport');

(async () => {
  try {
    if (process.env.IMPORT_TD_VEHICLES_CONFIRM !== 'yes') {
      console.error('Set IMPORT_TD_VEHICLES_CONFIRM=yes to run legacy vehicle import.');
      process.exit(1);
    }

    await connectDB();

    const before = await TDVehicle.countDocuments();
    const imported = await importLegacyTdVehiclesIfEmpty();
    const after = await TDVehicle.countDocuments();

    if (before > 0 && imported === 0) {
      console.log(`TDVehicle already has ${before} record(s). Skipped legacy import.`);
    } else if (imported > 0) {
      console.log(`Imported ${imported} vehicle(s). Total in TDVehicle: ${after}`);
    } else {
      console.log('No legacy vehicle collections found. TDVehicle collection is still empty.');
      console.log('Add vehicles in admin: TD → Demo Fleet → Add Vehicle');
    }

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
})();
