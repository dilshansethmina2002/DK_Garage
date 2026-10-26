import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  User, Wrench, Plus, Trash2, Camera, CheckCircle,
  AlertCircle, ArrowLeft, EyeOff, TrendingUp, Sparkles, Check,
  X, ChevronDown, Search, Car, Calendar
} from 'lucide-react';
import API from '../api';

// Comprehensive Sri Lanka Market Vehicle Registry
const SRI_LANKA_VEHICLE_DATA = {
  Toyota: [
    'Corolla (121 / 141 / 150)', 'Prius (20 / 30 / 50 / Prime)', 'Vitz / Yaris (KSP90 / KSP130)', 'Aqua (NHP10 / Crossover)',
    'Premio (240 / 260 NZT/ZRT)', 'Allion (240 / 260 NZT/ZRT)', 'Axio (141 / 161 / 165 Hybrid)',
    'Hilux (Tiger / Vigo / Revo / GR)', 'Land Cruiser (Prado 120/150 / LC100 / LC200 / LC300)',
    'HiAce / Commuter (KDH 200/201/206/222 / LH113)', 'Raize (1.0 Turbo / 1.2 Hybrid)',
    'C-HR (1.2 Turbo / 1.8 Hybrid)', 'Passo (KGC10 / KGC30 / M700A)', 'Rush', 'Camry', 'Harrier'
  ],
  Nissan: [
    'Sunny (FB14 / FB15 / N16 / N17)', 'X-Trail (T30 / T31 / T32 Hybrid)', 'Leaf (AZE0 / ZE1)',
    'March (K11 / K12 / K13)', 'Navara (D21 / D22 / D40 / NP300)', 'Caravan (E25 / NV350)',
    'Tiida / Latio', 'Note (E12 / E13 e-Power)', 'Bluebird Sylphy (G11)', 'Dayz / Roox', 'Patrol (Y61 / Y62)'
  ],
  Honda: [
    'Civic (EK3 / ES8 / FD1 / FD4 / FK7 / FL1)', 'Vezel (RU3 Hybrid / RV5 e:HEV / 1.5 Non-Hybrid)',
    'Fit / Jazz (GD1 / GE6 / GP1 / GP5 Hybrid / GR3)', 'Grace (GM4 Hybrid)', 'CR-V (RD1 / RD5 / RE4 / RM4 / RW)',
    'Insight (ZE2 / ZE3)', 'Shuttle (GP7 Hybrid)', 'Accord', 'Freed'
  ],
  Suzuki: [
    'Wagon R (FX / FZ / Stingray MH34S / MH44S / MH55S)', 'Alto (800 / K10 / Japanese HA25S / HA36S)',
    'Swift / Swift RS / Sport (HT51S / ZC71S / ZC82S / ZC83S)', 'Spacia / Spacia Custom (MK32S / MK42S / MK53S)',
    'Hustler (MR31S / MR41S / MR52S / MR92S)', 'Every (DA64V / DA17V)', 'Carry Truck', 'Baleno', 'Celerio',
    'Maruti 800 / Zen', 'Grand Vitara / Escudo', 'Jimny (JB23 / JB64 / JB74)'
  ],
  Mitsubishi: [
    'Lancer (CS3 / CS2 / CK2 / Box Lancer / CB1)', 'Pajero / Montero (V46 / V68 / V78 / V98)', 'Pajero Sport',
    'L200 / Triton / Sportero', 'Outlander (CW5W / GG2W PHEV)', 'Eclipse Cross', 'Rosa Bus', 'Canter Truck'
  ],
  Hyundai: [
    'Tucson', 'Santa Fe', 'Elantra', 'i10 / Grand i10', 'i20', 'Creta', 'Accent', 'Kona', 'Venue'
  ],
  Kia: [
    'Sportage', 'Sorento', 'Picanto', 'Rio', 'Seltos', 'Carnival', 'Cerato', 'Stonic'
  ],
  Micro: [
    'Panda / Panda Cross', 'Rhino', 'Kyron', 'Rexton', 'Actyon', 'Tivoli', 'Geely MK', 'Geely Emgrand 7'
  ],
  Mazda: [
    'Mazda 3 / Axela (BK / BL / BM / BP)', 'Mazda 2 / Demio (DY / DE / DJ)', 'Mazda 6 / Atenza (GG / GH / GJ)',
    'CX-3', 'CX-5', 'BT-50', 'Familia'
  ],
  BMW: [
    '3 Series (E36 / E46 / E90 / F30 / G20 / 318i / 320d / 330e)',
    '5 Series (E39 / E60 / F10 / G30 / 520d / 530e)', 'X1 / X3 / X5'
  ],
  Mercedes: [
    'C-Class (W202 / W203 / W204 / W205 / C180 / C200 / C220d / C350e)',
    'E-Class (W210 / W211 / W212 / W213 / E200 / E220d / E350e)', 'GLA / GLC / GLE'
  ],
  TVS: [
    'King (Petrol / 200cc / 4S / Electric)', 'Orbiter EV', 'Apache RTR 160 / 180 / 200 4V',
    'NTorq 125 (Race Edition / SuperSquad)', 'Jupiter 110 / 125', 'XL 100 HD', 'Wego'
  ],
  Bajaj: [
    'RE 4-Stroke (205cc Compact / Maxima)', 'RE 2-Stroke (Classic)',
    'Pulsar 125 / 150 / 180 / 200NS / 220F', 'Discover 100 / 125 / 135 / 150', 'Platina 100 / 110', 'CT 100'
  ],
  DFSK: [
    'Glory 580 (1.5 Turbo)', 'Glory i-Auto', 'V21 / V22 Single/Double Cab', 'K01 / K02 Mini Truck'
  ],
  Mahindra: [
    'Bolero (Maxi Truck / Camper / Single Cab)', 'Scorpio (S10 / S11 / CRDe)', 'KUV100', 'XUV500', 'Thar'
  ],
  Tata: [
    'Ace / Super Ace (Dimo Batta / HT / Mint)', 'Xenon XT Double Cab', 'Nexon', '407 / 709 / 1613 Lorry'
  ]
};

