import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminNotices.css";

function AdminNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    notice_type: "General",
    is_public: true,
    is_active: true,
    expires_at: "",
    attachment: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const baseURL = "http://localhost:8000/api/";

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
      await fetchNotices();
    } catch (err) {
      console.error("Auth check error:", err);
      navigate("/login");
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}notices/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setNotices(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError("Unable to load notices. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      notice_type: "General",
      is_public: true,
      is_active: true,
      expires_at: "",
      attachment: null,
    });
    setPreviewUrl(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      notice_type: notice.notice_type || "General",
      is_public: notice.is_public !== undefined ? notice.is_public : true,
      is_active: notice.is_active !== undefined ? notice.is_active : true,
      expires_at: notice.expires_at || "",
      attachment: null,
    });

    // Set preview if existing attachment is an image
    if (notice.attachment) {
      // Check if attachment is an image based on extension
      const isImage = notice.attachment.match(/\.(jpeg|jpg|gif|png)$/i) != null;
      if (isImage) {
        setPreviewUrl(notice.attachment.startsWith('http') ? notice.attachment : `http://localhost:8000${notice.attachment}`);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }

    setEditingId(notice.id);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, attachment: file });
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.content) {
      setError("Title and content are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("content", formData.content);
      submitData.append("notice_type", formData.notice_type);
      submitData.append("is_public", formData.is_public);
      // Always set active to true as we use expiry date instead
      submitData.append("is_active", true);

      if (formData.expires_at) {
        submitData.append("expires_at", formData.expires_at);
      } else {
        submitData.append("expires_at", "");
      }

      if (formData.attachment) {
        submitData.append("attachment", formData.attachment);
      }

      if (editingId) {
        // Update
        await axios.put(`${baseURL}notices/${editingId}/`, submitData, { headers });
        setSuccess("Notice updated successfully!");
      } else {
        // Create
        await axios.post(`${baseURL}notices/`, submitData, { headers });
        setSuccess("Notice created successfully!");
      }

      resetForm();
      await fetchNotices();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving notice:", err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to save notice. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}notices/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSuccess("Notice deleted successfully!");
      await fetchNotices();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting notice:", err);
      setError(err.response?.data?.error || "Failed to delete notice. Please try again.");
    }
  };

  const getNoticeTypeColor = (type) => {
    switch (type) {
      case "Urgent":
        return "#dc3545";
      case "Important":
        return "#ffc107";
      case "Announcement":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  if (!isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-internships-container">
      <div className="admin-internships-header">
        <h1>Notice Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add New Notice
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Notice" : "Create New Notice"}</h2>
              <button onClick={resetForm} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter notice title"
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows="6"
                  placeholder="Enter notice content"
                />
              </div>

              <div className="form-group">
                <label>Notice Type</label>
                <select
                  value={formData.notice_type}
                  onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Announcement">Announcement</option>
                </select>
              </div>

              <div className="form-group">
                <label>Attachment (Image/Poster/File)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />

                {previewUrl ? (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ fontWeight: 600, marginBottom: '5px' }}>Preview:</p>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </div>
                ) : (
                  editingId && notices.find(n => n.id === editingId)?.attachment && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        Current file: <a href={notices.find(n => n.id === editingId).attachment} target="_blank" rel="noopener noreferrer">
                          {notices.find(n => n.id === editingId).attachment?.split('/').pop()}
                        </a>
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  />
                  Public (Visible to students)
                </label>
              </div>

              <div className="form-group">
                <label>Valid Until / Expiry Date</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} // Cannot be in the past
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Notice will be hidden from students after this date (leave blank for no expiry).
                </small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Notice" : "Create Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading notices...</div>
      ) : (
        <div className="internships-list">
          {notices.length === 0 ? (
            <div className="no-data">No notices found. Create your first notice!</div>
          ) : (
            <table className="internships-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Created By</th>
                  <th>Expires On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      <strong>{notice.title}</strong>
                      {notice.content && (
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                          {notice.content.substring(0, 100)}
                          {notice.content.length > 100 ? "..." : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: getNoticeTypeColor(notice.notice_type),
                          color: "white",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                        }}
                      >
                        {notice.notice_type}
                      </span>
                    </td>
                    <td>
                      {notice.expires_at && new Date(notice.expires_at) < new Date(new Date().toDateString()) ? (
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Expired</span>
                      ) : (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>Active</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: notice.is_public ? "#17a2b8" : "#6c757d",
                          color: "white",
                          fontSize: "0.85rem",
                        }}
                      >
                        {notice.is_public ? "Public" : "Private"}
                      </span>
                    </td>
                    <td>{notice.created_by_name || "Admin"}</td>
                    <td>
                      {notice.expires_at ? new Date(notice.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="btn-edit"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="btn-delete"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotices;

