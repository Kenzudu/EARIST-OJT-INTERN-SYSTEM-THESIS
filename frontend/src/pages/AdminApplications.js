import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText, Clock, CheckCircle, XCircle, Download, Eye, Trash2, Check, X } from "lucide-react";
import "./AdminDashboard.css";
import "./AdminApplications.css";


function AdminApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const baseURL = "http://localhost:8000/api/";
  const mediaURL = "http://localhost:8000";

  // Helper function to get resume URL
  const getResumeUrl = (application) => {
    if (application.resume_file) {
      if (typeof application.resume_file === 'string' &&
        (application.resume_file.startsWith('http://') || application.resume_file.startsWith('https://'))) {
        return application.resume_file;
      }
      if (typeof application.resume_file === 'string') {
        if (application.resume_file.startsWith('/media/')) {
          return `${mediaURL}${application.resume_file}`;
        }
        return `${mediaURL}/media/${application.resume_file}`;
      }
    }
    if (application.resume_url) {
      return application.resume_url;
    }
    return null;
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!user || !token) {
        navigate("/login");
        return;
      }

      const userData = JSON.parse(user);
      if (!userData.is_staff) {
        navigate("/student/dashboard");
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchInternships(), fetchApplications()]);
    } catch (err) {
      console.error("Auth check error:", err);
      navigate("/login");
    }
  };

  const fetchInternships = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}internships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setInternships(res.data);
    } catch (err) {
      console.error("Error fetching internships:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}applications/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setApplications(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Unable to load applications. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const getPosition = (application) => {
    if (application.internship?.position) {
      return application.internship.position;
    }
    if (typeof application.internship === 'number' || typeof application.internship_id === 'number') {
      const internshipId = application.internship || application.internship_id;
      const internship = internships.find((i) => i.id === internshipId);
      return internship ? internship.position : "Unknown Position";
    }
    return "Unknown Position";
  };

  const getCompanyName = (application) => {
    if (application.internship?.company_name) {
      return application.internship.company_name;
    }
    if (application.internship?.company?.name) {
      return application.internship.company.name;
    }
    if (typeof application.internship === 'number' || typeof application.internship_id === 'number') {
      const internshipId = application.internship || application.internship_id;
      const internship = internships.find((i) => i.id === internshipId);
      return internship?.company?.name || internship?.company_name || "Unknown Company";
    }
    return "Unknown Company";
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this application?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${baseURL}applications/${id}/`,
        { status: "Approved" },
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess("Application approved successfully!");
      fetchApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to approve application.");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this application?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${baseURL}applications/${id}/`,
        { status: "Rejected" },
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess("Application rejected successfully!");
      fetchApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to reject application.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application permanently?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}applications/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSuccess("Application deleted successfully!");
      fetchApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete application.");
    }
  };

  const filteredApplications = useMemo(() => {
    if (filterStatus === "All") return applications;
    return applications.filter((app) => app.status === filterStatus);
  }, [applications, filterStatus]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseURL}export/applications/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export applications.");
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-dashboard-main">
          <div className="page-header"><h1>Applications Management</h1><p>Review, approve, and manage student internship applications</p></div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <div className="page-header-with-action">
          <div className="page-header">
            <h1>Applications Management</h1>
            <p>Review, approve, and manage student internship applications</p>
          </div>
          <button onClick={handleExport} className="btn-export">
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics Cards */}
        <div className="metrics-grid">
          <div className="metric-card metric-blue">
            <div className="metric-icon">
              <FileText size={24} />
            </div>
            <div className="metric-content">
              <p className="metric-label">TOTAL APPLICATIONS</p>
              <h2 className="metric-value">{applications.length}</h2>
            </div>
          </div>

          <div className="metric-card metric-orange">
            <div className="metric-icon">
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <p className="metric-label">PENDING</p>
              <h2 className="metric-value">{applications.filter((a) => a.status === "Pending").length}</h2>
            </div>
          </div>

          <div className="metric-card metric-green">
            <div className="metric-icon">
              <CheckCircle size={24} />
            </div>
            <div className="metric-content">
              <p className="metric-label">APPROVED</p>
              <h2 className="metric-value">{applications.filter((a) => a.status === "Approved").length}</h2>
            </div>
          </div>

          <div className="metric-card metric-red">
            <div className="metric-icon">
              <XCircle size={24} />
            </div>
            <div className="metric-content">
              <p className="metric-label">REJECTED</p>
              <h2 className="metric-value">{applications.filter((a) => a.status === "Rejected").length}</h2>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="filters-section">
          <div className="filters-group">
            {["All", "Pending", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? "active" : ""}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
                {status !== "All" && (
                  <span className="badge-count">
                    {applications.filter((a) => a.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="applications-table-card">
          <div className="table-header">
            <h3>Applications ({filteredApplications.length})</h3>
          </div>
          {filteredApplications.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>
                {filterStatus === "All"
                  ? "No applications yet. Applications will appear here when students apply."
                  : `No ${filterStatus.toLowerCase()} applications at the moment.`}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Company Name</th>
                    <th>Position</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Applied Date</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td className="font-semibold">{app.student_name || "N/A"}</td>
                      <td>{app.student_id || "N/A"}</td>
                      <td>{getCompanyName(app)}</td>
                      <td>{getPosition(app)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge status-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="text-muted" style={{ textAlign: 'center' }}>
                        {new Date(app.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          {getResumeUrl(app) && (
                            <button
                              className="btn-icon btn-view"
                              onClick={() => {
                                const resumeUrl = getResumeUrl(app);
                                if (resumeUrl) {
                                  window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              title="View Resume"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {app.status === "Pending" && (
                            <>
                              <button
                                className="btn-icon btn-approve"
                                onClick={() => handleApprove(app.id)}
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="btn-icon btn-reject"
                                onClick={() => handleReject(app.id)}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(app.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminApplications;

