import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentHeader from "./StudentHeader";
import "./AdminDashboard.css";

function StudentAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filter, setFilter] = useState('All');

    // Add Record Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time_in: "",
        time_out: "",
        notes: ""
    });

    const token = localStorage.getItem('token');
    const [requiredHours, setRequiredHours] = useState(300);
    const [hasApprovedInternship, setHasApprovedInternship] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attendanceRes, settingsRes, profileRes, applicationsRes] = await Promise.all([
                axios.get('http://localhost:8000/api/attendance/', { headers: { Authorization: `Token ${token}` } }),
                axios.get('http://localhost:8000/api/student/coordinator-settings/', { headers: { Authorization: `Token ${token}` } }).catch(() => ({ data: {} })),
                axios.get('http://localhost:8000/api/my-profile/', { headers: { Authorization: `Token ${token}` } }).catch(() => ({ data: {} })),
                axios.get('http://localhost:8000/api/applications/', { headers: { Authorization: `Token ${token}` } }).catch(() => ({ data: [] }))
            ]);

            setAttendance(attendanceRes.data);

            // 1. Calculate Required Hours Logic
            const settings = settingsRes.data || {};
            const profile = profileRes.data || {};
            const course = profile.course || "";

            let calculatedHours = 300;
            if (settings.hours_config && Array.isArray(settings.hours_config)) {
                const config = settings.hours_config.find(h => {
                    if (!h.program) return false;
                    const cleanProgram = h.program.replace(/\./g, '').trim().toLowerCase();
                    const cleanCourse = course.replace(/\./g, '').trim().toLowerCase();
                    return course.toLowerCase().includes(h.program.toLowerCase()) || cleanCourse.includes(cleanProgram);
                });

                if (config) {
                    calculatedHours = parseInt(config.requiredHours) || 300;
                } else if (settings.hours_config.length === 1) {
                    calculatedHours = parseInt(settings.hours_config[0].requiredHours) || 300;
                }
            }
            setRequiredHours(calculatedHours);

            // 2. Check for Approved Internship
            const apps = Array.isArray(applicationsRes.data) ? applicationsRes.data : [];
            const hasApproved = apps.some(app => app.status === 'Approved');
            setHasApprovedInternship(hasApproved);

            if (!hasApproved) {
                setError("You need an approved internship to access Attendance.");
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load records. Please try again.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Basic validation
        if (!formData.time_in || !formData.time_out) {
            setError("Please provide both Time In and Time Out.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dataToSubmit = {
                date: formData.date,
                time_in: formData.time_in + ":00", // Append seconds for backend
                time_out: formData.time_out + ":00",
                notes: formData.notes,
                status: 'Pending' // Explicitly set to Pending for Supervisor verification
            };

            const res = await axios.post(
                'http://localhost:8000/api/attendance/',
                dataToSubmit,
                { headers: { Authorization: `Token ${token}` } }
            );

            console.log('✅ SUCCESS:', res.data);
            setSuccess('Daily time record submitted for verification!');
            setShowModal(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                time_in: "",
                time_out: "",
                notes: ""
            });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error("❌ FULL ERROR:", err);
            console.error("❌ ERROR DATA:", err.response?.data);
            console.error("❌ STATUS:", err.response?.status);

            let errorMessage = "Unknown error";

            if (err.response?.data) {
                if (typeof err.response.data === 'object') {
                    const errors = Object.entries(err.response.data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join(' | ');
                    errorMessage = errors;
                } else {
                    errorMessage = err.response.data;
                }
            }

            setError(`Failed: ${errorMessage}`);
        }
    };


    // Calculate total hours
    const totalHours = attendance.reduce((sum, a) => sum + (parseFloat(a.hours_rendered) || 0), 0);
    const remainingHours = Math.max(0, requiredHours - totalHours);
    const progressPercentage = Math.min(100, (totalHours / requiredHours) * 100);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this pending time record?')) {
            try {
                await axios.delete(`http://localhost:8000/api/attendance/${id}/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                setSuccess('Record deleted successfully');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error('Error deleting record:', err);
                setError('Failed to delete record');
            }
        }
    };

    // Filter attendance
    const filteredAttendance = filter === 'All'
        ? attendance
        : attendance.filter(a => a.status === filter);

    // Count by status
    const counts = {
        All: attendance.length,
        Pending: attendance.filter(a => a.status === 'Pending').length,
        Present: attendance.filter(a => a.status === 'Present').length,
        Absent: attendance.filter(a => a.status === 'Absent').length,
        Late: attendance.filter(a => a.status === 'Late').length
    };

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <StudentHeader
                    title="Attendance & Time Record"
                    subtitle="Log your daily hours for Supervisor verification"
                />

                {/* Stats Cards */}
                <div className="stats-grid" style={{
                    marginBottom: '30px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '24px'
                }}>
                    {/* Total Hours Rendered */}
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
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                                {totalHours.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Hours Rendered
                            </div>
                        </div>
                    </div>

                    {/* Remaining Hours */}
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
                            background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(255, 94, 98, 0.3)'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                                {remainingHours.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Remaining Hours
                            </div>
                        </div>
                    </div>

                    {/* Days Present */}
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
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(56, 249, 215, 0.3)'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                <path d="M9 16l2 2 4-4"></path>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                                {counts.Present}
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Days Present
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
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
                            background: 'linear-gradient(135deg, #0acffe 0%, #495aff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(73, 90, 255, 0.3)'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748', lineHeight: '1.2' }}>
                                {progressPercentage.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '14px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Completion
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    {/* Add Button */}
                    <div style={{ position: 'relative' }}>
                        {!hasApprovedInternship && !loading && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#333',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                marginBottom: '5px',
                                opacity: 0.9,
                                pointerEvents: 'none'
                            }}>
                                Need approved internship first
                            </div>
                        )}
                        <button
                            className="btn-primary"
                            onClick={() => setShowModal(true)}
                            disabled={!hasApprovedInternship}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: !hasApprovedInternship ? 0.6 : 1,
                                cursor: !hasApprovedInternship ? 'not-allowed' : 'pointer',
                                background: !hasApprovedInternship ? '#ccc' : undefined,
                                borderColor: !hasApprovedInternship ? '#ccc' : undefined
                            }}
                        >
                            + Add Daily Time Record
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {['All', 'Pending', 'Present', 'Late', 'Absent'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    background: filter === status ? '#4CAF50' : 'white',
                                    color: filter === status ? 'white' : '#666',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    fontWeight: filter === status ? '600' : '400',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {status} ({counts[status] || 0})
                            </button>
                        ))}
                    </div>
                </div>

                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                {loading ? (
                    <div className="loading">Loading records...</div>
                ) : filteredAttendance.length === 0 ? (
                    <div className="no-data">
                        <p>{filter === 'All' ? 'No time records yet. Click "+ Add Daily Time Record" to start.' : `No ${filter.toLowerCase()} records.`}</p>
                    </div>
                ) : (
                    <div className="attendance-table-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Date</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Time In</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Time Out</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Hours</th>
                                        <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#444' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Notes</th>
                                        <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#444' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendance.map((record) => (
                                        <tr key={record.id} style={{ borderBottom: '1px solid #e0e0e0', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '15px', color: '#333' }}>
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '15px', color: '#555', fontFamily: 'monospace', fontSize: '14px' }}>
                                                {record.time_in || '-'}
                                            </td>
                                            <td style={{ padding: '15px', color: '#555', fontFamily: 'monospace', fontSize: '14px' }}>
                                                {record.time_out || '-'}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <strong>{record.hours_rendered ? `${record.hours_rendered} hrs` : '-'}</strong>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background:
                                                        record.status === 'Present' ? '#C41E3A' :
                                                            record.status === 'Absent' ? '#f44336' :
                                                                record.status === 'Late' ? '#FF9800' :
                                                                    record.status === 'Pending' ? '#2196F3' : '#757575',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    display: 'inline-block',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', color: '#666', maxWidth: '300px', fontSize: '14px' }}>
                                                {record.notes || '-'}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                {record.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        style={{
                                                            background: '#ff4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                        title="Delete pending record"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add Record Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Log Daily Attendance</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>
                                    Please copy the details from your physical time card/logbook accurately.
                                </p>

                                {/* Error/Success Messages in Modal */}
                                {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
                                {success && <div className="success-message" style={{ marginBottom: '15px' }}>{success}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Time In *</label>
                                            <input
                                                type="time"
                                                name="time_in"
                                                value={formData.time_in}
                                                onChange={handleInputChange}
                                                required
                                                max={formData.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Time Out *</label>
                                            <input
                                                type="time"
                                                name="time_out"
                                                value={formData.time_out}
                                                onChange={handleInputChange}
                                                required
                                                max={formData.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Notes / Activities (Optional)</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Briefly describe what you did today..."
                                            rows="3"
                                        ></textarea>
                                    </div>

                                    <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn-primary">
                                            Submit for Verification
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentAttendance;
