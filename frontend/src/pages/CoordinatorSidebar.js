import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./navbar.css";
import earistLogo from "./images/earist.png";

function CoordinatorSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.post('http://localhost:8000/api/logout/', {}, {
                    headers: { Authorization: `Token ${token}` }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            navigate('/login');
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={earistLogo} alt="EARIST Logo" className="sidebar-logo" />
                <h2>EARIST</h2>
                <p>Coordinator Portal</p>
            </div>

            <nav className="sidebar-nav">
                <Link to="/coordinator/dashboard" className={`sidebar-link ${location.pathname === "/coordinator/dashboard" ? "active" : ""}`}>
                    Dashboard
                </Link>
                <Link to="/coordinator/students" className={`sidebar-link ${location.pathname === "/coordinator/students" ? "active" : ""}`}>
                    Students
                </Link>
                <Link to="/coordinator/requirements" className={`sidebar-link ${location.pathname === "/coordinator/requirements" ? "active" : ""}`}>
                    Requirements
                </Link>
                <Link to="/coordinator/companies" className={`sidebar-link ${location.pathname === "/coordinator/companies" ? "active" : ""}`}>
                    Companies
                </Link>
                <Link to="/coordinator/applications" className={`sidebar-link ${location.pathname === "/coordinator/applications" ? "active" : ""}`}>
                    Applications
                </Link>
                <Link to="/coordinator/monitoring" className={`sidebar-link ${location.pathname === "/coordinator/monitoring" ? "active" : ""}`}>
                    Monitoring
                </Link>
                <Link to="/coordinator/documents" className={`sidebar-link ${location.pathname === "/coordinator/documents" ? "active" : ""}`}>
                    Documents
                </Link>
                <Link to="/coordinator/reports" className={`sidebar-link ${location.pathname === "/coordinator/reports" ? "active" : ""}`}>
                    Reports
                </Link>
                <Link to="/coordinator/messages" className={`sidebar-link ${location.pathname === "/coordinator/messages" ? "active" : ""}`}>
                    Messages
                </Link>
                <Link to="/coordinator/settings" className={`sidebar-link ${location.pathname === "/coordinator/settings" ? "active" : ""}`}>
                    Settings
                </Link>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
        </div>
    );
}

export default CoordinatorSidebar;
