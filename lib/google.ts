import { google } from 'googleapis';
import { IApplication } from '@/models/Application';

// Initialize the Google API client with service account
function getAuthClient() {
  try {
    // Get the service account credentials from environment variables
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentials) {
      throw new Error('Service account credentials not found');
    }
    
    // Parse the JSON credentials
    const parsedCredentials = JSON.parse(credentials);
    
    // Create a JWT client from the service account credentials
    const auth = new google.auth.JWT(
      parsedCredentials.client_email,
      undefined,
      parsedCredentials.private_key,
      [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ]
    );
    
    return auth;
  } catch (error) {
    throw error;
  }
}

// Format date as YYYYMMDDhhmmss
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function generateAndStorePDF(application: IApplication): Promise<string | null> {
  let documentId: string | null = null;
  
  try {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Load the template document
    const templateId = process.env.GOOGLE_TEMPLATE_DOC_ID;
    if (!templateId) {
      return null;
    }

    // Verify the template document exists and is accessible
    try {
      await docs.documents.get({ documentId: templateId });
    } catch (error) {
      return null;
    }

    // Create a copy of the template in Drive
    const driveResponse = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `Leave Application - ${application.name} - Temp`,
      },
    });

    documentId = driveResponse.data.id || null;
    if (!documentId) {
      return null;
    }

    // Prepare replacement data
    const startDate = new Date(application.startDate).toLocaleDateString();
    const endDate = new Date(application.endDate).toLocaleDateString();
    const statusDate = new Date(); // Current date when status was changed
    const statusType = application.status === 'approved' ? 'Approved' : 'Rejected';

    // Replace placeholders in the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: { text: '{{NAME}}', matchCase: true },
              replaceText: application.name,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{DEPARTMENT}}', matchCase: true },
              replaceText: application.department,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{DESIGNATION}}', matchCase: true },
              replaceText: application.designation,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{EMAIL}}', matchCase: true },
              replaceText: application.email,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{PHONE}}', matchCase: true },
              replaceText: application.phoneNumber,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{START_DATE}}', matchCase: true },
              replaceText: startDate,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{END_DATE}}', matchCase: true },
              replaceText: endDate,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{DAYS}}', matchCase: true },
              replaceText: String(application.days),
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{REASON}}', matchCase: true },
              replaceText: application.reason,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{ADMIN_MESSAGE}}', matchCase: true },
              replaceText: application.adminMessage || 'No message provided',
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{STATUS}}', matchCase: true },
              replaceText: statusType,
            },
          },
          {
            replaceAllText: {
              containsText: { text: '{{STATUS_DATE}}', matchCase: true },
              replaceText: statusDate.toLocaleDateString(),
            },
          },
        ],
      },
    });

    // Export and create PDF in Google Drive
    try {
      // Get the target folder ID
      const targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!targetFolderId) {
        if (documentId) {
          await drive.files.delete({ fileId: documentId });
        }
        return null;
      }
      
      // Generate a filename with format: YYYYMMDDhhmmss_NAME_STATUS.pdf
      const dateString = formatDateForFilename(statusDate);
      const cleanName = application.name.replace(/\s+/g, '_').toLowerCase();
      const filename = `${dateString}_${cleanName}_${application.status}.pdf`;
      
      // Copy the Google Doc to the target folder
      const copyResponse = await drive.files.copy({
        fileId: documentId,
        requestBody: {
          name: filename.replace('.pdf', ''), // Remove .pdf extension for the Doc
          parents: [targetFolderId],
        },
      });
      
      const finalDocId = copyResponse.data.id;
      if (!finalDocId) {
        if (documentId) {
          await drive.files.delete({ fileId: documentId });
        }
        return null;
      }
      
      // Get the webViewLink for the document
      const docFile = await drive.files.get({
        fileId: finalDocId,
        fields: 'webViewLink',
      });
      
      // Delete the original temporary document
      if (documentId) {
        await drive.files.delete({
          fileId: documentId,
        });
      }
      
      // Return the link to the document (which can be viewed as PDF in browser)
      const webViewLink = docFile.data.webViewLink;
      if (webViewLink) {
        // Convert the normal Doc view link to a PDF export link
        // Format: https://docs.google.com/document/d/ID/edit -> https://docs.google.com/document/d/ID/export?format=pdf
        const docId = webViewLink.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (docId) {
          const pdfLink = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
          return pdfLink;
        }
        return webViewLink;
      }
      
      return webViewLink || null;
    } catch (error) {
      // Cleanup the temporary document if it exists
      if (documentId) {
        try {
          const cleanupAuth = getAuthClient();
          const cleanupDrive = google.drive({ version: 'v3', auth: cleanupAuth });
          await cleanupDrive.files.delete({ fileId: documentId });
        } catch (cleanupError) {
          // Silently handle cleanup errors
        }
      }
      return null;
    }
  } catch (error) {
    // Cleanup the temporary document if it exists
    if (documentId) {
      try {
        // Create a new auth client and drive instance for cleanup
        const cleanupAuth = getAuthClient();
        const cleanupDrive = google.drive({ version: 'v3', auth: cleanupAuth });
        await cleanupDrive.files.delete({ fileId: documentId });
      } catch (cleanupError) {
        // Silently handle cleanup errors
      }
    }
    return null;
  }
} 