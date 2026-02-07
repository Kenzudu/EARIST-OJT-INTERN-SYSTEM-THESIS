import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SupervisorSidebar from "./SupervisorSidebar";
import "./AdminDashboard.css";

function SupervisorInterns() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [interns, setInterns] = useState([]);
    const [filter, setFilter] = useState('All'); // All, Pending, Approved, Rejected
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Terminate modal state
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminateStudentId, setTerminateStudentId] = useState(null);
    const [terminateStudentName, setTerminateStudentName] = useState('');
    const [terminationReason, setTerminationReason] = useState('');


    useEffect(() => {
        fetchInterns();
    }, []);

    const fetchInterns = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/supervisor/interns/', {
                headers: { Authorization: `Token ${token}` }
            });
            setInterns(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching interns:', err);
            setError('Failed to load applicants');
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId) => {
        if (!window.confirm('Are you sure you want to approve this application?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/api/supervisor/applications/${applicationId}/status/`,
                { status: 'Approved' },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess('Application approved successfully!');
            fetchInterns(); // Refresh list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve application');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleReject = async (applicationId) => {
        if (!window.confirm('Are you sure you want to reject this application?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/api/supervisor/applications/${applicationId}/status/`,
                { status: 'Rejected' },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess('Application rejected');
            fetchInterns(); // Refresh list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject application');
            setTimeout(() => setError(''), 3000);
        }
    };


    const handleTerminateClick = (studentId, studentName) => {
        setTerminateStudentId(studentId);
        setTerminateStudentName(studentName);
        setTerminationReason('');
        setShowTerminateModal(true);
    };

    const handleTerminateSubmit = async () => {
        if (!terminationReason.trim()) {
            setError('Please provide a reason for termination');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:8000/api/supervisor/students/${terminateStudentId}/terminate/`,
                { reason: terminationReason },
                { headers: { Authorization: `Token ${token}` } }
            );

            setSuccess(response.data.message || 'Internship terminated successfully');
            setShowTerminateModal(false);
            setTerminationReason('');
            fetchInterns(); // Refresh list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to terminate internship');
            setTimeout(() => setError(''), 3000);
        }
    };

    const fetchStudentDetails = async (studentId) => {

        setLoadingDetails(true);
        setShowDetailsModal(true);
        setSelectedStudent(studentId);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/supervisor/students/${studentId}/attendance/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setStudentDetails(response.data);
            setLoadingDetails(false);
        } catch (err) {
            console.error('Error fetching student details:', err);
            setError('Failed to load student details');
            setLoadingDetails(false);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Filter interns based on selected tab and search query
    const filteredInterns = interns
        .filter(intern => filter === 'All' || intern.status === filter)
        .filter(intern => {
            const searchLower = searchQuery.toLowerCase();
            return (
                intern.name?.toLowerCase().includes(searchLower) ||
                intern.student_id?.toLowerCase().includes(searchLower) ||
                intern.course?.toLowerCase().includes(searchLower) ||
                intern.position?.toLowerCase().includes(searchLower) ||
                intern.email?.toLowerCase().includes(searchLower)
            );
        });

    // Count by status
    const counts = {
        All: interns.length,
        Pending: interns.filter(i => i.status === 'Pending').length,
        Approved: interns.filter(i => i.status === 'Approved').length,
        Rejected: interns.filter(i => i.status === 'Rejected').length
    };

    return (
        <div className="admin-container">
            <SupervisorSidebar />
            <div className="admin-content">
                <header className="admin-header">
                    <h1>My Interns & Applicants</h1>
                </header>

                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                {/* Search Bar */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#718096"
                            strokeWidth="2"
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, ID, course, position, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#C41E3A'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '2px solid #e0e0e0' }}>
                    {['All', 'Pending', 'Approved', 'Rejected', 'Terminated'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                background: filter === status ? '#C41E3A' : 'transparent',
                                color: filter === status ? 'white' : '#666',
                                fontWeight: filter === status ? '600' : '400',
                                cursor: 'pointer',
                                borderBottom: filter === status ? '3px solid #C41E3A' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {status} ({counts[status]})
                        </button>
                    ))}
                </div>

                {loading && <div className="loading">Loading...</div>}

                {!loading && (
                    <div>
                        {filteredInterns.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                background: 'white',
                                borderRadius: '12px',
                                color: '#666'
                            }}>
                                {searchQuery
                                    ? 'No interns found matching your search.'
                                    : filter === 'All'
                                        ? 'No applications yet. Students will appear here when they apply to your internship postings.'
                                        : `No ${filter.toLowerCase()} applications.`
                                }
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '200px 120px 200px 250px 200px 120px 100px 150px',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    background: '#f8f9fa',
                                    borderRadius: '8px 8px 0 0',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '2px solid #e5e7eb'
                                }}>
                                    <div>Name</div>
                                    <div>Student ID</div>
                                    <div>Position</div>
                                    <div>Course</div>
                                    <div>Email</div>
                                    <div>Phone</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                </div>

                                {/* Table Body */}
                                <div style={{ background: 'white', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                    {filteredInterns.map((intern, index) => (
                                        <div
                                            key={intern.application_id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '200px 120px 200px 250px 200px 120px 100px 150px',
                                                gap: '16px',
                                                padding: '20px',
                                                borderBottom: index < filteredInterns.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                transition: 'background 0.2s ease',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Name */}
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                                {intern.name}
                                            </div>

                                            {/* Student ID */}
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {intern.student_id}
                                            </div>

                                            {/* Position */}
                                            <div style={{ fontSize: '13px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {intern.position}
                                            </div>

                                            {/* Course */}
                                            <div style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {intern.course}
                                            </div>

                                            {/* Email */}
                                            <div style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {intern.email}
                                            </div>

                                            {/* Phone */}
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {intern.phone || 'N/A'}
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background: intern.status === 'Approved' ? '#10b981' :
                                                        intern.status === 'Pending' ? '#f59e0b' :
                                                            intern.status === 'Terminated' ? '#9ca3af' : '#ef4444',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    display: 'inline-block'
                                                }}>
                                                    {intern.status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div>
                                                {intern.status === 'Pending' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <button
                                                            onClick={() => handleApprove(intern.application_id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(intern.application_id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : intern.status === 'Approved' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <button
                                                            onClick={() => fetchStudentDetails(intern.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: '#3b82f6',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                                                        >
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleTerminateClick(intern.id, intern.name)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                                        >
                                                            Terminate
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Student Details Modal - Only show when data is loaded */}
                {showDetailsModal && studentDetails && !loadingDetails && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            width: '98%',
                            maxWidth: '1400px',
                            height: '95vh',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                padding: '28px 32px',
                                borderBottom: '2px solid #e0e0e0',
                                background: 'linear-gradient(135deg, #C41E3A 0%, #A01729 100%)',
                                color: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                                                Student Details
                                            </h2>
                                        </div>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', opacity: 0.95 }}>
                                            {studentDetails.student_name}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <span>{studentDetails.student_email}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span>{studentDetails.student_id_number}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                                </svg>
                                                <span>{studentDetails.course}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9, marginTop: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                </svg>
                                                <span>{studentDetails.position}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                </svg>
                                                <span>{studentDetails.company_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setStudentDetails(null);
                                        }}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '28px',
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Progress Overview */}
                            <div style={{
                                padding: '28px 32px',
                                background: '#f8f9fa',
                                borderBottom: '2px solid #e0e0e0'
                            }}>
                                {/* Progress Bar */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '16px' }}>Overall Progress</span>
                                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#C41E3A' }}>
                                            {studentDetails.progress_percentage}%
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '28px',
                                        background: '#e0e0e0',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            width: `${studentDetails.progress_percentage}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #C41E3A 0%, #A01729 100%)',
                                            transition: 'width 0.5s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            paddingRight: '12px'
                                        }}>
                                            <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>
                                                {studentDetails.total_hours}h / {studentDetails.required_hours}h
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {/* Total Hours */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #C41E3A 0%, #A01729 100%)',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        color: 'white',
                                        boxShadow: '0 4px 12px rgba(196, 30, 58, 0.4)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>Total Hours</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700' }}>
                                            {studentDetails.total_hours}
                                        </div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px' }}>
                                            of {studentDetails.required_hours} required
                                        </div>
                                    </div>

                                    {/* Present */}
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: '2px solid #C41E3A'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Present</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#C41E3A' }}>
                                            {studentDetails.present_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            of {studentDetails.total_records} records
                                        </div>
                                    </div>

                                    {/* Late */}
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: '2px solid #FF9800'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Late</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#FF9800' }}>
                                            {studentDetails.late_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            {studentDetails.attendance_hours}h from attendance
                                        </div>
                                    </div>

                                    {/* Absent */}
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: '2px solid #f44336'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2.5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Absent</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#f44336' }}>
                                            {studentDetails.absent_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            Missed days
                                        </div>
                                    </div>

                                    {/* Tasks */}
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: '2px solid #2196F3'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                                                <path d="M9 11l3 3L22 4"></path>
                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Tasks</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3' }}>
                                            {studentDetails.completed_tasks}/{studentDetails.total_tasks}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            completed
                                        </div>
                                    </div>

                                    {/* Journals */}
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: '2px solid #9C27B0'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Journals</span>
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#9C27B0' }}>
                                            {studentDetails.journal_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            {studentDetails.journal_count} entries ({studentDetails.journal_hours}h reported)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Sheet */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>
                                        Attendance Sheet
                                    </h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5', zIndex: 1 }}>
                                            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Date</th>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Time In</th>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Time Out</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Hours</th>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetails.attendance_records.map((record, index) => (
                                                <tr key={record.id} style={{
                                                    borderBottom: '1px solid #e0e0e0',
                                                    background: index % 2 === 0 ? 'white' : '#fafafa',
                                                    transition: 'background 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                                                >
                                                    <td style={{ padding: '14px', fontSize: '14px', fontWeight: '500' }}>
                                                        {new Date(record.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '14px' }}>
                                                        {record.time_in || '-'}
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '14px' }}>
                                                        {record.time_out || '-'}
                                                    </td>
                                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '6px 14px',
                                                            background: record.status === 'Present' ? '#C41E3A' :
                                                                record.status === 'Late' ? '#FF9800' :
                                                                    record.status === 'Absent' ? '#f44336' : '#2196F3',
                                                            color: 'white',
                                                            borderRadius: '14px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            display: 'inline-block'
                                                        }}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '15px', fontWeight: '700', textAlign: 'center', color: '#C41E3A' }}>
                                                        {record.hours_rendered ? `${record.hours_rendered}h` : '-'}
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '14px', color: '#666', maxWidth: '300px' }}>
                                                        {record.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {studentDetails.attendance_records.length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '80px 20px',
                                            color: '#999',
                                            background: '#fafafa',
                                            borderRadius: '12px',
                                            marginTop: '20px'
                                        }}>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}>
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No attendance records found</div>
                                            <div style={{ fontSize: '15px' }}>This student hasn't logged any attendance yet</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Terminate Internship Modal */}
                {showTerminateModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                                Terminate Internship
                            </h2>
                            <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
                                You are about to terminate <strong>{terminateStudentName}</strong>'s internship. This action will notify the student.
                            </p>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                                    Reason for Termination *
                                </label>
                                <textarea
                                    value={terminationReason}
                                    onChange={(e) => setTerminationReason(e.target.value)}
                                    placeholder="Please provide a detailed reason for terminating this internship..."
                                    rows="5"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#C41E3A'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowTerminateModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTerminateSubmit}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                >
                                    Terminate Internship
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}

export default SupervisorInterns;
