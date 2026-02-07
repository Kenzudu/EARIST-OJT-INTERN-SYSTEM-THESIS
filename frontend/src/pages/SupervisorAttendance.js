import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './AdminDashboard.css';

const baseURL = 'http://localhost:8000/api';

function SupervisorAttendance() {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedIntern, setSelectedIntern] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [notes, setNotes] = useState('');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentAttendanceData, setStudentAttendanceData] = useState(null);
    const [loadingStudentAttendance, setLoadingStudentAttendance] = useState(false);
    const [hoveredStudentId, setHoveredStudentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, name, time_in, time_out, status
    const [sortOrder, setSortOrder] = useState('desc'); // asc or desc

    // Modal-specific search and sort
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSortBy, setModalSortBy] = useState('date');
    const [modalSortOrder, setModalSortOrder] = useState('desc');


    const token = localStorage.getItem('token');

    useEffect(() => {
        checkAccess();
        fetchAttendance();
        fetchInterns();
    }, []);

    const checkAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/attendance/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setAttendance(res.data);
        } catch (err) {
            setError('Failed to fetch attendance records');
        } finally {
            setLoading(false);
        }
    };

    const fetchInterns = async () => {
        try {
            const res = await axios.get(`${baseURL}/supervisor/interns/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setInterns(res.data);
        } catch (err) {
            console.error('Failed to fetch interns:', err);
        }
    };

    const handleUpdateAttendance = async (attendanceId, newStatus) => {
        try {
            setError('');
            setSuccess('');

            await axios.put(`${baseURL}/supervisor/attendance/`, {
                attendance_id: attendanceId,
                status: newStatus,
                notes: notes
            }, {
                headers: { Authorization: `Token ${token}` }
            });

            setSuccess(`Attendance ${newStatus.toLowerCase()} successfully!`);
            setEditingId(null);
            setNotes('');
            fetchAttendance();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update attendance');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return '#C41E3A';
            case 'Absent': return '#f44336';
            case 'Late': return '#FF9800';
            case 'Pending': return '#2196F3';
            default: return '#757575';
        }
    };

    const fetchStudentAttendance = async (studentId) => {
        try {
            setLoadingStudentAttendance(true);
            const res = await axios.get(`${baseURL}/supervisor/students/${studentId}/attendance/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setStudentAttendanceData(res.data);
            setShowAttendanceModal(true);
        } catch (err) {
            setError('Failed to fetch student attendance records');
        } finally {
            setLoadingStudentAttendance(false);
        }
    };

    const handleViewStudentAttendance = (studentId) => {
        setSelectedStudentId(studentId);
        fetchStudentAttendance(studentId);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            // Toggle sort order if clicking the same column
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to descending
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const handleModalSort = (column) => {
        if (modalSortBy === column) {
            setModalSortOrder(modalSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setModalSortBy(column);
            setModalSortOrder('desc');
        }
    };

    // Filter and sort modal attendance records
    const getFilteredModalAttendance = () => {
        if (!studentAttendanceData || !studentAttendanceData.attendance_records) {
            return [];
        }

        return studentAttendanceData.attendance_records
            .filter(record => {
                const searchLower = modalSearchQuery.toLowerCase();
                return modalSearchQuery === '' ||
                    (record.date && record.date.includes(modalSearchQuery)) ||
                    (record.time_in && record.time_in.toLowerCase().includes(searchLower)) ||
                    (record.time_out && record.time_out.toLowerCase().includes(searchLower)) ||
                    (record.status && record.status.toLowerCase().includes(searchLower)) ||
                    (record.notes && record.notes.toLowerCase().includes(searchLower));
            })
            .sort((a, b) => {
                let comparison = 0;

                switch (modalSortBy) {
                    case 'date':
                        comparison = new Date(a.date) - new Date(b.date);
                        break;
                    case 'time_in':
                        comparison = (a.time_in || '').localeCompare(b.time_in || '');
                        break;
                    case 'time_out':
                        comparison = (a.time_out || '').localeCompare(b.time_out || '');
                        break;
                    case 'status':
                        comparison = (a.status || '').localeCompare(b.status || '');
                        break;
                    default:
                        comparison = 0;
                }

                return modalSortOrder === 'asc' ? comparison : -comparison;
            });
    };

    const filteredAttendance = attendance
        .filter(record => {
            const matchesIntern = selectedIntern === 'all' || record.student === parseInt(selectedIntern);
            const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;

            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === '' ||
                (record.student_name && record.student_name.toLowerCase().includes(searchLower)) ||
                (record.date && record.date.includes(searchQuery)) ||
                (record.time_in && record.time_in.toLowerCase().includes(searchLower)) ||
                (record.time_out && record.time_out.toLowerCase().includes(searchLower)) ||
                (record.status && record.status.toLowerCase().includes(searchLower)) ||
                (record.notes && record.notes.toLowerCase().includes(searchLower));

            return matchesIntern && matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'name':
                    comparison = (a.student_name || '').localeCompare(b.student_name || '');
                    break;
                case 'time_in':
                    comparison = (a.time_in || '').localeCompare(b.time_in || '');
                    break;
                case 'time_out':
                    comparison = (a.time_out || '').localeCompare(b.time_out || '');
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });


    if (loading) return <div className="loading">Loading attendance...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Attendance Verification"
                    subtitle="Review and approve intern attendance records"
                />

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Search Bar */}
                <div style={{
                    marginBottom: '20px',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, date, time, status, or notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f5f5f5',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#666',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
                                onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                        <span style={{ fontWeight: '600' }}>{filteredAttendance.length}</span> record{filteredAttendance.length !== 1 ? 's' : ''} found
                        {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
                    </div>
                </div>

                {/* Filter Controls */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <label style={{ marginRight: '10px', fontWeight: '600' }}>Filter by Intern:</label>
                        <select
                            value={selectedIntern}
                            onChange={(e) => setSelectedIntern(e.target.value)}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minWidth: '200px'
                            }}
                        >
                            <option value="all">All Interns</option>
                            {interns.map(intern => (
                                <option key={intern.id} value={intern.id}>
                                    {intern.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ marginRight: '10px', fontWeight: '600' }}>Filter by Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minWidth: '150px'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                        </select>
                    </div>
                </div>

                {/* Attendance Records */}
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {filteredAttendance.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            No attendance records found
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                                        <th
                                            onClick={() => handleSort('date')}
                                            style={{
                                                padding: '15px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Date
                                                {sortBy === 'date' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                        {sortOrder === 'asc' ? (
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        ) : (
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('name')}
                                            style={{
                                                padding: '15px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Intern
                                                {sortBy === 'name' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                        {sortOrder === 'asc' ? (
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        ) : (
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('time_in')}
                                            style={{
                                                padding: '15px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Time In
                                                {sortBy === 'time_in' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                        {sortOrder === 'asc' ? (
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        ) : (
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('time_out')}
                                            style={{
                                                padding: '15px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Time Out
                                                {sortBy === 'time_out' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                        {sortOrder === 'asc' ? (
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        ) : (
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('status')}
                                            style={{
                                                padding: '15px',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                Status
                                                {sortBy === 'status' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                        {sortOrder === 'asc' ? (
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        ) : (
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        )}
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Notes</th>
                                        <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendance.map(record => (
                                        <tr key={record.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '15px' }}>
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '15px',
                                                    fontWeight: '500',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={() => setHoveredStudentId(record.student)}
                                                onMouseLeave={() => setHoveredStudentId(null)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span>{record.student_name || 'Unknown'}</span>
                                                    {hoveredStudentId === record.student && (
                                                        <button
                                                            onClick={() => handleViewStudentAttendance(record.student)}
                                                            style={{
                                                                padding: '4px 10px',
                                                                background: '#2196F3',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#1976D2'}
                                                            onMouseLeave={(e) => e.target.style.background = '#2196F3'}
                                                        >
                                                            📋 View All
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {record.time_in || '-'}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {record.time_out || '-'}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background: getStatusColor(record.status),
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', maxWidth: '200px' }}>
                                                {editingId === record.id ? (
                                                    <input
                                                        type="text"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Add notes..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            fontSize: '13px'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                                        {record.notes || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                {record.status === 'Pending' ? (
                                                    editingId === record.id ? (
                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleUpdateAttendance(record.id, 'Present')}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: '#C41E3A',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateAttendance(record.id, 'Late')}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: '#FF9800',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Late
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateAttendance(record.id, 'Absent')}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: '#f44336',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                × Reject
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(null);
                                                                    setNotes('');
                                                                }}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: '#757575',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(record.id);
                                                                setNotes(record.notes || '');
                                                            }}
                                                            style={{
                                                                padding: '6px 16px',
                                                                background: '#2196F3',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            Review
                                                        </button>
                                                    )
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '0.85rem' }}>Verified</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Student Attendance Modal with Vector Icons */}
                {showAttendanceModal && studentAttendanceData && (
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
                                            {/* User Icon */}
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                                                Student Overview
                                            </h2>
                                        </div>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', opacity: 0.95 }}>
                                            {studentAttendanceData.student_name}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <span>{studentAttendanceData.student_email}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span>{studentAttendanceData.student_id_number}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                                </svg>
                                                <span>{studentAttendanceData.course}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9, marginTop: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                </svg>
                                                <span>{studentAttendanceData.position}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                </svg>
                                                <span>{studentAttendanceData.company_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAttendanceModal(false);
                                            setStudentAttendanceData(null);
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

                            {/* Progress Overview Section */}
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
                                            {studentAttendanceData.progress_percentage}%
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '28px',
                                        background: '#e0e0e0',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            width: `${studentAttendanceData.progress_percentage}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #C41E3A 0%, #A01729 100%)',
                                            transition: 'width 0.5s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            paddingRight: '12px'
                                        }}>
                                            <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>
                                                {studentAttendanceData.total_hours}h / {studentAttendanceData.required_hours}h
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
                                            {studentAttendanceData.total_hours}
                                        </div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px' }}>
                                            of {studentAttendanceData.required_hours} required
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
                                            {studentAttendanceData.present_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            of {studentAttendanceData.total_records} records
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
                                            {studentAttendanceData.late_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            {studentAttendanceData.attendance_hours}h from attendance
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
                                            {studentAttendanceData.absent_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            {studentAttendanceData.journal_hours}h from journals
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
                                            {studentAttendanceData.completed_tasks}/{studentAttendanceData.total_tasks}
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
                                            {studentAttendanceData.journal_count}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                                            entries submitted
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Sheet Table */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
                                {/* Search Bar in Modal */}
                                <div style={{
                                    marginBottom: '20px',
                                    background: '#f8f9fa',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search by date, time, status, or notes..."
                                            value={modalSearchQuery}
                                            onChange={(e) => setModalSearchQuery(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 14px',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                        />
                                        {modalSearchQuery && (
                                            <button
                                                onClick={() => setModalSearchQuery('')}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#e0e0e0',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#666',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#d0d0d0'}
                                                onMouseLeave={(e) => e.target.style.background = '#e0e0e0'}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                                        <span style={{ fontWeight: '600' }}>{getFilteredModalAttendance().length}</span> of {studentAttendanceData.attendance_records.length} records
                                        {modalSearchQuery && <span> matching "<strong>{modalSearchQuery}</strong>"</span>}
                                    </div>
                                </div>

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
                                                <th
                                                    onClick={() => handleModalSort('date')}
                                                    style={{
                                                        padding: '14px',
                                                        textAlign: 'left',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        Date
                                                        {modalSortBy === 'date' && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                                {modalSortOrder === 'asc' ? (
                                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                                ) : (
                                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                                )}
                                                            </svg>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    onClick={() => handleModalSort('time_in')}
                                                    style={{
                                                        padding: '14px',
                                                        textAlign: 'left',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        Time In
                                                        {modalSortBy === 'time_in' && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                                {modalSortOrder === 'asc' ? (
                                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                                ) : (
                                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                                )}
                                                            </svg>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    onClick={() => handleModalSort('time_out')}
                                                    style={{
                                                        padding: '14px',
                                                        textAlign: 'left',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        Time Out
                                                        {modalSortBy === 'time_out' && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                                {modalSortOrder === 'asc' ? (
                                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                                ) : (
                                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                                )}
                                                            </svg>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    onClick={() => handleModalSort('status')}
                                                    style={{
                                                        padding: '14px',
                                                        textAlign: 'center',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#e8e8e8'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        Status
                                                        {modalSortBy === 'status' && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="3">
                                                                {modalSortOrder === 'asc' ? (
                                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                                ) : (
                                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                                )}
                                                            </svg>
                                                        )}
                                                    </div>
                                                </th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Hours</th>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredModalAttendance().map((record, index) => (
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
                                                            background: getStatusColor(record.status),
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
                                    {getFilteredModalAttendance().length === 0 && (
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
                                            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                                {modalSearchQuery ? 'No matching records found' : 'No attendance records found'}
                                            </div>
                                            <div style={{ fontSize: '15px' }}>
                                                {modalSearchQuery ? 'Try a different search term' : "This student hasn't logged any attendance yet"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


export default SupervisorAttendance;
