import React, { useState, useMemo } from "react";
import StudentHeader from "./StudentHeader";
import "./StudentDashboard.css";

function StudentSettings() {
  const currentStudent = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      return typeof stored === "string" ? JSON.parse(stored) : stored;
    } catch {
      return null;
    }
  }, []);

  const [settings, setSettings] = useState({
    notifications_email: true,
    notifications_sms: false,
    private_profile: false,
    show_cv: true,
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [saved, setSaved] = useState(false);

  const handleSettingChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
    setSaved(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value,
    });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("studentSettings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      alert("Passwords do not match!");
      return;
    }
    if (passwords.new_password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }
    alert("Password change request sent! (Feature requires backend implementation)");
    setPasswords({ current_password: "", new_password: "", confirm_password: "" });
  };

  return (
    <div className="student-dashboard">
      <div className="student-dashboard__content">
        <StudentHeader 
          title="⚙️ My Settings"
          subtitle="Manage your account preferences and privacy settings."
        />

        {saved && <div className="student-dashboard__status">Settings saved successfully! ✅</div>}

        <section className="student-section">
          <div className="section-header">
            <h2>Account Settings</h2>
            <p>Update your account preferences</p>
          </div>

          <div className="settings-grid">
            {/* Notification Settings */}
            <div className="settings-card">
              <h3>🔔 Notification Preferences</h3>
              <form onSubmit={handleSaveSettings}>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="notifications_email"
                      checked={settings.notifications_email}
                      onChange={handleSettingChange}
                    />
                    <span>Receive email notifications</span>
                  </label>
                  <small>Get updates about your applications and opportunities</small>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="notifications_sms"
                      checked={settings.notifications_sms}
                      onChange={handleSettingChange}
                    />
                    <span>Receive SMS notifications</span>
                  </label>
                  <small>Get urgent updates via text message</small>
                </div>

                <button type="submit" className="btn-save">
                  💾 Save Preferences
                </button>
              </form>
            </div>

            {/* Privacy Settings */}
            <div className="settings-card">
              <h3>🔐 Privacy Settings</h3>
              <form onSubmit={handleSaveSettings}>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="private_profile"
                      checked={settings.private_profile}
                      onChange={handleSettingChange}
                    />
                    <span>Keep profile private</span>
                  </label>
                  <small>Only admins can view your profile</small>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="show_cv"
                      checked={settings.show_cv}
                      onChange={handleSettingChange}
                    />
                    <span>Show CV to companies</span>
                  </label>
                  <small>Allow companies to view your curriculum vitae</small>
                </div>

                <button type="submit" className="btn-save">
                  💾 Save Privacy Settings
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Change Password Section */}
        <section className="student-section">
          <div className="section-header">
            <h2>🔒 Change Password</h2>
            <p>Update your password for security</p>
          </div>

          <div className="settings-card password-form">
            <form onSubmit={handleChangePassword}>
              <div className="form-group-settings">
                <label htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group-settings">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="form-group-settings">
                <label htmlFor="confirm_password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn-save">
                🔄 Change Password
              </button>
            </form>
          </div>
        </section>

        {/* Account Information */}
        <section className="student-section">
          <div className="section-header">
            <h2>👤 Account Information</h2>
            <p>Your profile details</p>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="info-label">Username</div>
              <div className="info-value">{currentStudent?.username || "N/A"}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Email</div>
              <div className="info-value">{currentStudent?.email || "N/A"}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Account Status</div>
              <div className="info-value">🟢 Active</div>
            </div>
            <div className="info-card">
              <div className="info-label">Member Since</div>
              <div className="info-value">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .settings-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settings-card h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          font-size: 18px;
        }

        .setting-item {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .setting-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 5px;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 10px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .setting-item span {
          font-weight: 500;
          color: #333;
        }

        .setting-item small {
          display: block;
          margin-left: 28px;
          color: #666;
          font-size: 12px;
          margin-top: 3px;
        }

        .password-form {
          max-width: 500px;
        }

        .form-group-settings {
          margin-bottom: 15px;
        }

        .form-group-settings label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .form-group-settings input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .form-group-settings input:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
        }

        .btn-save {
          background: #4CAF50;
          color: white;
          padding: 12px 20px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 10px;
        }

        .btn-save:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .info-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .info-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default StudentSettings;
