import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const { username, oldPassword, newPassword } = await request.json();
    
    if (!username || !oldPassword || !newPassword) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Find admin by username
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Verify old password
    if (!admin.authenticate(oldPassword)) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Update password
    admin.set('password', newPassword);
    await admin.save();
    
    return NextResponse.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update password' },
      { status: 500 }
    );
  }
} 