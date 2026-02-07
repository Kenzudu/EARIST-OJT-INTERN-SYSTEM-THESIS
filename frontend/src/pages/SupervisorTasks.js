import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './AdminDashboard.css';

const baseURL = 'http://localhost:8000/api';

function SupervisorTasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [newTask, setNewTask] = useState({
        student_id: '',
        title: '',
        description: '',
        deadline: '',
        priority: 'Medium'
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkAccess();
        fetchTasks();
        fetchInterns();
    }, []);

    const checkAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/tasks/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setTasks(res.data);
        } catch (err) {
            setError('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchInterns = async () => {
        try {
            const res = await axios.get(`${baseURL}/supervisor/interns/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setInterns(res.data);
        } catch (err) {
            console.error('Failed to fetch interns:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask({ ...newTask, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');

            await axios.post(`${baseURL}/supervisor/tasks/`, newTask, {
                headers: { Authorization: `Token ${token}` }
            });

            setSuccess('Task created successfully!');
            setShowModal(false);
            setNewTask({
                student_id: '',
                title: '',
                description: '',
                deadline: '',
                priority: 'Medium'
            });
            fetchTasks();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create task');
        }
    };

    const handleVerify = async (task) => {
        if (!window.confirm("Verify and complete this task?")) return;
        try {
            await axios.patch(`${baseURL}/tasks/${task.id}/`,
                { status: 'Completed', completed_at: new Date().toISOString() },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess("Task verified and marked as completed!");
            fetchTasks();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Failed to verify task");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return '#4CAF50';
            case 'In Progress': return '#FF9800';
            case 'Submitted': return '#2196F3';
            case 'Pending': return '#9ca3af';
            default: return '#757575';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#f44336';
            case 'Medium': return '#ff9800';
            case 'Low': return '#4caf50';
            default: return '#757575';
        }
    };

    const filteredTasks = filterStatus === 'all'
        ? tasks
        : tasks.filter(task => task.status === filterStatus);

    if (loading) return <div className="loading">Loading tasks...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Task Management"
                    subtitle="Assign and manage tasks for your interns"
                />

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['all', 'In Progress', 'Submitted', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '8px 16px',
                                    background: filterStatus === status ? getStatusColor(status === 'all' ? 'Pending' : status) : '#f5f5f5',
                                    color: filterStatus === status && status !== 'Pending' ? 'white' : '#333',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: '10px 20px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        + Assign New Task
                    </button>
                </div>

                {/* Tasks List */}
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {filteredTasks.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            No tasks found
                        </div>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            {filteredTasks.map(task => (
                                <div key={task.id} style={{
                                    padding: '20px',
                                    marginBottom: '15px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${getStatusColor(task.status)}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>
                                                {task.title}
                                            </h3>
                                            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>
                                                Assigned to: <strong>{task.student_name || 'Unknown'}</strong>
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                background: getPriorityColor(task.priority),
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {task.priority}
                                            </span>
                                            <span style={{
                                                padding: '4px 12px',
                                                background: getStatusColor(task.status),
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', color: '#555', lineHeight: '1.5' }}>
                                        {task.description}
                                    </p>

                                    {/* Submission Details */}
                                    {(task.submission_file || task.submission_link || task.student_notes) && (
                                        <div style={{
                                            marginBottom: '15px',
                                            padding: '15px',
                                            background: '#f0f9ff',
                                            borderRadius: '6px',
                                            border: '1px solid #bae6fd'
                                        }}>
                                            <strong style={{ color: '#0369a1', display: 'block', marginBottom: '8px' }}>Submission:</strong>

                                            {task.submission_link && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    🔗 <a href={task.submission_link} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                                                        {task.submission_link}
                                                    </a>
                                                </div>
                                            )}

                                            {task.submission_file && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    📄 <a href={`http://localhost:8000${task.submission_file}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                                                        View Attached File
                                                    </a>
                                                </div>
                                            )}

                                            {task.student_notes && (
                                                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0f2fe' }}>
                                                    <span style={{ fontSize: '0.85em', color: '#555', fontWeight: '600' }}>Comments:</span>
                                                    <p style={{ margin: '4px 0 0', color: '#444', fontStyle: 'italic' }}>"{task.student_notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#666' }}>
                                            <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                                            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {/* Verify Action */}
                                        {task.status === 'Submitted' && (
                                            <button
                                                onClick={() => handleVerify(task)}
                                                style={{
                                                    padding: '6px 16px',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Verify & Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Task Modal */}
                {showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '30px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <h2 style={{ margin: '0 0 20px 0' }}>Assign New Task</h2>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                        Select Intern *
                                    </label>
                                    <select
                                        name="student_id"
                                        value={newTask.student_id}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="">Choose an intern...</option>
                                        {interns.map(intern => (
                                            <option key={intern.id} value={intern.id}>
                                                {intern.name} ({intern.student_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={newTask.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Complete database design"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newTask.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        placeholder="Describe the task in detail..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                            Deadline *
                                        </label>
                                        <input
                                            type="date"
                                            name="deadline"
                                            value={newTask.deadline}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                            Priority *
                                        </label>
                                        <select
                                            name="priority"
                                            value={newTask.priority}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f5f5f5',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 20px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Assign Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupervisorTasks;
