import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";

// All EARIST courses grouped by college for a clean, sorted dropdown
const COURSES_BY_COLLEGE = {
  "College of Architecture and Fine Arts": [
    "Bachelor of Science in Architecture (BS ARCHI.)",
    "Bachelor of Science in Interior Design (BSID)",
    "Bachelor in Fine Arts (BFA) - Major in Painting",
    "Bachelor in Fine Arts (BFA) - Major in Visual Communication",
  ],
  "College of Arts and Sciences": [
    "Bachelor of Science in Applied Physics with Computer Science Emphasis (BSAP)",
    "Bachelor of Science in Computer Science (BSCS)",
    "Bachelor of Science in Information Technology (BS INFO. TECH.)",
    "Bachelor of Science in Psychology (BSPSYCH)",
    "Bachelor of Science in Mathematics (BSMATH)",
  ],
  "College of Business Administration": [
    "Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management",
    "Bachelor of Science in Business Administration (BSBA) - Major in Human Resource Development Management (HRDM)",
    "Bachelor of Science in Entrepreneurship (BSEM)",
    "Bachelor of Science in Office Administration (BSOA)",
  ],
  "College of Education": [
    "Bachelor in Secondary Education (BSE) - Major in Science",
    "Bachelor in Secondary Education (BSE) - Major in Mathematics",
    "Bachelor in Secondary Education (BSE) - Major in Filipino",
    "Bachelor in Special Needs Education (BSNEd)",
    "Bachelor in Technology and Livelihood Education (BTLE) - Major in Home Economics",
    "Bachelor in Technology and Livelihood Education (BTLE) - Major in Industrial Arts",
    "Professional Education / Subjects 18 units (TCP)",
  ],
  "College of Engineering": [
    "Bachelor of Science in Chemical Engineering (BSCHE)",
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Electrical Engineering (BSEE)",
    "Bachelor of Science in Electronics and Communication Engineering (BSECE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Science in Computer Engineering (BSCOE)",
  ],
  "College of Hospitality Management": [
    "Bachelor of Science in Tourism Management (BST)",
    "Bachelor of Science in Hospitality Management (BSHM)",
  ],
  "College of Industrial Technology": [
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Automotive Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Electrical Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Electronics Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Food Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Fashion and Apparel Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Industrial Chemistry",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Drafting Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Machine Shop Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Refrigeration and Air Conditioning",
  ],
  "College of Public Administration and Criminology": [
    "Bachelor in Public Administration (BPA)",
    "Bachelor of Science in Criminology (BSCRIM)",
  ],
};