const COMMON_PRESET_ISSUES = [
  'Regular Service & Engine Oil / Filter Change',
  'Brake Pad Replacement & Rotor Disc Skimming',
  'A/C Not Cooling & Gas Leak Nitrogen Test',
  'Engine Check Light (MIL) Scan & Reset',
  'Front Suspension Knocking / Bushing Wear Inspection',
  'Wheel Alignment, Dynamic Balancing & Tire Rotation',
  'Automatic Transmission (ATF/CVT/DCT) Fluid Flush',
  'Hybrid Battery Health, Fan Cleaning & Cell Balancing',
  'Engine Overheating & Radiator Coolant Leak',
  'Steering Rack Free-Play Noise & Fluid Leak',
  'Starter Motor / Alternator Charging System Fault',
  'ABS Pump Warning Light & Brake Actuator Failure',
  'Clutch Slipping / Hard Gear Shifting Overhaul',
  'Exhaust Smoke / Diesel Injector & DPF Clogging'
];

// Baseline Initial Seed Presets
const INITIAL_PRESET_ITEMS = {
  Service: [
    'Full Periodic Lubrication Service & Safety Inspection',
    'Engine Oil & Genuine Oil Filter Replacement Labor',
    'Automatic Transmission Fluid (ATF/CVT) Flush Labor',
    'Headlight Replace & Alignment',
    'Headlight Bulb Replacement & Beam Leveling',
    'Front Brake Pad Replacement & Caliper Pin Greasing',
    'Rear Brake Shoe / Pad Replacement & Drum Cleaning',
    'Front Brake Disc Rotor Lathe Skimming (Pair)',
    'Four-Wheel Computerized Laser Wheel Alignment',
    'Wheel Balancing (Per Wheel Alloy/Steel)',
    'Front Suspension Lower Arm & Ball Joint Replacement Labor',
    'Front Shock Absorber & Mount Strut Replacement Labor',
    'Steering Rack Reconditioning, Bush & Boot Replacement',
    'OBD2 Computer Diagnostic Scan & Trouble Code Reset',
    'Throttle Body Cleaning & Idle Air Volume Relearn',
    'A/C Condenser Flush & R134a Refrigerant Gas Top-Up',
    'A/C Cooling Evaporator Coil Replacement (Dashboard Removal)',
    'Hybrid High Voltage Battery Cooling Fan De-dusting',
    'Manual Clutch Plate, Pressure Plate & Release Bearing Overhaul'
  ],
  Part: [
    'Engine Oil Toyota Genuine 0W-20 SP/GF-6 (4L)',
    'Engine Oil Castrol Magnatec Stop-Start 5W-30 (4L)',
    'Engine Oil Castrol Magnatec 10W-40 Part Synthetic (4L)',
    'Toyota Genuine CVT Fluid FE (4L Can)',
    'Toyota Genuine ATF WS Fluid (4L Can)',
    'Engine Oil Filter (Toyota Genuine C-110 / C-113)',
    'Engine Oil Filter (Nissan Genuine C-224)',
    'Engine Oil Filter (Honda Genuine C-809)',
    'Engine Oil Filter (Suzuki K-Car Genuine C-932)',
    'Engine Air Cleaner Filter Element (Genuine / OEM)',
    'Air Conditioning Cabin Pollen Carbon Filter',
    'Front Brake Pad Set (Genuine / Akebono / Ferodo)',
    'Rear Brake Pad Set (Genuine / Advics / MK Kashiyama)',
    'Headlight Assembly Complete (Left / Right)',
    'High Output LED Headlight Bulb Pair (H4 / H11 / HIR2)',
    'Headlight Halogen Bulb H4 12V 60/55W (Philips / Osram)',
    '12V Starter Battery Amaron Maintenance Free 35Ah / 45Ah',
    'Front Lower Control Arm Big/Small Rubber Bush',
    'Stabilizer Sway Bar Link Rod (555 Japan - Pair)',
    'Tie Rod End (555 Japan - Pair)',
    'Steering Rack End (555 Japan - Pair)'
  ]
};

