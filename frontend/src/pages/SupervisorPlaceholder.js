import React from "react";
import "./AdminDashboard.css";

function SupervisorPlaceholder({ title }) {
    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <h1>{title}</h1>
                <p className="subtitle">This feature is coming soon</p>

                <div className="info-box" style={{ marginTop: '30px' }}>
                    <h2>🚧 Under Development</h2>
                    <p>
                        This page is currently being developed. The backend API is ready,
                        but the frontend interface is still in progress.
                    </p>
                    <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                        <strong>Available Features:</strong>
                    </p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                        <li>Backend API endpoints are functional</li>
                        <li>Role-based permissions are enforced</li>
                        <li>Data is being tracked in the database</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default SupervisorPlaceholder;
