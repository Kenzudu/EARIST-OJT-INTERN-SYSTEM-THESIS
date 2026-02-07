import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PublicStudentProfile.css';

const PublicStudentProfile = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentProfile();
  }, [token]);

  const fetchStudentProfile = async () => {
    try {
      // Use backend API URL (ngrok) instead of relative path
      const apiBaseURL = process.env.REACT_APP_API_URL || 'https://terminably-untensible-paulina.ngrok-free.dev/api';
      const response = await axios.get(`${apiBaseURL}/public/student/${token}/`);
      setStudentData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load student profile');
      setLoading(false);
    }
  };

  const handleEvaluate = () => {
    navigate(`/public/evaluate/${token}`);
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  return (
    <div className="public-profile-container">
      <div className="public-profile-card">
        <div className="profile-header">
          <div className="profile-image-section">
            {studentData.profile_picture ? (
              <img
                src={studentData.profile_picture}
                alt={studentData.student_name}
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>

          <div className="profile-info-section">
            <h1>{studentData.student_name}</h1>
            <p className="student-id">ID: {studentData.student_id}</p>
            {studentData.course && (
              <p className="course-info">{studentData.course} {studentData.year && `- ${studentData.year}`}</p>
            )}
            {studentData.college && (
              <p className="college-info">{studentData.college}</p>
            )}
          </div>
        </div>

        {studentData.has_active_internship ? (
          <div className="internship-details">
            <h2>Current Internship</h2>
            <div className="detail-row">
              <span className="detail-label">Company:</span>
              <span className="detail-value">{studentData.company_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Position:</span>
              <span className="detail-value">{studentData.position}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Company Address:</span>
              <span className="detail-value">{studentData.company_address}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Application Date:</span>
              <span className="detail-value">{studentData.application_date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Start Date:</span>
              <span className="detail-value">{studentData.start_date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Evaluations:</span>
              <span className="detail-value evaluation-count">{studentData.evaluation_count}</span>
            </div>
          </div>
        ) : (
          <div className="no-internship-message">
            <i className="fas fa-info-circle"></i>
            <p>This student does not have an active internship.</p>
            <div className="detail-row">
              <span className="detail-label">Total Evaluations:</span>
              <span className="detail-value evaluation-count">{studentData.evaluation_count}</span>
            </div>
          </div>
        )}

        {studentData.has_active_internship && (
          <div className="action-section">
            <button className="evaluate-button" onClick={handleEvaluate}>
              <i className="fas fa-clipboard-check"></i>
              Evaluate Performance
            </button>
            <p className="evaluation-note">
              <i className="fas fa-info-circle"></i>
              You can submit one evaluation per day for this student
            </p>
          </div>
        )}

        <div className="footer-info">
          <p><i className="fas fa-shield-alt"></i> EARIST OJT Management System</p>
        </div>
      </div>
    </div>
  );
};

export default PublicStudentProfile;
