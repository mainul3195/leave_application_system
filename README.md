# Leave Application Management System

A comprehensive web application built for Brikkhobondhon to manage employee leave applications with mobile-responsive design and automated document generation.

## Features

- **Employee Features**:
  - View and track personal leave applications
  - Submit new leave applications through an intuitive form
  - View application status (pending, approved, rejected)
  - Access approval/rejection documents
  
- **Admin Features**:
  - Secure admin dashboard with authentication
  - Approve or reject leave applications
  - Add comments when approving/rejecting applications
  - Reset application status if needed
  - View detailed information including reasons for leave
  - Download all applications as a PDF report
  - Regenerate documents for approved/rejected applications
  - Change admin password

- **Notifications**:
  - Email notifications for new applications
  - Status update notifications with document attachments
  
- **Document Generation**:
  - Automatic PDF generation for approved/rejected applications
  - Google Drive integration for document storage
  - Branded documents with application details

## Tech Stack

- **Frontend**:
  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Mobile-responsive design

- **Backend**:
  - Next.js API Routes
  - MongoDB with Mongoose
  - Nodemailer for email notifications
  - Google Drive API for document storage

## Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

All features, including the admin dashboard and application forms, are optimized for various screen sizes.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file in the root of your project with these variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   
   # Email Configuration (required for notifications)
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@example.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=leave-system@yourcompany.com
   
   # Comma-separated list of admin email addresses to receive notifications
   ADMIN_EMAILS=admin1@example.com,admin2@example.com
   
   # Admin credentials (initial setup)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure_password
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js app router pages and API routes
  - `/app/page.tsx` - Homepage showing all applications for the user
  - `/app/apply/page.tsx` - Application form for new leave requests
  - `/app/admin/page.tsx` - Admin dashboard for managing applications
  - `/app/api` - API endpoints for data operations
  
- `/models` - MongoDB schema definitions
  - `/models/Application.ts` - Schema for leave applications
  
- `/lib` - Utility functions and services
  - `/lib/db.ts` - Database connection utilities
  - `/lib/email.ts` - Email sending functions
  - `/lib/google.ts` - Google Drive integration for document generation

## Deployment

The application can be deployed to various platforms:

- **Vercel** (Recommended for Next.js apps):
  1. Connect your GitHub repository to Vercel
  2. Configure environment variables in the Vercel dashboard
  3. Deploy with a single click

- **Traditional Hosting**:
  1. Build the application: `npm run build`
  2. Start the server: `npm start`

## Google Drive Integration

This application includes the ability to generate PDF documents when leave applications are approved or rejected:

1. When an admin approves or rejects an application, a PDF document is automatically generated
2. The PDF is stored in Google Drive with the format `YYYYMMDD_name_status.pdf`
3. A link to the PDF is included in the email notification sent to the employee

### Google Drive Setup

There are two ways to set up Google Drive integration:

1. **Using OAuth 2.0 (requires verification)**: Follow the [Google Integration Setup Guide](./docs/google_integration_setup.md)

2. **Using a Service Account (recommended)**: Follow the [Service Account Setup Guide](./docs/service_account_setup.md)

A sample Google Doc template is available in [docs/google_doc_template.md](./docs/google_doc_template.md)

## Environment Variables

The application uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP server port
- `EMAIL_SECURE`: Whether to use TLS (true/false)
- `EMAIL_USER`: SMTP username/email
- `EMAIL_PASSWORD`: SMTP password or app password
- `EMAIL_FROM`: Sender email address
- `ADMIN_EMAILS`: Comma-separated list of admin emails
- `ADMIN_USERNAME`: Initial admin username (for first setup)
- `ADMIN_PASSWORD`: Initial admin password (for first setup)

If using OAuth 2.0 for Google Drive:
- `GOOGLE_CLIENT_ID`: OAuth 2.0 client ID for Google API
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 client secret for Google API
- `GOOGLE_REDIRECT_URI`: Redirect URI for OAuth 2.0 flow
- `GOOGLE_REFRESH_TOKEN`: OAuth 2.0 refresh token

If using a Service Account for Google Drive (recommended):
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Service account credentials JSON as a single line

Common for both approaches:
- `GOOGLE_TEMPLATE_DOC_ID`: ID of the Google Docs template
- `GOOGLE_DRIVE_FOLDER_ID`: ID of the Google Drive folder to store PDFs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Brikkhobondhon for the opportunity to develop this application
- The Next.js team for their excellent framework
- Contributors to the various libraries used in this project 