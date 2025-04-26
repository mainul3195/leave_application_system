'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IApplication } from '@/models/Application';

export default function Home() {
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          setApplications(data);
        }
      } catch (error) {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleViewReason = (app: IApplication) => {
    setSelectedApp(app);
    setShowReasonModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="glass-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-forest-dark">Leave Applications</h1>
            <p className="text-forest mt-1 opacity-80">Manage your leave requests for Brikkhobondhon</p>
          </div>
          <Link href="/apply" className="btn-primary flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex justify-center items-center py-12">
          <div className="animate-bounce flex items-center space-x-2">
            <svg className="animate-spin w-5 h-5 text-forest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-forest-dark">Loading applications...</span>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-leaf/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-leaf-dark">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-forest-dark">No applications found</p>
          <p className="text-forest mt-1 opacity-80">Be the first to apply for a leave!</p>
          <Link href="/apply" className="btn-primary mt-6">
            Apply Now
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 text-left border-b border-forest/10">Name</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Department</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Dates</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Days</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Status</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Applied On</th>
                  <th className="py-3 px-4 text-left border-b border-forest/10">Document</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id?.toString()} className="table-row-hover">
                    <td className="py-3 px-4 border-b border-forest/5">
                      <div className="font-medium text-gray-900">{app.name}</div>
                      <div className="text-sm text-forest/70">{app.email}</div>
                      <div className="text-sm text-forest/70">{app.phoneNumber}</div>
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      <div>{app.department}</div>
                      <div className="text-sm text-forest/70">{app.designation}</div>
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      <div>{new Date(app.startDate).toLocaleDateString()}</div>
                      {app.startDate !== app.endDate && (
                        <div className="text-sm text-forest/70">to {new Date(app.endDate).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      {app.days || '-'}
                      {app.days === 0.5 && app.halfDayType && (
                        <span className="ml-1 text-xs text-forest/70">
                          ({app.halfDayType === 'first' ? 'Morning' : 'Afternoon'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      <span className={`status-badge ${
                        app.status === 'approved' ? 'status-badge-approved' : 
                        app.status === 'rejected' ? 'status-badge-rejected' : 'status-badge-pending'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      {app.createdAt ? (
                        <div>
                          <div>{new Date(app.createdAt).toLocaleDateString()}</div>
                          <div className="text-sm text-forest/70">{new Date(app.createdAt).toLocaleTimeString()}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 border-b border-forest/5">
                      {app.status !== 'pending' ? (
                        app.documentLink ? (
                          <a 
                            href={app.documentLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-forest hover:text-forest-dark underline transition-colors flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            View
                          </a>
                        ) : (
                          <span className="text-forest/50 text-sm">
                            No document
                          </span>
                        )
                      ) : (
                        <span className="text-forest/50 text-sm">
                          Waiting for response
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      {showReasonModal && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Leave Application Details</h2>
              <button 
                onClick={() => setShowReasonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reason for Leave</h3>
                <p className="mt-1 text-gray-800">{selectedApp.reason}</p>
              </div>
              
              {selectedApp.comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Additional Comments</h3>
                  <p className="mt-1 text-gray-800">{selectedApp.comments}</p>
                </div>
              )}
              
              {selectedApp.adminMessage && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Admin Message</h3>
                  <p className="mt-1 text-gray-800">{selectedApp.adminMessage}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowReasonModal(false)}
                className="bg-forest hover:bg-forest-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
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