function AdminInternships() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    description: "",
    slots: 1,
    required_courses: "",
    work_location: "",
    duration_weeks: 8,
    stipend: "",
    position_type: "Full-time",
  });

  const baseURL = "http://localhost:8000/api/";

  // Check admin access and fetch data
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
      await Promise.all([fetchCompanies(), fetchInternships()]);
    } catch (err) {
      console.error("Auth check error:", err);
      navigate("/login");
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}companies/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseURL}internships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setInternships(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching internships:", err);
      setError("Unable to load internships. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = useMemo(
    () => (internship) => {
      if (internship.company?.name) return internship.company.name;
      const match = companies.find(
        (company) => company.id === internship.company || company.id === internship.company_id
      );
      return match ? match.name : "Unknown Company";
    },
    [companies]
  );

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      description: "",
      slots: 1,
      required_courses: "",
      work_location: "",
      duration_weeks: 8,
      stipend: "",
      position_type: "Full-time",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (internship) => {
    setFormData({
      company: internship.company?.id || internship.company_id || "",
      position: internship.position,
      description: internship.description,
      slots: internship.slots,
      required_courses: internship.required_courses || "",
      work_location: internship.work_location || "",
      duration_weeks: internship.duration_weeks || 8,
      stipend: internship.stipend || "",
      position_type: internship.position_type || "Full-time",
    });
    setEditingId(internship.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.company || !formData.position || !formData.description || formData.slots < 1) {
      setError("All fields are required and slots must be at least 1");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      // Prepare data with company_id instead of company
      const submitData = {
        ...formData,
        company_id: formData.company
      };
      delete submitData.company;

      if (editingId) {
        // Update
        await axios.put(`${baseURL}internships/${editingId}/`, submitData, { headers });
        setSuccess("Internship updated successfully!");
      } else {
        // Create
        await axios.post(`${baseURL}internships/`, submitData, { headers });
        setSuccess("Internship added successfully!");
      }

      resetForm();
      fetchInternships();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.company_id || "Operation failed. Please try again.";
      setError(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseURL}internships/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSuccess("Internship deleted successfully!");
      fetchInternships();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete internship.");
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseURL}export/internships/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `internships_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export internships.");
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="homepage">
      <div className="dashboard-content">
        <h1>Internships Management</h1>
        <p className="page-subtitle">Create and manage internship opportunities for students.</p>

        {success && <div className="status-banner">{success}</div>}
        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="status-banner">Loading internships…</div>}

        {/* Form Section */}
        {showForm && (
          <div className="add-section">
            <h2>{editingId ? " Edit Internship" : "➕ Add New Internship"}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Company</label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    placeholder="e.g., Junior Developer"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Available Slots</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.slots}
                    onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Work Location</label>
                  <select
                    value={formData.work_location}
                    onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  >
                    <option value="">Select location</option>
                    <option value="Remote">Remote</option>
                    <optgroup label="Metro Manila">
                      <option value="Makati">Makati</option>
                      <option value="BGC (Bonifacio Global City)">BGC (Bonifacio Global City)</option>
                      <option value="Manila">Manila</option>
                      <option value="Quezon City">Quezon City</option>
                      <option value="Pasig">Pasig</option>
                      <option value="Mandaluyong">Mandaluyong</option>
                      <option value="Taguig">Taguig</option>
                      <option value="Pasay">Pasay</option>
                      <option value="San Juan">San Juan</option>
                      <option value="Ortigas">Ortigas</option>
                      <option value="Alabang">Alabang</option>
                      <option value="Marikina">Marikina</option>
                      <option value="Las Piñas">Las Piñas</option>
                      <option value="Parañaque">Parañaque</option>
                      <option value="Muntinlupa">Muntinlupa</option>
                      <option value="Valenzuela">Valenzuela</option>
                      <option value="Caloocan">Caloocan</option>
                      <option value="Malabon">Malabon</option>
                      <option value="Navotas">Navotas</option>
                    </optgroup>
                    <optgroup label="Luzon">
                      <option value="Baguio">Baguio</option>
                      <option value="Angeles City">Angeles City</option>
                      <option value="Olongapo">Olongapo</option>
                      <option value="Batangas City">Batangas City</option>
                      <option value="Laguna (Calamba, Sta. Rosa)">Laguna (Calamba, Sta. Rosa)</option>
                      <option value="Cavite (Bacoor, Imus, Dasmariñas)">Cavite (Bacoor, Imus, Dasmariñas)</option>
                      <option value="Bulacan (Malolos, Marilao)">Bulacan (Malolos, Marilao)</option>
                      <option value="Pampanga (San Fernando)">Pampanga (San Fernando)</option>
                      <option value="Naga City">Naga City</option>
                      <option value="Legazpi">Legazpi</option>
                      <option value="Lucena">Lucena</option>
                      <option value="Antipolo">Antipolo</option>
                    </optgroup>
                    <optgroup label="Visayas">
                      <option value="Cebu City">Cebu City</option>
                      <option value="Iloilo City">Iloilo City</option>
                      <option value="Bacolod">Bacolod</option>
                      <option value="Tacloban">Tacloban</option>
                      <option value="Dumaguete">Dumaguete</option>
                      <option value="Tagbilaran">Tagbilaran</option>
                      <option value="Roxas City">Roxas City</option>
                    </optgroup>
                    <optgroup label="Mindanao">
                      <option value="Davao City">Davao City</option>
                      <option value="Cagayan de Oro">Cagayan de Oro</option>
                      <option value="Zamboanga City">Zamboanga City</option>
                      <option value="General Santos">General Santos</option>
                      <option value="Butuan">Butuan</option>
                      <option value="Iligan">Iligan</option>
                      <option value="Cotabato City">Cotabato City</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label>Position Type</label>
                  <select
                    value={formData.position_type}
                    onChange={(e) => setFormData({ ...formData, position_type: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stipend (PHP)</label>
                  <input
                    type="text"
                    placeholder="e.g., 5,000 or 5000"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Required Course</label>
                  <select
                    value={formData.required_courses || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        required_courses: e.target.value,
                      });
                    }}
                  >
                    <option value="">Any related course</option>
                    {Object.entries(COURSES_BY_COLLEGE).map(
                      ([college, courses]) => (
                        <optgroup key={college} label={college}>
                          {courses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </optgroup>
                      )
                    )}
                  </select>
                  <small style={{ fontSize: "0.8rem", color: "#666" }}>
                    Select the primary course this internship is intended for.
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the internship role and responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Internship" : "Add Internship"}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Button */}
        {!showForm && (
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              ➕ Add New Internship
            </button>
            <button
              className="btn-secondary"
              onClick={handleExport}
              style={{ marginLeft: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none' }}
            >
              Export CSV
            </button>
          </div>
        )}

        {/* Internships Table */}
        <div className="data-section">
          <h2>Internships List ({internships.length})</h2>
          {internships.length === 0 && !loading ? (
            <p className="empty-state">No internships created yet. Add your first internship to get started.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Company</th>
                    <th>Required Courses</th>
                    <th>Location</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Slots</th>
                    <th>Stipend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((internship) => (
                    <tr key={internship.id}>
                      <td className="font-bold">{internship.position}</td>
                      <td>{getCompanyName(internship)}</td>
                      <td>
                        {internship.required_courses
                          ? internship.required_courses
                          : "Any related course"}
                      </td>
                      <td>{internship.work_location || "Not specified"}</td>
                      <td className="center">
                        {internship.duration_weeks === 1 ? "1 week" :
                          internship.duration_weeks < 4 ? `${internship.duration_weeks} weeks` :
                            internship.duration_weeks < 8 ? `${Math.floor(internship.duration_weeks / 4)} month` :
                              `${Math.floor(internship.duration_weeks / 4)} months`}
                      </td>
                      <td className="center">{internship.position_type || "Full-time"}</td>
                      <td className="center">{internship.slots}</td>
                      <td>{internship.stipend ? `PHP ${internship.stipend}` : "Not specified"}</td>
                      <td className="action-cell">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(internship)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(internship.id)}
                          title="Delete"
                        >
                          Delete
                        </button>
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

export default AdminInternships;
