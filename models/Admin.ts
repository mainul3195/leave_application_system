import mongoose, { Schema, Document } from 'mongoose';
import * as CryptoJS from 'crypto-js';

export interface IAdmin extends Document {
  username: string;
  salt: string;
  hashed_password: string;
  _password?: string;
  authenticate: (plainText: string) => boolean;
  encryptPassword: (password: string) => string;
  makeSalt: () => string;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    salt: {
      type: String,
      required: true
    },
    hashed_password: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Virtual password setter
AdminSchema.virtual('password')
  .set(function(this: IAdmin, password: string) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  });

// Authentication methods
AdminSchema.methods = {
  authenticate(plainText: string): boolean {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  
  encryptPassword(password: string): string {
    if (!password) return '';
    try {
      return CryptoJS.HmacSHA256(password, this.salt).toString();
    } catch (err) {
      return '';
    }
  },
  
  makeSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
};

// Use mongoose.models if it exists (for Next.js HMR) or create a new model
const Admin = mongoose.models.Admin as mongoose.Model<IAdmin> || 
  mongoose.model<IAdmin>('Admin', AdminSchema);

// Default admin creation function
export async function initializeDefaultAdmin() {
  try {
    // Check if admin already exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      // Create default admin if none exists
      await Admin.create({
        username: 'admin',
        password: 'admin123'
      });
    }
  } catch (error) {
    // Silently handle any errors during initialization
  }
}

export default Admin; 