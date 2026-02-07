import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentApplications.css";
import StudentHeader from "./StudentHeader";

const baseURL = "http://localhost:8000/api";

function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [editingApp, setEditingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    cover_letter: "",
    resume_url: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/student/applications/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const apps = res.data.results || res.data;
      setApplications(apps || []);

      setStatistics({
        total: apps?.length || 0,
        pending: apps?.filter((a) => (a.status?.toLowerCase() || "") === "pending").length || 0,
        approved: apps?.filter((a) => (a.status?.toLowerCase() || "") === "approved").length || 0,
        rejected: apps?.filter((a) => (a.status?.toLowerCase() || "") === "rejected").length || 0,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch applications");
      setApplications([]);
      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      setStatistics({
        total: stats.length,
        pending: stats.filter((a) => (a.status?.toLowerCase() || "") === "pending").length,
        approved: stats.filter((a) => (a.status?.toLowerCase() || "") === "approved").length,
        rejected: stats.filter((a) => (a.status?.toLowerCase() || "") === "rejected").length,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApplications = () => {
    if (filterStatus === "all") return applications;
    return applications.filter((app) => (app.status?.toLowerCase() || "") === filterStatus.toLowerCase());
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "pending":
        return "status-pending";
      default:
        return "";
    }
  };

  const getStatusDisplay = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleEdit = (app) => {
    // Only allow editing if status is pending (case-insensitive)
    const status = app.status?.toLowerCase() || "";
    if (status !== "pending") {
      setError("You can only edit applications with 'Pending' status.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setEditingApp(app);
    setEditFormData({
      cover_letter: app.cover_letter || "",
      resume_url: app.resume_url || "",
    });
    setShowEditModal(true);
    setError("");
  };

  const handleUpdate = async () => {
    if (!editingApp) return;

    try {
      setError("");
      const res = await axios.put(
        `${baseURL}/applications/${editingApp.id}/`,
        {
          cover_letter: editFormData.cover_letter,
          resume_url: editFormData.resume_url,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      setSuccess("Application updated successfully!");
      setShowEditModal(false);
      setEditingApp(null);
      fetchApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to update application");
      if (typeof err.response?.data === "object") {
        setError(JSON.stringify(err.response?.data));
      }
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${baseURL}/applications/${appId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setSuccess("Application deleted successfully!");
      fetchApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      const errorMsg = err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete application";
      setError(errorMsg);
      console.error("Full error response:", err.response?.data);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingApp(null);
    setEditFormData({ cover_letter: "", resume_url: "" });
    setError("");
  };

  if (loading) return <div className="app-loading">Loading applications...</div>;

  const filteredApps = getFilteredApplications();

  return (
    <div className="applications-container">
      <StudentHeader
        title="My Applications"
        subtitle="Track and manage your internship applications."
      />


      <div className="stats-grid">
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>TOTAL APPLICATIONS</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.pending}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>PENDING</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.approved}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>APPROVED</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', lineHeight: '1' }}>{statistics.rejected}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>REJECTED</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filter-buttons">
        <button
          onClick={() => setFilterStatus("all")}
          className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
        >
          All ({statistics.total})
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
        >
          Pending ({statistics.pending})
        </button>
        <button
          onClick={() => setFilterStatus("approved")}
          className={`filter-btn ${filterStatus === "approved" ? "active" : ""}`}
        >
          Approved ({statistics.approved})
        </button>
        <button
          onClick={() => setFilterStatus("rejected")}
          className={`filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
        >
          Rejected ({statistics.rejected})
        </button>
      </div>

      {filteredApps.length > 0 ? (
        <div className="applications-list">
          {filteredApps.map((app) => (
            <div key={app.id} className="application-card">
              <div className="card-header">
                <h2>{app.internship?.position || "Untitled Position"}</h2>
                <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                  {getStatusDisplay(app.status)}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Company:</span>
                  <span className="value">
                    {app.internship?.company?.name || "Unknown Company"}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Position:</span>
                  <span className="value">{app.internship?.position || "N/A"}</span>
                </div>

                <div className="info-row">
                  <span className="label">Location:</span>
                  <span className="value">
                    {app.internship?.work_location || "Not specified"}
                  </span>
                </div>



                <div className="info-row">
                  <span className="label">Applied On:</span>
                  <span className="value">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>

                {app.cover_letter && (
                  <div className="cover-letter-section">
                    <span className="label">Cover Letter:</span>
                    <p className="cover-letter-text">{app.cover_letter}</p>
                  </div>
                )}

                {app.resume_url && (
                  <div className="info-row">
                    <span className="label">Resume URL:</span>
                    <span className="value">
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="resume-link">
                        View Resume →
                      </a>
                    </span>
                  </div>
                )}

                {app.resume_file && (
                  <div className="info-row">
                    <span className="label">Uploaded Resume:</span>
                    <span className="value">
                      <a href={app.resume_file} target="_blank" rel="noopener noreferrer" className="resume-link">
                        Download PDF →
                      </a>
                    </span>
                  </div>
                )}

                {app.feedback && (
                  <div className="feedback-section">
                    <span className="label">Feedback:</span>
                    <p className="feedback-text">{app.feedback}</p>
                  </div>
                )}

                {app.internship?.description && (
                  <div className="description-section">
                    <span className="label">Description:</span>
                    <p className="description-text">{app.internship.description}</p>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <small className="app-id">Application ID: {app.id}</small>
                  <div className="card-actions">
                    {(app.status?.toLowerCase() || "") === "pending" && (
                      <button
                        onClick={() => handleEdit(app)}
                        className="btn-edit"
                        title="Edit Application"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="btn-delete"
                      title="Delete Application"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">
          <p>
            {filterStatus === "all"
              ? "You haven't applied to any internships yet."
              : `No ${filterStatus} applications.`}
          </p>
          <a href="/student/internships" className="apply-btn">
            Browse Internships →
          </a>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingApp && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Application</h2>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Position:</label>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  {editingApp.internship?.position || "N/A"}
                </p>
              </div>
              <div className="form-group">
                <label>Company:</label>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  {editingApp.internship?.company?.name || "Unknown Company"}
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="edit_cover_letter">Cover Letter *</label>
                <textarea
                  id="edit_cover_letter"
                  value={editFormData.cover_letter}
                  onChange={(e) => setEditFormData({ ...editFormData, cover_letter: e.target.value })}
                  placeholder="Tell the company why you're a great fit..."
                  rows="8"
                  required
                  className="form-textarea"
                />
                <span className="char-count">
                  {editFormData.cover_letter.length} characters
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="edit_resume_url">Resume URL</label>
                <input
                  type="url"
                  id="edit_resume_url"
                  value={editFormData.resume_url}
                  onChange={(e) => setEditFormData({ ...editFormData, resume_url: e.target.value })}
                  placeholder="https://drive.google.com/file/... or https://dropbox.com/..."
                  className="form-input"
                />
                <small className="form-hint">
                  Paste a link to your resume (Google Drive, Dropbox, or any public URL)
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleUpdate} className="btn-save" disabled={!editFormData.cover_letter.trim()}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentApplications;


