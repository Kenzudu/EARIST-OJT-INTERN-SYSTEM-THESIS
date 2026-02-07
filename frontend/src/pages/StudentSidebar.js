import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./navbar.css";
import "./StudentDashboard.css";
import earistLogo from "./images/earist.png";

import gridIcon from "./images/grid.png";
import userIcon from "./images/user.png";
import journalIcon from "./images/journal.png";
import supportIcon from "./images/repair-fix-repairing-icon.png";
import trainingIcon from "./images/training.png";

import gearsIcon from "./images/gears.png";
import resumeIcon from "./images/resume.png";
import jobDescIcon from "./images/job-description.png";
import generativeIcon from "./images/generative.png";


function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [internshipsDropdownOpen, setInternshipsDropdownOpen] = React.useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true);
  const [hasApprovedInternship, setHasApprovedInternship] = React.useState(false);

  React.useEffect(() => {
    const checkInternshipStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:8000/api/applications/', {
            headers: { Authorization: `Token ${token}` }
          });
          const hasApproved = response.data.some(app => app.status === 'Approved');
          setHasApprovedInternship(hasApproved);
        }
      } catch (error) {
        console.error("Error checking internship status:", error);
      }
    };
    checkInternshipStatus();
  }, []);

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
    <div
      className={`sidebar student-sidebar ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}
    // Hover disabled as requested
    // onMouseEnter={() => setIsSidebarExpanded(true)}
    // onMouseLeave={() => setIsSidebarExpanded(false)}
    >
      <div className="sidebar-header">
        <img src={earistLogo} alt="EARIST Logo" className="sidebar-logo" />
        {isSidebarExpanded && (
          <>
            <h2>EARIST</h2>
            <p>Intern Portal</p>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        <Link to="/student/dashboard" className={`sidebar-link ${location.pathname === "/student/dashboard" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={gridIcon} alt="Dashboard" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
          {isSidebarExpanded && <span>Dashboard</span>}
        </Link>
        <Link to="/student/profile" className={`sidebar-link ${location.pathname === "/student/profile" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={userIcon} alt="Profile" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
          {isSidebarExpanded && <span>My Profile</span>}
        </Link>
        <Link to="/student/applications" className={`sidebar-link ${location.pathname === "/student/applications" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={resumeIcon} alt="Applications" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
          {isSidebarExpanded && <span>My Applications</span>}
        </Link>
        {/* Search Internships Dropdown */}
        <div className="sidebar-dropdown">
          <div
            className="sidebar-link"
            onClick={() => setInternshipsDropdownOpen(!internshipsDropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarExpanded ? 'space-between' : 'center', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={jobDescIcon} alt="Internships" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
              {isSidebarExpanded && <span>Search Internships</span>}
            </div>
            {isSidebarExpanded && (
              <span style={{ fontSize: '12px', transition: 'transform 0.3s' }}>
                {internshipsDropdownOpen ? '▼' : '▶'}
              </span>
            )}
          </div>
          {internshipsDropdownOpen && isSidebarExpanded && (
            <div className="sidebar-submenu">
              <Link to="/student/internships" className={`sidebar-sublink ${location.pathname === "/student/internships" ? "active" : ""}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Browse All
              </Link>

              <Link to="/student/recommendations" className={`sidebar-sublink ${location.pathname === "/student/recommendations" ? "active" : ""}`}>
                <img src={generativeIcon} alt="AI Recommendations" style={{ width: '16px', height: '16px', marginRight: '8px', filter: 'brightness(0) invert(1)' }} />
                AI Recommendations
              </Link>
            </div>
          )}
        </div>
        {hasApprovedInternship && (
          <>
            <Link to="/student/attendance" className={`sidebar-link ${location.pathname === "/student/attendance" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {isSidebarExpanded && <span>Attendance</span>}
            </Link>
            <Link to="/student/journal" className={`sidebar-link ${location.pathname === "/student/journal" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
              <img src={journalIcon} alt="Journal" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
              {isSidebarExpanded && <span>Daily Journal</span>}
            </Link>
            <Link to="/student/tasks" className={`sidebar-link ${location.pathname === "/student/tasks" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
              <img src={gearsIcon} alt="Tasks" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
              {isSidebarExpanded && <span>My Tasks</span>}
            </Link>
            <Link to="/student/feedback" className={`sidebar-link ${location.pathname === "/student/feedback" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {isSidebarExpanded && <span>Feedback & Evaluation</span>}
            </Link>
          </>
        )}


        <Link to="/student/pre-training" className={`sidebar-link ${location.pathname === "/student/pre-training" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={trainingIcon} alt="Requirements" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
          {isSidebarExpanded && <span>Requirements</span>}
        </Link>
        <Link to="/student/document-templates" className={`sidebar-link ${location.pathname === "/student/document-templates" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {isSidebarExpanded && <span>Templates</span>}
        </Link>
        <Link to="/student/support" className={`sidebar-link ${location.pathname === "/student/support" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={supportIcon} alt="Support" style={{ width: '20px', height: '20px', marginRight: isSidebarExpanded ? '10px' : '0', filter: 'brightness(0) invert(1)' }} />
          {isSidebarExpanded && <span>Support</span>}
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default StudentSidebar;
