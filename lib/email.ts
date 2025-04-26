import nodemailer from 'nodemailer';
import Application, { IApplication } from '@/models/Application';
import { generateAndStorePDF } from '@/lib/google';

// Email configuration
// For production, use proper SMTP credentials
// For development/testing, use services like Mailtrap or Ethereal
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

// Admin email addresses that should receive notifications
const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

// Function to send notification to admins when a new application is submitted
export async function sendNewApplicationNotification(application: IApplication) {
  if (!process.env.EMAIL_USER) {
    return;
  }

  const startDate = new Date(application.startDate).toLocaleDateString();
  const endDate = new Date(application.endDate).toLocaleDateString();
  
  try {
    const mailOptions = {
      from: `"Brikkhobondhon" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: adminEmails.join(','),
      subject: `New Leave Application from ${application.name}`,
      html: `
        <h2>New Leave Application Submitted</h2>
        <p><strong>Employee:</strong> ${application.name}</p>
        <p><strong>Department:</strong> ${application.department}</p>
        <p><strong>Designation:</strong> ${application.designation}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Phone:</strong> ${application.phoneNumber}</p>
        <p><strong>Leave Period:</strong> ${startDate} to ${endDate} (${application.days} day${application.days > 1 ? 's' : ''})</p>
        <p><strong>Reason:</strong> ${application.reason}</p>
        <p><strong>Comments:</strong> ${application.comments || 'None'}</p>
        <p>Please login to the admin dashboard to review this application.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Error handling remains but without logging
  }
}

// Function to send notification to employee when application status is updated
export async function sendStatusUpdateNotification(application: IApplication) {
  if (!process.env.EMAIL_USER) {
    return;
  }

  try {
    const statusText = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected'
    }[application.status];

    const startDate = new Date(application.startDate).toLocaleDateString();
    const endDate = new Date(application.endDate).toLocaleDateString();

    // Get the document link if available
    const docLink = application.documentLink;

    const mailOptions = {
      from: `"Brikkhobondhon" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: application.email,
      subject: `Leave Application Status Update: ${statusText}`,
      html: `
        <h2>Your Leave Application Status: ${statusText}</h2>
        <p><strong>Leave Period:</strong> ${startDate} to ${endDate} (${application.days} day${application.days > 1 ? 's' : ''})</p>
        <p><strong>Status:</strong> <span style="color: ${application.status === 'approved' ? 'green' : application.status === 'rejected' ? 'red' : 'orange'}">${statusText}</span></p>
        ${application.adminMessage ? `<p><strong>Message from Admin:</strong> ${application.adminMessage}</p>` : ''}
        
        ${docLink ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
          <p style="margin-bottom: 10px;"><strong>Here is your application document</strong></p>
          <a href="${docLink}" target="_blank" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Document</a>
        </div>
        ` : ''}
        
        <p>If you have any questions, please contact the HR department.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Error handling remains but without logging
  }
} 