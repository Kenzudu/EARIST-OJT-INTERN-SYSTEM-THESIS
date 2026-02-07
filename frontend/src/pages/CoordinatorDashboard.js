import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import CoordinatorHeader from "./CoordinatorHeader";
import useNotificationPolling from "../hooks/useNotificationPolling";
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';


// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function CoordinatorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCompanies: 0,
        pendingApplications: 0,
        activeInternships: 0
    });

    // Chart data state
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    // Chart type state (line, bar, pie)
    const [chartType, setChartType] = useState('line');

    // Notification polling handled in App.js

    useEffect(() => {
        checkCoordinatorAccess();
        fetchDashboardStats();
    }, []);

    const checkCoordinatorAccess = () => {
        try {
            const user = localStorage.getItem("user");
            const token = localStorage.getItem("token");
            const userRole = localStorage.getItem("userRole");

            if (!user || !token) {
                setError("Access denied. Please log in.");
                setTimeout(() => navigate("/login"), 1000);
                return;
            }

            if (userRole !== 'coordinator' && userRole !== 'admin') {
                setError("Access denied. Coordinators only.");
                setTimeout(() => navigate("/student/dashboard"), 1000);
                return;
            }

            setLoading(false);
        } catch (err) {
            console.error("Coordinator check error:", err);
            setError("Authentication error.");
            setTimeout(() => navigate("/login"), 1000);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8000/api/coordinator/dashboard/", {
                headers: { Authorization: `Token ${token}` }
            });

            const currentStats = {
                totalStudents: response.data.total_students || 0,
                totalCompanies: response.data.total_companies || 0,
                pendingApplications: response.data.pending_applications || 0,
                activeInternships: response.data.active_internships || 0
            };

            setStats(currentStats);

            // Prepare chart data (last 6 months)
            const months = ['July', 'August', 'September', 'October', 'November', 'December'];

            // Generate trend data (in a real app, this would come from the backend)
            const studentsData = months.map((_, index) =>
                Math.max(0, currentStats.totalStudents - (5 - index) * 10)
            );
            const companiesData = months.map((_, index) =>
                Math.max(0, currentStats.totalCompanies - (5 - index) * 2)
            );
            const pendingData = months.map((_, index) =>
                Math.max(0, currentStats.pendingApplications + Math.floor(Math.random() * 10 - 5))
            );
            const activeData = months.map((_, index) =>
                Math.max(0, currentStats.activeInternships - (5 - index) * 5)
            );

            setChartData({
                labels: months,
                datasets: [
                    {
                        label: 'Total Students',
                        data: studentsData,
                        borderColor: '#36A2EB', // Blue
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Partner Companies',
                        data: companiesData,
                        borderColor: '#FF9F40', // Orange
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Pending Applications',
                        data: pendingData,
                        borderColor: '#FF6384', // Red
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Active Internships',
                        data: activeData,
                        borderColor: '#4BC0C0', // Green
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            });
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            // Keep default values if fetch fails
        }
    };

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <CoordinatorHeader
                    title="Coordinator Dashboard"
                    subtitle="Manage students, companies, and internship placements"
                />

                {error && <div className="error-banner">{error}</div>}
                {loading && <div className="loading">Loading...</div>}

                {!loading && !error && (
                    <>
                        {/* Statistics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            {[
                                { value: stats.totalStudents, label: 'Total Students', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                { value: stats.totalCompanies, label: 'Partner Companies', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                                { value: stats.pendingApplications, label: 'Pending Applications', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                                { value: stats.activeInternships, label: 'Active Internships', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
                            ].map((card, index) => (
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

                        {/* Trends Chart */}
                        <div className="chart-header">
                            <div className="section-title">Trends Overview</div>
                            <div className="chart-toggle-buttons">
                                <button
                                    className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                                    onClick={() => setChartType('line')}
                                >
                                    Line
                                </button>
                                <button
                                    className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                                    onClick={() => setChartType('bar')}
                                >
                                    Bar
                                </button>
                                <button
                                    className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
                                    onClick={() => setChartType('pie')}
                                >
                                    Pie
                                </button>
                            </div>
                        </div>
                        <div className="chart-container">
                            {chartType === 'line' && (
                                <Line
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                                labels: {
                                                    usePointStyle: true,
                                                    padding: 15
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Key Metrics Over Time (Last 6 Months)',
                                                font: {
                                                    size: 16,
                                                    weight: 'bold'
                                                }
                                            },
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    precision: 0
                                                }
                                            }
                                        },
                                        interaction: {
                                            mode: 'nearest',
                                            axis: 'x',
                                            intersect: false
                                        }
                                    }}
                                />
                            )}
                            {chartType === 'bar' && (
                                <Bar
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                                labels: {
                                                    usePointStyle: true,
                                                    padding: 15
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Key Metrics Comparison (Last 6 Months)',
                                                font: {
                                                    size: 16,
                                                    weight: 'bold'
                                                }
                                            },
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    precision: 0
                                                }
                                            }
                                        }
                                    }}
                                />
                            )}
                            {chartType === 'pie' && (
                                <Pie
                                    data={{
                                        labels: ['Total Students', 'Partner Companies', 'Pending Applications', 'Active Internships'],
                                        datasets: [{
                                            data: [
                                                stats.totalStudents,
                                                stats.totalCompanies,
                                                stats.pendingApplications,
                                                stats.activeInternships
                                            ],
                                            backgroundColor: [
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(76, 175, 80, 0.6)'
                                            ],
                                            borderColor: [
                                                'rgb(75, 192, 192)',
                                                'rgb(255, 159, 64)',
                                                'rgb(255, 99, 132)',
                                                'rgb(76, 175, 80)'
                                            ],
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: {
                                                    usePointStyle: true,
                                                    padding: 15
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Current Metrics Distribution',
                                                font: {
                                                    size: 16,
                                                    weight: 'bold'
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        const label = context.label || '';
                                                        const value = context.parsed || 0;
                                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                        const percentage = ((value / total) * 100).toFixed(1);
                                                        return `${label}: ${value} (${percentage}%)`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            )}
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

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .stat-card {
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                    border-left: 4px solid #4CAF50;
                }

                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .section-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .chart-container {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 40px;
                    height: 400px;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .chart-toggle-buttons {
                    display: flex;
                    gap: 10px;
                }

                .toggle-btn {
                    padding: 8px 16px;
                    border: 2px solid #e0e0e0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    color: #666;
                }

                .toggle-btn:hover {
                    border-color: #4CAF50;
                    color: #4CAF50;
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
                }

                .toggle-btn.active {
                    background: #4CAF50;
                    border-color: #4CAF50;
                    color: white;
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .action-card {
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid #e0e0e0;
                }

                .action-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                    border-color: #4CAF50;
                }

                .action-card h3 {
                    margin: 0 0 12px 0;
                    font-size: 1.2rem;
                    color: #333;
                }

                .action-card p {
                    margin: 0 0 16px 0;
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .card-button {
                    width: 100%;
                    padding: 10px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .card-button:hover {
                    background: #45a049;
                }

                .error-banner {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 15px 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #f5c6cb;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    font-size: 1.1rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}

export default CoordinatorDashboard;
