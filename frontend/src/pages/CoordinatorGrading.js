import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './CoordinatorGrading.css';
import CoordinatorHeader from './CoordinatorHeader';

function CoordinatorGrading() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('rubric');

    // Rubric/Criteria
    const [criteria, setCriteria] = useState([]);
    const [newCriterion, setNewCriterion] = useState({ name: '', weight: '', description: '' });
    const [editingCriterion, setEditingCriterion] = useState(null);

    // Students and Grades
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [computing, setComputing] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        checkCoordinatorAccess();
        loadCriteria();
        loadStudents();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator' && userRole !== 'admin') {
            setError('Access denied. Coordinators only.');
            setTimeout(() => navigate('/student/dashboard'), 1000);
        }
    };

    const loadCriteria = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/grading/criteria/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setCriteria(response.data);
        } catch (err) {
            console.error('Error loading criteria:', err);
        }
    };

    const loadStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/students/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setStudents(response.data);

            // Load existing grades
            await loadExistingGrades();
        } catch (err) {
            console.error('Error loading students:', err);
        }
    };

    const loadExistingGrades = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/grading/grades/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setGrades(response.data);
        } catch (err) {
            console.error('Error loading grades:', err);
        }
    };

    const handleAddCriterion = async () => {
        if (!newCriterion.name || !newCriterion.weight) {
            setError('Please fill in name and weight');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            if (editingCriterion) {
                // Update existing criterion
                await axios.put(
                    `${baseURL}coordinator/grading/criteria/${editingCriterion.id}/`,
                    newCriterion,
                    { headers: { Authorization: `Token ${token}` } }
                );
                setSuccess('Criterion updated successfully!');
            } else {
                // Add new criterion
                await axios.post(
                    `${baseURL}coordinator/grading/criteria/`,
                    newCriterion,
                    { headers: { Authorization: `Token ${token}` } }
                );
                setSuccess('Criterion added successfully!');
            }

            setNewCriterion({ name: '', weight: '', description: '' });
            setEditingCriterion(null);
            loadCriteria();
        } catch (err) {
            console.error('Error saving criterion:', err);
            setError('Failed to save criterion');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCriterion = (criterion) => {
        setNewCriterion({
            name: criterion.name,
            weight: criterion.weight,
            description: criterion.description || ''
        });
        setEditingCriterion(criterion);
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setNewCriterion({ name: '', weight: '', description: '' });
        setEditingCriterion(null);
        setError('');
        setSuccess('');
    };

    const handleDeleteCriterion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this criterion?')) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}coordinator/grading/criteria/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Criterion deleted successfully!');
            loadCriteria();
        } catch (err) {
            console.error('Error deleting criterion:', err);
            setError('Failed to delete criterion');
        } finally {
            setLoading(false);
        }
    };

    const handleComputeGrade = async (studentId) => {
        setComputing(prev => ({ ...prev, [studentId]: true }));
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${baseURL}coordinator/grading/compute/${studentId}/`,
                {},
                { headers: { Authorization: `Token ${token}` } }
            );

            // Update grades state with new grade data
            setGrades(prevGrades => ({
                ...prevGrades,
                [studentId]: response.data
            }));
            setSuccess(`Grade computed for student ${response.data.student}`);
        } catch (err) {
            console.error('Error computing grade:', err);
            setError(`Failed to compute grade: ${err.response?.data?.error || err.message}`);
        } finally {
            setComputing(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleComputeAllGrades = async () => {
        setLoading(true);
        for (const student of students) {
            await handleComputeGrade(student.id);
        }
        setLoading(false);
    };

    const getTotalWeight = () => {
        return criteria.reduce((sum, c) => sum + parseFloat(c.weight || 0), 0);
    };

    // Filter students based on search query
    const filteredStudents = students.filter(student => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const studentId = student.student_profile?.student_id || '';
        const firstName = student.first_name || '';
        const lastName = student.last_name || '';
        const username = student.username || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();

        return studentId.toLowerCase().includes(query) ||
            fullName.includes(query) ||
            username.toLowerCase().includes(query);
    });

    return (
        <>
            <div className="admin-dashboard-container">
                <div className="admin-dashboard-main">
                    <CoordinatorHeader
                        title="Academic Grading System"
                        subtitle="Manage grading rubrics and compute student final grades"
                    />

                    {error && <div className="error-banner">{error}</div>}
                    {success && <div className="success-banner">{success}</div>}

                    {/* Tabs */}
                    <div className="grading-tabs">
                        <button
                            className={`grading-tab ${activeTab === 'rubric' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rubric')}
                        >
                            Grading Rubric
                        </button>
                        <button
                            className={`grading-tab ${activeTab === 'gradebook' ? 'active' : ''}`}
                            onClick={() => setActiveTab('gradebook')}
                        >
                            Gradebook
                        </button>
                    </div>

                    <div className="settings-content">
                        {/* Rubric Tab */}
                        {activeTab === 'rubric' && (
                            <div className="settings-section">
                                <h2>Grading Criteria Configuration</h2>
                                <p style={{ color: '#666', marginBottom: '20px' }}>
                                    Define the components and weights for final grade computation. Total weight should equal 100%.
                                </p>

                                {/* Current Criteria */}
                                <div style={{ marginBottom: '30px' }}>
                                    <h3>Current Criteria {getTotalWeight() > 0 && `(Total: ${getTotalWeight()}%)`}</h3>
                                    {criteria.length > 0 ? (
                                        <table className="settings-table">
                                            <thead>
                                                <tr>
                                                    <th>Component</th>
                                                    <th>Weight (%)</th>
                                                    <th>Description</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {criteria.map(c => (
                                                    <tr key={c.id}>
                                                        <td><strong>{c.name}</strong></td>
                                                        <td>{c.weight}%</td>
                                                        <td>{c.description || '—'}</td>
                                                        <td>
                                                            <button
                                                                onClick={() => handleEditCriterion(c)}
                                                                className="grading-btn-small"
                                                                style={{ marginRight: '8px', backgroundColor: '#2196F3' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCriterion(c.id)}
                                                                className="grading-btn-small"
                                                                style={{ backgroundColor: '#f44336' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p style={{ color: '#999', fontStyle: 'italic' }}>
                                            No criteria defined yet. Default weights will be used: Attendance 30%, Supervisor Evaluation 50%, Requirements 20%
                                        </p>
                                    )}
                                    {getTotalWeight() > 0 && getTotalWeight() !== 100 && (
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
                                            Warning: Total weight is {getTotalWeight()}%. It should equal 100%.
                                        </div>
                                    )}
                                </div>

                                {/* Add/Edit Criterion */}
                                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <h3>{editingCriterion ? 'Edit Criterion' : 'Add New Criterion'}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', gap: '15px', marginTop: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Component Name</label>
                                            <input
                                                type="text"
                                                value={newCriterion.name}
                                                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                                                placeholder="e.g., Attendance"
                                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Weight (%)</label>
                                            <input
                                                type="number"
                                                value={newCriterion.weight}
                                                onChange={(e) => setNewCriterion({ ...newCriterion, weight: e.target.value })}
                                                placeholder="30"
                                                min="0"
                                                max="100"
                                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Description (Optional)</label>
                                            <input
                                                type="text"
                                                value={newCriterion.description}
                                                onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                                                placeholder="Based on hours rendered"
                                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleAddCriterion}
                                            disabled={loading}
                                            className="grading-btn-primary"
                                        >
                                            {loading ? 'Saving...' : (editingCriterion ? 'Update Criterion' : 'Add Criterion')}
                                        </button>
                                        {editingCriterion && (
                                            <button
                                                onClick={handleCancelEdit}
                                                className="grading-btn-secondary"
                                                style={{ backgroundColor: '#757575' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gradebook Tab */}
                        {activeTab === 'gradebook' && (
                            <div className="settings-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h2>Student Gradebook</h2>
                                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                                            Compute and view final grades for all students
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleComputeAllGrades}
                                        disabled={loading}
                                        className="grading-btn-secondary"
                                    >
                                        {loading ? 'Computing...' : 'Compute All Grades'}
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div style={{ marginBottom: '20px' }}>
                                    <input
                                        type="text"
                                        placeholder=" Search by Student ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            fontSize: '15px',
                                            border: '2px solid #e0e0e0',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'border-color 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                    />
                                    {searchQuery && (
                                        <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                                            Showing {filteredStudents.length} of {students.length} students
                                        </p>
                                    )}
                                </div>

                                {filteredStudents.length > 0 ? (
                                    <table className="settings-table">
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>Attendance Score</th>
                                                <th>Supervisor Score</th>
                                                <th>Final Grade</th>
                                                <th>Remarks</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(student => {
                                                const grade = grades[student.id];
                                                return (
                                                    <tr key={student.id}>
                                                        <td>{student.student_profile?.student_id || student.username}</td>
                                                        <td><strong>{student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : student.username}</strong></td>
                                                        <td>{grade ? `${grade.attendance_score}%` : '—'}</td>
                                                        <td>{grade ? `${grade.supervisor_score}%` : '—'}</td>
                                                        <td>
                                                            {grade ? (
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    backgroundColor: grade.final_grade <= 3.0 ? '#d4edda' : '#f8d7da',
                                                                    color: grade.final_grade <= 3.0 ? '#155724' : '#721c24',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {grade.final_grade}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td>{grade?.remarks || '—'}</td>
                                                        <td>
                                                            <button
                                                                onClick={() => handleComputeGrade(student.id)}
                                                                disabled={computing[student.id]}
                                                                className="grading-btn-small"
                                                            >
                                                                {computing[student.id] ? 'Computing...' : 'Compute'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
                                        <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                                            {searchQuery ? 'No students found matching your search.' : 'No students found.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
            .grading-btn-primary {
                padding: 12px 28px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
                letter-spacing: 0.3px;
            }

            .grading-btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.35);
                background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
            }

            .grading-btn-primary:disabled {
                background: linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%);
                cursor: not-allowed;
                opacity: 0.7;
            }

            .grading-btn-secondary {
                padding: 12px 28px;
                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
            }

            .grading-btn-secondary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(33, 150, 243, 0.35);
                background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
            }

            .grading-btn-secondary:disabled {
                background: linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%);
                cursor: not-allowed;
                opacity: 0.7;
            }

            .grading-btn-small {
                padding: 8px 20px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
            }

            .grading-btn-small:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
            }

            .grading-btn-small:disabled {
                background: linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%);
                cursor: not-allowed;
                opacity: 0.7;
            }

            .tabs-container .tab {
                padding: 14px 28px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                color: #666;
                transition: all 0.3s ease;
            }

            .tabs-container .tab:hover {
                color: #333;
                background: rgba(0, 0, 0, 0.03);
            }

            .tabs-container .tab.active {
                color: #2196F3;
                border-bottom-color: #2196F3;
                background: rgba(33, 150, 243, 0.05);
            }
        `}</style>
        </>
    );
}

export default CoordinatorGrading;
