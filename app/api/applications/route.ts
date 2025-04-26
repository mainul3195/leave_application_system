import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import { sendNewApplicationNotification } from '@/lib/email';

export async function GET() {
  try {
    await dbConnect();
    const applications = await Application.find().sort({ createdAt: -1 });
    
    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
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
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
} 