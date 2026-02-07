import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './AdminDashboard.css';

const baseURL = 'http://localhost:8000/api';

function SupervisorJournals() {
    const navigate = useNavigate();
    const [journals, setJournals] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedIntern, setSelectedIntern] = useState('all');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJournal, setSelectedJournal] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkAccess();
        fetchJournals();
        fetchInterns();
    }, []);

    const checkAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchJournals = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/journals/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setJournals(res.data);
        } catch (err) {
            setError('Failed to fetch journals');
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

    // Filter by intern and status
    let filteredJournals = selectedIntern === 'all'
        ? journals
        : journals.filter(j => j.student === parseInt(selectedIntern));

    if (statusFilter !== 'All') {
        filteredJournals = filteredJournals.filter(j => j.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
        filteredJournals = filteredJournals.filter(j => {
            const query = searchQuery.toLowerCase();
            return (
                j.student_name?.toLowerCase().includes(query) ||
                j.activities?.toLowerCase().includes(query) ||
                j.learning_outcomes?.toLowerCase().includes(query) ||
                new Date(j.date).toLocaleDateString().toLowerCase().includes(query)
            );
        });
    }

    // Count by status
    const statusCounts = {
        All: journals.length,
        Submitted: journals.filter(j => j.status === 'Submitted').length,
        Approved: journals.filter(j => j.status === 'Approved').length,
        Rejected: journals.filter(j => j.status === 'Rejected').length
    };

    if (loading) return <div className="loading">Loading journals...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Intern Journals"
                    subtitle="Review daily journals submitted by your interns"
                />

                {error && <div className="alert alert-error">{error}</div>}

                {/* Filter Controls */}
                <div style={{ marginBottom: '20px' }}>
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

                {/* Status Filter Tabs */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '2px solid #e0e0e0', flexWrap: 'wrap' }}>
                    {['All', 'Submitted', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                background: statusFilter === status ?
                                    (status === 'Approved' ? '#43e97b' :
                                        status === 'Submitted' ? '#ffa726' :
                                            status === 'Rejected' ? '#f44336' : '#4CAF50') : 'transparent',
                                color: statusFilter === status ? 'white' : '#666',
                                fontWeight: statusFilter === status ? '600' : '400',
                                cursor: 'pointer',
                                borderBottom: statusFilter === status ? `3px solid ${status === 'Approved' ? '#43e97b' : status === 'Submitted' ? '#ffa726' : status === 'Rejected' ? '#f44336' : '#4CAF50'}` : 'none',
                                transition: 'all 0.3s ease',
                                borderRadius: '4px 4px 0 0'
                            }}
                        >
                            {status} ({statusCounts[status]})
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search by student name, activities, or date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.3s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    {searchQuery && (
                        <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                            Found {filteredJournals.length} journal{filteredJournals.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Journals List */}
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {filteredJournals.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            No journals found
                        </div>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            {filteredJournals.map(journal => (
                                <div key={journal.id} style={{
                                    padding: '20px',
                                    marginBottom: '15px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #4CAF50',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                    onClick={() => setSelectedJournal(journal)}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>
                                                {journal.student_name || 'Unknown Student'}
                                            </h3>
                                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                                {new Date(journal.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                background: journal.status === 'Approved' ? '#43e97b' :
                                                    journal.status === 'Submitted' ? '#ffa726' :
                                                        journal.status === 'Rejected' ? '#f44336' : '#9e9e9e',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {journal.status}
                                            </span>
                                            <span style={{
                                                padding: '4px 12px',
                                                background: '#4CAF50',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {journal.hours_rendered || 0} hours
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{
                                        margin: '12px 0 0 0',
                                        color: '#555',
                                        lineHeight: '1.6',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {journal.activities || 'No activities provided'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Journal Detail Modal */}
                {selectedJournal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                        onClick={() => setSelectedJournal(null)}
                    >
                        <div style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '30px',
                            maxWidth: '700px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h2 style={{ margin: 0 }}>Daily Journal Entry</h2>
                                        <span style={{
                                            padding: '6px 14px',
                                            background: selectedJournal.status === 'Approved' ? '#43e97b' :
                                                selectedJournal.status === 'Submitted' ? '#ffa726' :
                                                    selectedJournal.status === 'Rejected' ? '#f44336' : '#9e9e9e',
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            {selectedJournal.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0', color: '#666' }}>
                                        {selectedJournal.student_name} - {new Date(selectedJournal.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedJournal(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{
                                        padding: '15px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Hours Rendered</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>
                                            {selectedJournal.hours_rendered || 0}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '15px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Date</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                                            {new Date(selectedJournal.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Activities Performed</h3>
                                    <div style={{
                                        padding: '15px',
                                        background: '#f9f9f9',
                                        borderRadius: '8px',
                                        lineHeight: '1.6',
                                        color: '#555',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedJournal.activities || 'No activities provided'}
                                    </div>
                                </div>

                                {selectedJournal.learning_outcomes && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Learning Outcomes</h3>
                                        <div style={{
                                            padding: '15px',
                                            background: '#f9f9f9',
                                            borderRadius: '8px',
                                            lineHeight: '1.6',
                                            color: '#555',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedJournal.learning_outcomes}
                                        </div>
                                    </div>
                                )}

                                {selectedJournal.supervisor_comment && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Supervisor Comment</h3>
                                        <div style={{
                                            padding: '15px',
                                            background: '#fff3cd',
                                            borderRadius: '8px',
                                            lineHeight: '1.6',
                                            color: '#856404',
                                            border: '1px solid #ffeaa7',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedJournal.supervisor_comment}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Supervisor Comment */}
                            {selectedJournal.status === 'Submitted' && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Supervisor Comment (Optional)</h3>
                                    <textarea
                                        id="supervisor-comment"
                                        placeholder="Add your feedback or comments..."
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            minHeight: '80px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                {selectedJournal.status === 'Submitted' && (
                                    <>
                                        <button
                                            onClick={async () => {
                                                const comment = document.getElementById('supervisor-comment').value;
                                                try {
                                                    await axios.put(`${baseURL}/journals/${selectedJournal.id}/`, {
                                                        status: 'Rejected',
                                                        supervisor_comment: comment
                                                    }, {
                                                        headers: { Authorization: `Token ${token}` }
                                                    });
                                                    setSelectedJournal(null);
                                                    fetchJournals();
                                                } catch (err) {
                                                    alert('Failed to reject journal: ' + (err.response?.data?.error || err.message));
                                                }
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const comment = document.getElementById('supervisor-comment').value;
                                                try {
                                                    await axios.put(`${baseURL}/journals/${selectedJournal.id}/`, {
                                                        status: 'Approved',
                                                        supervisor_comment: comment
                                                    }, {
                                                        headers: { Authorization: `Token ${token}` }
                                                    });
                                                    setSelectedJournal(null);
                                                    fetchJournals();
                                                } catch (err) {
                                                    alert('Failed to approve journal: ' + (err.response?.data?.error || err.message));
                                                }
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Approve
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedJournal(null)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#757575',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupervisorJournals;
