import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Building2, User, Scale, Upload, FileText } from "lucide-react";
import "./AdminDashboard.css";
import "./SearchBar.css";

const baseURL = "http://localhost:8000/api";

function AdminCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingCompany, setViewingCompany] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_person: "",
    contact_email: "",
    phone: "",
    website: "",
    industry: "",
    description: "",
    status: "Pending",
    target_colleges: [],
    moa_file: null,
    moa_start_date: "",
    moa_expiration_date: ""
  });

  const collegeOptions = [
    { value: "CAS", label: "College of Arts and Sciences" },
    { value: "CBA", label: "College of Business Administration" },
    { value: "CED", label: "College of Education" },
    { value: "CEN", label: "College of Engineering" },
    { value: "CHM", label: "College of Hospitality Management" },
    { value: "CIT", label: "College of Industrial Technology" },
    { value: "CPAC", label: "College of Public Administration and Criminology" },
    { value: "CAFA", label: "College of Architecture and Fine Arts" },
    { value: "CCS", label: "College of Computer Studies" }
  ];

  useEffect(() => {
    checkAdminAccess();
    fetchCompanies();
  }, []);

  const checkAdminAccess = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== 'admin' && userRole !== 'coordinator') {
      setError("Access denied. Admins and Coordinators only.");
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.get(`${baseURL}/companies/`, {
        headers: { Authorization: `Token ${token}` }
      });

      let filteredCompanies = response.data;

      // If coordinator, filter companies to only show those with students from their college
      if (userRole === 'coordinator' && user?.college) {
        // ... (existing logic) ...
        const appsResponse = await axios.get(`${baseURL}/applications/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const companyIdsWithStudents = new Set();
        appsResponse.data.forEach(app => {
          if (app.student_profile?.college === user.college && app.internship?.company) {
            companyIdsWithStudents.add(app.internship.company);
          }
        });

        filteredCompanies = response.data.filter(company =>
          companyIdsWithStudents.has(company.id)
        );
      }

      setCompanies(filteredCompanies);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Failed to load companies");
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId) => {
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseURL}/companies/${companyId}/details/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setViewingCompany(response.data);
    } catch (err) {
      console.error("Error fetching company details:", err);
      setError("Failed to load company details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewCompany = (company) => {
    setViewingCompany({ ...company }); // Set basic data immediately
    fetchCompanyDetails(company.id); // Fetch full data
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Restrict phone input to numbers only
    if (name === "phone" && !/^\d*$/.test(value)) {
      return;
    }

    if (name === "moa_file") {
      setFormData(prev => ({
        ...prev,
        moa_file: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCollegeToggle = (collegeValue) => {
    setFormData(prev => {
      const currentColleges = prev.target_colleges || [];
      const isSelected = currentColleges.includes(collegeValue);

      return {
        ...prev,
        target_colleges: isSelected
          ? currentColleges.filter(c => c !== collegeValue)
          : [...currentColleges, collegeValue]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (key === 'target_colleges') {
          // Send as JSON string for JSONField
          data.append('target_colleges', JSON.stringify(formData[key]));
        } else if (key === 'moa_file') {
          if (formData.moa_file instanceof File) {
            data.append('moa_file', formData.moa_file);
          }
        } else if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      const config = {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingCompany) {
        await axios.put(`${baseURL}/companies/${editingCompany.id}/`, data, config);
        setSuccess("Company updated successfully!");
      } else {
        await axios.post(`${baseURL}/companies/`, data, config);
        setSuccess("Company created successfully!");
      }

      fetchCompanies();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving company:", err);
      setError(err.response?.data?.message || "Failed to save company");
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || "",
      address: company.address || "",
      contact_person: company.contact_person || "",
      contact_email: company.contact_email || "",
      phone: company.phone || "",
      website: company.website || "",
      industry: company.industry || "",
      description: company.description || "",
      status: company.status || "Pending",
      target_colleges: company.target_colleges || [],
      moa_file: null, // Reset file input
      moa_start_date: company.moa_start_date || "",
      moa_expiration_date: company.moa_expiration_date || ""
    });
    setShowModal(true);
  };

  const handleApprove = async (company) => {
    if (!window.confirm(`Are you sure you want to approve ${company.name}?`)) return;

    try {
      const token = localStorage.getItem("token");

      // Create a clean payload with only the fields we need to update
      const payload = {
        name: company.name,
        address: company.address,
        contact_person: company.contact_person,
        contact_email: company.contact_email,
        phone: company.phone,
        website: company.website || '',
        industry: company.industry,
        description: company.description || '',
        status: 'Approved',
        target_colleges: company.target_colleges || [],
        moa_start_date: company.moa_start_date || null,
        moa_expiration_date: company.moa_expiration_date || null
      };

      await axios.put(
        `${baseURL}/companies/${company.id}/`,
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess(`Company ${company.name} approved successfully!`);
      fetchCompanies();
    } catch (err) {
      console.error("Error approving company:", err);
      console.error("Error response:", err.response?.data);
      setError("Failed to approve company");
    }
  };

  const handleReject = async (company) => {
    if (!window.confirm(`Are you sure you want to reject ${company.name}?`)) return;

    try {
      const token = localStorage.getItem("token");

      // Create a clean payload with only the fields we need to update
      const payload = {
        name: company.name,
        address: company.address,
        contact_person: company.contact_person,
        contact_email: company.contact_email,
        phone: company.phone,
        website: company.website || '',
        industry: company.industry,
        description: company.description || '',
        status: 'Rejected',
        target_colleges: company.target_colleges || [],
        moa_start_date: company.moa_start_date || null,
        moa_expiration_date: company.moa_expiration_date || null
      };

      await axios.put(
        `${baseURL}/companies/${company.id}/`,
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess(`Company ${company.name} rejected.`);
      fetchCompanies();
    } catch (err) {
      console.error("Error rejecting company:", err);
      console.error("Error response:", err.response?.data);
      setError("Failed to reject company");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}/companies/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSuccess("Company deleted successfully!");
      fetchCompanies();
    } catch (err) {
      console.error("Error deleting company:", err);
      setError("Failed to delete company");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contact_person: "",
      contact_email: "",
      phone: "",
      website: "",
      industry: "",
      description: "",
      status: "Pending",
      target_colleges: [],
      moa_file: null,
      moa_start_date: "",
      moa_expiration_date: ""
    });
    setEditingCompany(null);
  };

  const openCreateModal = () => {
    resetForm();

    // Auto-set coordinator's college if they're creating a company
    if (isCoordinator) {
      const userCollege = localStorage.getItem('userCollege');
      if (userCollege) {
        setFormData(prev => ({
          ...prev,
          target_colleges: [userCollege] // Pre-select coordinator's college
        }));
      }
    }

    setShowModal(true);
  };

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === 'admin';
  const isCoordinator = userRole === 'coordinator';
  const canAdd = isAdmin || isCoordinator;

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;

    let cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;

    // Ensure it starts with media/ if it doesn't already (and isn't a full URL)
    if (!cleanPath.startsWith('media/') && !cleanPath.startsWith('static/')) {
      cleanPath = `media/${cleanPath}`;
    }

    return `http://localhost:8000/${cleanPath}`;
  };

  const filteredCompanies = companies.filter(company => {
    // Filter by status
    if (statusFilter === 'All' && company.status === 'Archived') return false;
    if (statusFilter !== 'All' && company.status !== statusFilter) return false;

    // Filter by college for coordinators
    if (isCoordinator) {
      const userCollege = localStorage.getItem('userCollege');
      if (userCollege && !company.target_colleges?.includes(userCollege)) {
        return false; // Hide companies not targeting this coordinator's college
      }
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = company.name?.toLowerCase().includes(search);
      const matchesIndustry = company.industry?.toLowerCase().includes(search);
      const matchesContact = company.contact_person?.toLowerCase().includes(search);
      const matchesAddress = company.address?.toLowerCase().includes(search);

      if (!matchesName && !matchesIndustry && !matchesContact && !matchesAddress) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <div className="page-header">
          <h1>Companies Management</h1>
          <p>Manage partner companies, verify MOAs, and track expiration</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="controls-bar">
          <div className="filters-group">
            <button
              className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending
              {companies.filter(c => c.status === 'Pending').length > 0 &&
                <span className="badge-count">{companies.filter(c => c.status === 'Pending').length}</span>
              }
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Approved')}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Archived' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Archived')}
            >
              Archived
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Rejected')}
            >
            </button>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search companies by name, industry, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {canAdd && (
            <button onClick={openCreateModal} className="btn-primary">
              + Add New Company
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading companies...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Contact</th>
                  <th>MOA Status</th>
                  <th>MOA Validity</th>
                  <th>MOA File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      {companies.length === 0 ? "No companies found" : `No ${statusFilter} companies found`}
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map(company => (
                    <tr key={company.id}>
                      <td
                        onClick={() => handleViewCompany(company)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view details"
                      >
                        <div style={{ fontWeight: 'bold', color: '#004AAD' }}>{company.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{company.industry}</div>
                      </td>
                      <td>
                        <div>{company.contact_person}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{company.contact_email}</div>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <span className={`status-badge status-${company.status.toLowerCase()}`}>
                          {company.status === 'Archived' ? 'Expired' : company.status}
                        </span>
                      </td>
                      <td>
                        {company.moa_start_date && company.moa_expiration_date ? (
                          <div style={{ fontSize: '0.9rem' }}>
                            <div>Start: {company.moa_start_date}</div>
                            <div>Exp: {company.moa_expiration_date}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>Not set</span>
                        )}
                      </td>
                      <td>
                        {company.moa_file ? (
                          <a
                            href={getFileUrl(company.moa_file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link"
                          >
                            View MOA
                          </a>
                        ) : (
                          <span style={{ color: '#999' }}>No File</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* Allow admin OR coordinator (if company targets their college) to approve/reject */}
                          {company.status === 'Pending' && (isAdmin || (isCoordinator && company.target_colleges?.includes(localStorage.getItem('userCollege')))) && (
                            <>
                              <button
                                onClick={() => handleApprove(company)}
                                className="btn-small btn-approve"
                                title="Approve Company"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(company)}
                                className="btn-small btn-delete"
                                title="Reject Company"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {company.status === 'Archived' && (isAdmin || (isCoordinator && company.target_colleges?.includes(localStorage.getItem('userCollege')))) && (
                            <button
                              onClick={() => handleEdit(company)}
                              className="btn-small btn-edit"
                              title="Renew MOA"
                              style={{ backgroundColor: '#28a745', color: 'white' }}
                            >
                              Renew
                            </button>
                          )}

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(company)}
                                className="btn-small btn-edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(company.id)}
                                className="btn-small btn-delete"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {!isAdmin && !isCoordinator && <span style={{ color: '#999' }}>View Only</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{editingCompany ? "Edit Company" : "Add New Company"}</h2>
                  <p className="modal-subtitle">Enter the partner details below</p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="company-form-modern">

                {/* CARD 1: COMPANY PROFILE */}
                <div className="form-card">
                  <div className="card-title">
                    <span className="card-icon"><Building2 size={24} className="text-indigo-600" /></span>
                    <h3>Company Profile</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Acme Corporation"
                        required
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label>Industry</label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        placeholder="e.g. Technology"
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        className="input-modern"
                      />
                    </div>

                    {(isAdmin || isCoordinator) && (
                      <div className="form-group">
                        <label>Status</label>
                        <div className="select-wrapper">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="input-modern"
                          >
                            <option value="Pending">🕒 Pending Review</option>
                            <option value="Approved">✅ Verified Partner</option>
                            <option value="Archived">📂 Archived (Expired)</option>
                            <option value="Rejected">❌ Rejected</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Brief overview of the company..."
                        className="input-modern"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: CONTACT INFO */}
                <div className="form-card">
                  <div className="card-title">
                    <span className="card-icon"><User size={24} className="text-indigo-600" /></span>
                    <h3>Contact Information</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Contact Person</label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        placeholder="Full Name"
                        required
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="email@company.com"
                        required
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(02) 1234-5678"
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Office Address"
                        required
                        className="input-modern"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: LEGAL & MOA */}
                <div className="form-card">
                  <div className="card-title">
                    <span className="card-icon"><Scale size={24} className="text-indigo-600" /></span>
                    <h3>Legal & MOA</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Start vs Expiry</label>
                      <div className="date-range-group">
                        <input
                          type="date"
                          name="moa_start_date"
                          value={formData.moa_start_date}
                          onChange={handleInputChange}
                          className="input-modern"
                          title="Start Date"
                        />
                        <span className="date-arrow">→</span>
                        <input
                          type="date"
                          name="moa_expiration_date"
                          value={formData.moa_expiration_date}
                          onChange={handleInputChange}
                          className="input-modern"
                          title="Expiration Date"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>MOA Document</label>
                      <div className="file-drop-area">
                        <input
                          type="file"
                          name="moa_file"
                          onChange={handleInputChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          id="moa-upload-modern"
                          className="file-input-hidden"
                        />
                        <label htmlFor="moa-upload-modern" className="file-drop-label">
                          <span className="icon"><Upload size={18} /></span>
                          <span>{formData.moa_file ? "File Selected" : "Upload Digital Copy"}</span>
                        </label>
                      </div>
                      {editingCompany && editingCompany.moa_file && (
                        <a href={getFileUrl(editingCompany.moa_file)} target="_blank" rel="noopener noreferrer" className="view-file-link">
                          View Current
                        </a>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label>Target Departments</label>
                      <div className="pill-grid">
                        {collegeOptions.map(college => (
                          <label key={college.value} className={`pill-checkbox ${formData.target_colleges.includes(college.value) ? 'active' : ''}`}>
                            <input
                              type="checkbox"
                              checked={formData.target_colleges.includes(college.value)}
                              onChange={() => handleCollegeToggle(college.value)}
                              style={{ display: 'none' }}
                            />
                            {college.value}
                          </label>
                        ))}
                      </div>
                      <p className="help-text-modern">Click codes to select colleges (e.g. CCS)</p>
                    </div>
                  </div>
                </div>

                <div className="modal-footer-modern">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-text-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-modern">
                    {editingCompany ? "Save Changes" : "Create Company"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW DETAILS MODAL */}
        {viewingCompany && (
          <div className="modal-overlay" onClick={() => setViewingCompany(null)}>
            <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '12px', color: '#4338ca' }}>
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem' }}>{viewingCompany.name}</h2>
                    <span className={`status-badge status-${(viewingCompany.status || 'Pending').toLowerCase()}`} style={{ marginTop: '5px' }}>
                      {viewingCompany.status === 'Archived' ? 'Expired' : viewingCompany.status}
                    </span>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setViewingCompany(null)}>×</button>
              </div>

              <div className="modal-body" style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
                {detailsLoading ? (
                  <div className="loading">Loading details...</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '15px', fontWeight: '700', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>
                          Contact Information
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Address:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.address}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Email:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.contact_email}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Phone:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.phone || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Contact:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.contact_person}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Website:</span>
                            <span>{viewingCompany.website ? <a href={viewingCompany.website} target="_blank" rel="noopener noreferrer" className="btn-link">{viewingCompany.website}</a> : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '15px', fontWeight: '700', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>
                          Company Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '100px' }}>Industry:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.industry}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#6b7280', minWidth: '100px' }}>MOA Expiry:</span>
                            <span style={{ color: '#111827', fontWeight: '500' }}>{viewingCompany.moa_expiration_date || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                            <span style={{ color: '#6b7280' }}>Description:</span>
                            <span style={{ color: '#374151', lineHeight: '1.5', background: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                              {viewingCompany.description || 'No description provided.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', color: '#1f2937', margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <User size={22} className="text-indigo-600" />
                          Supervisors
                        </h3>
                        <span className="badge-count" style={{ background: '#4f46e5', fontSize: '0.9rem', padding: '4px 10px' }}>
                          {viewingCompany.supervisors ? viewingCompany.supervisors.length : 0}
                        </span>
                      </div>

                      {viewingCompany.supervisors && viewingCompany.supervisors.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                          {viewingCompany.supervisors.map((sup, idx) => (
                            <div key={idx} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '15px' }}>
                              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                                {sup.name.charAt(0)}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: '700', color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sup.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{sup.position}</div>
                                <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                  <span>✉</span> {sup.email}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>📞</span> {sup.phone || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
                          No supervisors assigned to this company yet.
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', color: '#1f2937', margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <User size={22} className="text-indigo-600" />
                          Interns
                        </h3>
                        <span className="badge-count" style={{ background: '#4f46e5', fontSize: '0.9rem', padding: '4px 10px' }}>
                          {viewingCompany.students ? viewingCompany.students.length : 0}
                        </span>
                      </div>

                      {viewingCompany.students && viewingCompany.students.length > 0 ? (
                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Position</th>
                                <th>Course</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewingCompany.students.map((student, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: '500', color: '#111827' }}>{student.name}</td>
                                  <td>
                                    <span style={{ background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                                      {student.position}
                                    </span>
                                  </td>
                                  <td style={{ color: '#4b5563' }}>{student.course}</td>
                                  <td>
                                    <span className={`status-badge status-${(student.status || 'Pending').toLowerCase()}`}>
                                      {student.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
                          No interns currently working at this company.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer-modern">
                <button onClick={() => setViewingCompany(null)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* --- GLOBAL MODERN STYLES --- */
        .admin-dashboard-container {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            background: #f3f4f6;
        }

        /* --- MODAL --- */
        .modal-overlay { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(17, 24, 39, 0.7); 
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 1000; 
            padding: 20px;
        }
        .modal-content { 
            background: #f9fafb; /* Light grey bg for contrast */
            border-radius: 20px; 
            width: 100%; max-width: 750px; max-height: 90vh; 
            overflow-y: auto; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex; flex-direction: column;
        }
        
        .modal-header { 
            padding: 20px 32px; 
            background: white;
            border-bottom: 1px solid #e5e7eb; 
            display: flex; justify-content: space-between; align-items: flex-start; 
            position: sticky; top: 0; z-index: 10;
        }
        .modal-header h2 { margin: 0; font-size: 1.5rem; color: #111827; font-weight: 700; }
        .modal-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }
        .modal-close { 
            background: transparent; border: none; font-size: 1.8rem; line-height: 1;
            cursor: pointer; color: #9ca3af; transition: color 0.2s;
        }
        .modal-close:hover { color: #1f2937; }

        /* --- FORM LAYOUT --- */
        .company-form-modern { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

        .form-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
        }

        .card-title {
            display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
            padding-bottom: 12px; border-bottom: 1px dashed #e5e7eb;
        }
        .card-icon { font-size: 1.25rem; }
        .card-title h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #374151; letter-spacing: 0.5px; text-transform: uppercase; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: 1 / -1; }

        .form-group label { font-size: 0.85rem; font-weight: 600; color: #4b5563; }

        /* --- INPUTS --- */
        .input-modern {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #1f2937;
            transition: all 0.2s;
            background: #ffffff;
        }
        .input-modern:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .input-modern::placeholder { color: #9ca3af; }

        /* --- SPECIAL WIDGETS --- */
        .date-range-group { display: flex; align-items: center; gap: 10px; }
        .date-arrow { color: #9ca3af; }
        
        .file-drop-area { position: relative; width: 100%; }
        .file-input-hidden { position: absolute; width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; z-index: -1; }
        .file-drop-label { 
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 12px;
            background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;
            cursor: pointer; transition: all 0.2s; font-size: 0.9rem; font-weight: 500; color: #475569;
        }
        .file-drop-label:hover { background: #f1f5f9; border-color: #64748b; }
        .view-file-link { font-size: 0.8rem; margin-top: 4px; display: block; color: #4f46e5; text-decoration: none; }

        /* Target Colleges Pills */
        .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill-checkbox {
            padding: 6px 14px;
            background: #f3f4f6;
            border-radius: 20px;
            font-size: 0.85rem; font-weight: 600; color: #6b7280;
            cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
        }
        .pill-checkbox:hover { background: #e5e7eb; }
        .pill-checkbox.active {
            background: #e0e7ff; color: #4338ca; border-color: #c7d2fe;
        }
        .help-text-modern { font-size: 0.8rem; color: #9ca3af; margin-top: 6px; }

        /* --- FOOTER --- */
        .modal-footer-modern {
            padding: 20px 32px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex; justify-content: flex-end; gap: 16px; align-items: center;
            border-radius: 0 0 20px 20px;
        }

        .btn-text-cancel {
            background: transparent; border: none; font-weight: 600; color: #6b7280;
            cursor: pointer; font-size: 0.95rem; padding: 8px 16px; border-radius: 6px;
            transition: color 0.2s;
        }
        .btn-text-cancel:hover { color: #111827; background: #f3f4f6; }

        .btn-primary-modern {
            background: #4f46e5; color: white; border: none;
            padding: 10px 24px; border-radius: 8px;
            font-weight: 600; font-size: 0.95rem;
            cursor: pointer; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            transition: background 0.2s, transform 0.1s;
        }
        .btn-primary-modern:hover { background: #4338ca; transform: translateY(-1px); }

        /* Page Layout & Table (Retained) */
        .page-header { margin-bottom: 30px; }
        .page-header h1 { font-size: 2rem; margin: 0 0 8px 0; color: #111827; font-weight: 800; }
        .page-header p { margin: 0; color: #6b7280; font-size: 1.1rem; }
        
        .controls-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 15px;
        }

        /* Filter Tabs */
        .filters-group {
            display: flex;
            gap: 4px;
            background: #f3f4f6;
            padding: 4px;
            border-radius: 12px;
        }

        .filter-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-btn:hover {
            color: #111827;
            background: rgba(255,255,255,0.5);
        }

        .filter-btn.active {
            background: white;
            color: #4f46e5;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .badge-count {
            background: #ef4444;
            color: white;
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 10px;
            min-width: 20px;
            text-align: center;
            font-weight: 700;
        }

        /* Table Styles */
        .table-container { 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
            overflow: hidden; 
            border: 1px solid #e5e7eb;
        }
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .data-table th { 
            background: #f9fafb; 
            padding: 16px 24px; 
            text-align: left; 
            font-weight: 600; 
            color: #374151;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e5e7eb; 
        }
        .data-table td { 
            padding: 16px 24px; 
            border-bottom: 1px solid #f3f4f6; 
            vertical-align: middle; 
            color: #1f2937;
        }
        .data-table tbody tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover { background: #f9fafb; transition: background 0.1s; }
        
        /* Status Badges */
        .status-badge { 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 0.85rem; 
            font-weight: 700; 
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
        .status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; }
        .status-pending::before { background: #d97706; }
        .status-approved { background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; }
        .status-approved::before { background: #059669; }
        .status-rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .status-rejected::before { background: #dc2626; }

        /* Action Buttons */
        .action-buttons { display: flex; gap: 8px; }
        .btn-small { 
            padding: 6px 12px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 0.85rem; 
            font-weight: 500;
            transition: all 0.2s;
        }
        .btn-edit { background: #e0e7ff; color: #4338ca; }
        .btn-edit:hover { background: #c7d2fe; }
        .btn-delete { background: #fee2e2; color: #b91c1c; }
        .btn-delete:hover { background: #fecaca; }
        .btn-approve { background: #d1fae5; color: #065f46; }
        .btn-approve:hover { background: #a7f3d0; }
        .btn-link { color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
        .btn-link:hover { text-decoration: underline; color: #4338ca; }

        /* Modal Redesign */
        .modal-overlay { 
            position: fixed; 
            top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.6); 
            backdrop-filter: blur(4px);
            display: flex; 
            align-items: center; 
            justify-content: center; 
            z-index: 1000; 
            padding: 20px;
        }
        .modal-content { 
            background: white; 
            border-radius: 20px; 
            width: 100%; 
            max-width: 800px; 
            max-height: 90vh; 
            overflow-y: auto; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: modalSlideUp 0.3s ease-out;
        }
        @keyframes modalSlideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .modal-header { 
            padding: 24px 32px; 
            border-bottom: 1px solid #f3f4f6; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            background: white;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .modal-header h2 { margin: 0; font-size: 1.5rem; color: #111827; font-weight: 700; }
        .modal-close { 
            background: #f3f4f6; 
            border: none; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%;
            font-size: 1.2rem; 
            cursor: pointer; 
            color: #4b5563; 
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .modal-close:hover { background: #e5e7eb; color: #1f2937; }

        .company-form { padding: 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full-width { grid-column: 1 / -1; }
        
        .form-group label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 0.95rem;
            margin-left: 2px;
        }
        .form-group input, 
        .form-group textarea, 
        .form-group select { 
            padding: 12px 16px; 
            border: 2px solid #e5e7eb; 
            border-radius: 10px; 
            font-size: 1rem; 
            color: #1f2937;
            transition: all 0.2s;
            background: #f9fafb;
        }
        .form-group input:focus, 
        .form-group textarea:focus, 
        .form-group select:focus { 
            outline: none; 
            border-color: #6366f1; 
            background: white;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        /* Section Dividers */
        .section-header { 
            margin-top: 10px; 
            margin-bottom: 10px;
            padding-bottom: 15px; 
            border-bottom: 2px solid #f3f4f6;
            grid-column: 1 / -1;
        }
        .section-header h3 { 
            margin: 0; 
            color: #6366f1; 
            font-size: 1.1rem; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            font-weight: 700;
        }

        /* Checkbox Group */
        .checkbox-group { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 12px; 
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #f3f4f6;
        }
        .checkbox-label { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            cursor: pointer; 
            padding: 10px 14px; 
            border-radius: 8px; 
            transition: all 0.2s; 
            background: white;
            border: 1px solid #e5e7eb;
        }
        .checkbox-label:hover { border-color: #6366f1; transform: translateY(-1px); }
        .checkbox-label input[type="checkbox"] { 
            width: 18px; 
            height: 18px; 
            cursor: pointer; 
            accent-color: #6366f1;
            margin: 0;
        }
        .checkbox-label span { font-size: 0.95rem; font-weight: 500; color: #4b5563; }
        .help-text { font-size: 0.85rem; color: #6b7280; margin: 0 0 8px 2px; }

        /* Modal Footer */
        .modal-footer { 
            padding: 24px 32px; 
            border-top: 1px solid #f3f4f6; 
            display: flex; 
            justify-content: flex-end; 
            gap: 12px; 
            background: #f9fafb;
            border-radius: 0 0 20px 20px;
        }
        
        /* Main Buttons */
        .btn-primary { 
            background: #4f46e5; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 10px; 
            cursor: pointer; 
            font-size: 1rem; 
            font-weight: 600; 
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            transition: all 0.2s;
        }
        .btn-primary:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3); }
        
        .btn-cancel-action { 
            background: transparent; 
            color: #6b7280; 
            padding: 12px 24px; 
            border: 1px solid transparent; 
            border-radius: 10px; 
            cursor: pointer; 
            font-size: 1rem; 
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-cancel-action:hover { background: #f3f4f6; color: #111827; }

        .btn-secondary { 
            background: white; 
            color: #374151; 
            padding: 12px 24px; 
            border: 1px solid #d1d5db; 
            border-radius: 10px; 
            cursor: pointer; 
            font-size: 1rem; 
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-secondary:hover { background: #f3f4f6; color: #111827; border-color: #9ca3af; }

        .alert { padding: 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 500; }
        .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        
        .loading { text-align: center; padding: 60px; font-size: 1.1rem; color: #6b7280; font-weight: 500; }
        .file-preview { margin-top: 8px; font-size: 0.9rem; padding: 8px 12px; background: #e0e7ff; border-radius: 6px; display: inline-block; color: #3730a3; }
      `}</style>
    </div>
  );
}

export default AdminCompanies;
