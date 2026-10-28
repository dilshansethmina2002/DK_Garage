import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    Shield, CheckCircle2, AlertCircle, ArrowLeft, Camera,
    FileText, DollarSign, RefreshCw, Check, Printer
} from 'lucide-react';
import API from '../api';
import ValuationPrintView from '../components/ValuationPrintView.jsx';

const TABS = [
    { id: 'identification', label: '1. Vehicle Identification' },
    { id: 'technical', label: '2. Technical Evaluation' },
    { id: 'evaluationTab2', label: '3. Road Test & Values' },
    { id: 'photos', label: '4. Photo Documentation' }
];

const INITIAL_FORM_STATE = {
    reportNo: '',
    serialNo: '',
    company: 'AAM',
    branch: 'GA',
    vehicleTypeCategory: '',
    contactPerson: 'T.Pradeep Kumarage',
    telephone: '077-1963949',
    opinionProvidedTo: 'Sanasa Development Bank PLC',
    placeOfInspection: 'Galle',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionTime: '09:56 AM',
    convertedDateType: '',
    identification: {
        registrationNo: '',
        make: 'MITSUBISHI',
        model: 'FE635E6R',
        chassisNo: '',
        engineNo: '',
        classification: 'MOTOR LORRY',
        countryOfOrigin: 'Japan',
        countryOfUsed: 'Sri Lanka',
        yearOfManufacture: '2007',
        dateOfRegistration: '',
        length: '610.00CM',
        fuelSystem: 'DI',
        unladenWeight: '2000.00KG',
        grossWeight: '4530.00KG',
        previousOwners: '4',
        importer: '',
        currentOwner: '',
        extraOptions: '',
        typeOfFuel: 'Diesel',
        switchKeyNo: '',
        meterReading: '',
        dateOfImport: '',
        dateOfClearing: '',
        colour: 'White',
        justLow: '',
        seatingCapacity: '0',
        fourWheelDrive: 'No',
        engineCapacity: '3567.00CC',
        complianceWithCR: 'Yes',
        complianceComments: '-'
    },
    technical: {
        transmission: {
            gearBoxType: 'Manual',
            gearBoxCondition: 'Fair',
            clutchType: 'Applicable',
            clutchCondition: 'Good',
            shafting: 'Good',
            differential: 'Fair',
            gearSelection: 'Good'
        },
        suspension: { front: 'Fair', rear: 'Fair' },
        brakes: {
            footBrakesType: 'Hydraulic',
            footBrakesCondition: 'Good',
            parkingBrakes: 'Fair'
        },
        steering: { type: 'Power', condition: 'Good' },
        chassisCondition: 'Good',
        bodyCondition: 'Good',
        specialFeatures: '',
        engine: {
            condition: 'Fair',
            status: 'Original',
            overhaulDoneOn: '',
            replacedOn: ''
        },
        tyres: {
            front: { size: '700/16', conditionPercent: '60%' },
            rear: { size: '700/16', conditionPercent: '70%' },
            spare: { size: '700/16', conditionPercent: '50%' },
            wheels: 'Normal'
        },
        electricalSystem: {
            starter: 'Functioning',
            wipers: 'Functioning',
            horn: 'Functioning',
            lights: 'Functioning',
            meters: 'Functioning',
            alternator: 'Functioning'
        },
        options: {
            powerShutters: '-',
            powerMirrors: '-',
            airConditioner: '-'
        }
    },
    evaluationTab2: {
        roadTest: {
            doneOn: 'YES',
            notDoneBecause: '-',
            averageFuelConsumption: '6'
        },
        majorRepairs: {
            neededWithinYear: '-',
            bodyPartsReplaced: '-',
            accidents: '-',
            writeOffByInsurers: '-',
            comments: '-'
        },
        maintenance: {
            mechanical: 'Fair',
            body: 'Fair',
            internalTrim: 'Viny'
        },
        availabilityOfSpares: {
            bodyParts: 'Available',
            engineParts: 'Available',
            accessories: 'Available'
        },
        doors: '2',
        roofType: 'Flat',
        bodyType: 'Open',
        generalCondition: 'Fair',
        batteries: '1',
        impactOnGovPolicies: '-',
        complianceWithEnvRegulations: '-',
        comments: '-',
        marketValue: 5500000,
        marketValueWords: 'FIVE MILLION FIVE HUNDRED THOUSAND ONLY',
        forcedSaleValue: 5000000,
        forcedSaleValueWords: 'FIVE MILLION ONLY',
        travelingCharge: 0,
        valuationCharge: 0
    },
    photos: {
        chassisNoPhoto: '',
        engineNoPhoto: '',
        vehiclePhotos: []
    }
};

