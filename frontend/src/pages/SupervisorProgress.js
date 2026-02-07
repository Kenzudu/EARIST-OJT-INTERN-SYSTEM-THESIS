import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './AdminDashboard.css';

const baseURL = 'http://localhost:8000/api';

function SupervisorProgress() {
    const navigate = useNavigate();
    const [interns, setInterns] = useState([]);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        student_id: '',
        document_type: 'Approval',
        title: '',
        description: '',
        document_file: null,
        is_official: true
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkAccess();
        fetchInterns();
        fetchDocuments();
    }, []);

    const checkAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchInterns = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/interns/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setInterns(res.data.filter(intern => intern.status === 'Approved'));
        } catch (err) {
            setError('Failed to fetch interns');
        } finally {
            setLoading(false);
        }
    };

    const fetchProgressData = async (studentId) => {
        try {
            const res = await axios.get(`${baseURL}/supervisor/students/${studentId}/progress/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setProgressData(res.data);
        } catch (err) {
            setError('Failed to fetch progress data');
        }
    };

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${baseURL}/supervisor/documents/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const handleInternSelect = (intern) => {
        setSelectedIntern(intern);
        fetchProgressData(intern.id);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');

            const formData = new FormData();
            formData.append('student_id', uploadForm.student_id);
            formData.append('document_type', uploadForm.document_type);
            formData.append('title', uploadForm.title);
            formData.append('description', uploadForm.description);
            formData.append('document_file', uploadForm.document_file);
            formData.append('is_official', uploadForm.is_official);

            await axios.post(`${baseURL}/supervisor/documents/`, formData, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess('Document uploaded successfully!');
            setShowUploadModal(false);
            setUploadForm({
                student_id: '',
                document_type: 'Approval',
                title: '',
                description: '',
                document_file: null,
                is_official: true
            });
            fetchDocuments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload document');
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            await axios.delete(`${baseURL}/supervisor/documents/${documentId}/delete/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Document deleted successfully!');
            fetchDocuments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete document');
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#43e97b';
        if (percentage >= 50) return '#4facfe';
        if (percentage >= 25) return '#ff9f40';
        return '#f5576c';
    };

    // Filter interns based on search query
    const filteredInterns = interns.filter(intern => {
        const searchLower = searchQuery.toLowerCase();
        return (
            intern.name?.toLowerCase().includes(searchLower) ||
            intern.student_id?.toLowerCase().includes(searchLower) ||
            intern.course?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Progress & Documents"
                    subtitle="Track intern progress and manage completion documents"
                />

                {error && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)'
                    }}>
                        {success}
                    </div>
                )}

                {/* Interns Selection */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>Select Intern</h2>
                        <div style={{ position: 'relative', width: '300px' }}>
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
                                placeholder="Search by name, ID, or course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    {filteredInterns.length === 0 ? (
                        <div style={{
                            padding: '60px 40px',
                            textAlign: 'center',
                            color: '#718096',
                            background: '#f7fafc',
                            borderRadius: '12px',
                            border: '2px dashed #e2e8f0'
                        }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                                {searchQuery ? 'No interns found matching your search' : 'No approved interns yet'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                            {filteredInterns.map((intern) => (
                                <div
                                    key={intern.id}
                                    onClick={() => handleInternSelect(intern)}
                                    style={{
                                        padding: '20px',
                                        background: selectedIntern?.id === intern.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
                                        border: `2px solid ${selectedIntern?.id === intern.id ? '#667eea' : '#e2e8f0'}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        color: selectedIntern?.id === intern.id ? 'white' : '#1a202c'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedIntern?.id !== intern.id) {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>{intern.name}</h3>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', opacity: 0.9 }}>ID: {intern.student_id}</p>
                                    {intern.course && (
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{intern.course}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress Data & Dashboard UI */}
                {progressData && (
                    <div style={{ marginTop: '30px', fontFamily: '"Inter", sans-serif' }}>

                        {/* 1. Student Header Card */}
                        <div style={{
                            background: '#C41E3A',
                            borderRadius: '12px 12px 0 0',
                            padding: '30px',
                            color: 'white',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Student Details</h2>
                            </div>

                            <h1 style={{ margin: '0 0 15px 0', fontSize: '1.8rem', fontWeight: '700' }}>{progressData.student_name}</h1>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.9rem', opacity: 0.9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    {progressData.student_email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    {selectedIntern?.student_id || 'N/A'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    {selectedIntern?.course || '-'}
                                </div>
                            </div>
                            {selectedIntern?.company_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', opacity: 0.9, marginTop: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"></path><path d="M5 21V7l8-4 8 4v14"></path><path d="M17 21v-8H7v8"></path></svg>
                                    {selectedIntern.company_name}
                                </div>
                            )}
                        </div>

                        {/* 2. Dashboard Stats & Charts */}
                        <div style={{ background: 'white', borderRadius: '0 0 12px 12px', padding: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Overall Progress</h3>
                                <span style={{ color: '#C41E3A', fontWeight: '700' }}>{progressData.progress_percentage}%</span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ height: '24px', background: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                                <div style={{ width: `${progressData.progress_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #C41E3A 0%, #ef4444 100%)', transition: 'width 1s ease-in-out', borderRadius: '12px' }}></div>
                            </div>

                            {/* Stats Cards Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' }}>

                                {/* Total Hours */}
                                <div style={{ background: '#b91c1c', borderRadius: '12px', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(185, 28, 28, 0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Total Hours</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1 }}>{Math.floor(progressData.total_hours)}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>of {progressData.required_hours} required</div>
                                    </div>
                                </div>

                                {/* Present */}
                                <div style={{ background: 'white', border: '2px solid #C41E3A', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C41E3A' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Present</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, color: '#C41E3A' }}>{progressData.present_count}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>of {progressData.attendance_records_count || 0} records</div>
                                    </div>
                                </div>

                                {/* Late */}
                                <div style={{ background: 'white', border: '2px solid #f59e0b', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Late</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, color: '#f59e0b' }}>{progressData.late_count}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{progressData.late_hours}h from attendance</div>
                                    </div>
                                </div>

                                {/* Absent */}
                                <div style={{ background: 'white', border: '2px solid #ef4444', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Absent</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, color: '#ef4444' }}>{progressData.absent_count}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Missed days</div>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div style={{ background: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tasks</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, color: '#3b82f6' }}>
                                            {progressData.tasks_completed}<span style={{ fontSize: '1.25rem', color: '#9ca3af', fontWeight: '500' }}>/{progressData.tasks_total || 0}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>completed</div>
                                    </div>
                                </div>

                                {/* Journals */}
                                <div style={{ background: 'white', border: '2px solid #8b5cf6', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', height: '110px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Journals</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, color: '#8b5cf6' }}>{progressData.journal_entries_count}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>entries ({progressData.journal_hours}h reported)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Sheet */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1f2937' }}>Attendance Sheet</h3>
                                </div>

                                {progressData.attendance_records && progressData.attendance_records.length > 0 ? (
                                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead style={{ background: '#f9fafb' }}>
                                                <tr>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Time In</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Time Out</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Hours</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {progressData.attendance_records.map((record, index) => (
                                                    <tr key={record.id} style={{ borderBottom: index < progressData.attendance_records.length - 1 ? '1px solid #e5e7eb' : 'none', background: 'white' }}>
                                                        <td style={{ padding: '16px', color: '#1f2937', fontWeight: '500' }}>{new Date(record.date).toLocaleDateString()}</td>
                                                        <td style={{ padding: '16px', color: '#4b5563' }}>{record.time_in || '-'}</td>
                                                        <td style={{ padding: '16px', color: '#4b5563' }}>{record.time_out || '-'}</td>
                                                        <td style={{ padding: '16px' }}>
                                                            <span style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '9999px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '700',
                                                                background: record.status === 'Present' ? '#C41E3A' : record.status === 'Late' ? '#f59e0b' : '#ef4444',
                                                                color: 'white'
                                                            }}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '16px', fontWeight: '700', color: '#C41E3A' }}>{record.hours_rendered}h</td>
                                                        <td style={{ padding: '16px', color: '#6b7280', fontSize: '0.85rem' }}>{record.remarks || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
                                        No attendance records found for this student.
                                    </div>
                                )}
                            </div>

                            {/* Recent Journals */}
                            {progressData.journals && progressData.journals.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1f2937' }}>Recent Journals</h3>
                                    </div>
                                    <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                                        {progressData.journals.map((journal) => (
                                            <div key={journal.id} style={{
                                                padding: '16px',
                                                background: '#f9fafb',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #667eea',
                                                border: '1px solid #e5e7eb',
                                                borderLeftWidth: '4px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                                        {new Date(journal.date).toLocaleDateString()}
                                                    </span>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        background: '#43e97b',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {journal.hours_rendered} hrs
                                                    </span>
                                                </div>
                                                <p style={{ margin: '0 0 8px 0', color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                    <strong>Activities:</strong> {journal.activities}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Documents Section */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>Uploaded Documents</h2>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload Document
                        </button>
                    </div>

                    {documents.length === 0 ? (
                        <div style={{
                            padding: '60px 40px',
                            textAlign: 'center',
                            color: '#718096',
                            background: '#f7fafc',
                            borderRadius: '12px',
                            border: '2px dashed #e2e8f0'
                        }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {documents.map((doc) => (
                                <div key={doc.id} style={{
                                    padding: '20px',
                                    background: '#f7fafc',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    transition: 'all 0.3s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background: '#667eea',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {doc.document_type}
                                                </span>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1a202c' }}>
                                                    {doc.title}
                                                </h3>
                                            </div>
                                            <p style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '0.9rem' }}>
                                                Student: {doc.student_name}
                                            </p>
                                            {doc.description && (
                                                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '0.85rem' }}>
                                                    {doc.description}
                                                </p>
                                            )}
                                            <p style={{ margin: 0, color: '#a0aec0', fontSize: '0.8rem' }}>
                                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a
                                                href={doc.document_file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#4facfe',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Download
                                            </a>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#f5576c',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '40px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#1a202c' }}>
                                    Upload Document
                                </h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    style={{
                                        background: '#f7fafc',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        cursor: 'pointer',
                                        fontSize: '20px',
                                        color: '#718096'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleUploadSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a202c' }}>
                                        Select Student *
                                    </label>
                                    <select
                                        value={uploadForm.student_id}
                                        onChange={(e) => setUploadForm({ ...uploadForm, student_id: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px'
                                        }}
                                    >
                                        <option value="">Choose a student...</option>
                                        {interns.map(intern => (
                                            <option key={intern.id} value={intern.id}>
                                                {intern.name} ({intern.student_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a202c' }}>
                                        Document Type *
                                    </label>
                                    <select
                                        value={uploadForm.document_type}
                                        onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px'
                                        }}
                                    >
                                        <option value="Approval">Approval Document</option>
                                        <option value="Training Plan">Training Plan</option>
                                        <option value="Template">Template</option>
                                        <option value="Certificate">Certificate</option>
                                        <option value="Completion">Completion Form</option>
                                        <option value="Evaluation">Evaluation Form</option>
                                        <option value="Recommendation">Recommendation Letter</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a202c' }}>
                                        Document Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        required
                                        placeholder="e.g., Internship Completion Certificate"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a202c' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                        rows="3"
                                        placeholder="Additional notes about this document..."
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a202c' }}>
                                        Upload File *
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setUploadForm({ ...uploadForm, document_file: e.target.files[0] })}
                                        required
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px'
                                        }}
                                    />
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>
                                        Accepted formats: PDF, DOC, DOCX, JPG, PNG
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(false)}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#f7fafc',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#4a5568'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 32px',
                                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            boxShadow: '0 4px 12px rgba(67, 233, 123, 0.4)'
                                        }}
                                    >
                                        Upload Document
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

export default SupervisorProgress;
