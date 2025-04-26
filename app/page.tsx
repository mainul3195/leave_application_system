'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IApplication } from '@/models/Application';

export default function Home() {
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-forest-dark">Leave Applications</h1>
            <p className="text-sm md:text-base text-forest mt-1 opacity-80">Manage your leave requests for Brikkhobondhon</p>
          </div>
          <Link href="/apply" className="btn-primary flex items-center space-x-2 text-sm md:text-base py-1.5 px-3 md:py-2 md:px-4 self-start sm:self-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex justify-center items-center py-8 md:py-12">
          <div className="animate-bounce flex items-center space-x-2">
            <svg className="animate-spin w-4 h-4 md:w-5 md:h-5 text-forest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm md:text-base text-forest-dark">Loading applications...</span>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-10 md:py-16 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-leaf/20 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 text-leaf-dark">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-base md:text-lg font-medium text-forest-dark">No applications found</p>
          <p className="text-sm md:text-base text-forest mt-1 opacity-80">Be the first to apply for a leave!</p>
          <Link href="/apply" className="btn-primary mt-4 md:mt-6 text-sm md:text-base py-1.5 px-3 md:py-2 md:px-4">
            Apply Now
          </Link>
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
                    <th className="py-2 md:py-3 px-2 md:px-4 text-left border-b border-forest/10">Document</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id?.toString()} className="table-row-hover">
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
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5 hidden md:table-cell">
                        {app.createdAt ? (
                          <div>
                            <div className="text-xs md:text-sm">{new Date(app.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-forest/70">{new Date(app.createdAt).toLocaleTimeString()}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 border-b border-forest/5">
                        {app.status !== 'pending' ? (
                          app.documentLink ? (
                            <a 
                              href={app.documentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-forest hover:text-forest-dark underline transition-colors flex items-center text-xs md:text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              View
                            </a>
                          ) : (
                            <span className="text-forest/50 text-xs md:text-sm">
                              No document
                            </span>
                          )
                        ) : (
                          <span className="text-forest/50 text-xs md:text-sm">
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
        </div>
      )}
    </div>
  );
} 