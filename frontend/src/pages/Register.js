import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import earistLogo from "./images/earist.png";

// EARIST Colleges and Courses Mapping
const COLLEGES = {
  'CAFA': {
    name: 'College of Architecture and Fine Arts',
    courses: [
      'Bachelor of Science in Architecture (BS ARCHI.)',
      'Bachelor of Science in Interior Design (BSID)',
      'Bachelor in Fine Arts Major in Painting (BFA)',
      'Bachelor in Fine Arts Major in Visual Communication (BFA)'
    ]
  },
  'CAS': {
    name: 'College of Arts and Sciences',
    courses: [
      'Bachelor of Science in Applied Physics with Computer Science Emphasis (BSAP)',
      'Bachelor of Science in Psychology (BSPSYCH)',
      'Bachelor of Science in Mathematics (BSMATH)'
    ]
  },
  'CBA': {
    name: 'College of Business Administration',
    courses: [
      'Bachelor of Science in Business Administration Major in Marketing Management (BSBA)',
      'Bachelor of Science in Business Administration Major in Human Resource Development Management (BSBA-HRDM)',
      'Bachelor of Science in Entrepreneurship (BSEM)',
      'Bachelor of Science in Office Administration (BSOA)'
    ]
  },
  'CCS': {
    name: 'College of Computer Studies',
    courses: [
      'Bachelor of Science in Computer Science (BSCS)',
      'Bachelor of Science in Information Technology (BS INFO. TECH.)'
    ]
  },
  'CED': {
    name: 'College of Education',
    courses: [
      'Bachelor in Secondary Education Major in Science (BSE)',
      'Bachelor in Secondary Education Major in Mathematics (BSE)',
      'Bachelor in Secondary Education Major in Filipino (BSE)',
      'Bachelor in Special Needs Education (BSNEd)',
      'Bachelor in Technology and Livelihood Education Major in Home Economics (BTLE)',
      'Bachelor in Technology and Livelihood Education Major in Industrial Arts (BTLE)',
      'Professional Education / Subjects 18 units (TCP)'
    ]
  },
  'CEN': {
    name: 'College of Engineering',
    courses: [
      'Bachelor of Science in Chemical Engineering (BSCHE)',
      'Bachelor of Science in Civil Engineering (BSCE)',
      'Bachelor of Science in Electrical Engineering (BSEE)',
      'Bachelor of Science in Electronics and Communication Engineering (BSECE)',
      'Bachelor of Science in Mechanical Engineering (BSME)',
      'Bachelor of Science in Computer Engineering (BSCOE)'
    ]
  },
  'CHM': {
    name: 'College of Hospitality Management',
    courses: [
      'Bachelor of Science in Tourism Management (BST)',
      'Bachelor of Science in Hospitality Management (BSHM)'
    ]
  },
  'CIT': {
    name: 'College of Industrial Technology',
    courses: [
      'Bachelor of Science in Industrial Technology Major in Automotive Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Electrical Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Electronics Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Food Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Fashion and Apparel Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Industrial Chemistry (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Drafting Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Machine Shop Technology (BSIT)',
      'Bachelor of Science in Industrial Technology Major in Refrigeration and Air Conditioning (BSIT)'
    ]
  },
  'CPAC': {
    name: 'College of Public Administration and Criminology',
    courses: [
      'Bachelor in Public Administration (BPA)',
      'Bachelor of Science in Criminology (BSCRIM)'
    ]
  }
};

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // New State for College and Course
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  // Update available courses when college changes
  useEffect(() => {
    if (college && COLLEGES[college]) {
      setAvailableCourses(COLLEGES[college].courses);
      setCourse(""); // Reset course when college changes
    } else {
      setAvailableCourses([]);
      setCourse("");
    }
  }, [college]);

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim() || !studentId.trim() || !birthDate || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return false;
    }

    if (!college) {
      setError("Please select your College");
      return false;
    }

    if (!course) {
      setError("Please select your Course");
      return false;
    }

    if (firstName.trim().length < 2) {
      setError("First name must be at least 2 characters");
      return false;
    }

    if (lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters");
      return false;
    }

    if (!studentId.trim()) {
      setError("Student ID is required");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
      'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
      'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
      'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      setError("This password is too common. Please choose a stronger password.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Send verification code to email
      await axios.post("http://localhost:8000/api/send-verification-code/", {
        email: email,
      });

      // Store registration data in sessionStorage
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        student_id: studentId.trim(),
        birth_date: birthDate,
        email,
        password,
        course,  // Add course
        college  // Add college
      }));

      // Navigate to verification page
      navigate('/verify-email');
    } catch (err) {
      // Handle different error response formats
      let errorMsg = "Registration failed. Please try again.";

      if (err.response?.data) {
        // Check for error message directly
        if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
        // Check for errors object (new format)
        else if (err.response.data.errors) {
          const errors = err.response.data.errors;
          const errorFields = Object.keys(errors);
          if (errorFields.length > 0) {
            errorMsg = `${errorFields[0]}: ${errors[errorFields[0]]}`;
          }
        }
        // Check for field-specific errors (old format)
        else if (err.response.data.username?.[0]) {
          errorMsg = `Username: ${err.response.data.username[0]}`;
        } else if (err.response.data.email?.[0]) {
          errorMsg = `Email: ${err.response.data.email[0]}`;
        } else if (err.response.data.password?.[0]) {
          errorMsg = `Password: ${err.response.data.password[0]}`;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        }
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <button
        className="btn-back-home"
        onClick={() => navigate("/")}
        title="Back to Homepage"
      >
        ← Back to Home
      </button>
      <div className="register-card">
        <img src={earistLogo} alt="EARIST Logo" className="register-logo" />
        <h1>Create an Account</h1>

        {success && <div className="register-success">{success}</div>}
        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name <span style={{ color: 'red' }}>*</span></label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="register-input"
              disabled={loading}
              minLength="2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name <span style={{ color: 'red' }}>*</span></label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="register-input"
              disabled={loading}
              minLength="2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentId">Student ID <span style={{ color: 'red' }}>*</span></label>
            <input
              id="studentId"
              type="text"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="register-input"
              disabled={loading}
            />
            <small className="help-text">Your student identification number</small>
          </div>

          {/* College and Course Dropdowns */}
          <div className="form-group">
            <label htmlFor="college">College <span style={{ color: 'red' }}>*</span></label>
            <select
              id="college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
              className="register-input"
              disabled={loading}
              style={{ backgroundColor: 'white' }}
            >
              <option value="">Select your College</option>
              {Object.keys(COLLEGES).map(code => (
                <option key={code} value={code}>
                  {COLLEGES[code].name} ({code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="course">Course <span style={{ color: 'red' }}>*</span></label>
            <select
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
              className="register-input"
              disabled={loading || !college}
              style={{ backgroundColor: 'white' }}
            >
              <option value="">{college ? "Select your Course" : "Select a College first"}</option>
              {availableCourses.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <small className="help-text">Select your specific program</small>
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">Birthday <span style={{ color: 'red' }}>*</span></label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="register-input"
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="register-input"
                disabled={loading}
                minLength="6"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#6b7280',
                  padding: '0'
                }}
                tabIndex="-1"
              >
                {showPassword ? (
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
            <small className="help-text">
              At least 6 characters. Use uppercase, lowercase, and special characters (!@#$%).
              Common passwords are not allowed.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="register-input"
                disabled={loading}
                style={{ paddingRight: '40px' }}
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
                  fontSize: '1.2rem',
                  color: '#6b7280',
                  padding: '0'
                }}
                tabIndex="-1"
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

          <div className="form-group">
            <label htmlFor="email">Email Address <span style={{ color: 'red' }}>*</span></label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="register-input"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Sending Verification Code..." : "Register"}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
