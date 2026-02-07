import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import AdminHeader from "./AdminHeader";
import useNotificationPolling from "../hooks/useNotificationPolling";
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCoordinators: 0,
    totalCompanies: 0
  });

  const [chartType, setChartType] = useState('bar');

  // Notification polling handled in App.js

  useEffect(() => {
    checkAdminAccess();
    fetchDashboardStats();
  }, []);

  const checkAdminAccess = () => {
    try {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");

      if (!user || !token) {
        setError("Access denied. Please log in.");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }

      if (userRole !== 'admin') {
        setError("Access denied. Admins only.");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("Admin check error:", err);
      setError("Authentication error.");
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/admin/dashboard/stats/", {
        headers: { Authorization: `Token ${token}` }
      });

      setStats({
        totalUsers: response.data.total_users || 0,
        totalStudents: response.data.total_students || 0,
        totalCoordinators: response.data.total_coordinators || 0,
        totalCompanies: response.data.total_companies || 0
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:8000/api/admin/backup/", {}, {
        headers: { Authorization: `Token ${token}` }
      });
      alert(`Backup created successfully!\nFile: ${res.data.backup_file}\nSize: ${res.data.file_size_mb} MB`);
    } catch (err) {
      alert("Backup failed: " + (err.response?.data?.error || err.message));
    }
  };

  const statCards = [
    { value: stats.totalUsers, label: 'Total Users', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { value: stats.totalStudents, label: 'Total Students', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { value: stats.totalCoordinators, label: 'Coordinators', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { value: stats.totalCompanies, label: 'Companies', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
  ];

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <AdminHeader
          title="Admin Dashboard"
          subtitle="Manage users, roles, and system configuration"
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

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>System Overview</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['bar', 'pie', 'doughnut'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        background: chartType === type ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
                        color: chartType === type ? 'white' : '#4a5568',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize',
                        fontSize: '0.9rem'
                      }}
                      onMouseEnter={(e) => {
                        if (chartType !== type) {
                          e.currentTarget.style.background = '#edf2f7';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (chartType !== type) {
                          e.currentTarget.style.background = '#f7fafc';
                        }
                      }}
                    >
                      {type} Chart
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: '400px' }}>
                {chartType === 'bar' && (
                  <Bar
                    data={{
                      labels: ['Total Users', 'Students', 'Coordinators', 'Companies'],
                      datasets: [{
                        label: 'Count',
                        data: [stats.totalUsers, stats.totalStudents, stats.totalCoordinators, stats.totalCompanies],
                        backgroundColor: [
                          'rgba(102, 126, 234, 0.8)',
                          'rgba(245, 87, 108, 0.8)',
                          'rgba(79, 172, 254, 0.8)',
                          'rgba(67, 233, 123, 0.8)'
                        ],
                        borderColor: [
                          'rgb(102, 126, 234)',
                          'rgb(245, 87, 108)',
                          'rgb(79, 172, 254)',
                          'rgb(67, 233, 123)'
                        ],
                        borderWidth: 2,
                        borderRadius: 8
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: 'System Statistics Overview',
                          font: { size: 18, weight: 'bold' },
                          color: '#1a202c'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0, color: '#4a5568' },
                          grid: { color: '#e2e8f0' }
                        },
                        x: {
                          ticks: { color: '#4a5568' },
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                )}
                {chartType === 'pie' && (
                  <Pie
                    data={{
                      labels: ['Total Users', 'Students', 'Coordinators', 'Companies'],
                      datasets: [{
                        data: [stats.totalUsers, stats.totalStudents, stats.totalCoordinators, stats.totalCompanies],
                        backgroundColor: [
                          'rgba(102, 126, 234, 0.8)',
                          'rgba(245, 87, 108, 0.8)',
                          'rgba(79, 172, 254, 0.8)',
                          'rgba(67, 233, 123, 0.8)'
                        ],
                        borderColor: 'white',
                        borderWidth: 3
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#4a5568' }
                        },
                        title: {
                          display: true,
                          text: 'System Distribution',
                          font: { size: 18, weight: 'bold' },
                          color: '#1a202c'
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                )}
                {chartType === 'doughnut' && (
                  <Doughnut
                    data={{
                      labels: ['Total Users', 'Students', 'Coordinators', 'Companies'],
                      datasets: [{
                        data: [stats.totalUsers, stats.totalStudents, stats.totalCoordinators, stats.totalCompanies],
                        backgroundColor: [
                          'rgba(102, 126, 234, 0.8)',
                          'rgba(245, 87, 108, 0.8)',
                          'rgba(79, 172, 254, 0.8)',
                          'rgba(67, 233, 123, 0.8)'
                        ],
                        borderColor: 'white',
                        borderWidth: 3
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#4a5568' }
                        },
                        title: {
                          display: true,
                          text: 'System Composition',
                          font: { size: 18, weight: 'bold' },
                          color: '#1a202c'
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a202c', marginBottom: '24px' }}>System Administration</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                { title: 'User Management', desc: 'Manage user accounts, assign roles, and view profiles', action: () => navigate("/admin/users"), color: '#667eea' },
                { title: 'Database Backup', desc: 'Create a full backup of the system database', action: handleBackup, color: '#f5576c' },
                { title: 'Audit Logs', desc: 'View comprehensive system activity logs', action: () => navigate("/admin/audit-logs"), color: '#4facfe' },
                { title: 'System Settings', desc: 'Configure global system parameters and preferences', action: () => navigate("/admin/settings"), color: '#43e97b' }
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

export default AdminDashboard;