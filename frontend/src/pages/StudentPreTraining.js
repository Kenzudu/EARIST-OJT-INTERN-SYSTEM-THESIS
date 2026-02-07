import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentPreTraining.css";

const baseURL = "http://localhost:8000/api";

function StudentPreTraining() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requirement_type: "",
    document_file: null,
    document_url: "",
  });

  const token = localStorage.getItem("token");

  const requirementTypes = [
    "Recommendation Letter",
    "Waiver",
    "Consent Letter",
    "Contract",
    "Medical Certificate",
    "Other",
  ];

  const [requiredDocs, setRequiredDocs] = useState([]);

  useEffect(() => {
    fetchRequirements();
    fetchCoordinatorRequirements();
  }, []);

  const fetchCoordinatorRequirements = async () => {
    try {
      const res = await axios.get(`${baseURL}/student/coordinator-settings/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.data && res.data.required_docs && res.data.required_docs.length > 0) {
        setRequiredDocs(res.data.required_docs);
      } else {
        // Use defaults if empty
        throw new Error("No requirements configured");
      }
    } catch (err) {
      console.log("Using default requirements");
      setRequiredDocs([
        { name: "Resume/CV", required: true },
        { name: "Application Letter", required: true },
        { name: "Endorsement Letter", required: true },
        { name: "Medical Certificate", required: false },
        { name: "NBI Clearance", required: false },
        { name: "Barangay Clearance", required: false },
        { name: "Waiver", required: true },
        { name: "Consent Letter", required: true },
      ]);
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/pre-training-requirements/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setRequirements(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load requirements.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const formDataToSend = new FormData();
      formDataToSend.append("requirement_type", formData.requirement_type);
      if (formData.document_file) {
        formDataToSend.append("document_file", formData.document_file);
      }
      if (formData.document_url) {
        formDataToSend.append("document_url", formData.document_url);
      }

      await axios.post(`${baseURL}/pre-training-requirements/`, formDataToSend, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Requirement submitted successfully!");
      setShowForm(false);
      resetForm();
      fetchRequirements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit requirement.");
    }
  };

  const handleDelete = async (requirementId) => {
    if (!window.confirm("Are you sure you want to delete this requirement? You can submit it again later.")) {
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}/pre-training-requirements/${requirementId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setSuccess("Requirement deleted successfully!");
      fetchRequirements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete requirement.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, document_file: e.target.files[0] });
  };



  const resetForm = () => {
    setFormData({
      requirement_type: "",
      document_file: null,
      document_url: "",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="pretraining-container">
      <div className="pretraining-header">
        <h1>Pre-Training Requirements</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            resetForm();
          }}
          className="btn-primary"
        >
          {showForm ? "Cancel" : "+ Submit"}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}


      {/* Submit Requirement Form */}
      {/* Submit Requirement Modal */}
      {showForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="requirement-form-card" style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a237e' }}>Submit Requirement</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Requirement Type *</label>
                <select
                  value={formData.requirement_type}
                  onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="">Select requirement type...</option>
                  {requiredDocs.length > 0 ? (
                    requiredDocs.map((doc) => (
                      <option key={doc.name} value={doc.name}>
                        {doc.name} {doc.required ? '(Required)' : '(Optional)'}
                      </option>
                    ))
                  ) : (
                    requirementTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Upload Document</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <small className="form-help" style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </small>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Submit Requirement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: '1px solid #ddd', color: '#333' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {requiredDocs.length > 0 && (
        <div className="checklist-section" style={{ marginBottom: '30px' }}>
          <h2>Requirements Checklist</h2>
          <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {requiredDocs.map((doc) => {
              const submitted = requirements.find(r => r.requirement_type === doc.name);
              const status = submitted ? submitted.status : 'Missing';
              let statusColor = '#757575'; // Grey for missing
              let bgColor = '#f5f5f5';

              if (status === 'Approved') { statusColor = '#2e7d32'; bgColor = '#e8f5e9'; }
              else if (status === 'Pending') { statusColor = '#f57c00'; bgColor = '#fff3e0'; }
              else if (status === 'Rejected') { statusColor = '#c62828'; bgColor = '#ffebee'; }

              return (
                <div key={doc.name} className="checklist-card" style={{
                  padding: '15px',
                  borderRadius: '10px',
                  background: 'white',
                  border: `1px solid ${status === 'Missing' && doc.required ? '#ffcdd2' : '#e0e0e0'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{doc.name}</h3>
                    {doc.required && (
                      <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        color: '#c62828',
                        background: '#ffebee',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>Required</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: statusColor
                    }}></div>
                    <span style={{ color: statusColor, fontWeight: '600', fontSize: '0.9rem' }}>
                      {status}
                    </span>
                    {status === 'Missing' && (
                      <button
                        onClick={() => {
                          setFormData({ ...formData, requirement_type: doc.name });
                          setShowForm(true);
                          // Scroll to form
                          document.querySelector('.requirement-form-card')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          marginLeft: 'auto',
                          border: 'none',
                          background: 'none',
                          color: '#2196f3',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Submit Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="requirements-section">
        <h2>My Submitted Requirements</h2>
        {loading ? (
          <div className="loading">Loading requirements...</div>
        ) : requirements.length === 0 ? (
          <div className="empty-state">
            <p>No requirements submitted yet. Submit your first requirement to get started!</p>
          </div>
        ) : (
          <div className="requirements-list">
            {requirements.map((req) => (
              <div key={req.id} className="requirement-card">
                <div className="requirement-header">
                  <div>
                    <h3>{req.requirement_type}</h3>
                    <span className={`status-badge ${getStatusBadgeClass(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="requirement-meta">
                    <small>
                      Submitted: {new Date(req.submitted_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>

                <div className="requirement-content">
                  {req.document_file && (
                    <div className="requirement-doc">
                      <strong>Document:</strong>{" "}
                      <a href={req.document_file} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </div>
                  )}
                  {req.document_url && (
                    <div className="requirement-doc">
                      <strong>Document URL:</strong>{" "}
                      <a href={req.document_url} target="_blank" rel="noopener noreferrer">
                        {req.document_url}
                      </a>
                    </div>
                  )}

                  {req.admin_comment && (
                    <div className="admin-comment">
                      <strong>Notice:</strong>
                      <p>{req.admin_comment}</p>
                    </div>
                  )}

                  {req.reviewed_at && (
                    <div className="review-info">
                      <small>
                        Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}
                      </small>
                    </div>
                  )}

                  {/* Action buttons for Pending requirements */}
                  {req.status === 'Pending' && (
                    <div className="requirement-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <button
                        onClick={() => {
                          setFormData({ requirement_type: req.requirement_type, document_file: null });
                          setShowForm(true);
                          handleDelete(req.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#0056b3'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#007bff'}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🔄</span> Resubmit
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                      >
                        <span style={{ fontSize: '1.1rem' }}>❌</span> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentPreTraining;



