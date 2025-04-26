import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Application from '@/models/Application';

export const maxDuration = 60; // Extend serverless function timeout to 60 seconds

export const dynamic = 'force-dynamic'; // Never cache this route

export async function GET(req: NextRequest) {
  try {
    // Force connection to reset to ensure fresh connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    // Ensure database connection is properly established
    await dbConnect();
    
    // Add a longer delay to ensure connection is fully ready (especially for Vercel)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // First count applications to verify connection is working
    const count = await Application.countDocuments().exec();
    console.log(`Application count before fetch: ${count}`);
    
    // Fetch all applications with explicit projection and without lean for better reliability
    const applications = await Application.find({})
      .sort({ createdAt: -1 })
      .exec();
    
    // Convert to plain objects for processing
    const plainApplications = applications.map(app => app.toObject());
    
    // Log the number of applications found (helps with debugging)
    console.log(`Found ${plainApplications.length} applications for PDF generation`);
    
    if (!plainApplications || plainApplications.length === 0) {
      return NextResponse.json(
        { message: 'No applications found to generate PDF' },
        { status: 200 }
      );
    }
    
    // Create a new PDF document (A4 format in landscape mode for more space)
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add title and date
    const now = new Date();
    doc.setFontSize(18);
    doc.text('Leave Applications Report', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 
             doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Total applications: ${plainApplications.length}`, 
             doc.internal.pageSize.width / 2, 26, { align: 'center' });
    
    // Prepare table data
    const tableData = plainApplications.map(app => {
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
      let daysText = '';
      if (app.days === 0.5) {
        const halfDayPeriod = app.halfDayType === 'first' ? 'Morning' : 'Afternoon';
        daysText = `${app.days} (${halfDayPeriod})`;
      } else {
        daysText = app.days ? app.days.toString() : '—';
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
        3: { cellWidth: 40 },     // Days column (increased width for half-day info)
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
    
    // Close database connection to free resources
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    
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
    
    // Try to close database connection if there was an error
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF report', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 