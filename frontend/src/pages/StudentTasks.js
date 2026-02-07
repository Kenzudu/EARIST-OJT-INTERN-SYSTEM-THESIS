import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentHeader from "./StudentHeader";
import "./StudentTasks.css";

function StudentTasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filter, setFilter] = useState('All');

    // Submission Modal State
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionLink, setSubmissionLink] = useState("");
    const [submissionNotes, setSubmissionNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTasks();
    }, [navigate]);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const [tasksRes, appsRes] = await Promise.all([
                axios.get('http://localhost:8000/api/tasks/', { headers: { Authorization: `Token ${token}` } }),
                axios.get('http://localhost:8000/api/applications/', { headers: { Authorization: `Token ${token}` } })
            ]);

            setTasks(tasksRes.data);

            const hasApproved = appsRes.data.some(app => app.status === 'Approved');
            if (!hasApproved) {
                setError("You need an approved internship to access My Tasks.");
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                navigate('/login');
                return;
            }
            setError('Failed to load tasks');
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `http://localhost:8000/api/tasks/${taskId}/`,
                { status: newStatus },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess('Task started!');
            fetchTasks();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            setError('Failed to update task status');
            setTimeout(() => setError(''), 3000);
        }
    };

    const openSubmitModal = (task) => {
        setSelectedTask(task);
        setSubmissionFile(null);
        setSubmissionLink(task.submission_link || "");
        setSubmissionNotes(task.student_notes || "");
        setShowSubmitModal(true);
    };

    const handleFileChange = (e) => {
        setSubmissionFile(e.target.files[0]);
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('status', 'Submitted');
            formData.append('submitted_at', new Date().toISOString());

            if (submissionFile) {
                formData.append('submission_file', submissionFile);
            }
            formData.append('submission_link', submissionLink);
            formData.append('student_notes', submissionNotes);


            await axios.patch(
                `http://localhost:8000/api/tasks/${selectedTask.id}/`,
                formData,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setSuccess('Task submitted successfully!');
            setShowSubmitModal(false);
            fetchTasks();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
            else setError('Failed to submit task');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper functions for status
    const isMissing = (task) => {
        if (!task.deadline) return false;
        const now = new Date();
        const deadline = new Date(task.deadline);
        const isNotDone = task.status === 'Pending' || task.status === 'In Progress';
        return deadline < now && isNotDone;
    };

    const isLate = (task) => {
        if (!task.deadline || !task.submitted_at) return false;
        const deadline = new Date(task.deadline);
        const submitted = new Date(task.submitted_at);
        return submitted > deadline;
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filter === 'All') return true;
        if (filter === 'Missing') return isMissing(task);
        if (filter === 'Late') return isLate(task);
        if (filter === 'Submitted') return task.status === 'Submitted' && !isLate(task); // submitted on time
        if (filter === 'Completed') return task.status === 'Completed' && !isLate(task);
        return task.status === filter;
    });

    // Count by status
    const counts = {
        All: tasks.length,
        Pending: tasks.filter(t => t.status === 'Pending' && !isMissing(t)).length,
        'In Progress': tasks.filter(t => t.status === 'In Progress' && !isMissing(t)).length,
        Submitted: tasks.filter(t => t.status === 'Submitted').length, // All submitted
        Completed: tasks.filter(t => t.status === 'Completed').length,
        Missing: tasks.filter(t => isMissing(t)).length,
        Late: tasks.filter(t => isLate(t)).length
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'High': return 'priority-high';
            case 'Medium': return 'priority-medium';
            case 'Low': return 'priority-low';
            default: return '';
        }
    };

    const getDisplayStatus = (task) => {
        if (isMissing(task)) return 'Missing';
        if (isLate(task)) return 'Late';
        return task.status;
    };

    return (
        <div className="student-tasks-container">
            <div className="admin-dashboard-main">
                <StudentHeader
                    title="My Tasks"
                    subtitle="View and manage tasks assigned by your supervisor"
                />

                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {['All', 'In Progress', 'Submitted', 'Completed', 'Missing', 'Late'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`filter-tab ${filter === status ? 'active' : ''}`}
                        >
                            {status} ({counts[status]})
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-tasks">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="no-tasks">
                        <p>No tasks found in "{filter}" category.</p>
                    </div>
                ) : (
                    <div className="tasks-grid">
                        {filteredTasks.map(task => {
                            const displayStatus = getDisplayStatus(task);
                            const missing = displayStatus === 'Missing';
                            const late = displayStatus === 'Late';

                            return (
                                <div key={task.id} className="task-card" style={missing ? { borderLeft: '4px solid #ef4444' } : late ? { borderLeft: '4px solid #f59e0b' } : {}}>
                                    <div className="task-card-header">
                                        <h3 className="task-title">{task.title}</h3>
                                        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>

                                    <p className="task-description">
                                        {task.description}
                                    </p>

                                    {/* Task Details */}
                                    <div className="task-details">
                                        <div className="task-detail-row">
                                            <strong>Assigned by:</strong>
                                            <span>{task.assigned_by_name || 'Supervisor'}</span>
                                        </div>
                                        {task.deadline && (
                                            <div className={`task-detail-row ${missing ? 'deadline-overdue' : ''}`}>
                                                <strong>Deadline:</strong>
                                                <span>
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                    {missing && ' ❌ Missing'}
                                                    {late && ' ⚠️ Late'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="task-detail-row">
                                            <strong>Status:</strong>
                                            <span className={`status-badge`}
                                                style={
                                                    missing ? { background: '#fee2e2', color: '#dc2626' } :
                                                        late ? { background: '#fef3c7', color: '#d97706' } :
                                                            task.status === 'Submitted' ? { background: '#dbeafe', color: '#2563eb' } :
                                                                task.status === 'Completed' ? { background: '#dcfce7', color: '#16a34a' } :
                                                                    { background: '#f3f4f6', color: '#4b5563' }
                                                }
                                            >
                                                {displayStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submission Info */}
                                    {(task.submission_file || task.submission_link) && (
                                        <div className="task-submission-info" style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                                            <strong style={{ fontSize: '0.9em', display: 'block', marginBottom: '5px' }}>Your Submission:</strong>
                                            {task.submission_file && (
                                                <div style={{ marginBottom: '5px' }}>
                                                    📄 <a href={`http://localhost:8000${task.submission_file}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                                        View Attached File
                                                    </a>
                                                </div>
                                            )}
                                            {task.submission_link && (
                                                <div>
                                                    🔗 <a href={task.submission_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                                        {task.submission_link}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {task.student_notes && (
                                        <div className="task-notes" style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
                                            <strong>Your Notes:</strong>
                                            <p style={{ margin: '5px 0 0', fontStyle: 'italic' }}>"{task.student_notes}"</p>
                                        </div>
                                    )}

                                    {task.supervisor_feedback && (
                                        <div className="supervisor-feedback">
                                            <strong>Supervisor Feedback:</strong>
                                            <p>{task.supervisor_feedback}</p>
                                        </div>
                                    )}

                                    {/* Status Update Buttons */}
                                    {task.status !== 'Completed' && task.status !== 'Submitted' && (
                                        <div className="task-actions">
                                            {task.status === 'Pending' && (
                                                <button
                                                    className="task-btn task-btn-start"
                                                    onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                            {task.status === 'In Progress' && (
                                                <button
                                                    className="task-btn task-btn-complete"
                                                    onClick={() => openSubmitModal(task)}
                                                >
                                                    {missing ? 'Submit (Late)' : 'Submit Task'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {task.status === 'Submitted' && (
                                        <div style={{ marginTop: '15px', fontStyle: 'italic', color: '#666', fontSize: '13px' }}>
                                            <button
                                                onClick={() => openSubmitModal(task)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', padding: 0
                                                }}
                                            >
                                                Edit Submission
                                            </button>
                                            {' '} • Waiting for supervisor verification...
                                        </div>
                                    )}

                                    {task.completed_at && (
                                        <div className="task-completed-date">
                                            Completed on {new Date(task.completed_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Submission Modal */}
                {showSubmitModal && (
                    <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedTask?.title}</h2>
                                <button className="modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '20px', color: '#666' }}>
                                    Attach your work to complete this task.
                                </p>
                                <form onSubmit={handleSubmitTask}>

                                    {/* Link Input */}
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '500' }}>
                                            🔗 Add Link
                                        </label>
                                        <input
                                            type="url"
                                            value={submissionLink}
                                            onChange={(e) => setSubmissionLink(e.target.value)}
                                            placeholder="https://docs.google.com/..."
                                            style={{
                                                width: '100%', padding: '10px',
                                                border: '1px solid #ddd', borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    {/* File Input */}
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '500' }}>
                                            📎 Attach File
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="file"
                                                id="file-upload"
                                                onChange={handleFileChange}
                                                style={{
                                                    width: '100%', padding: '10px',
                                                    border: '1px dashed #ccc', borderRadius: '6px',
                                                    background: '#f9fafb', cursor: 'pointer'
                                                }}
                                            />
                                            {submissionFile && (
                                                <div style={{ marginTop: '5px', fontSize: '13px', color: '#10b981' }}>
                                                    Selected: {submissionFile.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="form-group" style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            💬 Private Comments
                                        </label>
                                        <textarea
                                            value={submissionNotes}
                                            onChange={(e) => setSubmissionNotes(e.target.value)}
                                            placeholder="Add comments for your supervisor..."
                                            rows="3"
                                            style={{
                                                width: '100%', padding: '10px',
                                                border: '1px solid #ddd', borderRadius: '6px',
                                                fontSize: '14px', resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setShowSubmitModal(false)}
                                            style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={submitting}
                                            style={{
                                                padding: '10px 20px', border: 'none',
                                                background: '#3b82f6', color: 'white',
                                                borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                                                opacity: submitting ? 0.7 : 1
                                            }}
                                        >
                                            {submitting ? 'Mark as Done' : 'Mark as Done'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                .modal-content {
                    background: white; padding: 0; border-radius: 12px; width: 90%; max-width: 500px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    overflow: hidden;
                    animation: slideUp 0.2s ease;
                }
                .modal-header { 
                    padding: 20px 25px; border-bottom: 1px solid #eee; 
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .modal-header h2 { margin: 0; font-size: 1.2rem; color: #111; }
                .modal-body { padding: 25px; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default StudentTasks;
