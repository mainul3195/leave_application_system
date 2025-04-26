import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Fetch all applications
    const applications = await Application.find().sort({ createdAt: -1 });
    
    // Create a new PDF document (A4 format in landscape mode for more space)
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add title and date
    const now = new Date();
    doc.setFontSize(18);
    doc.text('Leave Applications Report', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 
             doc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    // Prepare table data
    const tableData = applications.map(app => {
      // Format dates
      const startDateFormatted = new Date(app.startDate).toLocaleDateString();
      const endDateFormatted = new Date(app.endDate).toLocaleDateString();
      
      // Format createdAt with date and time
      const createdAtDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—';
      const createdAtTime = app.createdAt ? new Date(app.createdAt).toLocaleTimeString() : '';
      const createdAtFormatted = app.createdAt ? `${createdAtDate}\n${createdAtTime}` : '—';
      
      // Display date range or single date
      const datesText = startDateFormatted === endDateFormatted 
        ? startDateFormatted 
        : `${startDateFormatted}\nto ${endDateFormatted}`;
      
      // Format days with half-day type if applicable
      let daysText = app.days ? app.days.toString() : '—';
      if (app.days === 0.5 && app.halfDayType) {
        daysText += ` (${app.halfDayType === 'first' ? 'Morning' : 'Afternoon'})`;
      }
      
      // Status with first letter capitalized
      const status = app.status.charAt(0).toUpperCase() + app.status.slice(1);
      
      // Format name with contact details
      const nameWithContacts = `${app.name || '—'}\n${app.email || ''}\n${app.phoneNumber || ''}`;
      
      // Format department with designation
      const deptWithDesignation = `${app.department || '—'}\n${app.designation || ''}`;
      
      return [
        nameWithContacts,
        deptWithDesignation,
        datesText,
        daysText,
        createdAtFormatted,
        status
      ];
    });
    
    // Add the table to the PDF
    autoTable(doc, {
      head: [['Name', 'Department', 'Dates', 'Days', 'Applied On', 'Status']],
      body: tableData,
      startY: 30,
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249]
      },
      margin: { top: 30 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Name column
        1: { cellWidth: 'auto' }, // Department column
        2: { cellWidth: 'auto' }, // Dates column
        3: { cellWidth: 30 },     // Days column (fixed width)
        4: { cellWidth: 'auto' }, // Applied On column
        5: { cellWidth: 30 }      // Status column (fixed width)
      },
      // Allow line breaks in cells
      didParseCell: function(data) {
        data.cell.styles.cellPadding = 3;
        if (data.row.index === 0) { // Header row
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      didDrawCell: function(data) {
        // Add style for status column
        if (data.section === 'body' && data.column.index === 5) {
          const status = data.cell.raw?.toString().toLowerCase() || 'pending';
          if (status === 'approved') {
            doc.setFillColor(209, 250, 229); // Light green
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(6, 95, 70); // Dark green
          } else if (status === 'rejected') {
            doc.setFillColor(254, 226, 226); // Light red
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(153, 27, 27); // Dark red
          } else if (status === 'pending') {
            doc.setFillColor(254, 243, 199); // Light yellow
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(146, 64, 14); // Dark amber
          }
          
          // Re-draw the text since we changed the background
          doc.setFontSize(9);
          doc.text(
            data.cell.raw?.toString() || status, 
            data.cell.x + (data.cell.styles.cellPadding as number), 
            data.cell.y + data.cell.height / 2, 
            { baseline: 'middle' }
          );
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
        }
      }
    });
    
    // Convert the PDF to a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="leave-applications-report-${now.toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
} 