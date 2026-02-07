import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentInternships.css";
import StudentHeader from "./StudentHeader";

const baseURL = "http://localhost:8000/api";

function StudentInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [companies, setCompanies] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState({
    current_applications: 0,
    max_applications: 5,
    remaining: 5,
    can_apply: true
  });
  const [activeInternship, setActiveInternship] = useState(null);

  const token = localStorage.getItem("token");

  const dummyInternships = [
    {
      id: 1,
      position: "Frontend Developer Intern",
      title: "Frontend Developer Intern",
      company: { id: 1, name: "MOA" },
      company_name: "MOA",
      work_location: "BGC, Manila",
      duration_weeks: 8,
      position_type: "Full-time",
      stipend: 5000,
      required_skills: "ReactJS, HTML, CSS, JavaScript",
      description: "Work on real-world ReactJS projects and learn from experienced developers."
    },
    {
      id: 2,
      position: "Backend Developer Intern",
      title: "Backend Developer Intern",
      company: { id: 2, name: "Tech Solutions" },
      company_name: "Tech Solutions",
      work_location: "Makati, Manila",
      duration_weeks: 8,
      position_type: "Full-time",
      stipend: 6000,
      required_skills: "NodeJS, ExpressJS, SQL",
      description: "Assist in building scalable backend APIs and database management."
    }
  ];

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      try {
        const res = await axios.get(`${baseURL}/application-status/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setApplicationStatus(res.data);
      } catch (err) {
        console.log("Could not fetch application status");
      }
    };

    const fetchInternships = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/internships/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = res.data.results || res.data;
        if (!data || data.length === 0) {
          setInternships(dummyInternships);
        } else {
          setInternships(data);
        }
      } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.error === 'Pre-training requirements incomplete') {
          setError(err.response.data);
          setInternships([]);
        } else {
          setError(err.response?.data?.error || "Failed to load internships");
          setInternships(dummyInternships);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${baseURL}/companies/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = res.data.results || res.data;
        if (data && data.length > 0) {
          setCompanies(data);
        }
      } catch (err) {
        console.log("Could not fetch companies");
      }
    };

    const checkActiveInternship = async () => {
      try {
        const res = await axios.get(`${baseURL}/applications/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const apps = res.data;
        const approvedApp = apps.find(a => a.status === 'Approved');
        if (approvedApp) {
          setActiveInternship({
            position: approvedApp.internship?.position || 'Position',
            company: approvedApp.internship?.company?.name || 'Company',
            companyId: approvedApp.internship?.company?.id || approvedApp.internship?.company_id
          });
        }
      } catch (err) {
        console.log("Could not check active internship");
      }
    };

    fetchApplicationStatus();
    fetchInternships();
    fetchCompanies();
    checkActiveInternship();
  }, []);

  const getFilteredInternships = () => {
    if (!internships || internships.length === 0) return [];

    return internships.filter((internship) => {
      // HIDE internships from company that already accepted this student
      if (activeInternship && activeInternship.companyId) {
        const internshipCompanyId = internship.company?.id || internship.company_id || internship.company;
        if (internshipCompanyId === activeInternship.companyId) {
          return false; // Don't show internships from this company
        }
      }

      // Search by position/title, company name, description, or skills
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        (internship.position?.toLowerCase().includes(searchLower) || false) ||
        (internship.title?.toLowerCase().includes(searchLower) || false) ||
        (internship.company?.name?.toLowerCase().includes(searchLower) || false) ||
        (internship.company_name?.toLowerCase().includes(searchLower) || false) ||
        (internship.description?.toLowerCase().includes(searchLower) || false) ||
        (internship.required_skills?.toLowerCase().includes(searchLower) || false);

      // Filter by company
      let matchesCompany = true;
      if (filterCompany !== "all") {
        const companyId = parseInt(filterCompany);
        if (!isNaN(companyId)) {
          matchesCompany = internship.company?.id === companyId ||
            internship.company === companyId ||
            internship.company_id === companyId;
        }
      }

      return matchesSearch && matchesCompany;
    });
  };

  const handleApply = (internshipId) => {
    window.location.href = `/student/apply?internship_id=${internshipId}`;
  };

  const [selectedInternship, setSelectedInternship] = useState(null);

  const handleViewDetails = async (internship) => {
    // Set initial data while loading
    setSelectedInternship(internship);

    try {
      const res = await axios.get(`${baseURL}/internships/${internship.id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      // Update with full details including contact info
      setSelectedInternship(res.data);
    } catch (err) {
      console.error("Failed to fetch internship details", err);
    }
  };

  const handleCloseModal = () => {
    setSelectedInternship(null);
  };

  if (loading) return <div className="internships-loading">Loading internships...</div>;

  // Handle Restricted Access
  if (error && error.missing_requirements) {
    return (
      <div className="internships-container">
        <StudentHeader title="Access Restricted" subtitle="You simply need to complete a few steps first." />
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '600px',
          margin: '40px auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ color: '#d32f2f', marginTop: 0 }}>Access Locked</h2>
          <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '30px' }}>
            {error.message || "You must complete your pre-training requirements before you can view internships."}
          </p>

          <div style={{ textAlign: 'left', background: '#ffebee', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>Missing Approved Documents:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {error.missing_requirements.map((req, i) => (
                <li key={i} style={{ color: '#b71c1c', marginBottom: '5px' }}>{req}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/student/pre-training'}
            className="btn-primary"
            style={{ padding: '12px 30px', fontSize: '1.1rem' }}
          >
            Go to Pre-Training Requirements
          </button>
        </div>
      </div>
    );
  }

  const filteredInternships = getFilteredInternships();

  return (
    <div className="internships-container">
      <StudentHeader
        title="Search Internships"
        subtitle="Browse available internship opportunities and find the perfect match for your skills."
      />

      {/* Active Internship Notification - More Prominent */}
      {activeInternship && (
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '25px',
          boxShadow: '0 6px 20px rgba(245, 87, 108, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: '700' }}>
                Application Restricted - Active Internship
              </h3>
              <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.6' }}>
                You are currently approved for <strong style={{ fontSize: '1.1rem' }}>{activeInternship.position}</strong> at <strong style={{ fontSize: '1.1rem' }}>{activeInternship.company}</strong>.
                <br />
                <span style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                  You must complete your current internship before applying to new positions. Contact your coordinator if you have questions.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Status Banner */}
      {!activeInternship && (
        <div className={`application-status-banner ${applicationStatus.remaining === 0 ? 'limit-reached' : ''}`}>
          <div className="status-info">
            <h3>Application Status</h3>
            <p>
              You have submitted <strong>{applicationStatus.current_applications}</strong> out of <strong>{applicationStatus.max_applications}</strong> allowed applications
            </p>
          </div>
          <div className="status-count">
            <div className="count-number">
              {applicationStatus.remaining}
            </div>
            <div className="count-label">
              {applicationStatus.remaining === 1 ? 'slot remaining' : 'slots remaining'}
            </div>
          </div>
        </div>
      )}

      {!activeInternship && !applicationStatus.can_apply && (
        <div className="error-banner" style={{ marginBottom: '20px' }}>
          ⚠️ You have reached the maximum number of applications. You cannot apply to more internships.
        </div>
      )}

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by position, company name (e.g., 'moa'), or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <label>Filter by Company:</label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-count">
        Found <strong>{filteredInternships.length}</strong> internship
        {filteredInternships.length !== 1 ? "s" : ""}
      </div>

      {
        !loading && internships.length === 0 && (
          <div className="no-results">
            <p>No internships available at the moment. Please check back later.</p>
          </div>
        )
      }

      {
        filteredInternships.length > 0 ? (
          <div className="internships-grid">
            {filteredInternships.map((internship) => (
              <div key={internship.id} className="internship-card" onClick={() => handleViewDetails(internship)}>
                <div className="card-header">
                  <h2>{internship.position || internship.title || "Untitled Position"}</h2>
                  <span className="company-name">
                    {internship.company?.name || internship.company_name || "Unknown Company"}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-item">
                    <span className="text">
                      Location: {internship.work_location || "Not specified"}
                    </span>
                  </div>



                  <div className="info-item">
                    <span className="text">
                      Type: {internship.position_type || "Full-time"}
                    </span>
                  </div>

                  {internship.stipend && (
                    <div className="info-item">
                      <span className="text">Stipend: PHP {internship.stipend}/month</span>
                    </div>
                  )}

                  {internship.required_skills && (
                    <div className="skills-section">
                      <p className="skills-label">Required Skills:</p>
                      <div className="skills-container">
                        {internship.required_skills.split(",").map((skill, idx) => (
                          <span key={idx} className="skill-tag">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {internship.description && (
                    <div className="description">
                      <p>{internship.description}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!activeInternship && applicationStatus.can_apply) {
                        handleApply(internship.id);
                      }
                    }}
                    className={`apply-btn ${activeInternship || !applicationStatus.can_apply ? 'disabled' : ''}`}
                    disabled={activeInternship || !applicationStatus.can_apply}
                    title={activeInternship ? `You already have an active internship at ${activeInternship.company}` : !applicationStatus.can_apply ? 'You have reached the maximum number of applications' : 'Click to apply'}
                  >
                    {activeInternship ? 'Already Enrolled' : !applicationStatus.can_apply ? 'Limit Reached' : 'Apply Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No internships found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCompany("all");
              }}
              className="reset-btn"
            >
              Reset Filters
            </button>
          </div>
        )
      }

      {/* Internship Details Modal */}
      {
        selectedInternship && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{selectedInternship.position || selectedInternship.title}</h2>
                  <span className="company-name" style={{ fontSize: '1.1rem' }}>
                    {selectedInternship.company?.name || selectedInternship.company_name}
                  </span>
                </div>
                <button className="close-btn" onClick={handleCloseModal}>&times;</button>
              </div>

              <div className="modal-body">
                <div className="modal-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedInternship.work_location || "Not specified"}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{selectedInternship.position_type || "Full-time"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stipend</span>
                    <span className="detail-value">
                      {selectedInternship.stipend ? `PHP ${selectedInternship.stipend}/month` : "Unpaid / Not specified"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Slots Available</span>
                    <span className="detail-value">{selectedInternship.slots || 1}</span>
                  </div>
                </div>

                {selectedInternship.required_skills && (
                  <div className="modal-section">
                    <h3>Required Skills</h3>
                    <div className="skills-container">
                      {selectedInternship.required_skills.split(",").map((skill, idx) => (
                        <span key={idx} className="skill-tag" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-section">
                  <h3>Job Description</h3>
                  <div className="modal-description">
                    {selectedInternship.description || "No description provided."}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="modal-section">
                  <h3>Contact Information</h3>
                  <div className="contact-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>

                    {/* Company Contact */}
                    <div className="contact-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1rem' }}>Company Representative</h4>
                      {selectedInternship.company?.contact_person ? (
                        <>
                          <p style={{ margin: '5px 0', fontWeight: '600' }}>{selectedInternship.company.contact_person}</p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>📧 {selectedInternship.company.contact_email}</p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>📞 {selectedInternship.company.phone}</p>
                        </>
                      ) : (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Contact details available upon application.</p>
                      )}
                    </div>

                    {/* Supervisor(s) */}
                    {selectedInternship.supervisors && selectedInternship.supervisors.length > 0 && (
                      <div className="contact-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1rem' }}>Supervisor(s)</h4>
                        {selectedInternship.supervisors.map((sup, idx) => (
                          <div key={idx} style={{ marginBottom: '10px' }}>
                            <p style={{ margin: '5px 0', fontWeight: '600' }}>{sup.name}</p>
                            <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#666' }}>{sup.position}</p>
                            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>📧 {sup.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-cancel-btn" onClick={handleCloseModal}>Close</button>
                <button
                  className={`modal-apply-btn ${activeInternship || !applicationStatus.can_apply ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!activeInternship && applicationStatus.can_apply) {
                      handleApply(selectedInternship.id);
                    }
                  }}
                  disabled={activeInternship || !applicationStatus.can_apply}
                  title={activeInternship ? `You already have an active internship at ${activeInternship.company}` : !applicationStatus.can_apply ? 'You have reached the maximum number of applications' : 'Click to apply'}
                >
                  {activeInternship ? 'Already Enrolled' : !applicationStatus.can_apply ? 'Limit Reached' : 'Apply Now'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default StudentInternships;


