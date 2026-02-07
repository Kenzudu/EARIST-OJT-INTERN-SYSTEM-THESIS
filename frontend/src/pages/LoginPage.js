import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import earistLogo from "./images/earist.png";
import earsitbg from "./images/earistbg.jpg";

function LoginPage() {
  const [userRole, setUserRole] = useState("student"); // "student" or "admin"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");


  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetLoading, setResetLoading] = useState(false);



  const navigate = useNavigate();



  // Load saved credentials on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedRole = localStorage.getItem("rememberedRole");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Check if already logged in - REMOVED to prevent auto-redirect loop

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    // Check birthday for student login
    if (userRole === "student" && !birthDate) {
      setError("Birthday is required for student login");
      return;
    }

    setLoading(true);
    try {
      const loginData = {
        username,
        password,
      };

      // Add birth_date for student login
      if (userRole === "student") {
        loginData.birth_date = birthDate;
      }

      // Add device_token if available (for device trust)
      const deviceToken = localStorage.getItem('device_token');
      if (deviceToken) {
        loginData.device_token = deviceToken;
        console.log('[LOGIN] Sending device token for trust verification');
      }



      const res = await axios.post("http://localhost:8000/api/login/", loginData);

      // Check if 2FA method choice is required (first time admin login)
      if (res.data.requires_2fa_choice) {
        // Store credentials for setup page
        localStorage.setItem("temp_user", JSON.stringify({
          username,
          role: 'admin'
        }));
        localStorage.setItem("temp_password", password);
        localStorage.setItem("temp_email", res.data.email || '');

        setSuccess("Redirecting to 2FA setup...");
        setTimeout(() => {
          navigate("/2fa-setup");
        }, 1000);
        return;
      }// Check if email 2FA is required (code sent to email)
      if (res.data.requires_email_2fa) {
        setError("");
        setSuccess(res.data.message);

        // Store credentials for 2FA page
        localStorage.setItem("temp_user", JSON.stringify({
          username,
          role: 'admin'
        }));
        localStorage.setItem("temp_password", password);
        localStorage.setItem("temp_email", res.data.email);

        // Redirect to 2FA setup page instead of showing modal
        setSuccess("Redirecting to verification...");
        setTimeout(() => {
          navigate("/2fa-setup");
        }, 1000);
        setLoading(false);
        return;
      }

      // Check if 2FA setup is required (for admin users)
      if (res.data.requires_2fa_setup) {
        // Store temporary token and redirect to 2FA setup
        localStorage.setItem("temp_token", res.data.token);
        localStorage.setItem("temp_user", JSON.stringify({
          id: res.data.user_id,
          username: res.data.username,
          role: res.data.role
        }));

        setSuccess("2FA setup required. Redirecting...");
        setTimeout(() => {
          navigate("/admin/2fa-setup");
        }, 1000);
        return;
      }

      if (res.data.token && res.data.user) {
        // Validate role match
        const userRoleFromBackend = res.data.user.role || 'student';
        const selectedRole = userRole;

        // Check if selected role matches actual user role
        if (userRoleFromBackend !== selectedRole) {
          setError(`Invalid ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} login. Please check your credentials and try again.`);
          setLoading(false);
          return;
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Store user role (already declared above)
        localStorage.setItem("userRole", userRoleFromBackend);

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
          localStorage.setItem("rememberedRole", userRole);
        } else {
          localStorage.removeItem("rememberedUsername");
          localStorage.removeItem("rememberedRole");
        }

        // Check profile completion for students only
        if (userRoleFromBackend === 'student') {
          try {
            const profileRes = await axios.get("http://localhost:8000/api/my-profile/", {
              headers: { Authorization: `Token ${res.data.token}` }
            });

            if (!profileRes.data.profile_complete) {
              // Profile incomplete - redirect to profile page
              localStorage.setItem("profile_incomplete", "true");
              setSuccess("Please complete your profile to continue");
              setTimeout(() => {
                navigate("/student/profile");
              }, 1000);
              return;
            }
          } catch (err) {
            console.error("Error checking profile:", err);
          }
        }

        setSuccess("Login successful! Redirecting...");

        // Route based on role
        setTimeout(() => {
          switch (userRoleFromBackend) {
            case 'admin':
              navigate("/admin/dashboard");
              break;
            case 'coordinator':
              navigate("/coordinator/dashboard");
              break;
            case 'supervisor':
              navigate("/supervisor/dashboard");
              break;
            case 'student':
            default:
              navigate("/student/dashboard");
              break;
          }
        }, 500);
      }
    } catch (err) {
      console.error("Login error:", err);

      // Backend handles account-specific lockout
      if (err.response && err.response.status === 403) {
        const errorMsg = err.response?.data?.error || "Account temporarily locked due to too many failed attempts.";
        setError(errorMsg);
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Invalid username or password";
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetIdentifier.trim()) {
      setError("Email or Student ID is required");
      return;
    }

    setResetLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/request-password-reset/", {
        username: resetIdentifier, // Backend checks 'email' OR 'username'
      });
      setSuccess(res.data.message || "A new password has been sent to your registered email.");
      setTimeout(() => {
        setShowResetModal(false);
        setResetIdentifier("");
        setError("");
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };



  const closeResetModal = () => {
    setShowResetModal(false);
    setResetIdentifier("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="login-container">
      <button
        className="btn-back-home"
        onClick={() => navigate("/")}
        title="Back to Homepage"
      >
        ← Back to Home
      </button>
      <div className="login-card">
        <img src={earistLogo} alt="EARIST Logo" className="login-logo" />
        <h3>OJT SYSTEM</h3>
        <h1>Login to Your Account</h1>

        {success && <div className="login-success">{success}</div>}
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="userRole">Login As</label>
            <select
              id="userRole"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="login-input"
              disabled={loading}
            >
              <option value="student">Student Intern</option>
              <option value="coordinator">Coordinator</option>

              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="username">
              {userRole === "student" ? "Student ID" : "Username"}
            </label>
            <input
              type="text"
              id="username"
              placeholder={userRole === "student" ? "Enter your Student ID" : "Enter your username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="login-input"
              disabled={loading}
            />
          </div>

          {userRole === "student" && (
            <div className="form-group">
              <label htmlFor="birthDate">Birthday (Verification)</label>
              <input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="login-input"
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                Enter your birthday for security verification
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                disabled={loading}
                style={{ paddingRight: '45px' }}
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
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '18px'
                }}
                disabled={loading}
                title={showPassword ? "Hide password" : "Show password"}
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
          </div>

          {/* Remember Me Checkbox */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'normal'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Remember Me</span>
            </label>
          </div>



          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowResetModal(true);
              }}
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              Forgot Password?
            </a>
          </p>
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close" onClick={closeResetModal}>×</button>
            </div>
            <div className="modal-body">
              {success && <div className="login-success">{success}</div>}
              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleRequestReset}>
                <div className="form-group">
                  <label htmlFor="resetIdentifier">Email Address or Student ID</label>
                  <input
                    id="resetIdentifier"
                    type="text"
                    placeholder="Enter your email or Student ID"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    required
                    className="login-input"
                    disabled={resetLoading}
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    A new password will be sent to your registered email address.
                  </small>
                </div>
                <button type="submit" className="login-button" disabled={resetLoading}>
                  {resetLoading ? "Sending..." : "Send New Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default LoginPage;
