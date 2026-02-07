import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentProgress.css";

const baseURL = "http://localhost:8000/api";

function StudentProgress() {
  const [progress, setProgress] = useState(null);
  const [journals, setJournals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProgress();
    fetchJournals();
    fetchTasks();
    fetchEvaluations();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/progress/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setProgress(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load progress data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJournals = async () => {
    try {
      const res = await axios.get(`${baseURL}/journals/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setJournals(res.data);
    } catch (err) {
      console.error("Failed to load journals:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${baseURL}/tasks/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await axios.get(`${baseURL}/evaluations/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setEvaluations(res.data);
    } catch (err) {
      console.error("Failed to load evaluations:", err);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "#28a745";
    if (percentage >= 50) return "#ffc107";
    return "#dc3545";
  };

  if (loading) {
    return (
      <div className="progress-container">
        <div className="loading">Loading progress data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="progress-container">
      <h1>My Progress</h1>

      {progress && (
        <>
          {/* Progress Overview Cards */}
          <div className="progress-cards">
            <div className="progress-card main-card">
              <h2>Overall Progress</h2>
              <div className="progress-circle-container">
                <div
                  className="progress-circle"
                  style={{
                    background: `conic-gradient(${getProgressColor(progress.overall_progress || 0)} 0deg ${(progress.overall_progress || 0) * 3.6}deg, #e9ecef ${(progress.overall_progress || 0) * 3.6}deg 360deg)`,
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background: "white",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="progress-percentage">
                      {(progress.overall_progress || 0).toFixed(1)}%
                    </span>
                    <span className="progress-label">Complete</span>
                  </div>
                </div>
              </div>
              <div className="progress-details">
                <div className="detail-item">
                  <span className="detail-label">Hours Rendered:</span>
                  <span className="detail-value">{progress.total_hours_rendered} hrs</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Required Hours:</span>
                  <span className="detail-value">{progress.required_hours} hrs</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Remaining:</span>
                  <span className="detail-value">
                    {Math.max(0, progress.required_hours - progress.total_hours_rendered).toFixed(1)} hrs
                  </span>
                </div>
              </div>
            </div>

            <div className="progress-card">
              <h3>Journal Entries</h3>
              <div className="stat-number">{progress.journal_entries_count || progress.journal_entries || 0}</div>
              <p className="stat-label">Total entries submitted</p>
            </div>

            <div className="progress-card">
              <h3>Tasks</h3>
              <div className="stat-number">
                {progress.tasks_completed || progress.completed_tasks || 0} / {progress.total_tasks || 0}
              </div>
              <p className="stat-label">Completed tasks</p>
            </div>

            <div className="progress-card">
              <h3>Evaluations</h3>
              <div className="stat-number">{progress.evaluations_count || progress.evaluations_received || 0}</div>
              <p className="stat-label">Performance evaluations</p>
            </div>
          </div>

          {/* Application Status */}
          {progress.application_status && (
            <div className="status-section">
              <h2>Application Status</h2>
              <div className={`status-badge status-${progress.application_status.toLowerCase()}`}>
                {progress.application_status}
              </div>
            </div>
          )}

          {/* Recent Journals */}
          <div className="section">
            <h2>Recent Journal Entries</h2>
            {journals.length === 0 ? (
              <p className="empty-message">No journal entries yet.</p>
            ) : (
              <div className="journals-preview">
                {journals.slice(0, 5).map((journal) => (
                  <div key={journal.id} className="journal-preview-card">
                    <div className="preview-header">
                      <span className="preview-date">
                        {new Date(journal.date).toLocaleDateString()}
                      </span>
                      <span className={`status-badge status-${journal.status.toLowerCase()}`}>
                        {journal.status}
                      </span>
                    </div>
                    <p className="preview-content">
                      {journal.activities.substring(0, 100)}
                      {journal.activities.length > 100 ? "..." : ""}
                    </p>
                    <div className="preview-meta">
                      <span>{journal.hours_rendered} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Progress */}
          <div className="section">
            <h2>Task Progress</h2>
            {tasks.length === 0 ? (
              <p className="empty-message">No tasks assigned yet.</p>
            ) : (
              <div className="tasks-preview">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="task-preview-card">
                    <div className="preview-header">
                      <h4>{task.title}</h4>
                      <span className={`status-badge status-${task.status.toLowerCase().replace(" ", "-")}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="preview-content">{task.description.substring(0, 100)}...</p>
                    {task.deadline && (
                      <div className="preview-meta">
                        <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          <div className="section">
            <h2>Recent Evaluations</h2>
            {evaluations.length === 0 ? (
              <p className="empty-message">No evaluations received yet.</p>
            ) : (
              <div className="evaluations-preview">
                {evaluations.slice(0, 3).map((evaluation) => (
                  <div key={evaluation.id} className="evaluation-preview-card">
                    <div className="preview-header">
                      <h4>Performance Evaluation</h4>
                      {evaluation.overall_rating && (
                        <span className="rating-badge">
                          {evaluation.overall_rating.toFixed(1)} / 5.0
                        </span>
                      )}
                    </div>
                    <div className="evaluation-period">
                      {new Date(evaluation.evaluation_period_start).toLocaleDateString()} -{" "}
                      {new Date(evaluation.evaluation_period_end).toLocaleDateString()}
                    </div>
                    {evaluation.grade && (
                      <div className="grade-badge">Grade: {evaluation.grade}</div>
                    )}
                    {evaluation.comments && (
                      <p className="preview-content">{evaluation.comments.substring(0, 150)}...</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentProgress;

