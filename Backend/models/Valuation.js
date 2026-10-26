import mongoose from 'mongoose';

const valuationSchema = new mongoose.Schema({
  // Header Meta
  reportNo: { type: String, required: true, unique: true, index: true },
  serialNo: { type: String, default: '' },
  company: { type: String, default: '' },
  branch: { type: String, default: 'GA' },
  vehicleTypeCategory: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  telephone: { type: String, default: '' },
  opinionProvidedTo: { type: String, default: '' },
  placeOfInspection: { type: String, default: 'Galle' },
  inspectionDate: { type: Date, default: Date.now },
  inspectionTime: { type: String, default: '' },
  convertedDateType: { type: String, default: '' },

  // Tab 1: Vehicle Identification Details
  identification: {
    registrationNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    chassisNo: { type: String, required: true, trim: true },
    engineNo: { type: String, required: true, trim: true },
    classification: { type: String, default: 'MOTOR LORRY' },
    countryOfOrigin: { type: String, default: 'Japan' },
    countryOfUsed: { type: String, default: 'Sri Lanka' },
    yearOfManufacture: { type: String, default: '' },
    dateOfRegistration: { type: String, default: '' },
    length: { type: String, default: '' },
    fuelSystem: { type: String, default: 'DI' },
    unladenWeight: { type: String, default: '' },
    grossWeight: { type: String, default: '' },
    previousOwners: { type: String, default: '0' },
    importer: { type: String, default: '' },
    currentOwner: { type: String, default: '' },
    extraOptions: { type: String, default: '' },
    typeOfFuel: { type: String, default: 'Diesel' },
    switchKeyNo: { type: String, default: '' },
    meterReading: { type: String, default: '' },
    dateOfImport: { type: String, default: '' },
    dateOfClearing: { type: String, default: '' },
    colour: { type: String, default: 'White' },
    justLow: { type: String, default: '' },
    seatingCapacity: { type: String, default: '' },
    fourWheelDrive: { type: String, default: 'No' },
    engineCapacity: { type: String, default: '' },
    complianceWithCR: { type: String, default: 'Yes' },
    complianceComments: { type: String, default: '-' }
  },

  // Tab 2: Technical Evaluation
  technical: {
    transmission: {
      gearBoxType: { type: String, default: 'Manual' },
      gearBoxCondition: { type: String, default: 'Fair' },
      clutchType: { type: String, default: 'Applicable' },
      clutchCondition: { type: String, default: 'Good' },
      shafting: { type: String, default: 'Good' },
      differential: { type: String, default: 'Fair' },
      gearSelection: { type: String, default: 'Good' }
    },
    suspension: {
      front: { type: String, default: 'Fair' },
      rear: { type: String, default: 'Fair' }
    },
    brakes: {
      footBrakesType: { type: String, default: 'Hydraulic' },
      footBrakesCondition: { type: String, default: 'Good' },
      parkingBrakes: { type: String, default: 'Fair' }
    },
    steering: {
      type: { type: String, default: 'Power' },
      condition: { type: String, default: 'Good' }
    },
    chassisCondition: { type: String, default: 'Good' },
    bodyCondition: { type: String, default: 'Good' },
    specialFeatures: { type: String, default: '' },
    engine: {
      condition: { type: String, default: 'Fair' },
      status: { type: String, default: 'Original' },
      overhaulDoneOn: { type: String, default: '' },
      replacedOn: { type: String, default: '' }
    },
    tyres: {
      front: { size: { type: String, default: '' }, conditionPercent: { type: String, default: '60%' } },
      rear: { size: { type: String, default: '' }, conditionPercent: { type: String, default: '70%' } },
      spare: { size: { type: String, default: '' }, conditionPercent: { type: String, default: '50%' } },
      wheels: { type: String, default: 'Normal' }
    },
    electricalSystem: {
      starter: { type: String, default: 'Functioning' },
      wipers: { type: String, default: 'Functioning' },
      horn: { type: String, default: 'Functioning' },
      lights: { type: String, default: 'Functioning' },
      meters: { type: String, default: 'Functioning' },
      alternator: { type: String, default: 'Functioning' }
    },
    options: {
      powerShutters: { type: String, default: '-' },
      powerMirrors: { type: String, default: '-' },
      airConditioner: { type: String, default: '-' }
    }
  },

  // Tab 3: Road Test, Maintenance & Valuation Values
  evaluationTab2: {
    roadTest: {
      doneOn: { type: String, default: 'YES' },
      notDoneBecause: { type: String, default: '-' },
      averageFuelConsumption: { type: String, default: '' }
    },
    majorRepairs: {
      neededWithinYear: { type: String, default: '-' },
      bodyPartsReplaced: { type: String, default: '-' },
      accidents: { type: String, default: '-' },
      writeOffByInsurers: { type: String, default: '-' },
      comments: { type: String, default: '-' }
    },
    maintenance: {
      mechanical: { type: String, default: 'Fair' },
      body: { type: String, default: 'Fair' },
      internalTrim: { type: String, default: 'Viny' }
    },
    availabilityOfSpares: {
      bodyParts: { type: String, default: 'Available' },
      engineParts: { type: String, default: 'Available' },
      accessories: { type: String, default: 'Available' }
    },
    doors: { type: String, default: '2' },
    roofType: { type: String, default: 'Flat' },
    bodyType: { type: String, default: 'Open' },
    generalCondition: { type: String, default: 'Fair' },
    batteries: { type: String, default: '1' },
    impactOnGovPolicies: { type: String, default: '-' },
    complianceWithEnvRegulations: { type: String, default: '-' },
    comments: { type: String, default: '-' },

    // Financial Values
    marketValue: { type: Number, required: true, default: 0 },
    marketValueWords: { type: String, default: '' },
    forcedSaleValue: { type: Number, required: true, default: 0 },
    forcedSaleValueWords: { type: String, default: '' },
    travelingCharge: { type: Number, default: 0 },
    valuationCharge: { type: Number, default: 0 }
  },

  // Tab 4: Photos
  photos: {
    chassisNoPhoto: { type: String, default: '' },
    engineNoPhoto: { type: String, default: '' },
    vehiclePhotos: [{ type: String }]
  },

  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('VehicleValuation', valuationSchema);