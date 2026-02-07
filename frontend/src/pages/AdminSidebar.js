import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./navbar.css";
import earistLogo from "./images/earist.png";

function AdminSidebar() {
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
      navigate('/login');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={earistLogo} alt="EARIST Logo" className="sidebar-logo" />
        <h2>EARIST</h2>
        <p>Admin Portal</p>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin/dashboard" className={`sidebar-link ${location.pathname === "/admin/dashboard" ? "active" : ""}`}>
          Dashboard
        </Link>
        <Link to="/admin/users" className={`sidebar-link ${location.pathname === "/admin/users" ? "active" : ""}`}>
          User Management
        </Link>
        <Link to="/admin/companies" className={`sidebar-link ${location.pathname === "/admin/companies" ? "active" : ""}`}>
          Companies
        </Link>
        <Link to="/admin/documents" className={`sidebar-link ${location.pathname === "/admin/documents" ? "active" : ""}`}>
          Documents
        </Link>
        <Link to="/admin/notices" className={`sidebar-link ${location.pathname === "/admin/notices" ? "active" : ""}`}>
          Notices
        </Link>
        <Link to="/admin/analytics" className={`sidebar-link ${location.pathname === "/admin/analytics" ? "active" : ""}`}>
          Audit Logs
        </Link>
        <Link to="/admin/messages" className={`sidebar-link ${location.pathname === "/admin/messages" ? "active" : ""}`}>
          Messages
        </Link>
        <Link to="/admin/database" className={`sidebar-link ${location.pathname === "/admin/database" ? "active" : ""}`}>
          Database
        </Link>
        <Link to="/admin/settings" className={`sidebar-link ${location.pathname === "/admin/settings" ? "active" : ""}`}>
          System Settings
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

export default AdminSidebar;

