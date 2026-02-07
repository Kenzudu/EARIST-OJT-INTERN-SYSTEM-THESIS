import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./navbar.css";
import earistLogo from "./images/earist.png";

function SupervisorSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Call logout endpoint to log the activity
                await axios.post('http://localhost:8000/api/logout/', {}, {
                    headers: { Authorization: `Token ${token}` }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
            // Continue with logout even if API call fails
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
                <p>Supervisor Portal</p>
            </div>

            <nav className="sidebar-nav">
                <Link
                    to="/supervisor/dashboard"
                    className={`sidebar-link ${location.pathname === "/supervisor/dashboard" ? "active" : ""}`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/supervisor/profile"
                    className={`sidebar-link ${location.pathname === "/supervisor/profile" ? "active" : ""}`}
                >
                    My Profile
                </Link>
                <Link
                    to="/supervisor/internships"
                    className={`sidebar-link ${location.pathname === "/supervisor/internships" ? "active" : ""}`}
                >
                    Internship Postings
                </Link>
                <Link
                    to="/supervisor/interns"
                    className={`sidebar-link ${location.pathname === "/supervisor/interns" ? "active" : ""}`}
                >
                    My Interns
                </Link>
                <Link
                    to="/supervisor/tasks"
                    className={`sidebar-link ${location.pathname === "/supervisor/tasks" ? "active" : ""}`}
                >
                    Task Management
                </Link>
                <Link
                    to="/supervisor/attendance"
                    className={`sidebar-link ${location.pathname === "/supervisor/attendance" ? "active" : ""}`}
                >
                    Attendance Verification
                </Link>
                <Link
                    to="/supervisor/evaluations"
                    className={`sidebar-link ${location.pathname === "/supervisor/evaluations" ? "active" : ""}`}
                >
                    Performance Evaluations
                </Link>
                <Link
                    to="/supervisor/progress"
                    className={`sidebar-link ${location.pathname === "/supervisor/progress" ? "active" : ""}`}
                >
                    Progress & Documents
                </Link>
                <Link
                    to="/supervisor/journals"
                    className={`sidebar-link ${location.pathname === "/supervisor/journals" ? "active" : ""}`}
                >
                    Intern Journals
                </Link>
                <Link
                    to="/supervisor/messages"
                    className={`sidebar-link ${location.pathname === "/supervisor/messages" ? "active" : ""}`}
                >
                    Messages
                </Link>
                <Link
                    to="/supervisor/reports"
                    className={`sidebar-link ${location.pathname === "/supervisor/reports" ? "active" : ""}`}
                >
                    Reports
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

export default SupervisorSidebar;
