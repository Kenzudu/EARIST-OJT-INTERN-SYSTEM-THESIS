

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import './AdminDatabase.css';

function AdminDatabase() {
    const [activeTab, setActiveTab] = useState('backup');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [reportMode, setReportMode] = useState('result'); // 'preview' | 'result'
    const [backupStatus, setBackupStatus] = useState(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [backupMessage, setBackupMessage] = useState('');

    useEffect(() => {
        fetchStats();
        if (activeTab === 'backup') {
            fetchBackupStatus();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/admin/database/stats/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` }
            });
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const fetchBackupStatus = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/admin/backup/status/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` }
            });
            setBackupStatus(response.data);
        } catch (error) {
            console.error('Error fetching backup status:', error);
            // Set a fallback state so UI doesn't break
            setBackupStatus({
                error: true,
                message: 'Failed to load backup status. Please try again.',
                health: 'unknown'
            });
        }
    };

    const triggerManualBackup = async () => {
        setBackupLoading(true);
        setBackupMessage('');
        try {
            const response = await axios.post('http://localhost:8000/api/admin/backup/trigger/', {}, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setBackupMessage('✅ Backup completed successfully!');
                // Wait a moment before refreshing to ensure backup is written
                setTimeout(() => {
                    fetchBackupStatus();
                }, 1000);
            } else {
                setBackupMessage('⚠️ Backup completed with warnings. Check logs for details.');
                fetchBackupStatus();
            }
        } catch (error) {
            console.error('Error triggering backup:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error occurred';
            setBackupMessage(`❌ Backup failed: ${errorMsg}`);
        } finally {
            setBackupLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/admin/database/backup/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
                responseType: 'blob', // Important for file download
            });

            // Create a link to download the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.setAttribute('download', `system_backup_${timestamp}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading backup:', error);
            alert('Backup failed. See console for details.');
        }
    };

    const handleMaintenance = async (action) => {
        // Step 1: Request Preview (Dry Run)
        try {
            const response = await axios.post('http://localhost:8000/api/admin/database/maintenance/',
                { action, mode: 'preview' },
                { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
            );

            if (response.data.report) {
                setReportData(response.data.report);
                setPendingAction(action);
                setReportMode('preview'); // Enforce confirmation for all actions
                setShowReportModal(true);
            }
        } catch (error) {
            console.error('Maintenance preview error:', error);
            alert('Failed to load maintenance preview.');
        }
    };

    const executeMaintenance = async () => {
        if (!pendingAction) return;

        try {
            const response = await axios.post('http://localhost:8000/api/admin/database/maintenance/',
                { action: pendingAction, mode: 'execute' },
                { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
            );

            if (response.data.report) {
                setReportData(response.data.report);
                setReportMode('result'); // Switch to result view
                setPendingAction(null); // Clear pending action
                fetchStats(); // Refresh stats
            }
        } catch (error) {
            console.error('Maintenance execution error:', error);
            alert('Failed to execute maintenance task.');
        }
    };

    return (
        <div className="admin-database-page">
            <AdminSidebar />
            <div className="main-content">
                <div className="page-header">
                    <div>
                        <h1>Database Management</h1>
                        <p>System backups and data maintenance.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="db-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('backup')}
                    >
                        System Status & Backup
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('maintenance')}
                    >
                        Maintenance
                    </button>
                </div>

                <div className="tab-content">
                    {/* TAB 1: BACKUP & STATS */}
                    {activeTab === 'backup' && (
                        <div className="backup-section">
                            {/* Quick Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                        <span style={{ fontSize: '24px', color: 'white' }}>👥</span>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats?.users_count || 0}</span>
                                        <span className="stat-label">TOTAL USERS</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                                        <span style={{ fontSize: '24px', color: 'white' }}>📝</span>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats?.activity_logs_count || 0}</span>
                                        <span className="stat-label">LOG ENTRIES</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)' }}>
                                        <span style={{ fontSize: '24px', color: 'white' }}>💾</span>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-number">{stats?.db_size || '0 MB'}</span>
                                        <span className="stat-label">DB SIZE</span>
                                    </div>
                                </div>
                            </div>

                            {/* Backup Status Section */}
                            {backupStatus && (
                                <div className="content-card" style={{ marginBottom: '20px' }}>
                                    {backupStatus.error ? (
                                        // Error State
                                        <div style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                            background: '#fff3cd',
                                            borderRadius: '12px',
                                            border: '2px dashed #ffc107'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                marginBottom: '20px'
                                            }}>
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                </svg>
                                            </div>
                                            <h3 style={{ marginBottom: '12px', color: '#856404', fontSize: '20px', fontWeight: '600' }}>Unable to Load Backup Status</h3>
                                            <p style={{ color: '#856404', marginBottom: '24px', fontSize: '14px' }}>
                                                {backupStatus.message}
                                            </p>
                                            <button
                                                className="btn-primary"
                                                onClick={fetchBackupStatus}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '12px 24px',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="23 4 23 10 17 10"></polyline>
                                                    <polyline points="1 20 1 14 7 14"></polyline>
                                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                </svg>
                                                Try Again
                                            </button>
                                        </div>
                                    ) : (
                                        // Normal State
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <h2 style={{ margin: 0 }}>Automated Backup Status</h2>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {backupStatus.health === 'good' && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 18px',
                                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                            color: 'white',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                            GOOD
                                                        </span>
                                                    )}
                                                    {backupStatus.health === 'warning' && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 18px',
                                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                            color: 'white',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 2px 8px rgba(240, 147, 251, 0.3)'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                            </svg>
                                                            WARNING
                                                        </span>
                                                    )}
                                                    {backupStatus.health === 'critical' && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 18px',
                                                            background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
                                                            color: 'white',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 2px 8px rgba(255, 153, 102, 0.3)'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                                            </svg>
                                                            CRITICAL
                                                        </span>
                                                    )}
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={fetchBackupStatus}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="23 4 23 10 17 10"></polyline>
                                                            <polyline points="1 20 1 14 7 14"></polyline>
                                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                        </svg>
                                                        Refresh
                                                    </button>
                                                </div>
                                            </div>

                                            {backupStatus.latest_backup ? (
                                                <>
                                                    <div style={{
                                                        background: '#f8f9fa',
                                                        padding: '24px',
                                                        borderRadius: '8px',
                                                        marginBottom: '24px',
                                                        border: '1px solid #e0e0e0'
                                                    }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest Backup</div>
                                                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                                                    {backupStatus.latest_backup.date}
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: '#999' }}>
                                                                    {backupStatus.latest_backup.age_hours} hours ago
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Size</div>
                                                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                                                                    {backupStatus.latest_backup.db_size_mb} MB
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Media Files</div>
                                                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#11998e' }}>
                                                                    {backupStatus.latest_backup.media_size_mb} MB
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                                                                    {backupStatus.latest_backup.files_backed_up} files
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Backups</div>
                                                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#FF9966' }}>
                                                                    {backupStatus.backup_count}
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                                                                    {backupStatus.total_size_mb} MB total
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 7-Day History */}
                                                    <div style={{ marginBottom: '24px' }}>
                                                        <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#333', fontWeight: '600' }}>Last 7 Days</h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                                                            {backupStatus.last_7_days.map((day, index) => (
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        padding: '16px 8px',
                                                                        background: day.has_backup ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : '#f5f5f5',
                                                                        borderRadius: '10px',
                                                                        textAlign: 'center',
                                                                        border: day.has_backup ? 'none' : '2px dashed #ddd',
                                                                        transition: 'transform 0.2s',
                                                                        cursor: 'default'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        fontSize: '11px',
                                                                        color: day.has_backup ? 'rgba(255,255,255,0.9)' : '#999',
                                                                        marginBottom: '8px',
                                                                        fontWeight: '600',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.5px'
                                                                    }}>
                                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </div>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        marginBottom: '8px'
                                                                    }}>
                                                                        {day.has_backup ? (
                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    {day.has_backup && (
                                                                        <div style={{
                                                                            fontSize: '11px',
                                                                            color: 'rgba(255,255,255,0.85)',
                                                                            fontWeight: '500'
                                                                        }}>
                                                                            {day.times[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Next Expected Backup */}
                                                    {backupStatus.next_expected && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            background: '#e3f2fd',
                                                            padding: '14px 18px',
                                                            borderRadius: '8px',
                                                            borderLeft: '4px solid #2196f3',
                                                            fontSize: '14px',
                                                            color: '#1565c0'
                                                        }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            <div>
                                                                <strong>Next Expected Backup:</strong> {backupStatus.next_expected.date}
                                                                <span style={{ marginLeft: '12px', opacity: 0.8, fontSize: '13px' }}>
                                                                    (in {backupStatus.next_expected.hours_until} hours)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{
                                                    padding: '48px 40px',
                                                    textAlign: 'center',
                                                    background: '#fff3cd',
                                                    borderRadius: '12px',
                                                    border: '2px dashed #ffc107'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        marginBottom: '20px'
                                                    }}>
                                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                        </svg>
                                                    </div>
                                                    <h3 style={{ marginBottom: '12px', color: '#856404', fontSize: '20px', fontWeight: '600' }}>No Backups Found</h3>
                                                    <p style={{ color: '#856404', marginBottom: '24px', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px' }}>
                                                        {backupStatus.message}
                                                    </p>
                                                    <button
                                                        className="btn-primary"
                                                        onClick={triggerManualBackup}
                                                        disabled={backupLoading}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '12px 24px',
                                                            fontSize: '14px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="23 4 23 10 17 10"></polyline>
                                                            <polyline points="1 20 1 14 7 14"></polyline>
                                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                        </svg>
                                                        {backupLoading ? 'Creating Backup...' : 'Create First Backup'}
                                                    </button>
                                                </div>
                                            )}

                                            {backupMessage && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginTop: '20px',
                                                    padding: '14px 18px',
                                                    background: backupMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                                                    color: backupMessage.includes('✅') ? '#155724' : '#721c24',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    border: `1px solid ${backupMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                                                }}>
                                                    {backupMessage.includes('✅') ? (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    ) : (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line x1="15" y1="9" x2="9" y2="15"></line>
                                                            <line x1="9" y1="9" x2="15" y2="15"></line>
                                                        </svg>
                                                    )}
                                                    <span>{backupMessage.replace('✅', '').replace('❌', '').trim()}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="content-card backup-action-card">
                                <h2>System Backup</h2>
                                <p>Download a complete JSON dump of the system database. This includes users, profiles, internships, and application data. Regular backups are recommended.</p>
                                <div className="backup-actions">
                                    <button className="btn-primary btn-lg" onClick={handleBackup}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download System Backup
                                    </button>
                                    <span className="backup-note">Last backup: Never (Session based)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MAINTENANCE */}
                    {activeTab === 'maintenance' && (
                        <div className="maintenance-section">
                            {maintenanceMessage && (
                                <div className="alert-success">{maintenanceMessage}</div>
                            )}

                            <div className="content-card danger-zone">
                                <h2>Maintenance Tasks</h2>

                                {/* Clear Logs */}
                                <div className="task-item">
                                    <div className="task-info">
                                        <h3>Clear Old Activity Logs</h3>
                                        <p>Remove activity logs older than 30 days. This helps reduce database size.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => handleMaintenance('clear_logs')}>
                                        Clear Logs
                                    </button>
                                </div>

                                {/* Cleanup Files */}
                                <div className="task-item">
                                    <div className="task-info">
                                        <h3>Orphaned File Cleanup</h3>
                                        <p>Delete unused resumes and profile pictures from the server storage.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => handleMaintenance('cleanup_files')}>
                                        Cleanup Files
                                    </button>
                                </div>

                                {/* Archive Students */}
                                <div className="task-item">
                                    <div className="task-info">
                                        <h3>Archive Completed Students</h3>
                                        <p>Deactivate student accounts that have completed their OJT requirements.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => handleMaintenance('archive_students')}>
                                        Archive
                                    </button>
                                </div>

                                {/* Prune Accounts */}
                                <div className="task-item">
                                    <div className="task-info">
                                        <h3>Prune Unverified Accounts</h3>
                                        <p>Delete inactive accounts created over 30 days ago that never logged in.</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => handleMaintenance('prune_unverified')}>
                                        Prune
                                    </button>
                                </div>

                                {/* Integrity Check */}
                                <div className="task-item">
                                    <div className="task-info">
                                        <h3>System Health Check</h3>
                                        <p>Scan for data inconsistencies (e.g., users without roles, missing profiles).</p>
                                    </div>
                                    <button className="btn-secondary" onClick={() => handleMaintenance('integrity_check')}>
                                        Run Check
                                    </button>
                                </div>

                            </div>
                        </div>

                    )}

                    {/* Health Report Modal */}
                    {showReportModal && (
                        <div className="modal-overlay">
                            <div className="modal-content report-modal">
                                <div className="modal-header">
                                    <h2>System Health Report</h2>
                                    <button className="close-btn" onClick={() => setShowReportModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Check Name</th>
                                                <th>Status</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData?.map((item, index) => (
                                                <tr key={index} className={`status-${item.status.toLowerCase()}`}>
                                                    <td className="font-bold">{item.check}</td>
                                                    <td>
                                                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                                                            {item.status === 'Pass' && (
                                                                <>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                    PASS
                                                                </>
                                                            )}
                                                            {item.status === 'Warning' && (
                                                                <>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                                    </svg>
                                                                    WARNING
                                                                </>
                                                            )}
                                                            {item.status === 'Fail' && (
                                                                <>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                    </svg>
                                                                    FAIL
                                                                </>
                                                            )}
                                                            {item.status === 'Pending' && (
                                                                <>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                                                    </svg>
                                                                    PENDING
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td>{item.details}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="modal-footer">
                                    {reportMode === 'preview' ? (
                                        <>
                                            <button className="btn-secondary" onClick={() => setShowReportModal(false)} style={{ marginRight: '10px' }}>Cancel</button>
                                            <button className="btn-lg" onClick={executeMaintenance} style={{ minWidth: '150px', background: '#d32f2f' }}>
                                                Confirm & Execute
                                            </button>
                                        </>
                                    ) : (
                                        <button className="btn-secondary" onClick={() => setShowReportModal(false)}>Close Report</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

export default AdminDatabase;

