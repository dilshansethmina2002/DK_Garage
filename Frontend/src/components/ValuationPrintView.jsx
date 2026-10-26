import React from 'react';
import letterheadBg from '../assets/letterhead-template.jpg';

const ValuationPrintView = ({ data }) => {
    if (!data) return null;

    // Tightened margins to compress the content safely into one page
    const DottedRow = ({ label, value, labelWidth = "w-40" }) => (
        <div className="flex items-end mb-[1px] text-[10px]">
            <span className={`${labelWidth} shrink-0`}>{label}</span>
            <span className="mx-1">:</span>
            <span className="border-b border-dotted border-black flex-grow min-h-[14px] leading-tight font-bold">
                {value || ''}
            </span>
        </div>
    );

    return (
        // 1. Overlay entire screen to hide the app's top navbar/logo during printing
        <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:z-[9999] text-black font-sans mx-auto">

            {/* 2. Strip browser headers/footers (Date, URL) and set strict A4 margins */}
            <style type="text/css" media="print">
                {`
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
        `}
            </style>

            {/* ======================= PAGE 1 ======================= */}
            {/* 3. Lock exactly to A4 dimensions (210x297mm) to prevent spillover */}
            <div
                className="relative flex flex-col box-border overflow-hidden print:page-break-after-always"
                style={{ width: '210mm', height: '297mm', margin: '0 auto' }}
            >

                <img
                    src={letterheadBg}
                    alt="Letterhead Background"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                {/* 4. Enforce 52mm top padding to prevent overlapping the letterhead text */}
                <div className="px-8 pb-4 relative z-10 flex flex-col h-full" style={{ paddingTop: '52mm' }}>



                    <h3 className="text-center text-[12px] font-bold underline mb-2">VEHICLE INSPECTION AND VALUATION REPORT</h3>

                    {/* Meta Details */}
                    <div className="flex justify-between text-[10px] font-bold mb-2 px-2">
                        <div className="flex gap-2"><span className="w-16">Serial </span><span>: {data.serialNo}</span></div>
                        <div className="flex gap-2"><span className="w-16">Report No</span><span>: {data.reportNo}</span></div>
                        <div className="flex gap-2"><span className="w-10">Date</span><span>: {new Date(data.inspectionDate).toLocaleDateString()}</span></div>
                    </div>

                    <div className="space-y-0.5 mb-2">
                        <DottedRow label="Contact person" value={data.contactPerson} labelWidth="w-32" />
                        <DottedRow label="Opinion Provided to" value={data.opinionProvidedTo} labelWidth="w-32" />
                        <div className="flex justify-between pl-6 mt-1">
                            <div className="w-1/2"><DottedRow label="a Date and time of inspection" value={`${new Date(data.inspectionDate).toLocaleDateString()} ${data.inspectionTime}`} labelWidth="w-40" /></div>
                        </div>
                        <div className="flex justify-between pl-6">
                            <div className="w-1/2"><DottedRow label="b Place of inspection" value={data.placeOfInspection} labelWidth="w-40" /></div>
                        </div>
                    </div>

                    {/* 1.0 Vehicle Identification */}
                    <h4 className="text-[11px] font-bold mb-1 uppercase">1.0 VEHICLE IDENTIFICATION DETAILS</h4>
                    <div className="grid grid-cols-2 gap-x-6 text-[10px]">
                        <div>
                            <p className="font-bold underline text-center mb-0.5">As per Inspection</p>
                            <DottedRow label="1.1 Registration No" value={data.identification?.registrationNo} />
                            <DottedRow label="1.2 Make" value={data.identification?.make} />
                            <DottedRow label="1.3 Model" value={data.identification?.model} />
                            <DottedRow label="1.4 Chassis No" value={data.identification?.chassisNo} />
                            <DottedRow label="1.5 Engine No" value={data.identification?.engineNo} />
                            <DottedRow label="1.6 Classification" value={data.identification?.classification} />
                            <DottedRow label="1.7 Country of Origin" value={data.identification?.countryOfOrigin} />
                            <DottedRow label="1.8 Country of used" value={data.identification?.countryOfUsed} />
                            <DottedRow label="1.9 Year of Manufacture" value={data.identification?.yearOfManufacture} />
                            <DottedRow label="1.10 Date of Registration" value={data.identification?.dateOfRegistration} />
                            <DottedRow label="1.11 Lenght" value={data.identification?.length} />
                            <DottedRow label="1.12 Fuel System" value={data.identification?.fuelSystem} />
                            <DottedRow label="1.13 Unleden Weight" value={data.identification?.unladenWeight} />
                            <DottedRow label="1.14 Gross Weight" value={data.identification?.grossWeight} />
                            <DottedRow label="1.26 Previous Ownes" value={data.identification?.previousOwners} />
                            <DottedRow label="1.27 Importer" value={data.identification?.importer} />
                            <DottedRow label="1.28 Current Owner" value={data.identification?.currentOwner} />
                            <DottedRow label="1.29 Extra options" value={data.identification?.extraOptions} />
                        </div>
                        <div>
                            <p className="font-bold underline text-center mb-0.5">As per Inspection</p>
                            <DottedRow label="1.15 Type of fuel" value={data.identification?.typeOfFuel} />
                            <DottedRow label="1.16 If converted date & type" value={data.convertedDateType} />
                            <DottedRow label="1.17 Switch key no" value={data.identification?.switchKeyNo} />
                            <div className="h-3"></div>
                            <DottedRow label="1.18 Meter reading" value={data.identification?.meterReading} />
                            <DottedRow label="1.19 Date of import" value={data.identification?.dateOfImport} />
                            <DottedRow label="1.20 Date of clearing" value={data.identification?.dateOfClearing} />
                            <DottedRow label="1.21 Colour" value={data.identification?.colour} />
                            <DottedRow label="1.22 Just Low" value={data.identification?.justLow} />
                            <DottedRow label="1.23 Seating capacity" value={data.identification?.seatingCapacity} />
                            <DottedRow label="1.24 4 x 4 wheel drive" value={data.identification?.fourWheelDrive} />
                            <DottedRow label="1.25 Engine Capacity" value={data.identification?.engineCapacity} />
                        </div>
                    </div>

                    <div className="mt-1.5 text-[10px] space-y-0.5">
                        <div className="flex gap-2">
                            <div className="w-1/2"><DottedRow label="1.30 Compliance of above (1.0-1.25) with CR" value={data.identification?.complianceWithCR} labelWidth="w-56" /></div>
                            <div className="w-1/2"><DottedRow label="If No - Comments" value={data.identification?.complianceComments} labelWidth="w-24" /></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/2"><DottedRow label={<span className="font-bold">2.0 Road Test Done on</span>} value={data.evaluationTab2?.roadTest?.doneOn} labelWidth="w-56" /></div>
                            <div className="w-1/2"><DottedRow label="Not Done because" value={data.evaluationTab2?.roadTest?.notDoneBecause} labelWidth="w-24" /></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/2"><DottedRow label="2.1 Average Fuel Consumption per litre" value={data.evaluationTab2?.roadTest?.averageFuelConsumption} labelWidth="w-56" /></div>
                            <div className="w-1/2"><DottedRow label="3.0 Impact on Gov Policies" value={data.evaluationTab2?.impactOnGovPolicies} labelWidth="w-40" /></div>
                        </div>

                        <div className="flex gap-4 mt-1 font-bold">
                            <span className="w-32">4.0 Availability of spares</span>
                            <span>Body Parts : {data.evaluationTab2?.availabilityOfSpares?.bodyParts}</span>
                            <span className="ml-2">Engine Parts : {data.evaluationTab2?.availabilityOfSpares?.engineParts}</span>
                            <span className="ml-2">Accessories : {data.evaluationTab2?.availabilityOfSpares?.accessories}</span>
                        </div>
                    </div>

                    {/* 5. Shrunk photo heights so they do not spill to page 2 */}
                    <div className="mt-auto pt-1 pb-1">
                        <div className="grid grid-cols-2 gap-4 mb-2" style={{ height: '22mm' }}>
                            <div>
                                <p className="text-[9px] font-bold mb-0.5">Chassis No</p>
                                <div className="w-full h-full border-[1.5px] border-black flex items-center justify-center overflow-hidden">
                                    {data.photos?.chassisNoPhoto ? (
                                        <img src={data.photos.chassisNoPhoto} className="w-full h-full object-cover" alt="Chassis No" />
                                    ) : (
                                        <span className="text-[9px] text-gray-300">Photo Space</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold mb-0.5">Engine No</p>
                                <div className="w-full h-full border-[1.5px] border-black flex items-center justify-center overflow-hidden">
                                    {data.photos?.engineNoPhoto ? (
                                        <img src={data.photos.engineNoPhoto} className="w-full h-full object-cover" alt="Engine No" />
                                    ) : (
                                        <span className="text-[9px] text-gray-300">Photo Space</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4" style={{ height: '40mm' }}>
                            <div className="w-full h-full border-[1.5px] border-black flex items-center justify-center overflow-hidden">
                                {data.photos?.vehiclePhotos?.[0] ? (
                                    <img src={data.photos.vehiclePhotos[0]} className="w-full h-full object-cover" alt="Vehicle Front/Side" />
                                ) : (
                                    <span className="text-[10px] text-gray-300">Photo Space</span>
                                )}
                            </div>
                            <div className="w-full h-full border-[1.5px] border-black flex items-center justify-center overflow-hidden">
                                {data.photos?.vehiclePhotos?.[1] ? (
                                    <img src={data.photos.vehiclePhotos[1]} className="w-full h-full object-cover" alt="Vehicle Rear/Side" />
                                ) : (
                                    <span className="text-[10px] text-gray-300">Photo Space</span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ======================= PAGE 2 ======================= */}
            <div
                className="relative flex flex-col bg-white box-border overflow-hidden"
                style={{ width: '210mm', height: '297mm', margin: '0 auto' }}
            >
                <div className="px-8 pt-10 pb-6 flex flex-col h-full">
                    <h4 className="text-[11px] font-bold mb-3 uppercase">5.0 TECHNICAL EVALUATION</h4>

                    <div className="grid grid-cols-2 gap-x-8 text-[10px] pl-2">
                        <div>
                            <h5 className="font-bold">5.1 Transmission</h5>
                            <div className="pl-3">
                                <div className="flex"><div className="w-1/2"><DottedRow label="5.1.1 Gear box" value={data.technical?.transmission?.gearBoxType} labelWidth="w-24" /></div><div className="w-1/2 pl-1"><DottedRow label="" value={data.technical?.transmission?.gearBoxCondition} labelWidth="w-0" /></div></div>
                                <div className="flex"><div className="w-1/2"><DottedRow label="5.1.2 Clutch" value={data.technical?.transmission?.clutchType} labelWidth="w-24" /></div><div className="w-1/2 pl-1"><DottedRow label="" value={data.technical?.transmission?.clutchCondition} labelWidth="w-0" /></div></div>
                                <DottedRow label="5.1.3 Shafting" value={data.technical?.transmission?.shafting} labelWidth="w-24" />
                                <DottedRow label="5.1.4 Differential" value={data.technical?.transmission?.differential} labelWidth="w-24" />
                                <DottedRow label="5.1.5 Gear selection" value={data.technical?.transmission?.gearSelection} labelWidth="w-24" />
                            </div>

                            <h5 className="font-bold mt-2">5.2 Suspension</h5>
                            <div className="pl-3">
                                <DottedRow label="5.2.1 Front" value={data.technical?.suspension?.front} labelWidth="w-24" />
                                <DottedRow label="5.2.2 Rear" value={data.technical?.suspension?.rear} labelWidth="w-24" />
                            </div>

                            <h5 className="font-bold mt-2">5.3 Brakes</h5>
                            <div className="pl-3 flex">
                                <div className="w-1/2"><DottedRow label="5.3.1 Foot Brakes" value={data.technical?.brakes?.footBrakesType} labelWidth="w-28" /></div>
                                <div className="w-1/2 pl-1"><DottedRow label="" value={data.technical?.brakes?.footBrakesCondition} labelWidth="w-0" /></div>
                            </div>
                            <div className="pl-3">
                                <DottedRow label="5.3.2 Parking Brakes" value={data.technical?.brakes?.parkingBrakes} labelWidth="w-28" />
                            </div>

                            <div className="mt-2 flex pl-1">
                                <div className="w-1/2"><DottedRow label={<span className="font-bold">5.4 Steering</span>} value={data.technical?.steering?.type} labelWidth="w-28" /></div>
                                <div className="w-1/2 pl-1"><DottedRow label="" value={data.technical?.steering?.condition} labelWidth="w-0" /></div>
                            </div>

                            <div className="pl-1">
                                <DottedRow label={<span className="font-bold">5.5 Chassis Condition</span>} value={data.technical?.chassisCondition} labelWidth="w-32" />
                                <DottedRow label={<span className="font-bold">5.6 Body Condition</span>} value={data.technical?.bodyCondition} labelWidth="w-32" />
                            </div>

                            <h5 className="font-bold mt-2">5.8 Engine</h5>
                            <div className="pl-3">
                                <DottedRow label="5.8.1 Condition" value={data.technical?.engine?.condition} labelWidth="w-28" />
                                <div className="flex text-[9px] items-end gap-1 mt-1">
                                    <span className="w-16">5.8.2 Status :</span>
                                    <span className="border-b border-dotted border-black flex-grow text-center font-bold">{data.technical?.engine?.status}</span>
                                    <span>Overhaul:</span>
                                    <span className="border-b border-dotted border-black w-12 text-center font-bold">{data.technical?.engine?.overhaulDoneOn}</span>
                                    <span>Replaced:</span>
                                    <span className="border-b border-dotted border-black w-12 text-center font-bold">{data.technical?.engine?.replacedOn}</span>
                                </div>
                            </div>

                            <h5 className="font-bold mt-2">5.9 Tyres</h5>
                            <div className="pl-7 flex font-bold justify-between text-[9px] mb-0.5">
                                <span>Size</span><span>Wheels</span><span className="mr-8">Normal</span>
                            </div>
                            <div className="pl-3">
                                <div className="flex justify-between pr-8"><DottedRow label="5.9.1 Front" value={data.technical?.tyres?.front?.size} labelWidth="w-16" /><span className="border-b border-dotted border-black w-10 text-center font-bold">{data.technical?.tyres?.front?.conditionPercent}</span></div>
                                <div className="flex justify-between pr-8"><DottedRow label="5.9.2 Rear" value={data.technical?.tyres?.rear?.size} labelWidth="w-16" /><span className="border-b border-dotted border-black w-10 text-center font-bold">{data.technical?.tyres?.rear?.conditionPercent}</span></div>
                                <div className="flex justify-between pr-8"><DottedRow label="5.9.3 Spare" value={data.technical?.tyres?.spare?.size} labelWidth="w-16" /><span className="border-b border-dotted border-black w-10 text-center font-bold">{data.technical?.tyres?.spare?.conditionPercent}</span></div>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-bold">4.7 Electrical System</h5>
                            <div className="pl-3">
                                <DottedRow label="5.7.1 S/Starter" value={data.technical?.electricalSystem?.starter} labelWidth="w-28" />
                                <DottedRow label="5.7.2 Wipers" value={data.technical?.electricalSystem?.wipers} labelWidth="w-28" />
                                <DottedRow label="5.7.3 Horn" value={data.technical?.electricalSystem?.horn} labelWidth="w-28" />
                                <DottedRow label="5.7.4 Lights" value={data.technical?.electricalSystem?.lights} labelWidth="w-28" />
                                <DottedRow label="5.7.5 Meters" value={data.technical?.electricalSystem?.meters} labelWidth="w-28" />
                                <DottedRow label="5.7.6 Alternator" value={data.technical?.electricalSystem?.alternator} labelWidth="w-28" />
                            </div>

                            <div className="border border-black p-2 mt-6 w-56 ml-auto bg-gray-50/50">
                                <div className="flex font-bold"><span className="w-20">Reg No</span><span className="flex-grow border-b border-dotted border-black px-1">{data.identification?.registrationNo}</span></div>
                                <div className="flex font-bold mt-1.5"><span className="w-20">Chassis No</span><span className="flex-grow border-b border-dotted border-black px-1">{data.identification?.chassisNo}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] pl-2 mt-3">
                        <h5 className="font-bold">5.10 Major Repairs</h5>
                        <div className="pl-3 space-y-0.5">
                            <DottedRow label="5.10.1 Needed within a year" value={data.evaluationTab2?.majorRepairs?.neededWithinYear} labelWidth="w-44" />
                            <DottedRow label="5.10.2 Body parts replaced" value={data.evaluationTab2?.majorRepairs?.bodyPartsReplaced} labelWidth="w-44" />
                            <DottedRow label="5.10.3 Accidents" value={data.evaluationTab2?.majorRepairs?.accidents} labelWidth="w-44" />
                            <DottedRow label="5.10.4 Write off by insurers" value={data.evaluationTab2?.majorRepairs?.writeOffByInsurers} labelWidth="w-44" />
                            <DottedRow label="5.10.5 Comments" value={data.evaluationTab2?.majorRepairs?.comments} labelWidth="w-44" />
                        </div>

                        <div className="mt-1.5"><DottedRow label={<span className="font-bold">5.11 Compliance with environment regulations</span>} value={data.evaluationTab2?.complianceWithEnvRegulations} labelWidth="w-64" /></div>
                        <div className="pl-3"><DottedRow label="Comments" value={data.evaluationTab2?.comments} labelWidth="w-44" /></div>

                        <h5 className="font-bold mt-2">5.12 Maintenance</h5>
                        <div className="pl-3 flex">
                            <div className="w-1/2">
                                <DottedRow label="5.12.1 Mechanical" value="" labelWidth="w-32" />
                                <DottedRow label="5.12.2 Body" value="" labelWidth="w-32" />
                                <DottedRow label="5.12.3 Internal trim" value={data.evaluationTab2?.maintenance?.internalTrim} labelWidth="w-32" />
                            </div>
                            <div className="w-1/2">
                                <DottedRow label="" value={data.evaluationTab2?.maintenance?.mechanical} labelWidth="w-2" />
                                <DottedRow label="" value={data.evaluationTab2?.maintenance?.body} labelWidth="w-2" />
                                <DottedRow label="" value="-" labelWidth="w-2" />
                            </div>
                        </div>

                        <h5 className="font-bold mt-2">5.13 Options</h5>
                        <div className="pl-3 space-y-0.5">
                            <DottedRow label="5.13.1 P.Shutters" value={data.technical?.options?.powerShutters} labelWidth="w-48" />
                            <DottedRow label="5.13.2 P.Mirrors" value={data.technical?.options?.powerMirrors} labelWidth="w-48" />
                            <DottedRow label="5.13.3 Air conditioner (S/D/C)" value={data.technical?.options?.airConditioner} labelWidth="w-48" />
                            <DottedRow label="5.13.4 Special features" value={data.technical?.specialFeatures} labelWidth="w-48" />
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-2 pl-1">
                            <div>
                                <DottedRow label={<span className="font-bold">5.14 Doors</span>} value={data.evaluationTab2?.doors} labelWidth="w-20" />
                                <DottedRow label={<span className="font-bold">5.15 Roof Type</span>} value={data.evaluationTab2?.roofType} labelWidth="w-20" />
                                <DottedRow label={<span className="font-bold">5.16 Body</span>} value={data.evaluationTab2?.bodyType} labelWidth="w-20" />
                            </div>
                            <div>
                                <DottedRow label={<span className="font-bold">5.17 Condition</span>} value={data.evaluationTab2?.generalCondition} labelWidth="w-32" />
                                <DottedRow label={<span className="font-bold">5.18 Batteries</span>} value={data.evaluationTab2?.batteries} labelWidth="w-32" />
                                <DottedRow label={<span className="font-bold">5.19 Type of Vehicle</span>} value={data.identification?.classification} labelWidth="w-32" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-2 text-[10px]">
                        <h5 className="font-bold">6.0 Declaration by supplier</h5>
                        <p className="pl-3 mb-4 leading-tight">I hereby declare and affirm that I am the current owner of the vehicle details indicated in the section 1.0 that the information given concerning it is correct to the best of my knowledge.</p>

                        <div className="flex justify-between pl-3 mb-4">
                            <div className="w-48"><DottedRow label="Date" value="" labelWidth="w-10" /></div>
                            <div className="w-56"><DottedRow label="Vendor" value="" labelWidth="w-12" /></div>
                        </div>

                        <div className="font-bold space-y-1.5 mb-1 bg-gray-50/50 p-2 border border-gray-200">
                            <div className="flex items-end"><span className="w-36 shrink-0">7.0 Market Value : Rs.</span><span className="w-24 text-right pr-2 border-b border-dotted border-black">{data.evaluationTab2?.marketValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span><span className="ml-2 uppercase border-b border-dotted border-black flex-grow">{data.evaluationTab2?.marketValueWords}</span></div>
                            <div className="flex items-end"><span className="w-36 shrink-0">8.0 Forced Value : Rs.</span><span className="w-24 text-right pr-2 border-b border-dotted border-black">{data.evaluationTab2?.forcedSaleValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span><span className="ml-2 uppercase border-b border-dotted border-black flex-grow">{data.evaluationTab2?.forcedSaleValueWords}</span></div>
                        </div>
                        <p className="text-center italic mb-4 text-[9px]">(The above prices inclusive of VAT)</p>

                        <h5 className="font-bold">9.0 Declaration of valuer</h5>
                        <p className="pl-3 mb-10 leading-tight">I hereby confirm that the information stated is correct as per inspections made by me and to the best of my knowledge. I also have given the above valuation after considering all relevant factors, which affect the value of the vehicle to the best of my expertise knowledge.</p>

                        <div className="flex justify-between items-end px-6 font-bold text-center">
                            <div className="w-40 border-t border-black pt-1">Signature of the Valuer</div>
                            <div className="text-[11px] text-blue-900 leading-tight">
                                <p>DAMINDA K. KAHADUWA</p>
                                <p className="text-[8px]">VALUER OF MOTOR VEHICLES</p>
                                <p className="text-[8px]">Reg. No: LASL/V/089</p>
                                <p className="text-[12px] mt-0.5">DK AUTOMOBILE</p>
                            </div>
                            <div className="w-32">
                                <p className="mb-0.5">{new Date(data.inspectionDate).toLocaleDateString()}</p>
                                <div className="border-t border-black pt-1">Date</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ValuationPrintView;
