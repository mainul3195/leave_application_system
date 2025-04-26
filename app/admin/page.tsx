'use client';

import { useState, useEffect } from 'react';
import { IApplication } from '@/models/Application';

export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Admin dashboard state
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState({ 
    id: '', 
    processing: false, 
    message: 'Processing...' 
  });
  const [selectedApp, setSelectedApp] = useState<{id: string, status: string, adminMessage: string} | null>(null);
  const [showModal, setShowModal] = useState(false);
  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Notification modal state
  const [notification, setNotification] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });

  // Add viewReasonModal state
  const [viewReasonModal, setViewReasonModal] = useState(false);
  const [reasonApp, setReasonApp] = useState<IApplication | null>(null);

  // Check if user is already authenticated on load
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData && authData.username) {
          setIsAuthenticated(true);
          setUsername(authData.username);
        }
      } catch (e) {
        // Invalid stored auth data
        localStorage.removeItem('adminAuth');
      }
    }
  }, []);

  // Load applications after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  // Show a custom notification popup instead of browser alert
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      show: true,
      title,
      message,
      type
    });
    
    // Auto-hide notification after 4 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setAuthError('Please enter both username and password');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Store auth in localStorage
      localStorage.setItem('adminAuth', JSON.stringify({
        username: data.user.username,
        id: data.user.id
      }));
      
      // Update state
      setIsAuthenticated(true);
      setPassword(''); // Clear password for security
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAuthError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters');
      return;
    }
    
    setPasswordChangeLoading(true);
    setAuthError('');
    setPasswordChangeSuccess('');
    
    try {
      const response = await fetch('/api/auth/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }
      
      // Success handling
      setPasswordChangeSuccess('Password updated successfully!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Hide form after success
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordChangeSuccess('');
      }, 2000);
      
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setUsername('');
    setAuthError('');
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = (id: string, newStatus: string) => {
    // Get the application from the current list
    const app = applications.find(app => app._id?.toString() === id);
    if (!app) return;
    
    // Open modal with initial data
    setSelectedApp({
      id,
      status: newStatus,
      adminMessage: ''
    });
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    
    // Close modal first to prevent multiple clicks
    setShowModal(false);
    
    // Update the processing state with appropriate message
    const message = selectedApp.status === 'approved' || selectedApp.status === 'rejected'
      ? 'Generating document and updating status. Please wait...'
      : 'Updating status. Please wait...';
      
    setUpdateStatus({ id: selectedApp.id, processing: true, message });
    
    try {
      // Only regenerate document for approved or rejected status, not for reset to pending
      const regenerateDocument = selectedApp.status !== 'pending';
      
      const response = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: selectedApp.status,
          adminMessage: selectedApp.adminMessage,
          regenerateDocument: regenerateDocument // Only regenerate if not resetting to pending
        }),
      });

      if (response.ok) {
        const updatedApp = await response.json();
        
        // Update the local state
        setApplications(prev => 
          prev.map(app => 
            app._id?.toString() === selectedApp.id 
              ? { 
                  ...app, 
                  status: updatedApp.status,
                  adminMessage: updatedApp.adminMessage,
                  documentLink: updatedApp.documentLink
                } 
              : app
          )
        );
        
        // Show success notification instead of alert
        if (selectedApp.status === 'pending') {
          showNotification(
            'Status Reset',
            'Application status reset to pending successfully.',
            'success'
          );
        } else {
          showNotification(
            `Application ${updatedApp.status}`,
            `Application has been ${updatedApp.status} successfully. ${regenerateDocument ? 'Document has been generated and email notification sent to the applicant.' : ''}`,
            'success'
          );
        }
      } else {
        showNotification(
          'Update Failed',
          'Failed to update application status. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showNotification(
        'Error',
        'An error occurred while updating the application. Please try again.',
        'error'
      );
    } finally {
      setUpdateStatus({ id: '', processing: false, message: 'Processing...' });
    }
  };

  const handleRegenerateDocument = async (id: string) => {
    // Get the application from the current list
    const app = applications.find(app => app._id?.toString() === id);
    if (!app) return;
    
    setUpdateStatus({ 
      id, 
      processing: true, 
      message: 'Regenerating document. Please wait...' 
    });
    
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: app.status,
          adminMessage: app.adminMessage,
          regenerateDocument: true // Signal to regenerate the document
        }),
      });

      if (response.ok) {
        const updatedApp = await response.json();
        
        // Update the local state
        setApplications(prev => 
          prev.map(appItem => 
            appItem._id?.toString() === id 
              ? { 
                  ...appItem, 
                  documentLink: updatedApp.documentLink
                } 
              : appItem
          )
        );
        
        // Open the new document link in a new tab if available
        if (updatedApp.documentLink) {
          window.open(updatedApp.documentLink, '_blank');
        }
        
        // Show success notification
        showNotification(
          'Document Regenerated',
          'Document has been regenerated successfully.',
          'success'
        );
      } else {
        showNotification(
          'Regeneration Failed',
          'Failed to regenerate document. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showNotification(
        'Error',
        'An error occurred while regenerating the document. Please try again.',
        'error'
      );
    } finally {
      setUpdateStatus({ id: '', processing: false, message: 'Processing...' });
    }
  };

  // Add a function to open documents
  const openDocument = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  // Add a handler for viewing reason and comments
  const handleViewReason = (app: IApplication) => {
    setReasonApp(app);
    setViewReasonModal(true);
  };

  const downloadApplicationsAsPDF = async () => {
    try {
      setDownloadingPdf(true);
      showNotification('Download started', 'Generating PDF, please wait...', 'info');
      
      // Check if applications are loaded before proceeding
      if (!applications || applications.length === 0) {
        showNotification('No Data', 'There are no applications to download.', 'info');
        setDownloadingPdf(false);
        return;
      }
      
      const response = await fetch('/api/pdf/download', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to generate PDF');
      }
      
      // Create a blob from the PDF stream
      const blob = await response.blob();
      
      // Create a link element to trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `leave-applications-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Append to the document, click and cleanup
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the object URL
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      showNotification('Success', 'Applications report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showNotification(
        'Error', 
        `Failed to download applications report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {authError}
            </div>
          )}
          
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block mb-1">Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {authLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Admin panel with applications and password change feature
  return (
    <div className="space-y-8 relative">
      {updateStatus.processing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center">
            <div className="w-16 h-16 mb-4 relative">
              <svg className="animate-spin w-16 h-16 text-forest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing</h3>
            <p className="text-gray-600">{updateStatus.message}</p>
            <p className="text-sm text-gray-500 mt-4">Please wait, this may take a moment...</p>
          </div>
        </div>
      )}
      
      {/* Custom notification popup */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotification(prev => ({ ...prev, show: false }))}></div>
          <div className={`bg-white rounded-xl p-4 md:p-6 shadow-xl max-w-md w-full mx-4 z-10 border-l-4 modal-animation ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
          }`}>
            <div className="flex items-start mb-3 md:mb-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 mr-3 md:mr-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'success' ? 'bg-green-100 text-green-500' :
                notification.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
              }`}>
                {notification.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-base md:text-lg font-semibold ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {notification.title}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-gray-600">{notification.message}</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 ml-2 md:ml-4"
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex justify-end mt-2 md:mt-4">
              <button 
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-medium text-white ${
                  notification.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-forest-dark">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-forest opacity-80">Manage leave applications for Brikkhobondhon</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <button
              onClick={downloadApplicationsAsPDF}
              disabled={downloadingPdf || loading}
              className={`bg-forest text-white hover:bg-forest-dark font-medium py-1 px-2 md:py-1.5 md:px-3 rounded-lg transition-colors flex items-center text-xs md:text-sm ${
                (downloadingPdf || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {downloadingPdf ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download Applications
                </>
              )}
            </button>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="bg-white text-forest-dark border border-forest/20 hover:bg-forest/5 font-medium py-1 px-2 md:py-1.5 md:px-3 rounded-lg transition-colors flex items-center text-xs md:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Change Password
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2 md:py-1.5 md:px-3 rounded-lg transition-colors flex items-center text-xs md:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {showPasswordForm && (
        <div className="glass-card">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-forest-dark">Change Password</h2>
          
          {authError && (
            <div className="bg-red-50/80 border border-red-100 text-red-800 px-3 py-2 md:px-4 md:py-3 rounded-lg mb-3 md:mb-4 flex items-center text-xs md:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-1 md:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{authError}</span>
            </div>
          )}
          
          {passwordChangeSuccess && (
            <div className="bg-green-50/80 border border-green-100 text-green-800 px-3 py-2 md:px-4 md:py-3 rounded-lg mb-3 md:mb-4 flex items-center text-xs md:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-1 md:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{passwordChangeSuccess}</span>
            </div>
          )}
          
          <form onSubmit={handlePasswordChange} className="space-y-3 md:space-y-4">
            <div>
              <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-forest-dark">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/50 border border-forest/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/30 transition text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-forest-dark">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/50 border border-forest/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/30 transition text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-forest-dark">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/50 border border-forest/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/30 transition text-sm"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2 md:space-x-3 pt-1 md:pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setAuthError('');
                  setPasswordChangeSuccess('');
                }}
                className="btn-secondary text-xs md:text-sm py-1.5 px-2 md:py-2 md:px-3"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={passwordChangeLoading}
                className="btn-primary flex items-center text-xs md:text-sm py-1.5 px-2 md:py-2 md:px-3"
              >
                {passwordChangeLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 md:h-4 md:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Applications List */}
      {loading ? (
        <div className="glass-card flex justify-center items-center py-8 md:py-16">
          <div className="animate-bounce flex items-center space-x-2">
            <svg className="animate-spin w-4 h-4 md:w-6 md:h-6 text-forest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-forest-dark text-sm md:text-lg">Loading applications...</span>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card text-center py-8 md:py-16">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-forest/10 rounded-full mx-auto flex items-center justify-center mb-3 md:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 text-forest-dark">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-lg md:text-xl font-medium text-forest-dark">No applications found</p>
          <p className="text-sm md:text-base text-forest mt-1 md:mt-2">There are no leave applications to review at this time.</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="glass-card p-0 md:p-4">
            <div className="mobile-table-wrapper">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10">Name</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10 hidden sm:table-cell">Department</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10">Dates</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10 hidden sm:table-cell">Days</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10">Status</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10 hidden md:table-cell">Applied On</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10 hidden sm:table-cell">Reason</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10 hidden sm:table-cell">Document</th>
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="table-row-hover">
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5">
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-xs md:text-sm text-forest/70">{app.email}</div>
                        <div className="text-xs md:text-sm text-forest/70 sm:hidden">{app.department}</div>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden sm:table-cell">
                        <div>{app.department}</div>
                        <div className="text-xs md:text-sm text-forest/70">{app.designation}</div>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5">
                        <div className="text-xs md:text-sm">{new Date(app.startDate).toLocaleDateString()}</div>
                        {app.startDate !== app.endDate && (
                          <div className="text-xs text-forest/70">to {new Date(app.endDate).toLocaleDateString()}</div>
                        )}
                        <div className="text-xs text-forest/70 sm:hidden">{app.days} day(s)</div>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden sm:table-cell">
                        {app.days || '-'}
                        {app.days === 0.5 && app.halfDayType && (
                          <span className="ml-1 text-xs text-forest/70">
                            ({app.halfDayType === 'first' ? 'Morning' : 'Afternoon'})
                          </span>
                        )}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5">
                        <span className={`status-badge text-xs ${
                          app.status === 'approved' ? 'status-badge-approved' : 
                          app.status === 'rejected' ? 'status-badge-rejected' : 'status-badge-pending'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        
                        {/* Show processing status if this application is being updated */}
                        {updateStatus.id === app._id?.toString() && updateStatus.processing && (
                          <div className="mt-1 text-xs text-forest-dark flex items-center">
                            <svg className="animate-spin w-2 h-2 md:w-3 md:h-3 mr-1 text-forest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs truncate">{updateStatus.message}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden md:table-cell">
                        {app.createdAt ? (
                          <div>
                            <div className="text-xs md:text-sm">{new Date(app.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-forest/70">{new Date(app.createdAt).toLocaleTimeString()}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden sm:table-cell">
                        <button 
                          onClick={() => handleViewReason(app)}
                          className="text-forest hover:text-forest-dark underline transition-colors flex items-center text-xs"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View
                        </button>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden sm:table-cell">
                        {app.documentLink ? (
                          <div className="space-y-1">
                            <a 
                              href={app.documentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-forest hover:text-forest-dark underline transition-colors flex items-center text-xs"
                              onClick={(e) => openDocument(e, app.documentLink!)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              View
                            </a>
                            {(app.status === 'approved' || app.status === 'rejected') && (
                            <button 
                                onClick={() => handleRegenerateDocument(app._id?.toString() || '')}
                                className={`text-xs text-forest hover:text-forest-dark flex items-center ${updateStatus.processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={updateStatus.processing}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2 h-2 md:w-3 md:h-3 mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                Regenerate
                            </button>
                          )}
                          </div>
                        ) : (
                          <span className="text-forest/50 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5">
                        <div className="flex flex-col gap-1">
                          {app.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleStatusAction(app._id?.toString() || '', 'approved')}
                                className={`bg-green-300 text-green-800 hover:bg-green-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium transition-colors flex items-center ${updateStatus.processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={updateStatus.processing}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="whitespace-nowrap">Approve</span>
                              </button>
                              <button
                                onClick={() => handleStatusAction(app._id?.toString() || '', 'rejected')}
                                className={`bg-red-100 text-red-800 hover:bg-red-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium transition-colors flex items-center ${updateStatus.processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={updateStatus.processing}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="whitespace-nowrap">Reject</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStatusAction(app._id?.toString() || '', 'pending')}
                              className={`bg-amber-100 text-amber-800 hover:bg-amber-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium transition-colors flex items-center ${updateStatus.processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={updateStatus.processing}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="whitespace-nowrap">Reset</span>
                            </button>
                          )}

                          {/* Mobile-only action buttons for document and reason */}
                          <div className="flex flex-wrap gap-1 sm:hidden mt-1">
                            <button 
                              onClick={() => handleViewReason(app)}
                              className="bg-gray-100 text-forest-dark hover:bg-gray-200 px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5 mr-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Reason
                            </button>
                            {app.documentLink && (
                              <a 
                                href={app.documentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-forest/10 text-forest-dark hover:bg-forest/20 px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center"
                                onClick={(e) => openDocument(e, app.documentLink!)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5 mr-0.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                Doc
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl p-4 md:p-6 modal-animation" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                {selectedApp.status === 'approved' 
                  ? 'Approve Leave Application' 
                  : selectedApp.status === 'rejected'
                    ? 'Reject Leave Application'
                    : 'Reset Leave Application Status'
                }
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-3 md:mb-4">
              <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700">
                {selectedApp.status === 'approved' || selectedApp.status === 'rejected' 
                  ? 'Admin Message (Optional)'
                  : 'Reason for Status Reset (Optional)'
                }
              </label>
              <textarea
                value={selectedApp.adminMessage}
                onChange={(e) => setSelectedApp({...selectedApp, adminMessage: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/30 transition text-sm"
                placeholder={selectedApp.status === 'approved' 
                  ? 'Add any additional information for the approval...' 
                  : selectedApp.status === 'rejected'
                    ? 'Provide a reason for rejection...'
                    : 'Explain why you are resetting the status...'
                }
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2 md:space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-xs md:text-sm"
              >
                Cancel
              </button>
              
              <button
                onClick={handleStatusUpdate}
                className={`flex items-center ${
                  selectedApp.status === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : selectedApp.status === 'rejected'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                } font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-xs md:text-sm`}
              >
                {selectedApp.status === 'approved' 
                  ? 'Approve' 
                  : selectedApp.status === 'rejected'
                    ? 'Reject'
                    : 'Reset Status'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      {viewReasonModal && reasonApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl p-4 md:p-6 modal-animation" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Leave Application Details</h2>
              <button 
                onClick={() => setViewReasonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 md:space-y-4 text-sm md:text-base">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-500">Reason for Leave</h3>
                <p className="mt-1 text-gray-800">{reasonApp.reason}</p>
              </div>
              
              {reasonApp.comments && (
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-gray-500">Additional Comments</h3>
                  <p className="mt-1 text-gray-800">{reasonApp.comments}</p>
                </div>
              )}
              
              {reasonApp.adminMessage && (
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-gray-500">Admin Message</h3>
                  <p className="mt-1 text-gray-800">{reasonApp.adminMessage}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4 md:mt-6">
              <button
                onClick={() => setViewReasonModal(false)}
                className="bg-forest hover:bg-forest-dark text-white font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-xs md:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 