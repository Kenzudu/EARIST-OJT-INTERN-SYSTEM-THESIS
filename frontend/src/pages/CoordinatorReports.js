import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Users, FileText, CheckCircle, Clock, Award, Building2, BarChart3 } from 'lucide-react';
import './AdminDashboard.css';
import './CoordinatorReports.css';
import CoordinatorHeader from './CoordinatorHeader';

function CoordinatorReports() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState({
        college: '',
        total_students: 0,
        total_applications: 0,
        pending_applications: 0,
        approved_applications: 0,
        rejected_applications: 0,
        active_internships: 0,
        completed_students: 0,
        completion_rate: 0,
        total_hours_rendered: 0,
        average_hours_per_student: 0,
        companies_utilized: 0,
        average_performance_rating: 0,
        current_term_placements: 0,
        top_companies: [],
        program_breakdown: []
    });

    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        checkCoordinatorAccess();
        fetchAnalytics();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator' && userRole !== 'admin') {
            setError('Access denied. Coordinators only.');
            setTimeout(() => navigate('/student/dashboard'), 1000);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/analytics/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setAnalytics(response.data);
            setError('');
        } catch (err) {
            console.error('Error loading analytics:', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to load analytics';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-container">
                <div className="admin-dashboard-main">
                    <CoordinatorHeader title="Analytics & Reports" subtitle="Loading..." />
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <CoordinatorHeader
                    title={`Analytics & Reports - ${analytics.college}`}
                    subtitle="Performance metrics and statistics for your college"
                />

                {error && <div className="alert alert-error">{error}</div>}

                {/* Key Metrics Cards */}
                <div className="metrics-grid">
                    <div className="metric-card metric-blue">
                        <div className="metric-icon">
                            <Users size={24} />
                        </div>
                        <div className="metric-content">
                            <p className="metric-label">TOTAL STUDENTS</p>
                            <h2 className="metric-value">{analytics.total_students}</h2>
                        </div>
                    </div>

                    <div className="metric-card metric-green">
                        <div className="metric-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="metric-content">
                            <p className="metric-label">ACTIVE INTERNSHIPS</p>
                            <h2 className="metric-value">{analytics.active_internships}</h2>
                        </div>
                    </div>

                    <div className="metric-card metric-orange">
                        <div className="metric-icon">
                            <Clock size={24} />
                        </div>
                        <div className="metric-content">
                            <p className="metric-label">PENDING APPLICATIONS</p>
                            <h2 className="metric-value">{analytics.pending_applications}</h2>
                        </div>
                    </div>

                    {/* <div className="metric-card metric-purple">
                        <div className="metric-icon">
                            <CheckCircle size={24} />
                        </div>
                        <div className="metric-content">
                            <p className="metric-label">COMPLETION RATE</p>
                            <h2 className="metric-value">{analytics.completion_rate}%</h2>
                        </div>
                    </div> */}
                </div>

                {/* Detailed Sections */}
                <div className="reports-grid">
                    {/* Placements & Applications */}
                    <div className="report-card">
                        <div className="report-header">
                            <FileText size={20} />
                            <h3>Placements & Applications Summary</h3>
                        </div>
                        <div className="report-content">
                            <div className="stat-row">
                                <span className="stat-label">Current Term Placements</span>
                                <span className="stat-value">{analytics.current_term_placements}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Total Applications</span>
                                <span className="stat-value">{analytics.total_applications}</span>
                            </div>
                            <div className="stat-row highlight-success">
                                <span className="stat-label">Approved Applications</span>
                                <span className="stat-value">{analytics.approved_applications}</span>
                            </div>
                            <div className="stat-row highlight-warning">
                                <span className="stat-label">Pending Applications</span>
                                <span className="stat-value">{analytics.pending_applications}</span>
                            </div>
                            <div className="stat-row highlight-danger">
                                <span className="stat-label">Rejected Applications</span>
                                <span className="stat-value">{analytics.rejected_applications}</span>
                            </div>
                        </div>
                    </div>

                    {/* Hours & Performance */}
                    {/* Hours & Performance */}
                    {/* <div className="report-card">
                        <div className="report-header">
                            <Award size={20} />
                            <h3>Hours Rendered & Performance</h3>
                        </div>
                        <div className="report-content">
                            <div className="stat-row">
                                <span className="stat-label">Total Hours Rendered</span>
                                <span className="stat-value">{analytics.total_hours_rendered.toLocaleString()} hours</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Average Hours per Student</span>
                                <span className="stat-value">{analytics.average_hours_per_student} hours</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Average Performance Rating</span>
                                <span className={`stat-badge ${analytics.average_performance_rating >= 4 ? 'badge-success' : 'badge-warning'}`}>
                                    {analytics.average_performance_rating} / 5.0
                                </span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Completed Students</span>
                                <span className="stat-value">{analytics.completed_students} of {analytics.total_students}</span>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Company Utilization */}
                <div className="report-card full-width">
                    <div className="report-header">
                        <Building2 size={20} />
                        <h3>Company Utilization</h3>
                    </div>
                    <div className="report-content">
                        <p className="company-summary">
                            <strong>{analytics.companies_utilized}</strong> companies are currently hosting students from your college
                        </p>

                        {analytics.top_companies.length > 0 && (
                            <>
                                <h4 className="subsection-title">Top 5 Companies by Student Count</h4>
                                <div className="company-list">
                                    {analytics.top_companies.map((company, index) => (
                                        <div key={index} className="company-item">
                                            <div className="company-rank">#{index + 1}</div>
                                            <div className="company-info">
                                                <span className="company-name">{company.internship__company__name || 'Unknown'}</span>
                                                <span className="company-count">{company.student_count} students</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Program Breakdown */}
                {analytics.program_breakdown.length > 0 && (
                    <div className="report-card full-width">
                        <div className="report-header">
                            <BarChart3 size={20} />
                            <h3>Student Distribution by Program</h3>
                        </div>
                        <div className="report-content">
                            <div className="program-list">
                                {analytics.program_breakdown.map((program, index) => {
                                    const percentage = ((program.count / analytics.total_students) * 100).toFixed(1);
                                    return (
                                        <div key={index} className="program-item">
                                            <div className="program-info">
                                                <span className="program-name">{program.student_profile__course || 'Not Specified'}</span>
                                                <span className="program-stats">{program.count} students ({percentage}%)</span>
                                            </div>
                                            <div className="program-bar">
                                                <div className="program-fill" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CoordinatorReports;
