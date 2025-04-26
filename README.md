# Leave Application Management System

A simple web application built with Next.js and MongoDB to manage leave applications in an organization.

## Features

- View all leave applications on the homepage
- Submit new leave applications via a form
- Admin page to approve or reject applications
- Track application status (pending, approved, rejected)
- Email notifications for new applications and status updates

## Tech Stack

- Next.js 14 (App Router)
- MongoDB with Mongoose
- TypeScript
- Tailwind CSS
- Nodemailer for email notifications

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
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/models` - MongoDB schema definitions
- `/lib` - Database connection utilities and email functions
- `.env.local` - Environment variables (not tracked in git)

## How to Use

1. **Homepage**: View all leave applications
2. **Apply page**: Fill out the form to submit a new leave application
3. **Admin page**: View all applications, approve or reject applications

## Email Notifications

The system sends email notifications in the following scenarios:

1. When a new leave application is submitted:
   - All admin email addresses specified in ADMIN_EMAILS receive a notification

2. When an application status is updated (approved/rejected):
   - The employee who submitted the application receives a notification

## Email Configuration Tips

- For Gmail, you'll need to use an "App Password" rather than your regular password
- For testing, you can use services like [Mailtrap](https://mailtrap.io/) or [Ethereal Email](https://ethereal.email/)
- Make sure your SMTP server allows sending emails from your application

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