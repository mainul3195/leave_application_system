import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin, { initializeDefaultAdmin } from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Initialize default admin if none exists
    await initializeDefaultAdmin();
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!body.username || !body.password) {
      return NextResponse.json(
        { message: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // Find admin by username
    const admin = await Admin.findOne({ username: body.username });
    
    // Verify credentials
    if (!admin || !admin.authenticate(body.password)) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Authentication successful
    return NextResponse.json({
      user: {
        username: admin.username,
        id: admin._id
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 500 }
    );
  }
} 