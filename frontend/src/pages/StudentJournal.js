import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentHeader from "./StudentHeader";
import "./AdminDashboard.css";

const baseURL = "http://localhost:8000/api";

function StudentJournal() {
  const [journals, setJournals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [filter, setFilter] = useState('All'); // All, Draft, Submitted, Approved, Rejected
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activities: "",
    learning_outcomes: "",
    hours_rendered: "",
    application_id: "",
  });

  const [pendingAttendance, setPendingAttendance] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [journalsRes, applicationsRes, attendanceRes] = await Promise.all([
        axios.get(`${baseURL}/journals/`, { headers: { Authorization: `Token ${token}` } }),
        axios.get(`${baseURL}/applications/`, { headers: { Authorization: `Token ${token}` } }),
        axios.get(`${baseURL}/attendance/`, { headers: { Authorization: `Token ${token}` } })
      ]);

      setJournals(journalsRes.data);
      const approvedApps = applicationsRes.data.filter(app => app.status === "Approved");
      setApplications(approvedApps);

      if (approvedApps.length === 0) {
        alert("You need an approved internship to access your Daily Journal.");
        // Use a timeout to ensure alert is seen or better, just render empty state?
        // But requested logic "cant access". 
        // Redirecting might be annoying if they just clicked it.
        // Let's set an error state instead of redirect for better UX?
        // Or just show "No active internship".
        setError("You must have an approved internship to access this feature.");
      }

      // Filter approved attendance (Present or Late) that doesn't have a journal yet
      const approvedAttendance = attendanceRes.data.filter(a => ['Present', 'Late'].includes(a.status));
      const journalDates = new Set(journalsRes.data.map(j => j.date));
      const pending = approvedAttendance.filter(a => !journalDates.has(a.date));
      setPendingAttendance(pending);

      if (approvedApps.length > 0) setError(""); // Clear error if valid
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Keep these for compatibility if called individually, though fetchData handles all
  const fetchJournals = fetchData;
  const fetchApplications = () => { };





  const handleSubmit = async (e, status = 'Draft') => {
    e.preventDefault();
    try {
      setError("");
      const data = {
        ...formData,
        application_id: formData.application_id || null,
        hours_rendered: parseFloat(formData.hours_rendered) || 0,
        status: status, // Add status to the data
      };

      if (editingJournal) {
        await axios.put(`${baseURL}/journals/${editingJournal.id}/`, data, {
          headers: { Authorization: `Token ${token}` },
        });
        setSuccess(status === 'Submitted' ? "Journal entry submitted successfully!" : "Journal entry updated successfully!");
      } else {
        await axios.post(`${baseURL}/journals/`, data, {
          headers: { Authorization: `Token ${token}` },
        });
        setSuccess("Journal entry saved successfully!"); // Removed draft/submitted distinction
      }

      setShowForm(false);
      setEditingJournal(null);
      resetForm();
      fetchJournals();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save journal entry.");
    }
  };

  const handleEdit = (journal) => {
    setEditingJournal(journal);
    setFormData({
      date: journal.date,
      activities: journal.activities,
      learning_outcomes: journal.learning_outcomes || "",
      hours_rendered: journal.hours_rendered || "",
      application_id: journal.application || "",
    });
    setShowForm(true);
  };

  const handleCreateFromAttendance = (attendanceRecord) => {
    setFormData({
      date: attendanceRecord.date,
      hours_rendered: attendanceRecord.hours_rendered || 0,
      activities: "",
      learning_outcomes: "",
      application_id: applications.length > 0 ? applications[0].id : ""
    });
    setEditingJournal(null); // Ensure it's new
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this journal entry?")) return;

    try {
      await axios.delete(`${baseURL}/journals/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSuccess("Journal entry deleted successfully!");
      fetchJournals();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete journal entry.");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      activities: "",
      learning_outcomes: "",
      hours_rendered: "",
      application_id: "",
    });
  };

  // Filter journals
  const filteredJournals = filter === 'All'
    ? journals
    : journals.filter(j => j.status === filter);

  // Count by status
  const counts = {
    All: journals.length,
    Draft: journals.filter(j => j.status === 'Draft').length,
    Submitted: journals.filter(j => j.status === 'Submitted').length,
    Approved: journals.filter(j => j.status === 'Approved').length,
    Rejected: journals.filter(j => j.status === 'Rejected').length
  };

  // Calculate total hours
  const totalHours = journals.reduce((sum, j) => sum + (parseFloat(j.hours_rendered) || 0), 0);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <StudentHeader
          title="Daily Journal / eLogbook"
          subtitle="Track your daily activities and learning outcomes"
        />

        {/* Stats Cards */}
        <div className="stats-grid" style={{
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {/* Total Entries */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'transform 0.3s ease',
            cursor: 'default'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 16px rgba(118, 75, 162, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                {journals.length}
              </div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Entries
              </div>
            </div>
          </div>





          {/* Total Hours (Styled like 'Rejected' in reference but using different color for Hours) 
              OR Rejected? 
              Ref image has "Rejected" (Pink).
              Let's add Rejected to be complete and maybe move Hours to a separate display or its own card?
              I'll add Rejected to match the reference image exactly, and add a 5th card for Hours or combine it?
              Let's sticking to 4 cards as per grid. 
              Maybe "Total Hours" instead of Rejected?
              But "Rejected" is a status.
              I'll do: Entries, Pending (Draft+Submitted), Approved, Total Hours.
              I will color Total Hours BLUE/INDIGO.
          */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'transform 0.3s ease',
            cursor: 'default'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 16px rgba(79, 172, 254, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                {totalHours.toFixed(1)}
              </div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Hours
              </div>
            </div>
          </div>
        </div>

        {/* Add Button Removed to enforce attendance pairing */}
        <div style={{ marginBottom: '20px' }}></div>

        {/* Pending Journal Entries Section */}
        {pendingAttendance.length > 0 && (
          <div style={{ marginBottom: '30px', background: '#fff8e1', padding: '20px', borderRadius: '12px', border: '1px solid #ffe082' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f57f17', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> You have approved attendance records awaiting journal entries
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {pendingAttendance.map(att => (
                <div key={att.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{new Date(att.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{att.hours_rendered} Hours Verified</div>
                  </div>
                  <button
                    onClick={() => handleCreateFromAttendance(att)}
                    style={{
                      background: '#ff9800',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Create Journal
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Tabs Removed */}
        <div style={{ marginBottom: '20px' }}></div>

        {showForm && (
          <div
            className="modal-overlay"
            onClick={() => setShowForm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '700px',
                width: '100%',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px 30px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white'
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                    {editingJournal ? "Edit Journal Entry" : "New Journal Entry"}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                    {editingJournal ? "Update your daily activities and learning" : "Record your daily activities and learning outcomes"}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{
                padding: '30px',
                overflowY: 'auto',
                flex: 1
              }}>
                <form onSubmit={handleSubmit}>
                  {/* Date Field */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* Internship Field */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Internship <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                    </label>
                    <select
                      value={formData.application_id}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        cursor: 'not-allowed',
                        appearance: 'none' // Remove down arrow to look more static
                      }}
                    >
                      <option value="">Select internship...</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.internship?.position || "Unknown Position"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Activities Field */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Activities Performed <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      value={formData.activities}
                      onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                      rows="5"
                      placeholder="Describe the activities and tasks you performed today..."
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Learning Outcomes Field */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Learning Outcomes
                    </label>
                    <textarea
                      value={formData.learning_outcomes}
                      onChange={(e) => setFormData({ ...formData, learning_outcomes: e.target.value })}
                      rows="4"
                      placeholder="What did you learn today? What skills did you develop?"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Hours Rendered Field */}
                  <div style={{ marginBottom: '30px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Hours Rendered <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={formData.hours_rendered}
                      readOnly
                      placeholder="8.0"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr', // Changed to 2 columns
                    gap: '12px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        color: '#6b7280',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      Cancel
                    </button>
                    {/* Draft Button Removed */}
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, 'Approved')} // Auto-approve
                      style={{
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <span></span> Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading journal entries...</div>
        ) : filteredJournals.length === 0 ? (
          <div className="no-data">
            <p>{filter === 'All' ? 'No journal entries yet. Create your first entry to start tracking your daily activities!' : `No ${filter.toLowerCase()} entries.`}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredJournals.map((journal) => (
              <div
                key={journal.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 120px 200px 180px', gap: '20px', alignItems: 'center' }}>
                  {/* Date Column */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {new Date(journal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Activities Column */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Activities</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {journal.activities.substring(0, 100)}{journal.activities.length > 100 ? '...' : ''}
                    </div>
                    {journal.learning_outcomes && (
                      <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '500', color: '#9ca3af' }}>Learning:</span> {journal.learning_outcomes.substring(0, 80)}{journal.learning_outcomes.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </div>

                  {/* Hours Column */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Hours</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#4f46e5' }}>
                      {journal.hours_rendered} hrs
                    </div>
                  </div>

                  {/* Status Column */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</div>
                    <span style={{
                      padding: '6px 14px',
                      background: journal.status === 'Approved' ? '#10b981' :
                        journal.status === 'Submitted' ? '#f59e0b' :
                          journal.status === 'Rejected' ? '#ef4444' : '#6b7280',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                      textTransform: 'capitalize'
                    }}>
                      {journal.status}
                    </span>
                  </div>

                  {/* Supervisor Comment Column */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Supervisor Comment</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: journal.supervisor_comment ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {journal.supervisor_comment || '-'}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Actions</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {journal.status === 'Draft' && (
                        <button
                          style={{
                            padding: '8px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onClick={async () => {
                            try {
                              await axios.put(`${baseURL}/journals/${journal.id}/`, {
                                ...journal,
                                status: 'Submitted'
                              }, {
                                headers: { Authorization: `Token ${token}` }
                              });
                              setSuccess('Journal entry submitted for review!');
                              fetchJournals();
                              setTimeout(() => setSuccess(''), 3000);
                            } catch (err) {
                              setError('Failed to submit journal entry');
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                        >
                          Submit
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(journal)}
                        disabled={journal.status === 'Approved' || journal.status === 'Submitted'}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: (journal.status === 'Approved' || journal.status === 'Submitted') ? '#e5e7eb' : '#f3f4f6',
                          color: (journal.status === 'Approved' || journal.status === 'Submitted') ? '#9ca3af' : '#4b5563',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: (journal.status === 'Approved' || journal.status === 'Submitted') ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (journal.status !== 'Approved' && journal.status !== 'Submitted') {
                            e.currentTarget.style.background = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (journal.status !== 'Approved' && journal.status !== 'Submitted') {
                            e.currentTarget.style.background = '#f3f4f6';
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(journal.id)}
                        disabled={journal.status === 'Approved'}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: journal.status === 'Approved' ? '#fecaca' : '#fee2e2',
                          color: journal.status === 'Approved' ? '#f87171' : '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: journal.status === 'Approved' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (journal.status !== 'Approved') {
                            e.currentTarget.style.background = '#fecaca';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (journal.status !== 'Approved') {
                            e.currentTarget.style.background = '#fee2e2';
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentJournal;
