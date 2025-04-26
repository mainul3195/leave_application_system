'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    email: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    days: 1,
    halfDayType: null as 'first' | 'second' | null,
    reason: '',
    comments: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({ success: false, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate days when start/end dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      // If both dates are valid
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Calculate difference in days (add 1 because both start and end dates are inclusive)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // Update days, but respect half-day selection if dates are the same
        if (start.toDateString() === end.toDateString() && isHalfDay) {
          setFormData(prev => ({ ...prev, days: 0.5 }));
        } else {
          setFormData(prev => ({ ...prev, days: diffDays }));
          // Reset half-day if dates are different
          if (start.toDateString() !== end.toDateString()) {
            setIsHalfDay(false);
            setFormData(prev => ({ ...prev, halfDayType: null }));
          }
        }
      }
    }
  }, [formData.startDate, formData.endDate, isHalfDay]);

  // Handle half-day toggle
  const handleHalfDayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHalfDay(checked);
    
    // Only apply half-day if start and end dates are the same
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start.toDateString() === end.toDateString()) {
        setFormData(prev => ({ 
          ...prev, 
          days: checked ? 0.5 : 1,
          // Set default half day type to first half when checking the box
          halfDayType: checked ? 'first' : null
        }));
      } else if (checked) {
        // If trying to set half-day when dates differ, show error
        setError('Half-day option is only available when start and end dates are the same');
        setIsHalfDay(false);
      }
    }
  };

  // Handle half-day type selection
  const handleHalfDayTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, halfDayType: e.target.value as 'first' | 'second' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate data before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus({ success: false, message: '' });
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmissionStatus({
          success: true,
          message: 'Your leave application has been submitted successfully!',
        });
        
        // Clear form after successful submission
        resetForm();
      } else {
        setSubmissionStatus({
          success: false,
          message: `Failed to submit application: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err) {
      setSubmissionStatus({
        success: false,
        message: 'An error occurred while submitting your application. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      designation: '',
      email: '',
      phoneNumber: '',
      startDate: '',
      endDate: '',
      days: 1,
      halfDayType: null,
      reason: '',
      comments: ''
    });
    setIsHalfDay(false);
    setError('');
    
    // Scroll to the top to ensure the success message is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card mb-8">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-leaf/20 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-leaf-dark">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-dark">Apply for Leave</h1>
            <p className="text-forest opacity-80">Fill out the form to submit your leave request</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link href="/" className="text-forest hover:text-forest-dark transition-colors flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Applications</span>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="glass-card bg-red-50/80 mb-6 border-red-100 text-red-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {submissionStatus.message && (
        <div className={`glass-card mb-6 notification-animation ${
          submissionStatus.success 
            ? 'bg-green-50/80 border-l-4 border-green-500 text-green-800' 
            : 'bg-red-50/80 border-l-4 border-red-500 text-red-800'
        }`}>
          <div className="flex items-center p-4">
            <div className={`flex-shrink-0 w-8 h-8 mr-3 rounded-full flex items-center justify-center ${
              submissionStatus.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                className={`w-5 h-5 ${submissionStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                {submissionStatus.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium">
                {submissionStatus.success ? 'Success' : 'Error'}
              </h3>
              <p className="mt-1">{submissionStatus.message}</p>
              {submissionStatus.success && (
                <p className="mt-2 text-sm">
                  You can <Link href="/" className="text-green-700 underline font-medium">view your applications</Link> or submit another request.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="glass-card space-y-6" style={{animationDelay: '0.1s'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your email address"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Your department"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Your job title"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="form-input"
              placeholder="Your contact number"
            />
          </div>
        </div>
        
        <div className="border-t border-forest/10 pt-6">
          <h3 className="text-lg font-medium text-forest-dark mb-4">Leave Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-forest-dark">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-forest-dark">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="halfDay"
                checked={isHalfDay}
                onChange={handleHalfDayToggle}
                className="w-4 h-4 text-forest border-forest/30 rounded focus:ring-forest/50"
                disabled={!formData.startDate || !formData.endDate || new Date(formData.startDate).toDateString() !== new Date(formData.endDate).toDateString()}
              />
              <label htmlFor="halfDay" className="ml-2 text-sm font-medium text-forest-dark">
                Half Day Leave
              </label>
            </div>
            
            {isHalfDay && (
              <div className="ml-6 mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="firstHalf"
                    name="halfDayType"
                    value="first"
                    checked={formData.halfDayType === 'first'}
                    onChange={handleHalfDayTypeChange}
                    className="w-4 h-4 text-forest border-forest/30 focus:ring-forest/50"
                  />
                  <label htmlFor="firstHalf" className="ml-2 text-sm text-forest-dark">
                    First Half (Morning)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="secondHalf"
                    name="halfDayType"
                    value="second"
                    checked={formData.halfDayType === 'second'}
                    onChange={handleHalfDayTypeChange}
                    className="w-4 h-4 text-forest border-forest/30 focus:ring-forest/50"
                  />
                  <label htmlFor="secondHalf" className="ml-2 text-sm text-forest-dark">
                    Second Half (Afternoon)
                  </label>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-forest/5 border border-forest/10 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-forest mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="text-sm text-forest-dark">
              Total Leave Duration: <strong>{formData.days}</strong> {formData.days === 1 ? 'day' : 'days'}
              {formData.days === 0.5 && formData.halfDayType && (
                <span> ({formData.halfDayType === 'first' ? 'Morning' : 'Afternoon'})</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={3}
              className="form-input"
              placeholder="Please provide a reason for your leave request"
            ></textarea>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-forest-dark">
              Additional Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={2}
              className="form-input"
              placeholder="Any additional information (optional)"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 border-t border-forest/10">
          <Link href="/" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-primary flex items-center ${isSubmitting ? '' : 'hover:shadow-lg'}`}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
} 