import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentHeader from "./StudentHeader";
import "./AdminDashboard.css";
import useNotificationPolling from "../hooks/useNotificationPolling";
import { QRCodeSVG } from 'qrcode.react';
import { generateQRCodeUrl } from '../config/tunnelConfig';

function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    attendance: { totalHours: 0, daysPresent: 0, requiredHours: 300 },
    journals: { total: 0, approved: 0, pending: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeInternship, setActiveInternship] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const token = localStorage.getItem('token');

  // Notification polling handled in App.js

  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncements();
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      setLoadingQR(true);
      const response = await axios.post('http://localhost:8000/api/student/generate-qr/', {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setQrCodeData(response.data);

      // Generate dynamic QR URL based on current tunnel
      const dynamicUrl = await generateQRCodeUrl(response.data.qr_code_token);
      setQrUrl(dynamicUrl);

      setLoadingQR(false);
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setLoadingQR(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [applicationsRes, tasksRes, attendanceRes, journalsRes, settingsRes, profileRes] = await Promise.all([
        axios.get('http://localhost:8000/api/applications/', { headers: { Authorization: `Token ${token}` } }),
        axios.get('http://localhost:8000/api/tasks/', { headers: { Authorization: `Token ${token}` } }),
        axios.get('http://localhost:8000/api/attendance/', { headers: { Authorization: `Token ${token}` } }),
        axios.get('http://localhost:8000/api/journals/', { headers: { Authorization: `Token ${token}` } }),
        axios.get('http://localhost:8000/api/student/coordinator-settings/', { headers: { Authorization: `Token ${token}` } }).catch(() => ({ data: {} })),
        axios.get('http://localhost:8000/api/my-profile/', { headers: { Authorization: `Token ${token}` } }).catch(() => ({ data: {} }))
      ]);

      const apps = Array.isArray(applicationsRes.data) ? applicationsRes.data : [];
      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const attendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const journals = Array.isArray(journalsRes.data) ? journalsRes.data : [];
      const settings = settingsRes.data || {};
      const profile = profileRes.data || {};
      const course = profile.course || "";

      const totalHours = attendance.reduce((sum, a) => sum + (parseFloat(a.hours_rendered) || 0), 0);

      // Determine required hours dynamically from settings based on Student Course
      let requiredHours = 300; // Default fallback
      if (settings.hours_config && Array.isArray(settings.hours_config)) {
        // Try to match student course with config program
        const config = settings.hours_config.find(h => {
          if (!h.program) return false;
          // Normalize strings (remove dots, trim) for better matching
          const cleanProgram = h.program.replace(/\./g, '').trim().toLowerCase();
          const cleanCourse = course.replace(/\./g, '').trim().toLowerCase();
          return course.toLowerCase().includes(h.program.toLowerCase()) || cleanCourse.includes(cleanProgram);
        });

        if (config) {
          requiredHours = parseInt(config.requiredHours) || 300;
        } else if (settings.hours_config.length === 1) {
          // Fallback: If only one config exists, use it (robustness for simple setups)
          requiredHours = parseInt(settings.hours_config[0].requiredHours) || 300;
        }
      }

      setStats({
        applications: {
          total: apps.length,
          pending: apps.filter(a => a.status === 'Pending').length,
          approved: apps.filter(a => a.status === 'Approved').length,
          rejected: apps.filter(a => a.status === 'Rejected').length
        },
        tasks: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'Pending').length,
          inProgress: tasks.filter(t => t.status === 'In Progress').length,
          completed: tasks.filter(t => t.status === 'Completed').length
        },
        attendance: {
          totalHours: totalHours,
          daysPresent: attendance.filter(a => a.status === 'Present').length,
          requiredHours: requiredHours
        },
        journals: {
          total: journals.length,
          approved: journals.filter(j => j.status === 'Approved').length,
          pending: journals.filter(j => j.status === 'Submitted' || j.status === 'Pending').length
        }
      });

      // Check for active approved internship
      const approvedApp = apps.find(a => a.status === 'Approved');
      if (approvedApp) {
        setActiveInternship({
          position: approvedApp.internship?.position || 'Position',
          company: approvedApp.internship?.company?.name || 'Company'
        });
      }

      const activities = [];
      apps.slice(0, 3).forEach(app => {
        activities.push({
          type: 'application',
          title: `Applied to ${app.internship?.position || 'Position'}`,
          status: app.status,
          date: new Date(app.applied_at)
        });
      });

      tasks.slice(0, 3).forEach(task => {
        activities.push({
          type: 'task',
          title: task.title,
          status: task.status,
          date: new Date(task.created_at)
        });
      });

      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 5));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set safe defaults on error
      setStats({
        applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
        tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
        attendance: { totalHours: 0, daysPresent: 0, requiredHours: 300 },
        journals: { total: 0, approved: 0, pending: 0 }
      });
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notices/', {
        headers: { Authorization: `Token ${token}` }
      });
      // Filter for active and public announcements
      const activeAnnouncements = response.data.filter(notice => notice.is_active && notice.is_public);
      setAnnouncements(activeAnnouncements.slice(0, 3)); // Show only top 3
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const progressPercentage = Math.min(100, (stats.attendance.totalHours / stats.attendance.requiredHours) * 100);
  const remainingHours = Math.max(0, stats.attendance.requiredHours - stats.attendance.totalHours);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <StudentHeader
          title="Dashboard"
          subtitle="Welcome back! Here's your internship overview"
        />

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {/* Active Internship Notification */}
            {activeInternship && (
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '25px',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600' }}>
                      Active Internship
                    </h3>
                    <p style={{ margin: '0', fontSize: '0.95rem', opacity: 0.95 }}>
                      You are currently approved for <strong>{activeInternship.position}</strong> at <strong>{activeInternship.company}</strong>.
                      <br />
                      You cannot apply to new positions until you complete this internship.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="stats-grid" style={{ marginBottom: '30px' }}>
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
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{stats.applications.approved}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>APPROVED APPLICATIONS</div>
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{stats.tasks.pending + stats.tasks.inProgress}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>ACTIVE TASKS</div>
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
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{stats.attendance.totalHours.toFixed(0)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>HOURS RENDERED</div>
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{progressPercentage.toFixed(0)}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>OVERALL PROGRESS</div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {qrCodeData && (
              <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a' }}>Your QR Code</h2>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                  gap: '30px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    background: '#f9fafb',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #667eea',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }}>
                    {loadingQR ? (
                      <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div>Loading...</div>
                      </div>
                    ) : qrUrl ? (
                      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <QRCodeSVG
                          value={qrUrl}
                          size={180}
                          level={"M"}
                          includeMargin={true}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        <div>Generating URL...</div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#1a1a1a' }}>
                      For Company Supervisor Evaluation
                    </h3>
                    <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '15px' }}>
                      Show this QR code to your company supervisor when they need to evaluate your performance.
                    </p>
                    <p style={{
                      background: qrUrl.includes('ngrok') ? '#d1fae5' : '#fef3c7',
                      color: qrUrl.includes('ngrok') ? '#065f46' : '#92400e',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      border: qrUrl.includes('ngrok') ? '1px solid #6ee7b7' : '1px solid #fcd34d',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      margin: '15px 0'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span>
                        {qrUrl.includes('ngrok') ? (
                          <><strong>Ngrok Active!</strong> This QR code uses your public ngrok URL and will work on any device.</>
                        ) : (
                          <><strong>Localhost Mode:</strong> Start ngrok and refresh this page to get a public QR code that works on mobile devices.</>
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Announcement Board */}
            {announcements.length > 0 && (
              <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 11 18-5v12L3 14v-3z"></path>
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                  </svg>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a' }}>Announcements</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {announcements.map((announcement, index) => {
                    const isImage = announcement.attachment && (
                      announcement.attachment.endsWith('.jpg') ||
                      announcement.attachment.endsWith('.jpeg') ||
                      announcement.attachment.endsWith('.png') ||
                      announcement.attachment.endsWith('.gif') ||
                      announcement.attachment.endsWith('.webp')
                    );

                    return (
                      <div key={announcement.id} style={{
                        background: '#f9fafb',
                        padding: '18px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                        onClick={() => setSelectedAnnouncement(announcement)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '15px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <span style={{
                                background: announcement.notice_type === 'Urgent' ? '#ef4444' :
                                  announcement.notice_type === 'Important' ? '#f59e0b' :
                                    announcement.notice_type === 'Announcement' ? '#3b82f6' : '#10b981',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {announcement.notice_type}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                {new Date(announcement.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                                {announcement.expires_at && (
                                  <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                                  </span>
                                )}
                              </span>
                            </div>
                            <h3 style={{
                              margin: '0 0 10px 0',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              lineHeight: '1.4',
                              color: '#1a1a1a'
                            }}>
                              {announcement.title}
                            </h3>
                            <p style={{
                              margin: 0,
                              fontSize: '0.95rem',
                              lineHeight: '1.6',
                              color: '#4b5563',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {announcement.content}
                            </p>
                          </div>

                          {announcement.attachment && (
                            <div style={{ flexShrink: 0 }}>
                              {isImage ? (
                                <div style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <img
                                    src={announcement.attachment.startsWith('http') ? announcement.attachment : `http://localhost:8000${announcement.attachment}`}
                                    alt="Thumbnail"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              ) : (
                                <div style={{
                                  background: '#e5e7eb',
                                  color: '#374151',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                  </svg>
                                  File
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Internship Progress</h2>
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>Hours Completed</span>
                <span style={{ fontSize: '1.2rem', color: '#4CAF50' }}>
                  {stats.attendance.totalHours.toFixed(1)} / {stats.attendance.requiredHours} hrs
                </span>
              </div>
              <div style={{ width: '100%', height: '30px', background: '#e0e0e0', borderRadius: '15px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #4CAF50, #8BC34A)', transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                <span>Remaining: {remainingHours.toFixed(1)} hours</span>
                <span>Days Present: {stats.attendance.daysPresent}</span>
              </div>
            </div>

            {recentActivity.length > 0 && (
              <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Recent Activity</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentActivity.map((activity, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{activity.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {activity.date.toLocaleDateString()} • {activity.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Announcement Modal */}
            {selectedAnnouncement && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '20px'
              }} onClick={() => setSelectedAnnouncement(null)}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  maxWidth: '700px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  position: 'relative',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  animation: 'fadeIn 0.3s ease'
                }} onClick={e => e.stopPropagation()}>

                  {/* Modal Header */}
                  <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: selectedAnnouncement.notice_type === 'Urgent' ? '#ef4444' :
                          selectedAnnouncement.notice_type === 'Important' ? '#f59e0b' :
                            selectedAnnouncement.notice_type === 'Announcement' ? '#3b82f6' : '#10b981',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {selectedAnnouncement.notice_type}
                      </span>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAnnouncement(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div style={{ padding: '25px' }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>
                      {selectedAnnouncement.title}
                    </h2>

                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      color: '#374151',
                      fontSize: '1rem',
                      marginBottom: '25px'
                    }}>
                      {selectedAnnouncement.content}
                    </div>

                    {/* Attachment Display */}
                    {selectedAnnouncement.attachment && (
                      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#666' }}>Attachment</h4>

                        {(
                          selectedAnnouncement.attachment.endsWith('.jpg') ||
                          selectedAnnouncement.attachment.endsWith('.jpeg') ||
                          selectedAnnouncement.attachment.endsWith('.png') ||
                          selectedAnnouncement.attachment.endsWith('.gif') ||
                          selectedAnnouncement.attachment.endsWith('.webp')
                        ) ? (
                          <div style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #ddd',
                            background: '#f8f9fa'
                          }}>
                            <img
                              src={selectedAnnouncement.attachment.startsWith('http') ? selectedAnnouncement.attachment : `http://localhost:8000${selectedAnnouncement.attachment}`}
                              alt="Full Attachment"
                              style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                            <div style={{ padding: '10px', textAlign: 'center', background: 'white', borderTop: '1px solid #eee' }}>
                              <a
                                href={selectedAnnouncement.attachment.startsWith('http') ? selectedAnnouncement.attachment : `http://localhost:8000${selectedAnnouncement.attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#2563eb',
                                  textDecoration: 'none',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}
                              >
                                View / Download Original Image
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={selectedAnnouncement.attachment.startsWith('http') ? selectedAnnouncement.attachment : `http://localhost:8000${selectedAnnouncement.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: '#f3f4f6',
                              padding: '12px 20px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#1f2937',
                              fontWeight: '500',
                              border: '1px solid #e5e7eb',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Attachment ({selectedAnnouncement.attachment.split('/').pop()})
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )
        }
      </div >
    </div >
  );
}

export default StudentDashboard;
