import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import API from '../api';
import letterheadBg from '../assets/letterhead-template.jpg';

const QuotationPrintView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/quotations/${id}`);
                setQuotation(res.data);
            } catch (err) {
                setError('Failed to load quotation for printing.');
            } finally {
                setLoading(false);
            }
        };
        fetchQuotation();
    }, [id]);

    // Triggers print and sets default PDF save file name dynamically
    const handlePrint = () => {
        const originalTitle = document.title;
        const safeQuotationNo = quotation?.quotationNo || 'Quotation';
        const safeVehicleNo = quotation?.vehicleNo ? `_${quotation.vehicleNo}` : '';
        const exportFileName = `${safeQuotationNo}${safeVehicleNo}`.replace(/[\/\\?%*:|"<>]/g, '-');

        document.title = exportFileName;
        window.print();
        document.title = originalTitle;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
                <div className="flex items-center gap-3 text-slate-800 font-extrabold text-base animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#BC0202] animate-spin" />
                    Loading Quotation Print View...
                </div>
            </div>
        );
    }

    if (error || !quotation) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
                <div className="bg-red-50 border-2 border-red-300 text-red-900 p-6 rounded-2xl flex items-center gap-3 font-bold max-w-md">
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <span>{error || 'Quotation not found.'}</span>
                </div>
            </div>
        );
    }

    const DottedRow = ({ label, value, labelWidth = "w-36" }) => (
        <div className="flex items-end mb-1 text-[12px]">
            <span className={`${labelWidth} shrink-0 text-slate-800 font-bold`}>{label}</span>
            <span className="mx-1 font-bold">:</span>
            <span className="border-b border-dotted border-black flex-grow min-h-[18px] leading-snug font-black text-black uppercase">
                {value || ''}
            </span>
        </div>
    );

    const sections = [
        { title: '1. REMOVE AND REFIX', items: quotation.removeAndRefix || [] },
        { title: '2. REALIGNING', items: quotation.realigning || [] },
        { title: '3. REPAINTING', items: quotation.repainting || [] },
        { title: '4. SPARE PARTS', items: quotation.spareParts || [] },
    ];

    // Smart Section-Aware Pagination:
    // Page 1 budget: ~15 rows (Header + Customer Details take space)
    // Later Pages budget: ~24 rows (No letterhead gap, plain page)
    const paginateSections = () => {
        const pages = [];
        let currentPage = [];
        let currentPageIdx = 0;

        const getPageCapacity = (pageIdx) => {
            return pageIdx === 0 ? 15 : 24;
        };

        const getRemainingCapacity = () => {
            return getPageCapacity(currentPageIdx) - currentPage.length;
        };

        const pushNewPage = () => {
            if (currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [];
                currentPageIdx++;
            }
        };

        sections.forEach((sec) => {
            const itemCount = sec.items.length;
            const itemsToPack = itemCount === 0 ? [{ type: 'empty' }] : sec.items.map((item, idx) => ({ type: 'item', index: idx + 1, item }));

            // If category has > 3 items and current page cannot fit at least 1 header + 3 items, push to next page
            const remainingSlots = getRemainingCapacity();
            if (itemCount > 3 && remainingSlots < 4 && currentPage.length > 0) {
                pushNewPage();
            }

            if (getRemainingCapacity() < 2 && currentPage.length > 0) {
                pushNewPage();
            }

            currentPage.push({ type: 'header', title: sec.title });

            itemsToPack.forEach((rowObj) => {
                if (getRemainingCapacity() <= 0) {
                    pushNewPage();
                }
                currentPage.push(rowObj);
            });
        });

        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        // Safety check to ensure the footer has ample space on the last page
        if (pages.length > 0) {
            const lastPage = pages[pages.length - 1];
            const maxAllowedOnLastPage = pages.length === 1 ? 11 : 14;
            if (lastPage.length > maxAllowedOnLastPage) {
                const overflowItems = lastPage.splice(maxAllowedOnLastPage);
                pages.push(overflowItems);
            }
        }

        return pages.length === 0 ? [[]] : pages;
    };

    const paginatedPages = paginateSections();

    // Renders the content of an individual A4 sheet
    const renderPageContent = (pageRows, pageIndex, totalPages) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;

        return (
            <div
                className="px-9 pb-6 relative z-10 flex flex-col h-full"
                style={{ paddingTop: isFirstPage ? '56mm' : '18mm' }}
            >
                {/* Title & Page Number */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-center flex-grow text-[16px] font-black underline tracking-wide text-slate-950 uppercase pl-8">
                        VEHICLE ACCIDENT REPAIR QUOTATION
                    </h3>
                    {totalPages > 1 && (
                        <span className="text-[11px] font-bold text-slate-600 shrink-0">
                            Page {pageIndex + 1} of {totalPages}
                        </span>
                    )}
                </div>

                {/* Quotation No & Date */}
                <div className="flex justify-between items-center text-[12px] font-bold mb-2.5 px-1">
                    <div className="flex gap-2 items-center">
                        <span className="text-slate-700">Quotation No :</span>
                        <span className="font-mono font-black text-black text-[13px]">{quotation.quotationNo}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-slate-700">Date :</span>
                        <span className="font-black text-black text-[13px]">{new Date(quotation.date).toLocaleDateString('en-GB')}</span>
                    </div>
                </div>

                {/* Customer & Vehicle Info Grid - Rendered only on Page 1 */}
                {isFirstPage ? (
                    <div className="grid grid-cols-2 gap-x-8 mb-3.5 text-[12px] border border-slate-400 p-3 rounded bg-white/70">
                        <div>
                            <DottedRow label="Customer Name" value={quotation.customerName} />
                            <DottedRow label="Contact Number" value={quotation.contactNumber} />
                            <DottedRow label="Insurance Co." value={quotation.insuranceCompany} />
                        </div>
                        <div>
                            <DottedRow label="Vehicle Reg No" value={quotation.vehicleNo} />
                            <DottedRow label="Make / Model" value={`${quotation.make || ''} ${quotation.model || ''}`} />
                            <DottedRow label="Chassis No" value={quotation.chassisNo} />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between text-[11px] font-bold border-b border-slate-300 pb-1 mb-3 text-slate-600">
                        <span>Vehicle No: <strong className="text-black uppercase">{quotation.vehicleNo}</strong></span>
                        <span>Customer: <strong className="text-black">{quotation.customerName}</strong></span>
                    </div>
                )}

                {/* Table for this specific page slice */}
                <div className="flex-grow overflow-hidden">
                    <table className="w-full text-[12px] border-collapse border border-slate-500 bg-white">
                        <thead>
                            <tr className="bg-slate-200 text-slate-950 border-b border-slate-500 font-black text-[12px]">
                                <th className="py-1.5 px-2.5 w-12 text-center border-r border-slate-400">#</th>
                                <th className="py-1.5 px-3.5 text-left border-r border-slate-400">Description of Work / Parts Required</th>
                                <th className="py-1.5 px-3.5 text-right w-44">Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                            {pageRows.map((row, rIdx) => {
                                if (row.type === 'header') {
                                    return (
                                        <tr key={rIdx} className="bg-slate-100 font-black text-[12.5px] text-slate-950 border-t border-b border-slate-400">
                                            <td colSpan="3" className="py-1.5 px-3.5 uppercase tracking-wider">
                                                {row.title}
                                            </td>
                                        </tr>
                                    );
                                }
                                if (row.type === 'empty') {
                                    return (
                                        <tr key={rIdx}>
                                            <td colSpan="3" className="py-1 px-3.5 text-slate-400 italic text-[11px] pl-8">
                                                None
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={rIdx} className="hover:bg-slate-50/40">
                                        <td className="py-1.5 px-2.5 text-center text-slate-600 font-bold border-r border-slate-300">
                                            {row.index}
                                        </td>
                                        <td className="py-1.5 px-3.5 text-slate-950 font-bold border-r border-slate-300 pl-6 text-[12.5px]">
                                            • {row.item.description}
                                        </td>
                                        <td className="py-1.5 px-3.5 text-right font-mono font-black text-black text-[13px]">
                                            {Number(row.item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER SECTION: Docked strictly at the bottom of the LAST page */}
                {isLastPage ? (
                    <div className="mt-auto pt-2 text-[12px]">
                        {/* Grand Total Box */}
                        <div className="font-bold space-y-1 mb-1 bg-gray-200 p-2.5 border border-slate-500">
                            <div className="flex items-end justify-between">
                                <span className="text-[13px] font-black uppercase text-black">Grand Total Estimated Cost :</span>
                                <span className="text-[16px] font-black text-right border-b border-dotted border-black px-4 font-mono text-black">
                                    Rs. {Number(quotation.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <p className="text-center italic mb-3 text-[10.5px] text-slate-700 font-semibold">
                            (Estimated prices are subject to parts availability and prevailing market rates)
                        </p>

                        {/* Declaration & Signatures */}
                        <div className="border-t border-slate-400 pt-2.5">
                            <h5 className="font-bold text-[12px] text-slate-900 uppercase tracking-tight">Declaration of Valuer / Assessor</h5>
                            <p className="mb-8 leading-relaxed text-[11px] text-slate-800 text-justify font-medium">
                                I hereby certify that the above estimation has been prepared after an examination of the damages caused to the vehicle.
                                The parts and labor charges stated are based on standard workshop labor schedules and prevailing market prices for replacement parts.
                            </p>

                            <div className="flex justify-between items-end px-8 font-bold text-center">
                                <div className="w-52 border-t-2 border-black pt-1.5 text-[12px] text-black">
                                    Signature of Assessor
                                </div>
                                <div className="w-44">
                                    <p className="mb-1 text-[11.5px] font-mono text-black font-bold">{new Date(quotation.date).toLocaleDateString('en-GB')}</p>
                                    <div className="border-t-2 border-black pt-1.5 text-[12px] text-black">Date</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto pt-2 text-right">
                        <p className="text-[11px] font-bold text-slate-500 italic">Continued on next page →</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* On-Screen Screen View */}
            <div className="min-h-screen bg-slate-200 py-6 text-black font-sans print:hidden">
                <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center px-4">
                    <button
                        onClick={() => navigate('/quotations')}
                        className="bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Quotations
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-[#BC0202] hover:bg-[#830000] text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Print Quotation ({paginatedPages.length} {paginatedPages.length === 1 ? 'Page' : 'Pages'})
                    </button>
                </div>

                <div className="space-y-6">
                    {paginatedPages.map((pageRows, pageIdx) => (
                        <div
                            key={pageIdx}
                            className="relative flex flex-col box-border overflow-hidden bg-white shadow-xl mx-auto"
                            style={{ width: '210mm', height: '297mm' }}
                        >
                            {/* Render letterhead background ONLY on the first page */}
                            {pageIdx === 0 && (
                                <img
                                    src={letterheadBg}
                                    alt="Letterhead Template"
                                    className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
                                />
                            )}
                            {renderPageContent(pageRows, pageIdx, paginatedPages.length)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Print-Only View: Uses print:absolute print:z-[9999] print:top-0 to cover Navbar */}
            <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:z-[9999] text-black font-sans mx-auto bg-white">
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 0; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                    `}
                </style>

                {paginatedPages.map((pageRows, pageIdx) => (
                    <div
                        key={pageIdx}
                        className="relative flex flex-col box-border overflow-hidden bg-white print:break-after-page print:page-break-after-always"
                        style={{ width: '210mm', height: '297mm', margin: '0 auto' }}
                    >
                        {/* Render letterhead background ONLY on the first page */}
                        {pageIdx === 0 && (
                            <img
                                src={letterheadBg}
                                alt="Letterhead Template"
                                className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
                            />
                        )}
                        {renderPageContent(pageRows, pageIdx, paginatedPages.length)}
                    </div>
                ))}
            </div>
        </>
    );
};

export default QuotationPrintView;