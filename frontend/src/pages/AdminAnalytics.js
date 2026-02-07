import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminAnalytics.css";
import reportingIcon from "./images/reportingicon.png";

const baseURL = "http://localhost:8000/api";

function AdminAnalytics() {
  const [statistics, setStatistics] = useState({
    total_users: 0,
    total_students: 0,
    total_admins: 0,
    total_internships: 0,
    total_companies: 0,
    total_applications: 0,
    pending_applications: 0,
    approved_applications: 0,
    rejected_applications: 0,
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [studentLoginLogs, setStudentLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [roleFilter, setRoleFilter] = useState(""); // Filter for activity logs by role
  const [daysFilter, setDaysFilter] = useState("all"); // Filter logs by time period

  const token = localStorage.getItem("token");

  useEffect(() => {
    checkAdminAccess();
    fetchAnalytics();
  }, []);

  const checkAdminAccess = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData?.is_staff) {
      window.location.href = "/student/dashboard";
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, loginLogsRes] = await Promise.all([
        axios.get(`${baseURL}/statistics/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(`${baseURL}/activity-logs/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(`${baseURL}/student-login-logs/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      setStatistics(statsRes.data);
      // Handle both array and paginated response formats
      const logsData = logsRes.data;
      if (Array.isArray(logsData)) {
        setActivityLogs(logsData);
      } else if (logsData.results && Array.isArray(logsData.results)) {
        setActivityLogs(logsData.results);
      } else {
        setActivityLogs([]);
      }

      // Set student login logs
      const loginLogsData = loginLogsRes.data;
      if (Array.isArray(loginLogsData)) {
        setStudentLoginLogs(loginLogsData);
      } else if (loginLogsData.results && Array.isArray(loginLogsData.results)) {
        setStudentLoginLogs(loginLogsData.results);
      } else {
        setStudentLoginLogs([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const calculateApprovalRate = () => {
    if (statistics.total_applications === 0) return 0;
    return Math.round(
      (statistics.approved_applications / statistics.total_applications) * 100
    );
  };

  const calculateRejectionRate = () => {
    if (statistics.total_applications === 0) return 0;
    return Math.round(
      (statistics.rejected_applications / statistics.total_applications) * 100
    );
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      setError("");

      const response = await axios.get(`${baseURL}/admin/generate-report/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob', // Important for PDF download
      });

      // Create downloadable PDF file
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `internship_analytics_report_${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("PDF report generated and downloaded successfully!");
    } catch (err) {
      console.error("Report generation error:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to generate report. Please try again.";
      setError(`Error: ${errorMessage}`);
      alert(`Failed to generate report: ${errorMessage}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <div className="analytics-loading">Loading analytics...</div>;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Statistics and Activity Log</h1>
        <button onClick={fetchAnalytics} className="refresh-btn" title="Refresh data">
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Report Generation Section */}
      <div className="analytics-section" style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '2px solid #004AAD'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#004AAD' }}>Report Generation</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.95rem' }}>
              Compile performance data and comprehensive internship analytics
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            style={{
              padding: '12px 24px',
              backgroundColor: generatingReport ? '#ccc' : '#004AAD',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: generatingReport ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {generatingReport ? (
              <>
                <span>⏳</span> Generating...
              </>
            ) : (
              <>
                <img
                  src={reportingIcon}
                  alt="Report"
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
                Generate Comprehensive Report
              </>
            )}
          </button>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#555',
          lineHeight: '1.6'
        }}>
          <strong>Report includes:</strong>
          <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
            <li>Summary statistics (users, students, companies, internships, applications)</li>
            <li>Application performance metrics (approval/rejection rates, recent trends)</li>
            <li>Student engagement analytics (profile completion, application rates)</li>
            <li>Internship analytics (distribution, top companies, average applications)</li>
            <li>Course distribution across student population</li>
            <li>Top performing companies by approval rate</li>
            <li>Activity metrics and system usage statistics</li>
          </ul>
          <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', color: '#888' }}>
            Report will be downloaded as a professional PDF document with charts and visualizations.
          </p>
        </div>
      </div>


      {/* User Statistics */}
      <div className="analytics-section">
        <h2>User Statistics</h2>
        <div className="stats-grid">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_users}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>TOTAL USERS</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_students}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>STUDENTS</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_admins}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>ADMINS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Internship Statistics */}
      <div className="analytics-section">
        <h2>Internship Statistics</h2>
        <div className="stats-grid">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_companies}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>TOTAL COMPANIES</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_internships}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>TOTAL INTERNSHIPS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Statistics */}
      <div className="analytics-section">
        <h2>Application Statistics</h2>
        <div className="stats-grid">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total_applications}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>TOTAL APPLICATIONS</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.pending_applications}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>PENDING</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.approved_applications}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>APPROVED</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.rejected_applications}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>REJECTED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Login/Logout Logs */}
      <div className="analytics-section">
        <h2>Recent Student Login/Logout Activity</h2>
        {studentLoginLogs.length > 0 ? (
          <div className="activity-logs">
            <table className="login-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Student ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentLoginLogs.slice(0, 50).map((log) => {
                  const logDate = new Date(log.timestamp);
                  const dateStr = logDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const timeStr = logDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                        <strong>{log.full_name || log.username || "Unknown"}</strong>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                        {log.student_id || "—"}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                        {timeStr}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          backgroundColor: log.action === 'Login' ? '#d4edda' : '#fff3cd',
                          color: log.action === 'Login' ? '#155724' : '#856404',
                          fontWeight: '500'
                        }}>
                          {log.action === 'Login' ? 'Logged In' : 'Logged Out'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No student login activity found yet.</p>
          </div>
        )}
      </div>


      {/* Activity Logs */}
      <div className="analytics-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>All Activity Logs</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>Filter by Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                minWidth: '150px'
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="coordinator">Coordinator</option>
              <option value="supervisor">Supervisor</option>
              <option value="student">Student</option>
            </select>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: 'white',
                minWidth: '150px'
              }}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
        </div>
        {activityLogs.length > 0 ? (
          <div className="activity-logs">
            {activityLogs
              .filter(log => {
                // Filter by role
                if (roleFilter && log.user_role?.toLowerCase() !== roleFilter.toLowerCase()) {
                  return false;
                }

                // Filter by date range
                if (daysFilter !== 'all') {
                  const logDate = new Date(log.timestamp);
                  const now = new Date();
                  const daysAgo = new Date(now.setDate(now.getDate() - parseInt(daysFilter)));
                  if (logDate < daysAgo) {
                    return false;
                  }
                }

                return true;
              })
              .slice(0, 100)
              .map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="username">{log.full_name || log.username || "Unknown"}</span>
                        {log.user_role && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              log.user_role === 'admin' ? '#e3f2fd' :
                                log.user_role === 'coordinator' ? '#f3e5f5' :
                                  log.user_role === 'supervisor' ? '#fff3e0' :
                                    '#e8f5e9',
                            color:
                              log.user_role === 'admin' ? '#1565c0' :
                                log.user_role === 'coordinator' ? '#6a1b9a' :
                                  log.user_role === 'supervisor' ? '#e65100' :
                                    '#2e7d32'
                          }}>
                            {log.user_role.charAt(0).toUpperCase() + log.user_role.slice(1)}
                          </span>
                        )}
                      </div>
                      {log.student_id && (
                        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                          Student ID: {log.student_id}
                        </span>
                      )}
                    </div>
                    <span className="action" style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}>{log.action}</span>
                    <span className="timestamp" style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {log.description && (
                    <div className="activity-description">{log.description}</div>
                  )}
                </div>
              ))}
            {activityLogs.filter(log => !roleFilter || log.user_role?.toLowerCase() === roleFilter.toLowerCase()).length === 0 && (
              <div className="no-data">
                <p>No activity logs found for the selected role.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <p>No activity logs found yet.</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="analytics-section">
        <h2>Quick Summary</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Active Ratio</h3>
            <div className="summary-stat">
              {statistics.total_users > 0
                ? `${Math.round((statistics.total_students / statistics.total_users) * 100)}% Students`
                : "N/A"}
            </div>
          </div>
          <div className="summary-card">
            <h3>Application Flow</h3>
            <div className="summary-stat">
              {statistics.total_applications > 0
                ? `${statistics.total_applications} total, ${calculateApprovalRate()}% approved`
                : "No applications yet"}
            </div>
          </div>
          <div className="summary-card">
            <h3>Platform Health</h3>
            <div className="summary-stat">
              {statistics.total_users > 0 && statistics.total_internships > 0
                ? "Good"
                : "Setup phase"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