// Utility function to convert numbers to uppercase words
const convertNumberToWords = (amount) => {
    if (!amount) return '';

    const single = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const double = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const scale = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    let words = [];
    let num = Math.floor(amount);
    let scaleIdx = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = [];
            if (chunk > 99) {
                chunkWords.push(single[Math.floor(chunk / 100)] + ' HUNDRED');
                chunk %= 100;
            }
            if (chunk > 9 && chunk < 20) {
                chunkWords.push(double[chunk - 10]);
            } else {
                if (chunk > 19) {
                    chunkWords.push(tens[Math.floor(chunk / 10)]);
                    chunk %= 10;
                }
                if (chunk > 0) {
                    chunkWords.push(single[chunk]);
                }
            }
            if (scale[scaleIdx]) {
                chunkWords.push(scale[scaleIdx]);
            }
            words.unshift(chunkWords.join(' '));
        }
        num = Math.floor(num / 1000);
        scaleIdx++;
    }
    return words.length > 0 ? words.join(' ') + ' ONLY' : '';
};

const ValuationWorkspace = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('identification');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const chassisInputRef = useRef(null);
    const engineInputRef = useRef(null);
    const vehicleFrontInputRef = useRef(null);
    const vehicleRearInputRef = useRef(null);

    useEffect(() => {
        if (!isEditMode) return;
        const fetchRecord = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/valuations/${id}`);
                setFormData(res.data);
            } catch (err) {
                setErrorMessage('Failed to load valuation report details.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [id, isEditMode]);

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleDeepNestedChange = (section, subSection, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subSection]: { ...prev[section][subSection], [field]: value }
            }
        }));
    };

    const handlePhotoUpload = async (e, type, index = null) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const uploadPayload = new FormData();
        if (type === 'chassisNoPhoto') {
            uploadPayload.append('chassisNoPhoto', files[0]);
        } else if (type === 'engineNoPhoto') {
            uploadPayload.append('engineNoPhoto', files[0]);
        } else if (type === 'vehiclePhotos') {
            uploadPayload.append('vehiclePhotos', files[0]);
        }

        try {
            setUploadingPhotos(true);
            const res = await API.post('/api/valuations/upload-photos', uploadPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFormData(prev => {
                const updatedPhotos = { ...prev.photos };

                if (type === 'chassisNoPhoto') {
                    updatedPhotos.chassisNoPhoto = res.data.chassisNoPhoto || prev.photos.chassisNoPhoto;
                } else if (type === 'engineNoPhoto') {
                    updatedPhotos.engineNoPhoto = res.data.engineNoPhoto || prev.photos.engineNoPhoto;
                } else if (type === 'vehiclePhotos') {
                    const currentVehiclePhotos = [...(prev.photos.vehiclePhotos || [])];
                    if (currentVehiclePhotos.length < 2) {
                        currentVehiclePhotos.push(null, null);
                    }
                    currentVehiclePhotos[index] = res.data.vehiclePhotos?.[0] || currentVehiclePhotos[index];
                    updatedPhotos.vehiclePhotos = currentVehiclePhotos;
                }

                return { ...prev, photos: updatedPhotos };
            });
            setSuccessMessage('Photo uploaded to Supabase Storage successfully.');
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to upload photo to storage.');
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            if (isEditMode) {
                await API.put(`/api/valuations/${id}`, formData);
                setSuccessMessage('Valuation Report updated successfully.');
            } else {
                const res = await API.post('/api/valuations', formData);
                setSuccessMessage('Valuation Report generated and saved.');
                navigate(`/valuations/workspace/${res.data.valuation.reportNo || res.data.valuation._id}`);
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to persist valuation report.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
                <div className="flex items-center gap-3 text-slate-800 font-extrabold text-base animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#BC0202] animate-spin" />
                    Loading Valuation Workspace...
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8 font-sans text-slate-900 print:hidden">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header Controls */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-[#BC0202] border border-red-200 mb-2">
                                <Shield className="w-3.5 h-3.5" /> DK Automobile Valuation System
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                                {isEditMode ? `Inspection Report — #${formData.reportNo || id}` : 'New Valuation Certificate'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                            <Link className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer" to="/valuations">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Link>

                            {isEditMode && (
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                >
                                    <Printer className="w-4 h-4" /> Print A4 Report
                                </button>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className={`bg-[#BC0202] hover:bg-[#830000] text-white px-7 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#830000] ${saving ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                {saving ? 'Saving...' : isEditMode ? 'Update Report' : 'Save & Publish'}
                            </button>
                        </div>
                    </div>

                    {/* Feedback alerts */}
                    {errorMessage && (
                        <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs">
                            <Check className="w-5 h-5 text-emerald-600 shrink-0" /> {successMessage}
                        </div>
                    )}

                    {/* Master Inspection Header Form */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#BC0202]" /> Header Specifications
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Report No *</label>
                                <input type="text" value={formData.reportNo} onChange={e => setFormData({ ...formData, reportNo: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Company</label>
                                <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Branch</label>
                                <input type="text" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">V:Type Category</label>
                                <input type="text" value={formData.vehicleTypeCategory} onChange={e => setFormData({ ...formData, vehicleTypeCategory: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Date</label>
                                <input type="date" value={formData.inspectionDate} onChange={e => setFormData({ ...formData, inspectionDate: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Contact Person</label>
                                <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Tel Contact</label>
                                <input type="text" value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Opinion Provided To</label>
                                <input type="text" value={formData.opinionProvidedTo} onChange={e => setFormData({ ...formData, opinionProvidedTo: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Place of Inspection</label>
                                <input type="text" value={formData.placeOfInspection} onChange={e => setFormData({ ...formData, placeOfInspection: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Time of Inspection</label>
                                <input type="text" value={formData.inspectionTime} onChange={e => setFormData({ ...formData, inspectionTime: e.target.value })} className="w-full p-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800" />
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation Controls */}
                    <div className="flex border-b-2 border-slate-300 bg-white rounded-t-2xl px-3 pt-2 gap-2 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all cursor-pointer border-b-4 shrink-0 ${activeTab === tab.id
                                    ? 'border-[#BC0202] text-[#BC0202] bg-red-50/50'
                                    : 'border-transparent text-slate-600 hover:text-black hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: IDENTIFICATION */}
                    {activeTab === 'identification' && (
                        <div className="bg-white p-6 rounded-b-2xl border-2 border-t-0 border-slate-300 shadow-xs space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.1 Registration No *</label><input type="text" value={formData.identification.registrationNo} onChange={e => handleNestedChange('identification', 'registrationNo', e.target.value.toUpperCase())} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.2 Make *</label><input type="text" value={formData.identification.make} onChange={e => handleNestedChange('identification', 'make', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.3 Model *</label><input type="text" value={formData.identification.model} onChange={e => handleNestedChange('identification', 'model', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.4 Chassis No *</label><input type="text" value={formData.identification.chassisNo} onChange={e => handleNestedChange('identification', 'chassisNo', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.5 Engine No *</label><input type="text" value={formData.identification.engineNo} onChange={e => handleNestedChange('identification', 'engineNo', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-black uppercase bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.6 Classification</label><input type="text" value={formData.identification.classification} onChange={e => handleNestedChange('identification', 'classification', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.7 Country of Origin</label><input type="text" value={formData.identification.countryOfOrigin} onChange={e => handleNestedChange('identification', 'countryOfOrigin', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.8 Country of Used</label><input type="text" value={formData.identification.countryOfUsed} onChange={e => handleNestedChange('identification', 'countryOfUsed', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.9 Year of Manufacture</label><input type="text" value={formData.identification.yearOfManufacture} onChange={e => handleNestedChange('identification', 'yearOfManufacture', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.10 Date of Registration</label><input type="text" value={formData.identification.dateOfRegistration} onChange={e => handleNestedChange('identification', 'dateOfRegistration', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.11 Length</label><input type="text" value={formData.identification.length} onChange={e => handleNestedChange('identification', 'length', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.12 Fuel System</label><input type="text" value={formData.identification.fuelSystem} onChange={e => handleNestedChange('identification', 'fuelSystem', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.13 Unladen Weight</label><input type="text" value={formData.identification.unladenWeight} onChange={e => handleNestedChange('identification', 'unladenWeight', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.14 Gross Weight</label><input type="text" value={formData.identification.grossWeight} onChange={e => handleNestedChange('identification', 'grossWeight', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.15 Type of Fuel</label>
                                    <select value={formData.identification.typeOfFuel} onChange={e => handleNestedChange('identification', 'typeOfFuel', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none">
                                        <option value="Diesel">Diesel</option>
                                        <option value="Petrol">Petrol</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Electric">Electric</option>
                                    </select>
                                </div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.18 Meter Reading</label><input type="text" value={formData.identification.meterReading} onChange={e => handleNestedChange('identification', 'meterReading', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.21 Colour</label><input type="text" value={formData.identification.colour} onChange={e => handleNestedChange('identification', 'colour', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.25 Engine Capacity</label><input type="text" value={formData.identification.engineCapacity} onChange={e => handleNestedChange('identification', 'engineCapacity', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.26 Previous Owners</label><input type="text" value={formData.identification.previousOwners} onChange={e => handleNestedChange('identification', 'previousOwners', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div><label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.28 Current Owner Name</label><input type="text" value={formData.identification.currentOwner} onChange={e => handleNestedChange('identification', 'currentOwner', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none" /></div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">1.30 Compliance with CR</label>
                                    <select value={formData.identification.complianceWithCR} onChange={e => handleNestedChange('identification', 'complianceWithCR', e.target.value)} className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white outline-none">
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: TECHNICAL EVALUATION */}
                    {activeTab === 'technical' && (
                        <div className="bg-white p-6 rounded-b-2xl border-2 border-t-0 border-slate-300 shadow-xs space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">5.1 Transmission</h4>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">5.1.1 Gear Box</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={formData.technical.transmission.gearBoxType} onChange={e => handleDeepNestedChange('technical', 'transmission', 'gearBoxType', e.target.value)} placeholder="Type" className="p-2 border rounded-lg text-xs font-bold" />
                                            <input type="text" value={formData.technical.transmission.gearBoxCondition} onChange={e => handleDeepNestedChange('technical', 'transmission', 'gearBoxCondition', e.target.value)} placeholder="Condition" className="p-2 border rounded-lg text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.1.2 Clutch</label><input type="text" value={formData.technical.transmission.clutchCondition} onChange={e => handleDeepNestedChange('technical', 'transmission', 'clutchCondition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.1.3 Shafting</label><input type="text" value={formData.technical.transmission.shafting} onChange={e => handleDeepNestedChange('technical', 'transmission', 'shafting', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.1.4 Differential</label><input type="text" value={formData.technical.transmission.differential} onChange={e => handleDeepNestedChange('technical', 'transmission', 'differential', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">5.2 Suspension & 5.3 Brakes</h4>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.2.1 Front Suspension</label><input type="text" value={formData.technical.suspension.front} onChange={e => handleDeepNestedChange('technical', 'suspension', 'front', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.2.2 Rear Suspension</label><input type="text" value={formData.technical.suspension.rear} onChange={e => handleDeepNestedChange('technical', 'suspension', 'rear', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.3.1 Foot Brakes</label><input type="text" value={formData.technical.brakes.footBrakesCondition} onChange={e => handleDeepNestedChange('technical', 'brakes', 'footBrakesCondition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.3.2 Parking Brakes</label><input type="text" value={formData.technical.brakes.parkingBrakes} onChange={e => handleDeepNestedChange('technical', 'brakes', 'parkingBrakes', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">5.4 - 5.6 Body & Steering</h4>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.4 Steering</label><input type="text" value={formData.technical.steering.condition} onChange={e => handleDeepNestedChange('technical', 'steering', 'condition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.5 Chassis Condition</label><input type="text" value={formData.technical.chassisCondition} onChange={e => handleNestedChange('technical', 'chassisCondition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.6 Body Condition</label><input type="text" value={formData.technical.bodyCondition} onChange={e => handleNestedChange('technical', 'bodyCondition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">5.8 Engine Condition</label><input type="text" value={formData.technical.engine.condition} onChange={e => handleDeepNestedChange('technical', 'engine', 'condition', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">5.9 Tyres (Size & Wear %)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Front Tyres</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={formData.technical.tyres.front.size} onChange={e => handleDeepNestedChange('technical', 'tyres', 'front', { ...formData.technical.tyres.front, size: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                            <input type="text" value={formData.technical.tyres.front.conditionPercent} onChange={e => handleDeepNestedChange('technical', 'tyres', 'front', { ...formData.technical.tyres.front, conditionPercent: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Rear Tyres</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={formData.technical.tyres.rear.size} onChange={e => handleDeepNestedChange('technical', 'tyres', 'rear', { ...formData.technical.tyres.rear, size: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                            <input type="text" value={formData.technical.tyres.rear.conditionPercent} onChange={e => handleDeepNestedChange('technical', 'tyres', 'rear', { ...formData.technical.tyres.rear, conditionPercent: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Spare Tyre</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={formData.technical.tyres.spare.size} onChange={e => handleDeepNestedChange('technical', 'tyres', 'spare', { ...formData.technical.tyres.spare, size: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                            <input type="text" value={formData.technical.tyres.spare.conditionPercent} onChange={e => handleDeepNestedChange('technical', 'tyres', 'spare', { ...formData.technical.tyres.spare, conditionPercent: e.target.value })} className="w-1/2 p-2 border rounded-lg text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Wheels</label>
                                        <input type="text" value={formData.technical.tyres.wheels} onChange={e => handleDeepNestedChange('technical', 'tyres', 'wheels', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">4.7 Electrical System</h4>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    {['starter', 'wipers', 'horn', 'lights', 'meters', 'alternator'].map(elem => (
                                        <div key={elem}>
                                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">{elem}</label>
                                            <input type="text" value={formData.technical.electricalSystem[elem]} onChange={e => handleDeepNestedChange('technical', 'electricalSystem', elem, e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ROAD TEST & VALUES */}
                    {activeTab === 'evaluationTab2' && (
                        <div className="bg-white p-6 rounded-b-2xl border-2 border-t-0 border-slate-300 shadow-xs space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">2.0 Road Test</h4>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">Road Test Done On</label><input type="text" value={formData.evaluationTab2.roadTest.doneOn} onChange={e => handleDeepNestedChange('evaluationTab2', 'roadTest', 'doneOn', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    <div><label className="text-[11px] font-bold text-slate-600 block mb-1">2.1 Avg Fuel Consumption</label><input type="text" value={formData.evaluationTab2.roadTest.averageFuelConsumption} onChange={e => handleDeepNestedChange('evaluationTab2', 'roadTest', 'averageFuelConsumption', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-1">5.12 Maintenance</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><label className="text-[11px] font-bold text-slate-600 block mb-1">Mechanical</label><input type="text" value={formData.evaluationTab2.maintenance.mechanical} onChange={e => handleDeepNestedChange('evaluationTab2', 'maintenance', 'mechanical', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                        <div><label className="text-[11px] font-bold text-slate-600 block mb-1">Body</label><input type="text" value={formData.evaluationTab2.maintenance.body} onChange={e => handleDeepNestedChange('evaluationTab2', 'maintenance', 'body', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                        <div><label className="text-[11px] font-bold text-slate-600 block mb-1">Internal Trim</label><input type="text" value={formData.evaluationTab2.maintenance.internalTrim} onChange={e => handleDeepNestedChange('evaluationTab2', 'maintenance', 'internalTrim', e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50/70 p-6 rounded-2xl border-2 border-amber-300 space-y-4">
                                <h4 className="text-sm font-black uppercase text-amber-950 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-amber-800" /> 7.0 & 8.0 Commercial Valuation Figures (LKR)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-black text-amber-900 uppercase block mb-1">7.0 Market Value (LKR) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.evaluationTab2.marketValue}
                                            onChange={e => {
                                                const numValue = Number(e.target.value) || 0;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    evaluationTab2: {
                                                        ...prev.evaluationTab2,
                                                        marketValue: numValue,
                                                        marketValueWords: convertNumberToWords(numValue)
                                                    }
                                                }));
                                            }}
                                            className="w-full p-3 border-2 border-amber-400 bg-white rounded-xl text-base font-black text-slate-950 outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Market Value in Words"
                                            value={formData.evaluationTab2.marketValueWords}
                                            onChange={e => handleNestedChange('evaluationTab2', 'marketValueWords', e.target.value.toUpperCase())}
                                            className="w-full p-2 mt-2 border border-amber-300 bg-white/80 rounded-lg text-xs font-bold uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-amber-900 uppercase block mb-1">8.0 Forced Sale Value (LKR) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.evaluationTab2.forcedSaleValue}
                                            onChange={e => {
                                                const numValue = Number(e.target.value) || 0;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    evaluationTab2: {
                                                        ...prev.evaluationTab2,
                                                        forcedSaleValue: numValue,
                                                        forcedSaleValueWords: convertNumberToWords(numValue)
                                                    }
                                                }));
                                            }}
                                            className="w-full p-3 border-2 border-amber-400 bg-white rounded-xl text-base font-black text-slate-950 outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Forced Sale Value in Words"
                                            value={formData.evaluationTab2.forcedSaleValueWords}
                                            onChange={e => handleNestedChange('evaluationTab2', 'forcedSaleValueWords', e.target.value.toUpperCase())}
                                            className="w-full p-2 mt-2 border border-amber-300 bg-white/80 rounded-lg text-xs font-bold uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PHOTOS */}
                    {activeTab === 'photos' && (
                        <div className="bg-white p-6 rounded-b-2xl border-2 border-t-0 border-slate-300 shadow-xs space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Photo Documentation</h3>
                                {uploadingPhotos && (
                                    <span className="text-xs font-black text-[#BC0202] animate-pulse flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-700 block">Chassis Number Engraving</span>
                                    <div onClick={() => chassisInputRef.current?.click()} className="h-64 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden bg-slate-50 transition-colors">
                                        {formData.photos.chassisNoPhoto ? (
                                            <img src={formData.photos.chassisNoPhoto} alt="Chassis" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center text-slate-400 space-y-1"><Camera className="w-8 h-8 mx-auto" /><p className="text-xs font-bold text-slate-600">Click to upload</p></div>
                                        )}
                                        <input ref={chassisInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'chassisNoPhoto')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-700 block">Engine Number Engraving</span>
                                    <div onClick={() => engineInputRef.current?.click()} className="h-64 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden bg-slate-50 transition-colors">
                                        {formData.photos.engineNoPhoto ? (
                                            <img src={formData.photos.engineNoPhoto} alt="Engine" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center text-slate-400 space-y-1"><Camera className="w-8 h-8 mx-auto" /><p className="text-xs font-bold text-slate-600">Click to upload</p></div>
                                        )}
                                        <input ref={engineInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'engineNoPhoto')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-700 block">Vehicle Photo 1 (Front/Side)</span>
                                    <div onClick={() => vehicleFrontInputRef.current?.click()} className="h-64 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden bg-slate-50 transition-colors">
                                        {formData.photos.vehiclePhotos?.[0] ? (
                                            <img src={formData.photos.vehiclePhotos[0]} alt="Vehicle Front" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center text-slate-400 space-y-1"><Camera className="w-8 h-8 mx-auto" /><p className="text-xs font-bold text-slate-600">Click to upload</p></div>
                                        )}
                                        <input ref={vehicleFrontInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'vehiclePhotos', 0)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-700 block">Vehicle Photo 2 (Rear/Side)</span>
                                    <div onClick={() => vehicleRearInputRef.current?.click()} className="h-64 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden bg-slate-50 transition-colors">
                                        {formData.photos.vehiclePhotos?.[1] ? (
                                            <img src={formData.photos.vehiclePhotos[1]} alt="Vehicle Rear" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center text-slate-400 space-y-1"><Camera className="w-8 h-8 mx-auto" /><p className="text-xs font-bold text-slate-600">Click to upload</p></div>
                                        )}
                                        <input ref={vehicleRearInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'vehiclePhotos', 1)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PRINT PREVIEW UI (Only rendered during printing or in print preview) */}
            <ValuationPrintView data={formData} />
        </>
    );
};

export default ValuationWorkspace;