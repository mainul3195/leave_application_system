import mongoose, { Schema } from 'mongoose';

export interface IApplication {
  _id?: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phoneNumber: string;
  startDate: Date;
  endDate: Date;
  days: number; // Total days (can be 0.5 for half-day)
  halfDayType: 'first' | 'second' | null; // Morning or afternoon half
  reason: string;
  comments: string;
  status: 'pending' | 'approved' | 'rejected';
  adminMessage: string; // Message from admin when approving/rejecting
  statusUpdateDate?: Date; // Date when status was last updated
  documentLink?: string; // Link to the generated document
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 }, // Allow half-day (0.5)
    halfDayType: { 
      type: String, 
      enum: ['first', 'second', null], 
      default: null,
      required: function(this: IApplication) {
        return this.days === 0.5; // Required only if it's a half day
      }
    },
    reason: { type: String, required: true },
    comments: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    adminMessage: { type: String, default: '' }, // Admin message when approving/rejecting
    statusUpdateDate: { type: Date }, // When status was last updated
    documentLink: { type: String }, // Link to the generated document
  },
  { timestamps: true }
);

export default mongoose.models.Application || 
  mongoose.model<IApplication>('Application', ApplicationSchema); 