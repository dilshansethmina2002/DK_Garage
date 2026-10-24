import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import letterheadBg from '../assets/letterhead-template.jpg';

export const generateJobReceipt = (job) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const safeText = (val, fallback = 'N/A') =>
        val !== undefined && val !== null && String(val).trim() !== ''
            ? String(val).trim()
            : fallback;

    const jobId = safeText(job.jobId || job.id, 'JC-0000');
    const jobDate = job.jobDate
        ? new Date(job.jobDate).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');
    const deliveryDate = job.deliveryDate
        ? new Date(job.deliveryDate).toLocaleDateString('en-GB')
        : 'Not Specified';

    const customerName = safeText(job.customer?.name || job.customer);
    const customerPhone = safeText(job.customer?.phone || job.customerPhone);
    const vehicleMakeModel = job.vehicle?.make
        ? `${safeText(job.vehicle.make)} ${safeText(job.vehicle.model, '')}`
        : safeText(job.vehicle);
    const licensePlate = safeText(job.vehicle?.licensePlate, 'NO-PLATE');

    const mechanicsList = Array.isArray(job.mechanics) && job.mechanics.length > 0
        ? job.mechanics.join(', ')
        : safeText(job.mechanic);

    const status = safeText(job.status, 'Pending Inspection');
    const customerRequests = safeText(job.customerRequests || job.notes, '');

    // 1. BACKGROUND TEMPLATE
    try {
        doc.addImage(letterheadBg, 'JPEG', 0, 0, 210, 297);
    } catch (e) {
        console.warn('Letterhead image error:', e);
    }

    // 2. RECEIPT META BAR (Shifted down to Y = 66 to give clear breathing room below disclaimer)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 66, 182, 8.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(188, 2, 2);
    doc.text(`SERVICE INVOICE & RECEIPT — #${jobId}`, 18, 71.5);

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Date: ${jobDate}  |  Status: ${status.toUpperCase()}`, 192, 71.5, { align: 'right' });

    // 3. CUSTOMER & VEHICLE BOXES (Shifted down to Y = 77.5)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 77.5, 89, 27, 1.5, 1.5, 'FD');
    doc.roundedRect(107, 77.5, 89, 27, 1.5, 1.5, 'FD');

    // Customer Information
    doc.setTextColor(188, 2, 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CUSTOMER / BILL TO', 18, 83);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(customerName, 18, 89);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Contact: ${customerPhone}`, 18, 95);
    doc.text(`Delivery Due: ${deliveryDate}`, 18, 100);

    // Vehicle Information
    doc.setTextColor(188, 2, 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('VEHICLE & WORKSHOP ALLOCATION', 111, 83);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(vehicleMakeModel, 111, 89);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Plate No: ${licensePlate}`, 111, 95);

    const splitMech = doc.splitTextToSize(`Mechanic: ${mechanicsList}`, 80);
    doc.text(splitMech, 111, 100);

    let currentY = 107.5;

    // 4. REPORTED ISSUES / CUSTOMER COMPLAINTS (IF PRESENT)
    if (customerRequests) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);

        const splitReqs = doc.splitTextToSize(customerRequests, 174);
        const reqBoxHeight = Math.max(10, splitReqs.length * 3.6 + 6);

        doc.roundedRect(14, currentY, 182, reqBoxHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(188, 2, 2);
        doc.text('REPORTED ISSUES & CUSTOMER REQUESTS:', 18, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(splitReqs, 18, currentY + 8.5);

        currentY += reqBoxHeight + 3;
    }

    // 5. EXTRACT & SEPARATE SERVICES AND SPARE PARTS
    const rawItems = Array.isArray(job.lineItems) && job.lineItems.length > 0
        ? job.lineItems
        : Array.isArray(job.items) && job.items.length > 0
            ? job.items
            : [];

    const serviceItems = rawItems.filter(i => (i.type || 'Service') === 'Service');
    const partItems = rawItems.filter(i => i.type === 'Part');

    const tableRows = [];
    let itemCounter = 1;

    const formatLKR = (val) =>
        `LKR ${(Number(val) || 0).toLocaleString('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    // Services rows
    if (serviceItems.length > 0) {
        tableRows.push([
            { content: 'SERVICES & LABOUR CHARGES', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }
        ]);
        serviceItems.forEach(item => {
            tableRows.push([
                itemCounter++,
                safeText(item.name, 'Labour Service'),
                formatLKR(item.rate)
            ]);
        });
    }

    // Parts rows
    if (partItems.length > 0) {
        tableRows.push([
            { content: 'REPLACED SPARE PARTS', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }
        ]);
        partItems.forEach(item => {
            tableRows.push([
                itemCounter++,
                safeText(item.name, 'Spare Part'),
                formatLKR(item.rate)
            ]);
        });
    }

    if (tableRows.length === 0) {
        tableRows.push(['1', 'General Mechanical Service & Repair', formatLKR(job.totalCost || 0)]);
    }

    autoTable(doc, {
        startY: currentY,
        head: [['#', 'Description of Services & Replaced Parts', 'Amount (LKR)']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [188, 2, 2],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            fillColor: [255, 255, 255],
            cellPadding: 2,
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 130 },
            2: { cellWidth: 40, halign: 'right' }
        }
    });

    let finalY = doc.lastAutoTable.finalY + 5;

    // 6. REMARKS & FINANCIAL TOTALS
    const subtotal = Number(job.subtotal) || Number(job.totalCost) || 0;
    const tax = Number(job.tax) || 0;
    const totalCost = Number(job.totalCost) || (subtotal + tax);

    // Workshop Remarks (Left)
    if (job.notes && String(job.notes).trim() !== '') {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, finalY, 100, 26, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(188, 2, 2);
        doc.text('WORKSHOP DIAGNOSIS & REMARKS:', 18, finalY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        const splitNotes = doc.splitTextToSize(String(job.notes).trim(), 92);
        doc.text(splitNotes, 18, finalY + 9);
    }

    // Totals Box (Right)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(118, finalY, 78, 26, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', 123, finalY + 6.5);
    doc.text(formatLKR(subtotal), 191, finalY + 6.5, { align: 'right' });

    doc.text('Tax (GST / VAT 18%):', 123, finalY + 12.5);
    doc.text(formatLKR(tax), 191, finalY + 12.5, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(123, finalY + 16, 191, finalY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(188, 2, 2);
    doc.text('Total Payable:', 123, finalY + 22);
    doc.text(formatLKR(totalCost), 191, finalY + 22, { align: 'right' });

    // 7. SIGNATURES
    const footerY = 265;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(18, footerY, 74, footerY);
    doc.line(136, footerY, 192, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Customer Signature', 46, footerY + 4.5, { align: 'center' });
    doc.text('Authorized Garage Stamp & Signature', 164, footerY + 4.5, { align: 'center' });

    // Download PDF
    doc.save(`DK_Automobile_Receipt_${jobId}.pdf`);
};