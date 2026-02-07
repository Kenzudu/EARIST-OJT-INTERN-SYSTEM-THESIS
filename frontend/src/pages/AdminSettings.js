import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HomePage.css";

import ChangePasswordModal from "../components/ChangePasswordModal";

function AdminSettings() {
  const [settings, setSettings] = useState({
    company_name: "EARIST Internship System",
    system_email: "earistojtsys@gmail.com",
    max_applications_per_student: 5,
    application_deadline: "2025-12-31",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const baseURL = "http://localhost:8000/api/";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseURL}settings/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSettings(prev => ({
        ...prev,
        max_applications_per_student: response.data.max_applications_per_student,
        company_name: response.data.company_name || prev.company_name,
        system_email: response.data.system_email || prev.system_email,
        application_deadline: response.data.application_deadline || prev.application_deadline,
      }));
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings from server');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
    setSaved(false);
    setError('');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      // Save all settings to backend
      await axios.put(
        `${baseURL}settings/update/`,
        settings,
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      // Save to localStorage as backup/cache
      localStorage.setItem("systemSettings", JSON.stringify(settings));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <div className="dashboard-content">
        <h1>Admin Settings</h1>
        <p className="page-subtitle">Configure system settings and preferences.</p>

        {saved && <div className="status-banner">Settings saved successfully! </div>}
        {error && <div className="error-banner">{error}</div>}

        <div className="settings-container">
          <form onSubmit={handleSaveSettings} className="settings-form">
            {/* System Information */}
            <fieldset>
              <legend>System Information</legend>

              <div className="form-group">
                <label htmlFor="company_name">System Name</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleInputChange}
                  placeholder="e.g., EARIST Internship System"
                  required
                />
                <small>The name of your internship management system</small>
              </div>

              <div className="form-group">
                <label htmlFor="system_email">System Email</label>
                <input
                  type="email"
                  id="system_email"
                  name="system_email"
                  value={settings.system_email}
                  onChange={handleInputChange}
                  placeholder="e.g., earistojtsys@gmail.com"
                  required
                />
                <small>Email address for system notifications</small>
              </div>
            </fieldset>

            {/* Security Settings */}
            <fieldset>
              <legend>Security</legend>
              <div className="form-group">
                <label>Account Password</label>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '5px' }}
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔒 Change Your Password
                </button>
                <small>Update your account password regularly for better security</small>
              </div>
            </fieldset>

            {/* Quick Stats */}
            <fieldset>
              <legend>System Statistics</legend>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">System Status</div>
                  <div className="stat-value">🟢 Active</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Last Updated</div>
                  <div className="stat-value">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Version</div>
                  <div className="stat-value">1.0</div>
                </div>
              </div>
            </fieldset>

            {/* Action Buttons */}
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Settings"}
              </button>
              <button type="reset" className="btn-secondary">
                Reset
              </button>
            </div>
          </form>

          {/* Additional Information */}
          <div className="settings-info">
            <h3>Admin Settings Information</h3>
            <ul>
              <li>All settings are automatically saved to your browser</li>
              <li> Settings apply immediately after saving</li>
              <li> System configuration can be backed up</li>
              <li> Administrator access required</li>
            </ul>
          </div>


          <ChangePasswordModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
          />
        </div>
      </div>

      <style>{`
        .settings-container {
          max-width: 800px;
          margin: 30px auto;
        }

        .settings-form {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        fieldset {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        legend {
          padding: 0 10px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-size: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 15px 0;
        }

        .stat-box {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #4CAF50;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .settings-info {
          background: #e8f5e9;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
          
        }

        .settings-info h3 {
          margin-top: 0;
          color: #2e7d32;
        }

        .settings-info ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .settings-info li {
          margin: 8px 0;
          color: #555;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div >
  );
}

export default AdminSettings;
