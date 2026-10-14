import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateJobReceipt = (job) => {
    const doc = new jsPDF();

    // Safely sanitize strings before rendering into the PDF
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
    const mechanic = safeText(job.mechanic);
    const status = safeText(job.status, 'Pending Inspection');

    // --- 1. HEADER BANNER ---
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('DK GARAGE OS', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('Official Service & Repair Receipt', 14, 25);
    doc.text('Generated Securely via Garage Management System', 14, 31);

    // Right-side Receipt Meta
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`RECEIPT #${jobId}`, 196, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${jobDate}`, 196, 25, { align: 'right' });
    doc.text(`Status: ${status.toUpperCase()}`, 196, 31, { align: 'right' });

    // --- 2. CUSTOMER & VEHICLE INFO BOXES ---
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(14, 45, 88, 34, 2, 2, 'FD');
    doc.roundedRect(108, 45, 88, 34, 2, 2, 'FD');

    // Left Box: Customer Details
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILL TO (CUSTOMER)', 18, 52);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(customerName, 18, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Phone: ${customerPhone}`, 18, 67);
    doc.text(`Delivery Due: ${deliveryDate}`, 18, 73);

    // Right Box: Vehicle Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VEHICLE & SERVICE DETAILS', 112, 52);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`${vehicleMakeModel}`, 112, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`License Plate: ${licensePlate}`, 112, 67);
    doc.text(`Assigned Mechanic: ${mechanic}`, 112, 73);

    // --- 3. SERVICES & SPARE PARTS TABLE ---
    const lineItems = Array.isArray(job.lineItems) ? job.lineItems : [];
    const tableRows =
        lineItems.length > 0
            ? lineItems.map((item, index) => [
                index + 1,
                safeText(item.name, 'Service Item'),
                safeText(item.type, 'Service'),
                `LKR ${(Number(item.rate) || 0).toLocaleString('en-LK', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
            ])
            : [['1', 'Standard Inspection / General Service', 'Service', 'LKR 0.00']];

    autoTable(doc, {
        startY: 86,
        head: [['#', 'Description', 'Category', 'Amount (LKR)']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59], // Slate-800
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [30, 41, 59],
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 98 },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 37, halign: 'right' },
        },
    });

    let finalY = doc.lastAutoTable.finalY + 8;

    // --- 4. DIAGNOSTIC NOTES (LEFT) & FINANCIAL SUMMARY (RIGHT) ---
    const subtotal = Number(job.subtotal) || 0;
    const tax = Number(job.tax) || 0;
    const totalCost = Number(job.totalCost) || subtotal + tax;

    // Repair Notes on the left
    if (job.notes && String(job.notes).trim() !== '') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('MECHANIC / DIAGNOSTIC NOTES:', 14, finalY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitNotes = doc.splitTextToSize(String(job.notes).trim(), 95);
        doc.text(splitNotes, 14, finalY + 10);
    }

    // Financial Breakdown Box on the right
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(120, finalY, 76, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', 125, finalY + 8);
    doc.text(
        `LKR ${subtotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
        191,
        finalY + 8,
        { align: 'right' }
    );

    doc.text('Tax (GST 18%):', 125, finalY + 15);
    doc.text(
        `LKR ${tax.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
        191,
        finalY + 15,
        { align: 'right' }
    );

    doc.setDrawColor(203, 213, 225);
    doc.line(125, finalY + 19, 191, finalY + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Final Total:', 125, finalY + 26);
    doc.text(
        `LKR ${totalCost.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
        191,
        finalY + 26,
        { align: 'right' }
    );

    // --- 5. SIGNATURE & FOOTER ---
    const footerY = 265;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, footerY, 74, footerY);
    doc.line(136, footerY, 196, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Customer Signature', 44, footerY + 5, { align: 'center' });
    doc.text('Authorized Garage Stamp', 166, footerY + 5, { align: 'center' });

    doc.setFontSize(8);
    doc.text(
        'Thank you for choosing our workshop! Please retain this receipt for warranty claims.',
        105,
        285,
        { align: 'center' }
    );

    // Save the PDF and open print-ready view in a new tab
    doc.save(`Receipt-${jobId}.pdf`);
};