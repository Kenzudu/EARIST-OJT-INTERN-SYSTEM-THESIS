import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDocuments.css";

function AdminDocuments() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_type: "Waiver",
    file: null
  });
  const [editingTemplate, setEditingTemplate] = useState(null);

  const baseURL = "http://localhost:8000/api/";
  const mediaURL = "http://localhost:8000";

  const templateTypes = [
    "Endorsement Letter",
    "Acceptance Letter",
    "Evaluation Form",
    "Waiver",
    "Consent Letter",
    "Training Plan",
    "Contract",
    "Medical Certificate",
    "Other"
  ];

  // Check admin access
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
      fetchTemplates();
    } catch (err) {
      console.error("Auth check error:", err);
      navigate("/login");
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}document-templates/`, {
        headers: { Authorization: `Token ${token}` },
      });
      console.log("Fetched templates:", res.data);
      console.log("Fetched templates:", res.data);
      // Debug distribution
      console.log("Type Distribution:", res.data.map(t => t.template_type).reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {}));
      setTemplates(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Unable to load document templates. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!editingTemplate && !formData.file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("template_type", formData.template_type);

      if (formData.file) {
        submitData.append("file", formData.file);
      }

      if (editingTemplate) {
        // Update existing template
        await axios.put(
          `${baseURL}document-templates/${editingTemplate.id}/`,
          submitData,
          { headers: { Authorization: `Token ${token}` } }
        );
        setSuccess("Template updated successfully!");
      } else {
        // Create new template
        await axios.post(
          `${baseURL}document-templates/`,
          submitData,
          { headers: { Authorization: `Token ${token}` } }
        );
        setSuccess("Template uploaded successfully!");
      }

      resetForm();
      fetchTemplates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.error || "Failed to save template.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      template_type: template.template_type || "Other",
      file: null
    });
    setShowUploadModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}document-templates/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSuccess("Template deleted successfully!");
      fetchTemplates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete template.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      template_type: "Waiver",
      file: null
    });
    setEditingTemplate(null);
    setShowUploadModal(false);
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    if (fileUrl.startsWith('/media/')) {
      return `${mediaURL}${fileUrl}`;
    }
    return `${mediaURL}/media/${fileUrl}`;
  };

  // Filter and Sort Logic
  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (template.template_type && template.template_type.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === "All" || template.template_type === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-documents-page">
      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Document Templates</h1>
            <p className="page-subtitle">
              Manage system-wide document templates including waivers, contracts, evaluation sheets, and forms.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload New Template
          </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="alert alert-info">Loading templates…</div>}

        {/* Statistics Cards */}
        <div className="stats-grid">
          {/* Total Templates Card */}
          <div className="stat-card">
            <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{templates.length}</span>
              <span className="stat-label">TOTAL TEMPLATES</span>
            </div>
          </div>

          {/* Dynamic Cards */}
          {templateTypes.map((type, index) => {
            // Generate different gradients based on index
            const gradients = [
              'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Green
              'linear-gradient(135deg, #ff6a88 0%, #ff99ac 100%)', // Pink
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Red/Purple
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Orange
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
              'linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)', // Cyan
              'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Lavender
            ];
            const bgGradient = gradients[index % gradients.length];

            return (
              <div className="stat-card" key={type}>
                <div className="stat-icon-box" style={{ background: bgGradient }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {templates.filter(t => (t.template_type || '').trim() === type).length}
                  </span>
                  <span className="stat-label">{type.toUpperCase()}S</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter Controls */}
        <div className="filter-controls">
          <div className="search-box">
            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#999"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="#999"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {templateTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filtered Templates Grid */}
        <div className="data-section">
          <div className="section-header">
            <h2>
              {filterType === "All" ? "All Documents" : `${filterType}s`}
              <span className="count-badge">{filteredTemplates.length}</span>
            </h2>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="templates-grid">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-icon">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2V8H20"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 13H8"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 17H8"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 9H8"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="template-info">
                    <h3>{template.name}</h3>
                    {template.description && (
                      <p className="template-description">{template.description}</p>
                    )}
                    <div className="template-meta">
                      <span className="category-badge">{template.template_type || 'Uncategorized'}</span>
                      {template.created_at && (
                        <span className="upload-date">
                          {new Date(template.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="template-actions">
                    {template.file && (
                      <a
                        href={getFileUrl(template.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view"
                        title="View/Download"
                      >
                        View
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(template)}
                      className="btn-edit"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="btn-delete"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No templates found matching your criteria.</p>
              {searchTerm && <button className="btn-secondary" onClick={() => setSearchTerm("")}>Clear Search</button>}
            </div>
          )}
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? "Edit Template" : "Upload New Template"}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Student Waiver Form 2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="template_type"
                    value={formData.template_type}
                    onChange={handleInputChange}
                    required
                  >
                    {templateTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>



                <div className="form-group">
                  <label>
                    Document File {editingTemplate ? "(Upload new file to replace)" : "*"}
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    required={!editingTemplate}
                  />
                  <small className="form-hint">
                    Accepted formats: PDF, DOC, DOCX, XLS, XLSX
                  </small>
                  {editingTemplate && editingTemplate.file && (
                    <div className="current-file">
                      Current file: <a href={getFileUrl(editingTemplate.file)} target="_blank" rel="noopener noreferrer">
                        {editingTemplate.name}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTemplate ? "Update Template" : "Upload Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDocuments;
