import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentApply.css";
import StudentHeader from "./StudentHeader";

const baseURL = "http://localhost:8000/api";

function StudentApply() {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState("");
  const [internshipDetails, setInternshipDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    cover_letter: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [consentFile, setConsentFile] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const [healthFile, setHealthFile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    fetchInternships();
    fetchUserProfile();
    // Check if internship_id is in URL params
    const params = new URLSearchParams(window.location.search);
    const internshipId = params.get("internship_id");
    if (internshipId) {
      setSelectedInternship(internshipId);
      fetchInternshipDetails(internshipId);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${baseURL}/my-profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setUserProfile(res.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
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
      setError(err.response?.data?.error || "Failed to load internships");
      setInternships(dummyInternships);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternshipDetails = async (internshipId) => {
    try {
      const res = await axios.get(`${baseURL}/internships/${internshipId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setInternshipDetails(res.data);
    } catch (err) {
      console.log("Could not fetch internship details");
      const detail = dummyInternships.find(i => i.id === parseInt(internshipId));
      if (detail) {
        setInternshipDetails(detail);
      }
    }
  };

  const handleInternshipChange = (e) => {
    const internshipId = e.target.value;
    setSelectedInternship(internshipId);
    if (internshipId) {
      fetchInternshipDetails(internshipId);
    } else {
      setInternshipDetails(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError("Resume file must be less than 5MB.");
      return;
    }
    setResumeFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInternship) {
      setError("Please select an internship");
      return;
    }

    if (!resumeFile || !consentFile || !contractFile || !healthFile) {
      setError("Please upload all required documents (Resume, Consent, Contract, Health Record).");
      return;
    }

    // Cover letter check removed (Optional)

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const payload = new FormData();
      payload.append("internship_id", parseInt(selectedInternship));
      payload.append("cover_letter", formData.cover_letter);
      // Resume URL removed
      if (resumeFile) {
        payload.append("resume_file", resumeFile);
      }
      if (consentFile) {
        payload.append("parents_consent", consentFile);
      }
      if (contractFile) {
        payload.append("internship_contract", contractFile);
      }
      if (healthFile) {
        payload.append("student_health_record", healthFile);
      }

      await axios.post(`${baseURL}/applications/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Application submitted successfully! Good luck!");
      setFormData({ cover_letter: "" });
      setResumeFile(null);
      setConsentFile(null);
      setContractFile(null);
      setHealthFile(null);
      setSelectedInternship("");
      setInternshipDetails(null);

      setTimeout(() => {
        window.location.href = "/student/applications";
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail;
      const activeInternship = err.response?.data?.active_internship;

      // If student has an active approved internship, show detailed message
      if (activeInternship) {
        setError(
          `You already have an approved internship at ${activeInternship.company} as ${activeInternship.position}. ` +
          `You must complete your current internship before applying to another position.`
        );
      } else if (typeof errorMsg === "object") {
        setError(JSON.stringify(errorMsg));
      } else {
        setError(errorMsg || "Failed to submit application");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="apply-loading">Loading...</div>;

  return (
    <div className="apply-container">
      <StudentHeader
        title="Apply for Internship"
        subtitle="Submit your application and join our partner companies."
      />

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="apply-content">
        <form onSubmit={handleSubmit} className="apply-form">
          {/* Internship Selection - Fixed/Read-Only */}
          <div className="form-group">
            <label>Internship Position</label>
            <input
              type="text"
              className="form-input"
              value={internshipDetails ? `${internshipDetails.position || internshipDetails.title} - ${internshipDetails.company?.name || "Unknown"}` : "Loading..."}
              disabled
              style={{ backgroundColor: "#f8f9fa", border: "1px solid #ced4da", color: "#495057", fontWeight: "500" }}
            />
          </div>

          {/* Internship Details Display */}
          {internshipDetails && (
            <div className="internship-details">
              <h3>Position Details</h3>
              <div className="detail-row">
                <span className="label">Company:</span>
                <span className="value">{internshipDetails.company?.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Position:</span>
                <span className="value">{internshipDetails.position || internshipDetails.title}</span>
              </div>
              <div className="detail-row">
                <span className="label">Location:</span>
                <span className="value">
                  {internshipDetails.work_location || "Not specified"}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{internshipDetails.position_type || "Full-time"}</span>
              </div>
              {internshipDetails.required_skills && (
                <div className="detail-row">
                  <span className="label">Required Skills:</span>
                  <div className="skills-display">
                    {internshipDetails.required_skills.split(",").map((skill, idx) => (
                      <span key={idx} className="skill-badge">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resume File Upload - Moved UP */}
          <div className="form-group">
            <label htmlFor="resume_file">Upload Resume (PDF preferred)</label>
            <input
              type="file"
              id="resume_file"
              name="resume_file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            {resumeFile && (
              <small className="form-hint">
                Selected file: {resumeFile.name}
              </small>
            )}
            <small className="form-hint">
              Upload a PDF/DOC (max 5MB).
            </small>
          </div>

          {/* Parents Consent Letter */}
          <div className="form-group">
            <label htmlFor="parents_consent">Upload Parents Consent Letter</label>
            <input
              type="file"
              id="parents_consent"
              name="parents_consent"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  setError("File must be less than 5MB");
                  return;
                }
                setConsentFile(file || null);
              }}
            />
            {consentFile && (
              <small className="form-hint">
                Selected file: {consentFile.name}
              </small>
            )}
            <small className="form-hint">
              Upload a PDF, DOC, or Image (max 5MB).
            </small>
          </div>

          {/* Internship Contract */}
          <div className="form-group">
            <label htmlFor="internship_contract">Upload Internship Contract *</label>
            <input
              type="file"
              id="internship_contract"
              name="internship_contract"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  setError("File must be less than 5MB");
                  return;
                }
                setContractFile(file || null);
              }}
              required
            />
            {contractFile && (
              <small className="form-hint">
                Selected file: {contractFile.name}
              </small>
            )}
            <small className="form-hint">
              Upload a PDF, DOC, or Image (max 5MB).
            </small>
          </div>

          {/* Student Health Record */}
          <div className="form-group">
            <label htmlFor="student_health_record">Upload Student Health Record</label>
            <input
              type="file"
              id="student_health_record"
              name="student_health_record"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  setError("File must be less than 5MB");
                  return;
                }
                setHealthFile(file || null);
              }}
            />
            {healthFile && (
              <small className="form-hint">
                Selected file: {healthFile.name}
              </small>
            )}
            <small className="form-hint">
              Upload a PDF, DOC, or Image (max 5MB).
            </small>
          </div>

          {/* Cover Letter - Moved DOWN (Optional) */}
          <div className="form-group">
            <label htmlFor="cover_letter">Cover Letter (Optional)</label>
            <textarea
              id="cover_letter"
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleInputChange}
              placeholder="Tell the company why you're a great fit for this internship..."
              rows="8"
              className="form-textarea"
            />
            <span className="char-count">
              {formData.cover_letter.length} characters
            </span>
          </div>

          {/* User Info Display - Updated */}
          <div className="form-group info-display">
            <label>Your Information</label>
            <div className="info-box">
              <div className="info-item">
                <span className="label">Full Name:</span>
                <span className="value">
                  {userProfile
                    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.username
                    : user.username}
                </span>
              </div>

              {userProfile && userProfile.student_profile && (
                <>
                  <div className="info-item">
                    <span className="label">Course:</span>
                    <span className="value">{userProfile.student_profile.course || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Year & Section:</span>
                    <span className="value">
                      {userProfile.student_profile.year_level || '?'} - {userProfile.student_profile.section || '?'}
                    </span>
                  </div>
                </>
              )}

              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{userProfile?.email || user?.email || "No email available"}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting || !resumeFile || !consentFile || !contractFile || !healthFile}
              className="submit-btn"
              title={(!resumeFile || !consentFile || !contractFile || !healthFile) ? "Please upload all required files" : ""}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <a href="/student/internships" className="cancel-btn">
              Browse More Internships
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentApply;


