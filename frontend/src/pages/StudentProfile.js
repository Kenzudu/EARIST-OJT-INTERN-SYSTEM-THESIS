import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentProfile.css";
import jsPDF from "jspdf";
import defaultAvatar from "./images/—Pngtree—character default avatar_5407167.png";

const baseURL = "http://localhost:8000/api";

// Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder, rows = 4, required = false }) => {
  const editorRef = React.useRef(null);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const html = e.target.innerHTML;
    onChange(html);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    const html = editorRef.current?.innerHTML || '';
    onChange(html);
  };

  const getPlainText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return (
    <div className="rich-text-editor-wrapper">
      <div className="rich-text-toolbar">
        <button type="button" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)" className="toolbar-btn">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)" className="toolbar-btn">
          <em>I</em>
        </button>
        <button type="button" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)" className="toolbar-btn">
          <u>U</u>
        </button>
        <div className="toolbar-separator"></div>
        <button type="button" onClick={() => execCommand('formatBlock', '<h3>')} title="Heading" className="toolbar-btn">
          H
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List" className="toolbar-btn">
          •
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List" className="toolbar-btn">
          1.
        </button>
        <div className="toolbar-separator"></div>
        <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left" className="toolbar-btn">
          ⬅
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center" className="toolbar-btn">
          ⬌
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right" className="toolbar-btn">
          ➡
        </button>
        <div className="toolbar-separator"></div>
        <button type="button" onClick={() => execCommand('removeFormat')} title="Clear Formatting" className="toolbar-btn">
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`rich-text-editor ${isFocused ? 'focused' : ''} ${!value || value === '<br>' ? 'empty' : ''}`}
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 24}px`,
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          outline: 'none',
          backgroundColor: '#fff',
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: 'inherit'
        }}
        suppressContentEditableWarning={true}
      />
      {required && (!value || value.trim() === '' || value === '<br>') && (
        <span className="required-indicator">* Required field</span>
      )}
    </div>
  );
};

function StudentProfile() {
  const [profile, setProfile] = useState({
    user: {},
    bio: "",
    phone: "",
    address: "",
    skills: "",
    certifications: "",
    career_interests: "",
    resume_url: "",
    course: "",
    student_id: "",
    birth_date: "",
    sex: "",
    profile_picture: null,
    certificate_of_registration: null,
    profile_complete: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [formData, setFormData] = useState({ ...profile });
  const [resumeData, setResumeData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    objective: "",
    education: "",
    experience: "",
    skills: "",
    certifications: "",
    languages: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    checkStudentAccess();
    fetchProfile();
  }, []);

  const checkStudentAccess = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.is_staff) {
      window.location.href = "/admin/dashboard";
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/my-profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      // Ensure certificate_of_registration is initialized
      const profileData = {
        ...res.data,
        certificate_of_registration: res.data.certificate_of_registration || null
      };
      setProfile(profileData);
      setFormData(profileData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Restrict phone input to numbers only
    if (name === "phone" && !/^\d*$/.test(value)) {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleCORFileChange = (e) => {
    setFormData({ ...formData, certificate_of_registration: e.target.files[0] });
  };

  const handleProfilePictureChange = (e) => {
    setFormData({ ...formData, profile_picture: e.target.files[0] });
  };

  const handleCertificationFileChange = (e) => {
    setFormData({ ...formData, certification_file: e.target.files[0] });
  };

  // Check if all required fields are filled
  const isProfileComplete = () => {
    const requiredFields = ['course', 'year', 'section', 'phone', 'address', 'skills', 'career_interests'];

    // Check all text fields
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field];
      return value && String(value).trim() !== '';
    });

    // Check if resume is uploaded (file or URL)
    const hasResume = (formData.resume instanceof File) ||
      (formData.resume_url && String(formData.resume_url).trim() !== '') ||
      (profile.resume && String(profile.resume).trim() !== '') ||
      (profile.resume_url && String(profile.resume_url).trim() !== '');

    // Check if COR is uploaded
    const hasCOR = (formData.certificate_of_registration instanceof File) ||
      (profile.certificate_of_registration && String(profile.certificate_of_registration).trim() !== '');

    return allFieldsFilled && hasResume && hasCOR;
  };

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");
      const data = new FormData();

      // Add all fields except file fields first
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'resume') {
          // Only add resume if it's a File object (newly selected)
          if (value instanceof File) {
            data.append(key, value);
          }
        } else if (key === 'certificate_of_registration') {
          // Only add certificate_of_registration if it's a File object (newly selected)
          // Don't send if it's a URL string (existing file)
          if (value instanceof File) {
            data.append(key, value);
          }
          // If it's a string (URL), don't send it - backend will keep existing file
        } else if (key === 'certification_file') {
          // Only add certification_file if it's a File object (newly selected)
          if (value instanceof File) {
            data.append(key, value);
          }
        } else if (key === 'profile_picture') {
          // Only add profile_picture if it's a File object (newly selected)
          // Don't send if it's a URL string (existing file)
          if (value instanceof File) {
            data.append(key, value);
          }
          // If it's a string (URL), don't send it - backend will keep existing file
        } else if (key === 'user') {
          // Don't include nested user object in FormData
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([userKey, userVal]) => {
              if (userKey === 'first_name' || userKey === 'last_name') {
                data.append(userKey, userVal || '');
              }
            });
          }
        } else if (value !== undefined && value !== null && value !== '') {
          data.append(key, value);
        }
      });

      // Always send first_name, last_name, and email to update user fields
      data.append('first_name', formData.first_name || formData.user?.first_name || '');
      data.append('last_name', formData.last_name || formData.user?.last_name || '');
      data.append('email', formData.email || formData.user?.email || '');

      const res = await axios.put(`${baseURL}/my-profile/`, data, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      setFormData(res.data);
      setEditMode(false);
      setSuccess("Profile updated successfully!");

      // Clear profile incomplete flag if it was set
      localStorage.removeItem("profile_incomplete");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error details:", err.response);
      // Log full error details for debugging
      if (err.response?.data) {
        console.error("Full error response:", JSON.stringify(err.response.data, null, 2));
      }
      const errorMsg = err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data :
          Object.entries(err.response?.data || {}).map(([key, val]) => {
            // Handle array errors (like validation errors)
            if (Array.isArray(val)) {
              return `${key}: ${val.join(", ")}`;
            }
            return `${key}: ${val}`;
          }).join(", ")) ||
        "Failed to update profile";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setEditMode(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    setPasswordError("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 12) {
      setPasswordError("Password must be between 6 and 12 characters");
      return;
    }

    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
      'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
      'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
      'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1'
    ];

    if (commonPasswords.includes(newPassword.toLowerCase())) {
      setPasswordError("This password is too common. Please choose a stronger password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${baseURL}/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword,
      }, {
        headers: { Authorization: `Token ${token}` },
      });

      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => {
        setPasswordSuccess("");
        setShowChangePassword(false);
      }, 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Failed to change password. Please check your old password.");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`edit-btn ${editMode ? "editing" : ""}`}
        >
          {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {!profile.profile_complete && (
        <div className="alert alert-warning" style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          color: '#856404',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          ⚠️ Please complete your profile by filling in all required fields:<br />
          <strong>Course, Year, Section, Phone, Address, Skills, Career Interests, Resume (upload or URL), and COR (Certificate of Registration)</strong>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        {/* Profile Picture Section */}
        <div className="profile-section profile-picture-section">
          <h2>Profile Picture</h2>
          {editMode ? (
            <div className="profile-picture-upload">
              <div className="profile-picture-preview">
                {formData.profile_picture instanceof File ? (
                  <img src={URL.createObjectURL(formData.profile_picture)} alt="Profile preview" />
                ) : profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="Profile" />
                ) : (
                  <img src={defaultAvatar} alt="Default Avatar" />
                )}
              </div>
              <div className="form-group">
                <label>Upload Profile Picture</label>
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                  Upload a profile picture (JPG, PNG, or GIF format)
                </small>
              </div>
            </div>
          ) : (
            <div className="profile-picture-display">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" />
              ) : (
                <img src={defaultAvatar} alt="Default Avatar" />
              )}
            </div>
          )}
        </div>

        {/* User Info Section */}
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-grid">
            <div className="profile-item">
              <label>Username</label>
              <p className="profile-value">{profile.user.username || "N/A"}</p>
            </div>
            <div className="profile-item">
              <label>Email</label>
              <p className="profile-value">{profile.user.email || "N/A"}</p>
            </div>
            <div className="profile-item">
              <label>Full Name</label>
              <p className="profile-value">
                {profile.user.first_name && profile.user.last_name
                  ? `${profile.user.first_name} ${profile.user.last_name}`
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="profile-section">
          <h2>Profile Details</h2>
          {editMode ? (
            <div className="profile-form">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || formData.user?.first_name || ""}
                  onChange={(e) => {
                    const newFormData = { ...formData, first_name: e.target.value };
                    // Clear nested user.first_name so the new value displays
                    if (newFormData.user) {
                      newFormData.user = { ...newFormData.user, first_name: e.target.value };
                    }
                    setFormData(newFormData);
                  }}
                  placeholder="Your first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || formData.user?.last_name || ""}
                  onChange={(e) => {
                    const newFormData = { ...formData, last_name: e.target.value };
                    // Clear nested user.last_name so the new value displays
                    if (newFormData.user) {
                      newFormData.user = { ...newFormData.user, last_name: e.target.value };
                    }
                    setFormData(newFormData);
                  }}
                  placeholder="Your last name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || formData.user?.email || ""}
                  onChange={(e) => {
                    const newFormData = { ...formData, email: e.target.value };
                    // Clear nested user.email so the new value displays
                    if (newFormData.user) {
                      newFormData.user = { ...newFormData.user, email: e.target.value };
                    }
                    setFormData(newFormData);
                  }}
                  placeholder="Your email address"
                />
              </div>

              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id || ""}
                  onChange={handleInputChange}
                  placeholder="Your student ID"
                />
              </div>

              <div className="form-group">
                <label>Birthday</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date || ""}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Sex</label>
                <select
                  name="sex"
                  value={formData.sex || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Upload COR (Certificate of Registration)</label>
                <input
                  type="file"
                  name="certificate_of_registration"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCORFileChange}
                />
                {profile.certificate_of_registration && (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.certificate_of_registration} target="_blank" rel="noopener noreferrer">
                      View Uploaded COR
                    </a>
                  </div>
                )}
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                  Upload your Certificate of Registration (PDF or DOC format)
                </small>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Your complete address"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Course</label>
                <select
                  name="course"
                  value={formData.course || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Course</option>

                  <optgroup label="College of Architecture and Fine Arts">
                    <option value="Bachelor of Science in Architecture (BS ARCHI.)">Bachelor of Science in Architecture (BS ARCHI.)</option>
                    <option value="Bachelor of Science in Interior Design (BSID)">Bachelor of Science in Interior Design (BSID)</option>
                    <option value="Bachelor in Fine Arts (BFA) - Major in Painting">Bachelor in Fine Arts (BFA) - Major in Painting</option>
                    <option value="Bachelor in Fine Arts (BFA) - Major in Visual Communication">Bachelor in Fine Arts (BFA) - Major in Visual Communication</option>
                  </optgroup>

                  <optgroup label="College of Computing Studies (CCS)">
                    <option value="Bachelor of Science in Computer Science (BSCS)">Bachelor of Science in Computer Science (BSCS)</option>
                    <option value="Bachelor of Science in Information Technology (BS INFO. TECH.)">Bachelor of Science in Information Technology (BS INFO. TECH.)</option>
                  </optgroup>

                  <optgroup label="College of Arts and Sciences">
                    <option value="Bachelor of Science in Applied Physics with Computer Science Emphasis (BSAP)">Bachelor of Science in Applied Physics with Computer Science Emphasis (BSAP)</option>
                    <option value="Bachelor of Science in Psychology (BSPSYCH)">Bachelor of Science in Psychology (BSPSYCH)</option>
                    <option value="Bachelor of Science in Mathematics (BSMATH)">Bachelor of Science in Mathematics (BSMATH)</option>
                  </optgroup>

                  <optgroup label="College of Business Administration">
                    <option value="Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management">Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management</option>
                    <option value="Bachelor of Science in Business Administration (BSBA) - Major in Human Resource Development Management (HRDM)">Bachelor of Science in Business Administration (BSBA) - Major in Human Resource Development Management (HRDM)</option>
                    <option value="Bachelor of Science in Entrepreneurship (BSEM)">Bachelor of Science in Entrepreneurship (BSEM)</option>
                    <option value="Bachelor of Science in Office Administration (BSOA)">Bachelor of Science in Office Administration (BSOA)</option>
                  </optgroup>

                  <optgroup label="College of Education">
                    <option value="Bachelor in Secondary Education (BSE) - Major in Science">Bachelor in Secondary Education (BSE) - Major in Science</option>
                    <option value="Bachelor in Secondary Education (BSE) - Major in Mathematics">Bachelor in Secondary Education (BSE) - Major in Mathematics</option>
                    <option value="Bachelor in Secondary Education (BSE) - Major in Filipino">Bachelor in Secondary Education (BSE) - Major in Filipino</option>
                    <option value="Bachelor in Special Needs Education (BSNEd)">Bachelor in Special Needs Education (BSNEd)</option>
                    <option value="Bachelor in Technology and Livelihood Education (BTLE) - Major in Home Economics">Bachelor in Technology and Livelihood Education (BTLE) - Major in Home Economics</option>
                    <option value="Bachelor in Technology and Livelihood Education (BTLE) - Major in Industrial Arts">Bachelor in Technology and Livelihood Education (BTLE) - Major in Industrial Arts</option>
                    <option value="Professional Education / Subjects 18 units (TCP)">Professional Education / Subjects 18 units (TCP)</option>
                  </optgroup>

                  <optgroup label="College of Engineering">
                    <option value="Bachelor of Science in Chemical Engineering (BSCHE)">Bachelor of Science in Chemical Engineering (BSCHE)</option>
                    <option value="Bachelor of Science in Civil Engineering (BSCE)">Bachelor of Science in Civil Engineering (BSCE)</option>
                    <option value="Bachelor of Science in Electrical Engineering (BSEE)">Bachelor of Science in Electrical Engineering (BSEE)</option>
                    <option value="Bachelor of Science in Electronics and Communication Engineering (BSECE)">Bachelor of Science in Electronics and Communication Engineering (BSECE)</option>
                    <option value="Bachelor of Science in Mechanical Engineering (BSME)">Bachelor of Science in Mechanical Engineering (BSME)</option>
                    <option value="Bachelor of Science in Computer Engineering (BSCOE)">Bachelor of Science in Computer Engineering (BSCOE)</option>
                  </optgroup>

                  <optgroup label="College of Hospitality Management">
                    <option value="Bachelor of Science in Tourism Management (BST)">Bachelor of Science in Tourism Management (BST)</option>
                    <option value="Bachelor of Science in Hospitality Management (BSHM)">Bachelor of Science in Hospitality Management (BSHM)</option>
                  </optgroup>

                  <optgroup label="College of Industrial Technology">
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Automotive Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Automotive Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Electrical Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Electrical Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Electronics Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Electronics Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Food Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Food Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Fashion and Apparel Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Fashion and Apparel Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Industrial Chemistry">Bachelor of Science in Industrial Technology (BSIT) - Major in Industrial Chemistry</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Drafting Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Drafting Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Machine Shop Technology">Bachelor of Science in Industrial Technology (BSIT) - Major in Machine Shop Technology</option>
                    <option value="Bachelor of Science in Industrial Technology (BSIT) - Major in Refrigeration and Air Conditioning">Bachelor of Science in Industrial Technology (BSIT) - Major in Refrigeration and Air Conditioning</option>
                  </optgroup>

                  <optgroup label="College of Administration and Criminology">
                    <option value="Bachelor in Public Administration (BPA)">Bachelor in Public Administration (BPA)</option>
                    <option value="Bachelor of Science in Criminology (BSCRIM)">Bachelor of Science in Criminology (BSCRIM)</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>
                <select
                  name="year"
                  value={formData.year || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section || ""}
                  onChange={handleInputChange}
                  maxLength="3"
                  placeholder="e.g., A, B, 1"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., Python, React, Java"
                />
              </div>

              <div className="form-group">
                <label>Certifications</label>
                <input
                  type="text"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="e.g., AWS, CCNA"
                />
              </div>

              <div className="form-group">
                <label>Certifications (File Upload)</label>
                <input
                  type="file"
                  name="certification_file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleCertificationFileChange}
                />
                {profile.certification_file && (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.certification_file} target="_blank" rel="noopener noreferrer">
                      View Uploaded Certification
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Career Interests</label>
                <input
                  type="text"
                  name="career_interests"
                  value={formData.career_interests}
                  onChange={handleInputChange}
                  placeholder="e.g., Backend Development, Data Science"
                />
              </div>

              <div className="form-group">
                <label>Resume URL</label>
                <input
                  type="url"
                  name="resume_url"
                  value={formData.resume_url || ""}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/file/... or https://dropbox.com/..."
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                  Paste a link to your resume (Google Drive, Dropbox, or any public URL)
                </small>
              </div>

              <div className="form-group">
                <label>Resume Upload (File)</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                {profile.resume && (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.resume} target="_blank" rel="noopener noreferrer">
                      View Uploaded Resume
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <button
                  type="button"
                  onClick={() => {
                    // Pre-fill resume builder with existing profile data
                    setResumeData({
                      fullName: `${formData.user?.first_name || ""} ${formData.user?.last_name || ""}`.trim() || formData.user?.username || "",
                      email: formData.user?.email || "",
                      phone: formData.phone || "",
                      address: formData.address || "",
                      objective: formData.bio || "",
                      education: "",
                      experience: "",
                      skills: formData.skills || "",
                      certifications: formData.certifications || "",
                      languages: "",
                    });
                    setShowResumeBuilder(true);
                  }}
                  className="resume-builder-btn"
                >
                  Create Resume in System
                </button>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleSave}
                  className="save-btn"
                  disabled={!isProfileComplete()}
                  title={!isProfileComplete() ? "Please fill all required fields" : "Save your profile changes"}
                >
                  Save Changes
                </button>
                <button onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-display">
              <div className="profile-item">
                <label>Student ID</label>
                <p className="profile-value">{profile.student_id || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Birthday</label>
                <p className="profile-value">
                  {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Not set"}
                </p>
              </div>

              <div className="profile-item">
                <label>Sex</label>
                <p className="profile-value">{profile.sex || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Bio</label>
                <p className="profile-value">{profile.bio || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Phone</label>
                <p className="profile-value">
                  {profile.phone ? (
                    <a href={`tel:${profile.phone}`}>{profile.phone}</a>
                  ) : (
                    "Not set"
                  )}
                </p>
              </div>

              <div className="profile-item">
                <label>Address</label>
                <p className="profile-value">{profile.address || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Course</label>
                <p className="profile-value">{profile.course || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Year</label>
                <p className="profile-value">{profile.year || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Section</label>
                <p className="profile-value">{profile.section || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>COR (Certificate of Registration)</label>
                <p className="profile-value">
                  {profile.certificate_of_registration ? (
                    <a href={profile.certificate_of_registration} target="_blank" rel="noopener noreferrer" className="resume-link">
                      View COR →
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
              </div>

              <div className="profile-item">
                <label>Password</label>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="change-password-btn"
                  >
                    {showChangePassword ? "Cancel" : "Change Password"}
                  </button>
                </div>
              </div>

              {showChangePassword && (
                <div className="change-password-form">
                  {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
                  {passwordError && <div className="alert alert-error">{passwordError}</div>}
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label htmlFor="oldPassword">Old Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showOldPassword ? "text" : "password"}
                          id="oldPassword"
                          name="oldPassword"
                          value={passwordData.oldPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter your current password"
                          required
                          className="login-input"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '18px'
                          }}
                          title={showOldPassword ? "Hide password" : "Show password"}
                        >
                          {showOldPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password (6-12 characters)"
                          required
                          minLength="6"
                          maxLength="12"
                          className="login-input"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '18px'
                          }}
                          title={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                        Password must be between 6 and 12 characters. Use uppercase, lowercase, and special characters (!@#$%). Common passwords are not allowed.
                      </small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm your new password"
                          required
                          minLength="6"
                          maxLength="12"
                          className="login-input"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '18px'
                          }}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="save-btn">
                      Change Password
                    </button>
                  </form>
                </div>
              )}

              <div className="profile-item">
                <label>Skills</label>
                <div className="skills-container">
                  {profile.skills
                    ? profile.skills.split(",").map((skill, idx) => (
                      <span key={idx} className="skill-badge">
                        {skill.trim()}
                      </span>
                    ))
                    : <p className="profile-value">Not set</p>}
                </div>
              </div>

              <div className="profile-item">
                <label>Certifications</label>
                <p className="profile-value">{profile.certifications || "Not set"}</p>
                {profile.certification_file && (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.certification_file} target="_blank" rel="noopener noreferrer" className="resume-link">
                      View Uploaded Certification →
                    </a>
                  </div>
                )}
              </div>

              <div className="profile-item">
                <label>Career Interests</label>
                <p className="profile-value">{profile.career_interests || "Not set"}</p>
              </div>

              <div className="profile-item">
                <label>Resume URL</label>
                <p className="profile-value">
                  {profile.resume_url ? (
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="resume-link">
                      View Resume URL →
                    </a>
                  ) : (
                    "Not set"
                  )}
                </p>
              </div>

              <div className="profile-item">
                <label>Resume (File Upload)</label>
                <p className="profile-value">
                  {profile.resume ? (
                    <a href={profile.resume} target="_blank" rel="noopener noreferrer">
                      View Uploaded Resume
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
              </div>

              <div className="profile-item">
                <button
                  type="button"
                  onClick={() => {
                    setResumeData({
                      fullName: `${profile.user?.first_name || ""} ${profile.user?.last_name || ""}`.trim() || profile.user?.username || "",
                      email: profile.user?.email || "",
                      phone: profile.phone || "",
                      address: profile.address || "",
                      objective: profile.bio || "",
                      education: "",
                      experience: "",
                      skills: profile.skills || "",
                      certifications: profile.certifications || "",
                      languages: "",
                    });
                    setShowResumeBuilder(true);
                  }}
                  className="resume-builder-btn"
                >
                  Create Resume in System
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Builder Modal */}
      {showResumeBuilder && (
        <div className="modal-overlay" onClick={() => setShowResumeBuilder(false)}>
          <div className="modal-content resume-builder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Your Resume</h2>
              <button className="modal-close" onClick={() => setShowResumeBuilder(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="resume-builder-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={resumeData.address}
                    onChange={(e) => setResumeData({ ...resumeData, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>

                <div className="form-group">
                  <label>Objective / Summary *</label>
                  <RichTextEditor
                    value={resumeData.objective}
                    onChange={(html) => setResumeData({ ...resumeData, objective: html })}
                    placeholder="Enter your professional objective or summary..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Education</label>
                  <RichTextEditor
                    value={resumeData.education}
                    onChange={(html) => setResumeData({ ...resumeData, education: html })}
                    placeholder="Enter your educational background..."
                    rows={5}
                  />
                </div>

                <div className="form-group">
                  <label>Work Experience / Projects</label>
                  <RichTextEditor
                    value={resumeData.experience}
                    onChange={(html) => setResumeData({ ...resumeData, experience: html })}
                    placeholder="Enter your work experience and projects..."
                    rows={6}
                  />
                </div>

                <div className="form-group">
                  <label>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                    placeholder="Enter your skills separated by commas"
                  />
                </div>

                <div className="form-group">
                  <label>Certifications</label>
                  <input
                    type="text"
                    value={resumeData.certifications}
                    onChange={(e) => setResumeData({ ...resumeData, certifications: e.target.value })}
                    placeholder="Enter your certifications"
                  />
                </div>

                <div className="form-group">
                  <label>Languages</label>
                  <input
                    type="text"
                    value={resumeData.languages}
                    onChange={(e) => setResumeData({ ...resumeData, languages: e.target.value })}
                    placeholder="Enter languages you speak"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowResumeBuilder(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Generate PDF using jsPDF
                    const pdf = new jsPDF();
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    let yPosition = 20;
                    const margin = 20;
                    const lineHeight = 7;
                    const sectionSpacing = 10;

                    // Helper function to load and add image to PDF
                    const addImageToPDF = async (imageUrl, x, y, width, height) => {
                      return new Promise((resolve) => {
                        // If it's a local file (File object), convert to data URL
                        if (imageUrl instanceof File) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              pdf.addImage(e.target.result, 'PNG', x, y, width, height);
                              resolve(true);
                            } catch (err) {
                              console.warn("Could not add image to PDF:", err);
                              resolve(false);
                            }
                          };
                          reader.onerror = () => {
                            console.warn("Could not read image file for PDF");
                            resolve(false);
                          };
                          reader.readAsDataURL(imageUrl);
                          return;
                        }

                        // For URL strings, load the image
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = imageUrl;

                        img.onload = () => {
                          try {
                            // Create a canvas to convert image to base64
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataURL = canvas.toDataURL('image/png');
                            pdf.addImage(dataURL, 'PNG', x, y, width, height);
                            resolve(true);
                          } catch (err) {
                            console.warn("Could not add image to PDF:", err);
                            resolve(false);
                          }
                        };
                        img.onerror = () => {
                          console.warn("Could not load image for PDF:", imageUrl);
                          resolve(false);
                        };
                        // Timeout after 3 seconds
                        setTimeout(() => {
                          console.warn("Image load timeout for PDF");
                          resolve(false);
                        }, 3000);
                      });
                    };

                    // Helper function to convert HTML to plain text
                    const htmlToText = (html) => {
                      if (!html) return '';
                      const div = document.createElement('div');
                      div.innerHTML = html;
                      // Replace <br> with newlines
                      const text = div.textContent || div.innerText || '';
                      // Clean up extra whitespace
                      return text.replace(/\n\s*\n/g, '\n').trim();
                    };

                    // Helper function to add text with word wrap
                    const addText = (text, x, y, fontSize = 11, isBold = false, color = [0, 0, 0]) => {
                      // Convert HTML to plain text if needed
                      const plainText = htmlToText(text);
                      if (!plainText || plainText.trim() === '') return y;
                      pdf.setFontSize(fontSize);
                      pdf.setFont("helvetica", isBold ? "bold" : "normal");
                      pdf.setTextColor(color[0], color[1], color[2]);
                      const maxWidth = pageWidth - 2 * margin - (x - margin);
                      const splitText = pdf.splitTextToSize(plainText, maxWidth);
                      pdf.text(splitText, x, y);
                      return y + (splitText.length * lineHeight);
                    };

                    // Helper function to check and add new page if needed
                    const checkPageBreak = (requiredSpace = 30) => {
                      if (yPosition + requiredSpace > pageHeight - 20) {
                        pdf.addPage();
                        yPosition = 20;
                        return true;
                      }
                      return false;
                    };

                    // Add Profile Picture in top right corner
                    let profilePictureUrl = defaultAvatar; // Default fallback

                    // Determine which profile picture to use
                    if (formData.profile_picture instanceof File) {
                      // If a new file was selected, use it
                      profilePictureUrl = formData.profile_picture;
                    } else if (profile.profile_picture) {
                      // Use existing profile picture from server
                      profilePictureUrl = profile.profile_picture;
                    }

                    const imageSize = 40; // Size of the profile picture in PDF units
                    const imageX = pageWidth - margin - imageSize;
                    const imageY = 20;

                    // Load and add profile picture
                    await addImageToPDF(profilePictureUrl, imageX, imageY, imageSize, imageSize);

                    // Title
                    yPosition = addText("RESUME", margin, yPosition, 20, true, [0, 51, 102]);
                    yPosition += sectionSpacing;

                    // Personal Information Section
                    checkPageBreak();
                    yPosition = addText("PERSONAL INFORMATION", margin, yPosition, 14, true, [0, 0, 0]);
                    yPosition += 5;
                    yPosition = addText(`Full Name: ${resumeData.fullName}`, margin + 5, yPosition, 11, false);
                    yPosition += lineHeight;
                    yPosition = addText(`Email: ${resumeData.email}`, margin + 5, yPosition, 11, false);
                    yPosition += lineHeight;
                    if (resumeData.phone) {
                      yPosition = addText(`Phone: ${resumeData.phone}`, margin + 5, yPosition, 11, false);
                      yPosition += lineHeight;
                    }
                    if (resumeData.address) {
                      yPosition = addText(`Address: ${resumeData.address}`, margin + 5, yPosition, 11, false);
                      yPosition += lineHeight;
                    }
                    yPosition += sectionSpacing;

                    // Objective Section
                    checkPageBreak();
                    yPosition = addText("OBJECTIVE", margin, yPosition, 14, true, [0, 0, 0]);
                    yPosition += 5;
                    yPosition = addText(resumeData.objective, margin + 5, yPosition, 11, false);
                    yPosition += sectionSpacing;

                    // Education Section
                    if (resumeData.education && resumeData.education.trim()) {
                      checkPageBreak(40);
                      yPosition = addText("EDUCATION", margin, yPosition, 14, true, [0, 0, 0]);
                      yPosition += 5;
                      const educationText = htmlToText(resumeData.education);
                      const educationLines = educationText.split('\n').filter(line => line.trim());
                      educationLines.forEach(line => {
                        checkPageBreak();
                        yPosition = addText(line.trim(), margin + 5, yPosition, 11, false);
                        yPosition += lineHeight;
                      });
                      yPosition += sectionSpacing;
                    }

                    // Experience Section
                    if (resumeData.experience && resumeData.experience.trim()) {
                      checkPageBreak(40);
                      yPosition = addText("EXPERIENCE / PROJECTS", margin, yPosition, 14, true, [0, 0, 0]);
                      yPosition += 5;
                      const experienceText = htmlToText(resumeData.experience);
                      const experienceLines = experienceText.split('\n').filter(line => line.trim());
                      experienceLines.forEach(line => {
                        checkPageBreak();
                        yPosition = addText(line.trim(), margin + 5, yPosition, 11, false);
                        yPosition += lineHeight;
                      });
                      yPosition += sectionSpacing;
                    }

                    // Skills Section
                    if (resumeData.skills && resumeData.skills.trim()) {
                      checkPageBreak();
                      yPosition = addText("TECHNICAL SKILLS", margin, yPosition, 14, true, [0, 0, 0]);
                      yPosition += 5;
                      yPosition = addText(resumeData.skills, margin + 5, yPosition, 11, false);
                      yPosition += sectionSpacing;
                    }

                    // Certifications Section
                    if (resumeData.certifications && resumeData.certifications.trim()) {
                      checkPageBreak();
                      yPosition = addText("CERTIFICATIONS", margin, yPosition, 14, true, [0, 0, 0]);
                      yPosition += 5;
                      yPosition = addText(resumeData.certifications, margin + 5, yPosition, 11, false);
                      yPosition += sectionSpacing;
                    }

                    // Languages Section
                    if (resumeData.languages && resumeData.languages.trim()) {
                      checkPageBreak();
                      yPosition = addText("LANGUAGES", margin, yPosition, 14, true, [0, 0, 0]);
                      yPosition += 5;
                      yPosition = addText(resumeData.languages, margin + 5, yPosition, 11, false);
                    }

                    // Footer on last page
                    const totalPages = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                      pdf.setPage(i);
                      pdf.setFontSize(8);
                      pdf.setTextColor(128, 128, 128);
                      pdf.text(
                        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                      );
                    }

                    // Generate PDF blob and create download/view link
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const fileName = `resume_${resumeData.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

                    // Create download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pdfUrl;
                    downloadLink.download = fileName;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    // Also open in new tab for viewing
                    window.open(pdfUrl, '_blank');

                    // Clean up the blob URL after a delay
                    setTimeout(() => {
                      URL.revokeObjectURL(pdfUrl);
                    }, 1000);
                  } catch (error) {
                    console.error("Error generating PDF:", error);
                    setError("Failed to generate PDF. Please try again.");
                    setTimeout(() => setError(""), 5000);
                    return;
                  }

                  // Also update profile with resume data
                  setFormData({
                    ...formData,
                    skills: resumeData.skills || formData.skills,
                    certifications: resumeData.certifications || formData.certifications,
                    bio: resumeData.objective || formData.bio,
                    phone: resumeData.phone || formData.phone,
                  });

                  setSuccess("Resume created and downloaded! You can also upload it or save the URL.");
                  setShowResumeBuilder(false);
                  setTimeout(() => setSuccess(""), 5000);
                }}
                className="btn-save"
                disabled={!resumeData.fullName || !resumeData.email || !resumeData.objective}
              >
                Generate & Download PDF Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProfile;