const JobCardWorkspace = () => {
  const { jobId } = useParams();
  const isViewOrEditMode = Boolean(jobId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isViewOrEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Customer & Vehicle State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [customerRequests, setCustomerRequests] = useState('');

  // Dropdown Suggestions State for Make & Model
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // Dynamic Learning Dictionary for Line Items
  const [availableLineItems, setAvailableLineItems] = useState(INITIAL_PRESET_ITEMS);
  const [activeItemSuggestionId, setActiveItemSuggestionId] = useState(null);

  // Historical Database & Autocomplete State
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [historicalIssues, setHistoricalIssues] = useState(COMMON_PRESET_ISSUES);
  const [customerMatches, setCustomerMatches] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [issueMatches, setIssueMatches] = useState([]);
  const [showIssueDropdown, setShowIssueDropdown] = useState(false);

  // Registered Mechanics State
  const [registeredMechanics, setRegisteredMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mechSearch, setMechSearch] = useState('');

  const dropdownRef = useRef(null);
  const customerRef = useRef(null);
  const issueRef = useRef(null);
  const makeRef = useRef(null);
  const modelRef = useRef(null);

  // Job Logistics (Defaults to today's date)
  const [jobDate, setJobDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending Inspection');
  const [notes, setNotes] = useState('');
  const [applyGST, setApplyGST] = useState(false);

  // Dynamic Line Items with individual work dates
  const [items, setItems] = useState([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      type: 'Service',
      name: 'General Labor & Diagnostic',
      costPrice: 0,
      rate: 0
    }
  ]);

  // Filtered Make Suggestions
  const filteredMakes = useMemo(() => {
    const q = make.trim().toLowerCase();
    const allMakes = Object.keys(SRI_LANKA_VEHICLE_DATA);
    if (!q) return allMakes;
    return allMakes.filter(m => m.toLowerCase().includes(q));
  }, [make]);

  // Filtered Model Suggestions
  const filteredModels = useMemo(() => {
    const q = model.trim().toLowerCase();
    const currentMakeKey = Object.keys(SRI_LANKA_VEHICLE_DATA).find(
      m => m.toLowerCase() === make.trim().toLowerCase()
    );
    const pool = currentMakeKey
      ? SRI_LANKA_VEHICLE_DATA[currentMakeKey]
      : Object.values(SRI_LANKA_VEHICLE_DATA).flat();

    if (!q) return pool.slice(0, 15);
    return pool.filter(mod => mod.toLowerCase().includes(q));
  }, [make, model]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
      if (issueRef.current && !issueRef.current.contains(e.target)) {
        setShowIssueDropdown(false);
      }
      if (makeRef.current && !makeRef.current.contains(e.target)) {
        setShowMakeSuggestions(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target)) {
        setShowModelSuggestions(false);
      }
      if (!e.target.closest('.item-name-container')) {
        setActiveItemSuggestionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch registered vehicles, historical jobs, mechanics, and learned line items
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [vehiclesRes, jobsRes, mechanicsRes] = await Promise.all([
          API.get('/api/vehicles').catch(() => ({ data: [] })),
          API.get('/api/jobs').catch(() => ({ data: [] })),
          API.get('/api/users/mechanics').catch(async () => {
            const fallback = await API.get('/api/users');
            return {
              data: (fallback.data || []).filter(u => String(u.role).toLowerCase() === 'mechanic')
            };
          })
        ]);

        setRegisteredVehicles(vehiclesRes.data || []);

        const allJobs = jobsRes.data || [];

        // Learn historical reported customer issues
        const recordedIssues = allJobs
          .flatMap(j => (j.customerRequests || j.reportedIssues || j.notes || '').split('\n'))
          .map(str => str.replace(/^[•\-\*]\s*/, '').trim())
          .filter(str => str.length >= 3);
        setHistoricalIssues(Array.from(new Set([...COMMON_PRESET_ISSUES, ...recordedIssues])));

        // Learn historical Services and Parts from MongoDB lineItems
        const learnedServices = new Set(INITIAL_PRESET_ITEMS.Service);
        const learnedParts = new Set(INITIAL_PRESET_ITEMS.Part);

        allJobs.forEach(j => {
          if (Array.isArray(j.lineItems)) {
            j.lineItems.forEach(item => {
              const cleanName = (item.name || '').trim();
              if (cleanName.length >= 2) {
                if (item.type === 'Part') {
                  learnedParts.add(cleanName);
                } else {
                  learnedServices.add(cleanName);
                }
              }
            });
          }
        });

        setAvailableLineItems({
          Service: Array.from(learnedServices),
          Part: Array.from(learnedParts)
        });

        setRegisteredMechanics(mechanicsRes.data || []);
      } catch (err) {
        console.warn('Initial data lookup failed:', err);
      }
    };

    fetchPrerequisites();
  }, []);

  // Fetch Existing Job Card if in Edit/View mode
  useEffect(() => {
    if (!isViewOrEditMode) return;

    const fetchExistingJob = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/jobs/${jobId}`);
        const job = response.data;

        setCustomerName(job.customer?.name || job.customerName || '');
        setCustomerPhone(job.customer?.phone || job.customerPhone || '');
        setMake(job.vehicle?.make || job.make || 'Toyota');
        setModel(job.vehicle?.model || job.model || '');
        setLicensePlate(job.vehicle?.licensePlate || job.licensePlate || '');
        setCustomerRequests(job.customerRequests || job.reportedIssues || job.notes || '');

        if (Array.isArray(job.mechanics) && job.mechanics.length > 0) {
          setSelectedMechanics(job.mechanics);
        } else if (job.mechanic) {
          setSelectedMechanics(job.mechanic.split(',').map(m => m.trim()).filter(Boolean));
        }

        setPriority(job.priority || 'Medium');
        setStatus(job.status || 'Pending Inspection');
        setJobDate(job.jobDate ? new Date(job.jobDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setDeliveryDate(job.deliveryDate ? new Date(job.deliveryDate).toISOString().split('T')[0] : '');
        setNotes(job.notes || '');
        setApplyGST(Boolean(job.applyGST));

        if (job.lineItems && job.lineItems.length > 0) {
          setItems(job.lineItems.map((item, idx) => ({
            id: idx + 1,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            type: item.type || 'Service',
            name: item.name || '',
            costPrice: item.costPrice || 0,
            rate: item.rate || 0
          })));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError('Could not load the requested Job Card from MongoDB.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExistingJob();
  }, [jobId, isViewOrEditMode, navigate]);

  const handleCustomerNameChange = (val) => {
    setCustomerName(val);
    const query = val.trim().toLowerCase();

    if (query.length >= 2) {
      const matches = registeredVehicles.filter(v =>
        (v.ownerName || '').toLowerCase().includes(query) ||
        (v.licensePlate || '').toLowerCase().includes(query) ||
        (v.ownerPhone || '').includes(query)
      );
      setCustomerMatches(matches);
      setShowCustomerDropdown(matches.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  };

  const handleSelectCustomer = (veh) => {
    setCustomerName(veh.ownerName || '');
    setCustomerPhone(veh.ownerPhone && veh.ownerPhone !== 'N/A' ? veh.ownerPhone : '');
    setLicensePlate(veh.licensePlate || '');
    setMake(veh.make || 'Toyota');
    setModel(veh.model || '');
    setShowCustomerDropdown(false);
  };

  const handleCustomerRequestsChange = (val) => {
    setCustomerRequests(val);
    const lastLine = val.split('\n').pop().replace(/^[•\-\*]\s*/, '').trim();

    if (lastLine.length >= 2) {
      const matches = historicalIssues.filter(issue =>
        issue.toLowerCase().includes(lastLine.toLowerCase())
      );
      setIssueMatches(matches.slice(0, 6));
      setShowIssueDropdown(matches.length > 0);
    } else {
      setShowIssueDropdown(false);
    }
  };

  const addQuickIssue = (issue) => {
    setCustomerRequests(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return `• ${issue}`;
      if (cleanPrev.includes(issue)) return cleanPrev;
      return `${cleanPrev}\n• ${issue}`;
    });
    setShowIssueDropdown(false);
  };

  const calculations = useMemo(() => {
    let totalActualCost = 0;
    let servicesBilled = 0;
    let partsBilled = 0;

    items.forEach(i => {
      const actual = Math.max(0, Number(i.costPrice) || 0);
      const charging = Math.max(0, Number(i.rate) || 0);

      totalActualCost += actual;
      if (i.type === 'Service') {
        servicesBilled += charging;
      } else {
        partsBilled += charging;
      }
    });

    const subtotal = servicesBilled + partsBilled;
    const tax = applyGST ? subtotal * 0.18 : 0;
    const totalBilled = subtotal + tax;
    const grossProfit = subtotal - totalActualCost;
    const marginPercent = subtotal > 0 ? ((grossProfit / subtotal) * 100).toFixed(1) : '0.0';

    return {
      totalActualCost,
      servicesBilled,
      partsBilled,
      subtotal,
      tax,
      totalBilled,
      grossProfit,
      marginPercent,
      serviceCount: items.filter(i => i.type === 'Service').length,
      partCount: items.filter(i => i.type === 'Part').length
    };
  }, [items, applyGST]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'Part',
        name: '',
        costPrice: 0,
        rate: 0
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleMechanicSelection = (mechanicName) => {
    if (selectedMechanics.includes(mechanicName)) {
      setSelectedMechanics(selectedMechanics.filter(m => m !== mechanicName));
    } else {
      setSelectedMechanics([...selectedMechanics, mechanicName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMechanics.length === 0) {
      alert('Please assign at least one registered mechanic.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim()
      },
      make: make.trim(),
      model: model.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      vehicle: {
        make: make.trim(),
        model: model.trim(),
        licensePlate: licensePlate.trim().toUpperCase()
      },
      customerRequests: customerRequests.trim(),
      reportedIssues: customerRequests.trim(),
      mechanics: selectedMechanics,
      mechanic: selectedMechanics.join(', '),
      priority,
      status,
      jobDate,
      deliveryDate,
      notes: notes || customerRequests,
      lineItems: items.map(({ date, type, name, costPrice, rate }) => ({
        date: date || new Date().toISOString().split('T')[0],
        type,
        name: name.trim(),
        costPrice: Number(costPrice) || 0,
        rate: Number(rate) || 0
      })),
      applyGST
    };

    try {
      if (isViewOrEditMode) {
        await API.put(`/api/jobs/${jobId}`, payload);
      } else {
        await API.post('/api/jobs', payload);
      }

      // Learn current items into active session state
      setAvailableLineItems(prev => {
        const updatedServices = new Set(prev.Service);
        const updatedParts = new Set(prev.Part);

        items.forEach(it => {
          const trimmed = (it.name || '').trim();
          if (trimmed) {
            if (it.type === 'Part') updatedParts.add(trimmed);
            else updatedServices.add(trimmed);
          }
        });

        return {
          Service: Array.from(updatedServices),
          Part: Array.from(updatedParts)
        };
      });

      navigate('/job-cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Job Card to MongoDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegisteredMechanics = registeredMechanics.filter(m =>
    (m.name || '').toLowerCase().includes(mechSearch.toLowerCase()) ||
    (m.username || '').toLowerCase().includes(mechSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-800 font-extrabold text-lg animate-pulse">
          <Wrench className="w-6 h-6 text-[#BC0202] animate-spin" />
          Loading Job Card Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-[#BC0202] border border-red-200 mb-2">
              <Car className="w-3.5 h-3.5" /> Garage OS Workshop Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {isViewOrEditMode ? `Job Card Workspace — #${jobId}` : 'Create New Repair Job Card'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Live customer lookup, date-mapped items, dynamic suggestions, and dual internal/customer rate calculations.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/job-cards"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel & Back
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`bg-[#BC0202] hover:bg-[#830000] text-white px-7 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#830000] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Saving...' : isViewOrEditMode ? 'Update Job Card' : 'Save & Open Job'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl flex items-center gap-2 text-sm shadow-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left Column (Customer, Vehicle Specifications & Profitability) */}
          <div className="xl:col-span-4 space-y-6">

            {/* Customer & Vehicle Info */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <h3 className="font-black text-slate-950 flex items-center gap-2 border-b-2 border-slate-100 pb-3 text-sm uppercase tracking-wider">
                <User className="w-4 h-4 text-[#BC0202]" /> Customer & Vehicle Details
              </h3>

              {/* Customer Name with Live Autocomplete */}
              <div ref={customerRef} className="relative">
                <label className="text-xs font-black uppercase text-slate-600 block mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => handleCustomerNameChange(e.target.value)}
                    onFocus={() => {
                      if (customerMatches.length > 0) setShowCustomerDropdown(true);
                    }}
                    placeholder="Type name (e.g. Kasun)..."
                    className="w-full pl-3.5 pr-9 py-2.5 border-2 border-slate-300 rounded-xl text-sm outline-none focus:border-slate-800 font-bold bg-slate-50 focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                {showCustomerDropdown && customerMatches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-2 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                      Matching Registered Customers & Vehicles
                    </div>
                    {customerMatches.map((veh) => (
                      <div
                        key={veh._id}
                        onClick={() => handleSelectCustomer(veh)}
                        className="p-3 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sm text-slate-900">{veh.ownerName}</span>
                          <span className="text-xs font-black text-[#BC0202] bg-red-100 px-2 py-0.5 rounded">
                            {veh.licensePlate}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                          <span>📞 {veh.ownerPhone || 'No Phone'}</span>
                          <span>• {veh.make} {veh.model}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-600 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="0771234567"
                  className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm outline-none focus:border-slate-800 font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Keyboard-typeable Make & Model with Autocomplete */}
              <div className="grid grid-cols-2 gap-3">
                {/* Make Input */}
                <div ref={makeRef} className="relative">
                  <label className="text-xs font-black uppercase text-slate-600 block mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={e => {
                      setMake(e.target.value);
                      setShowMakeSuggestions(true);
                    }}
                    onFocus={() => setShowMakeSuggestions(true)}
                    placeholder="e.g. Toyota"
                    className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800"
                  />
                  {showMakeSuggestions && filteredMakes.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredMakes.map(m => (
                        <div
                          key={m}
                          onClick={() => {
                            setMake(m);
                            setShowMakeSuggestions(false);
                          }}
                          className="p-2.5 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-[#BC0202] cursor-pointer"
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Input */}
                <div ref={modelRef} className="relative">
                  <label className="text-xs font-black uppercase text-slate-600 block mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={e => {
                      setModel(e.target.value);
                      setShowModelSuggestions(true);
                    }}
                    onFocus={() => setShowModelSuggestions(true)}
                    placeholder="e.g. Yaris"
                    className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white outline-none focus:border-slate-800"
                  />
                  {showModelSuggestions && filteredModels.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredModels.map((mod, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setModel(mod);
                            setShowModelSuggestions(false);
                          }}
                          className="p-2.5 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-[#BC0202] cursor-pointer"
                        >
                          {mod}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-600 block mb-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  required
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="WP KV-2008"
                  className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm outline-none focus:border-slate-800 font-black uppercase tracking-wider bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Financial Summary & Gross Profit Breakdown */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <h3 className="font-black text-slate-950 border-b-2 border-slate-100 pb-3 text-sm uppercase tracking-wide flex items-center justify-between">
                <span>Financial Summary</span>
                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase">LKR</span>
              </h3>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Services Subtotal ({calculations.serviceCount}):</span>
                  <span className="font-extrabold text-slate-900">LKR {calculations.servicesBilled.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spare Parts Subtotal ({calculations.partCount}):</span>
                  <span className="font-extrabold text-slate-900">LKR {calculations.partsBilled.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-slate-900">
                  <span>Subtotal (Customer):</span>
                  <span>LKR {calculations.subtotal.toFixed(2)}</span>
                </div>
                {applyGST && (
                  <div className="flex justify-between text-slate-700">
                    <span>GST (18%):</span>
                    <span>LKR {calculations.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t-2 border-slate-200">
                  <span>Total Billed:</span>
                  <span className="text-emerald-700">LKR {calculations.totalBilled.toFixed(2)}</span>
                </div>
              </div>

              {/* Internal Profitability Card */}
              <div className="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                    Internal Profitability
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Workshop Only
                  </span>
                </div>

                <div className="text-xs space-y-1.5 pt-1 text-amber-950">
                  <div className="flex justify-between font-semibold">
                    <span>Actual Cost (Stock & Expenses):</span>
                    <span className="font-bold">LKR {calculations.totalActualCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black pt-1.5 border-t border-amber-200 text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Gross Margin:
                    </span>
                    <span className={calculations.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      LKR {calculations.grossProfit.toFixed(2)} ({calculations.marginPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Attachment */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-xs">
              <h3 className="font-black text-slate-950 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-2 text-sm uppercase tracking-wide">
                <Camera className="w-4 h-4 text-slate-700" /> Diagnostic Media
              </h3>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                <Plus className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Attach Vehicle Photos & Video Clips</p>
              </div>
            </div>

          </div>

          {/* Right Column: Mechanics, Line Items, Logistics & Instructions */}
          <div className="xl:col-span-8 space-y-6">

            {/* Section 1: Assigned Mechanics & Customer Complaints */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-5">
              <h2 className="text-base font-black text-slate-950 border-b-2 border-slate-100 pb-3 uppercase tracking-wide flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#BC0202]" /> Mechanic Allocation & Reported Issues
              </h2>

              {/* Mechanics Tag Dropdown Picker */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Assigned Registered Mechanics * (Multiple Selectable)
                </label>

                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full min-h-[48px] p-2 bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:border-slate-800 transition-colors"
                >
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {selectedMechanics.map(name => (
                      <span
                        key={name}
                        onClick={e => {
                          e.stopPropagation();
                          toggleMechanicSelection(name);
                        }}
                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg group"
                      >
                        <Wrench className="w-3 h-3 text-slate-400" />
                        {name}
                        <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                      </span>
                    ))}
                    {selectedMechanics.length === 0 && (
                      <span className="text-slate-400 text-xs py-1 px-2 font-semibold">
                        Click to select registered mechanic(s)...
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search mechanics by name or username..."
                        value={mechSearch}
                        onChange={e => setMechSearch(e.target.value)}
                        className="w-full bg-transparent text-xs outline-none text-slate-800 font-bold"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredRegisteredMechanics.map(m => {
                        const isSelected = selectedMechanics.includes(m.name);
                        return (
                          <div
                            key={m._id}
                            onClick={() => toggleMechanicSelection(m.name)}
                            className={`p-3 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            <div>
                              <p className="font-extrabold">{m.name}</p>
                              <p className="text-[11px] font-normal text-slate-500">@{m.username}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#BC0202] stroke-[3]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Requests & Quick-Suggestion Tags */}
              <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#BC0202]" />
                    Customer Requests & Defects Reported (Presets & Quick Add)
                  </label>
                  <span className="text-[11px] text-slate-500 font-bold">Tap chips to insert</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PRESET_ISSUES.map((issue, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => addQuickIssue(issue)}
                      className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-red-50 hover:text-[#BC0202] border border-slate-300 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    >
                      + {issue}
                    </button>
                  ))}
                </div>

                <div ref={issueRef} className="relative">
                  <textarea
                    rows={4}
                    placeholder="Describe customer complaints and requested repairs (e.g. Brake noise, oil leak, vibration at 80 km/h)..."
                    value={customerRequests}
                    onChange={e => handleCustomerRequestsChange(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-slate-900 outline-none focus:border-slate-800 text-xs sm:text-sm font-semibold resize-none"
                  />

                  {showIssueDropdown && issueMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 p-2 divide-y divide-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">Matching Past Garage Issues</p>
                      {issueMatches.map((match) => (
                        <div
                          key={match}
                          onClick={() => addQuickIssue(match)}
                          className="p-2 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                        >
                          {match}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Services & Parts with Individual Date Mapping and Add Item at Bottom */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <div className="border-b-2 border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 uppercase tracking-wide text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-slate-800" /> Services & Spare Parts
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Actual Cost is for internal workshop profitability. Only the Billed Rate is shown on customer invoices.
                </p>
              </div>

              {/* Line Items Container with Date Picker */}
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemActual = Number(item.costPrice) || 0;
                  const itemCharging = Number(item.rate) || 0;
                  const itemProfit = itemCharging - itemActual;

                  const currentPool = availableLineItems[item.type] || [];
                  const q = item.name.trim().toLowerCase();

                  const matchingSuggestions = q
                    ? currentPool.filter(p => p.toLowerCase().includes(q))
                    : currentPool.slice(0, 10);

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border-2 border-slate-200 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">

                        {/* 1. Date Field */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-[#BC0202]" /> Work Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={item.date || new Date().toISOString().split('T')[0]}
                            onChange={e => handleItemChange(item.id, 'date', e.target.value)}
                            className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 outline-none focus:border-slate-800"
                          />
                        </div>

                        {/* 2. Type */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Type *</label>
                          <select
                            value={item.type}
                            onChange={e => handleItemChange(item.id, 'type', e.target.value)}
                            className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 outline-none focus:border-slate-800"
                          >
                            <option value="Service">Service</option>
                            <option value="Part">Spare Part</option>
                          </select>
                        </div>

                        {/* 3. Description with Dynamic Autocomplete */}
                        <div className="sm:col-span-3 relative item-name-container">
                          <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">
                            Description / Item Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={item.type === 'Service' ? 'e.g. headlight replace' : 'e.g. Headlight Assembly'}
                            value={item.name}
                            onChange={e => {
                              handleItemChange(item.id, 'name', e.target.value);
                              setActiveItemSuggestionId(item.id);
                            }}
                            onFocus={() => setActiveItemSuggestionId(item.id)}
                            className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 outline-none focus:border-slate-800"
                          />

                          {/* Item Suggestions Dropdown */}
                          {activeItemSuggestionId === item.id && matchingSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 px-2.5 py-1 bg-slate-50">
                                Suggested {item.type} Items
                              </p>
                              {matchingSuggestions.map((suggestion, sIdx) => (
                                <div
                                  key={sIdx}
                                  onClick={() => {
                                    handleItemChange(item.id, 'name', suggestion);
                                    setActiveItemSuggestionId(null);
                                  }}
                                  className="p-2.5 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-[#BC0202] cursor-pointer"
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Actual Cost */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-black text-amber-900 uppercase flex items-center gap-1 mb-1">
                            <EyeOff className="w-3 h-3 text-amber-700" /> Actual Cost (LKR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.costPrice}
                            onChange={e => handleItemChange(item.id, 'costPrice', e.target.value)}
                            className="w-full p-2.5 border-2 border-amber-300 bg-amber-50/40 rounded-xl text-xs font-black text-amber-950 outline-none focus:border-amber-600"
                          />
                        </div>

                        {/* 5. Billed Rate */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-black text-emerald-800 uppercase block mb-1">
                            Billed Rate (LKR) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={item.rate}
                            onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                            className="w-full p-2.5 border-2 border-emerald-300 bg-emerald-50/40 rounded-xl text-xs font-black text-emerald-950 outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* 6. Delete Action */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length === 1}
                            className="p-2.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 px-1 border-t border-slate-200 font-bold text-slate-500">
                        <span>Item #{index + 1} ({item.date || 'Today'})</span>
                        <span className={itemProfit >= 0 ? 'text-emerald-700 font-extrabold' : 'text-red-600 font-extrabold'}>
                          Net Margin: LKR {itemProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item Button at Bottom of Section */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-400 hover:border-slate-800 rounded-xl text-xs font-black text-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5] text-[#BC0202]" /> Add Another Line Item / Part
                </button>
              </div>
            </div>

            {/* Section 3: Job Card Logistics, Internal Notes & GST */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4">
              <h3 className="font-black text-slate-950 uppercase tracking-wide text-sm border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#BC0202]" /> Logistics & Scheduling Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase">Job Date (Created) *</label>
                  <input
                    type="date"
                    required
                    value={jobDate}
                    onChange={e => setJobDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase">Estimated Delivery</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full mt-1 p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full mt-1 p-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="Pending Inspection">Pending Inspection</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase block mb-1">
                  Internal Workshop Notes & Diagnostic Findings
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Diagnostic findings, torque specs, technician observations, additional recommendations..."
                  className="w-full p-3 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-slate-800 resize-none bg-slate-50 focus:bg-white"
                />
              </div>

              {/* GST Toggle */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={applyGST}
                    onChange={e => setApplyGST(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  Apply GST / VAT (18%) to Customer Bill
                </label>

                <div className="text-sm font-black text-slate-950">
                  Customer Final Billed: <span className="text-emerald-700">LKR {calculations.totalBilled.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-[#BC0202] hover:bg-[#830000] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-md transition-all flex items-center gap-2 w-full justify-center cursor-pointer border border-[#830000] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                {isSubmitting
                  ? 'Processing & Saving to MongoDB...'
                  : isViewOrEditMode
                    ? `Update Job Card (${jobId})`
                    : 'Create & Finalize Job Card'}
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
};

export default JobCardWorkspace;