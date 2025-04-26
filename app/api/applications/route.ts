import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Application from '@/models/Application';
import { sendNewApplicationNotification } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Never cache this route

export async function GET() {
  try {
    // Ensure fresh connection
    await dbConnect();
    
    // Add a small delay to ensure connection is fully established
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Count first to verify connection is working
    const count = await Application.countDocuments();
    console.log(`Application count in GET: ${count}`);
    
    // Get all applications with explicit sort by creation date
    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`Returning ${applications.length} applications`);
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch applications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const data = await request.json();
    
    // Parse date strings into Date objects
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }
    
    const newApplication = await Application.create(data);
    
    // Send notification to admin
    await sendNewApplicationNotification(newApplication);
    
    return NextResponse.json(newApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create application',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 