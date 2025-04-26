import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import { generateAndStorePDF } from '@/lib/google';
import { sendStatusUpdateNotification } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    
    const application = await Application.findById(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(application, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await request.json();
    
    // Get the current application
    const application = await Application.findById(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Create update object with status and other fields
    const updateData: { 
      status: string; 
      adminMessage?: string;
      statusUpdateDate?: Date;
      documentLink?: string | null;
    } = {
      status: data.status
    };
    
    // Add admin message if provided
    if (data.adminMessage) {
      updateData.adminMessage = data.adminMessage;
    }
    
    // Add status update date when approving or rejecting
    if (data.status === 'approved' || data.status === 'rejected') {
      updateData.statusUpdateDate = new Date();
      
      // Always regenerate the document for approved or rejected status changes
      // or if explicitly requested
      if (data.regenerateDocument || 
          data.status !== application.status || 
          !application.documentLink) {
        
        // Generate the document first with updated data
        const documentLink = await generateAndStorePDF({
          ...application.toObject(),
          status: data.status,
          adminMessage: data.adminMessage || application.adminMessage || '',
          statusUpdateDate: updateData.statusUpdateDate
        });
        
        // Add document link if generated successfully
        updateData.documentLink = documentLink;
      }
    }
    
    // Update the application in the database
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    // Send email notification to applicant after update is complete
    if (updatedApplication) {
      await sendStatusUpdateNotification(updatedApplication);
    }
    
    return NextResponse.json(updatedApplication, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
} 