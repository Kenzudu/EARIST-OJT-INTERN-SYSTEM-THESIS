import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import SupervisorHeader from "./SupervisorHeader";
import useNotificationPolling from "../hooks/useNotificationPolling";
import useNotificationSound from "../hooks/useNotificationSound";

function SupervisorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [stats, setStats] = useState({
        total_interns: 0,
        pending_tasks: 0,
        pending_attendance: 0,
        pending_evaluations: 0
    });

    // Notification polling now handled globally in App.js
    // useNotificationPolling();

    // Get notification sound function for testing
    const playNotification = useNotificationSound();

    useEffect(() => {
        checkSupervisorAccess();
        fetchDashboardData();
    }, []);

    const checkSupervisorAccess = () => {
        try {
            const user = localStorage.getItem("user");
            const token = localStorage.getItem("token");
            const userRole = localStorage.getItem("userRole");

            if (!user || !token) {
                setError("Access denied. Please log in.");
                setTimeout(() => navigate("/login"), 1000);
                return;
            }

            if (userRole !== 'supervisor') {
                setError("Access denied. Supervisors only.");
                setTimeout(() => navigate("/student/dashboard"), 1000);
                return;
            }

            setLoading(false);
        } catch (err) {
            console.error("Supervisor check error:", err);
            setError("Authentication error.");
            setTimeout(() => navigate("/login"), 1000);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/supervisor/dashboard/', {
                headers: { Authorization: `Token ${token}` }
            });

            const data = response.data;
            setCompanyName(data.company_name || "Not Assigned");
            setStats({
                total_interns: data.total_interns || 0,
                pending_tasks: data.pending_tasks || 0,
                pending_attendance: data.pending_attendance || 0,
                pending_evaluations: data.pending_evaluations || 0
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
    };

    const statCards = [
        { value: stats.total_interns, label: 'My Interns', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { value: stats.pending_tasks, label: 'Pending Tasks', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { value: stats.pending_attendance, label: 'Pending Attendance', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { value: stats.pending_evaluations, label: 'Pending Evaluations', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    ];

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Company Supervisor Dashboard"
                    subtitle={`Manage your assigned interns at ${companyName}`}
                />

                {error && <div className="error-banner">{error}</div>}
                {loading && <div className="loading">Loading...</div>}

                {!loading && !error && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            {statCards.map((card, index) => (
                                <div
                                    key={index}
                                    style={{
                                        background: card.gradient,
                                        padding: '32px',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                        color: 'white',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                    }}
                                >
                                    <div style={{ fontSize: '3.2rem', fontWeight: '700', marginBottom: '12px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {card.value}
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', opacity: 0.95, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        {card.label}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        top: '-50%',
                                        right: '-20%',
                                        width: '200px',
                                        height: '200px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        pointerEvents: 'none'
                                    }} />
                                </div>
                            ))}
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a202c', marginBottom: '24px' }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                            {[
                                { title: 'My Interns', desc: 'View and manage your assigned interns', action: () => navigate("/supervisor/interns"), color: '#667eea' },
                                { title: 'Manage Tasks', desc: 'Assign and track intern tasks and assignments', action: () => navigate("/supervisor/tasks"), color: '#f5576c' },
                                { title: 'Attendance', desc: 'Verify and approve intern attendance records', action: () => navigate("/supervisor/attendance"), color: '#4facfe' },
                                { title: 'Evaluations', desc: 'Submit performance evaluations for interns', action: () => navigate("/supervisor/evaluations"), color: '#43e97b' },
                                { title: 'Review Journals', desc: 'Read and provide feedback on daily journals', action: () => navigate("/supervisor/journals"), color: '#ff9f40' },
                                { title: 'Reports', desc: 'Generate and download intern progress reports', action: () => navigate("/supervisor/reports"), color: '#9966ff' }
                            ].map((card, index) => (
                                <div
                                    key={index}
                                    onClick={card.action}
                                    style={{
                                        background: 'white',
                                        padding: '28px',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: '2px solid transparent',
                                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = card.color;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1a202c' }}>{card.title}</h3>
                                    <p style={{ margin: '0 0 20px 0', color: '#718096', fontSize: '0.95rem', lineHeight: '1.6' }}>{card.desc}</p>
                                    <button
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: card.color,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.95rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.9';
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        Open
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
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

export default SupervisorDashboard;
