import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupervisorHeader from './SupervisorHeader';
import './AdminDashboard.css';

const baseURL = 'http://localhost:8000/api';

// Evaluation Criteria Structure based on the paper form
const EVALUATION_AREAS = [
    {
        id: 'area1',
        title: 'AREA 1: COMPETENCE AND DEPENDABILITY (30 pts)',
        maxPoints: 30,
        questions: [
            { id: 'q1', text: 'Quality of work (performs an assigned job efficiently as possible)' },
            { id: 'q2', text: 'Quality of work (can cope with the demand of additional unexpected work load in a limited time)' },
            { id: 'q3', text: 'Application of acquired knowledge & skill' },
            { id: 'q4', text: 'Use of tools and equipment' },
            { id: 'q5', text: 'Care of materials and supplies' },
            { id: 'q6', text: 'Knowledge of the vocabulary related to the job' }
        ]
    },
    {
        id: 'area2',
        title: 'AREA 2: ACCURACY & WORK HABITS (25 pts)',
        maxPoints: 25,
        questions: [
            { id: 'q1', text: 'Reliability' },
            { id: 'q2', text: 'Initiative' },
            { id: 'q3', text: 'Self-dependence' },
            { id: 'q4', text: 'Attendance and punctuality' },
            { id: 'q5', text: 'Ability to follow direction' }
        ]
    },
    {
        id: 'area3',
        title: 'AREA 3: INTEREST / COOPERATION (25 pts)',
        maxPoints: 25,
        questions: [
            { id: 'q1', text: 'Ability to work together with other people' },
            { id: 'q2', text: 'Ability to control one\'s emotions (self-control)' },
            { id: 'q3', text: 'Demonstrate self-confidence appropriate for the job' },
            { id: 'q4', text: 'Willingness to follow directions or instructions' },
            { id: 'q5', text: 'Ability to adjust to new problems and changing situations' }
        ]
    },
    {
        id: 'area4',
        title: 'AREA 4: PERSONALITY / INTERPERSONAL RELATIONSHIP (20 pts)',
        maxPoints: 20,
        questions: [
            { id: 'q1', text: 'Ability to handle issues and constructive criticism' },
            { id: 'q2', text: 'Personality and character' },
            { id: 'q3', text: 'Human and public relations' },
            { id: 'q4', text: 'Grooming / Dress Code' }
        ]
    }
];

function SupervisorEvaluations() {
    const navigate = useNavigate();
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [history, setHistory] = useState([]);



    // Evaluation State
    const [studentId, setStudentId] = useState('');
    const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);
    const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
    const [criteriaScores, setCriteriaScores] = useState({}); // { area1: { q1: 5, q2: 4 }, area2: ... }
    const [comments, setComments] = useState('');

    // Calculated State
    const [areaTotals, setAreaTotals] = useState({ area1: 0, area2: 0, area3: 0, area4: 0 });
    const [totalScore, setTotalScore] = useState(0);
    const [gradeEquivalent, setGradeEquivalent] = useState('1.0');

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkAccess();
        checkAccess();
        fetchInterns();
        fetchHistory();

        // Initialize scores with 5 (Excellent)
        const initialScores = {};
        EVALUATION_AREAS.forEach(area => {
            initialScores[area.id] = {};
            area.questions.forEach(q => {
                initialScores[area.id][q.id] = 5;
            });
        });
        setCriteriaScores(initialScores);
    }, []);

    // Recalculate totals whenever scores change
    useEffect(() => {
        const newAreaTotals = {};
        let newTotalScore = 0;

        EVALUATION_AREAS.forEach(area => {
            let areaSum = 0;
            if (criteriaScores[area.id]) {
                Object.values(criteriaScores[area.id]).forEach(val => {
                    areaSum += parseInt(val) || 0;
                });
            }
            newAreaTotals[area.id] = areaSum;
            newTotalScore += areaSum;
        });

        setAreaTotals(newAreaTotals);
        setTotalScore(newTotalScore);
        setGradeEquivalent(calculateGrade(newTotalScore));
    }, [criteriaScores]);

    const calculateGrade = (score) => {
        if (score >= 97) return '1.0';
        if (score >= 94) return '1.25';
        if (score >= 91) return '1.5';
        if (score >= 88) return '1.75';
        if (score >= 85) return '2.0';
        if (score >= 82) return '2.25';
        if (score >= 79) return '2.5';
        if (score >= 76) return '2.75';
        if (score >= 73) return '3.0';
        return '5.0';
    };

    const checkAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchInterns = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/interns/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setInterns(res.data.filter(intern => intern.status === 'Approved'));
        } catch (err) {
            setError('Failed to fetch interns');
        } finally {
            setLoading(false);
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${baseURL}/evaluations/`, {
                headers: { Authorization: `Token ${token}` }
            });
            // Result is already filtered by backend to show this supervisor's submissions
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleScoreChange = (areaId, questionId, value) => {
        setCriteriaScores(prev => ({
            ...prev,
            [areaId]: {
                ...prev[areaId],
                [questionId]: parseInt(value)
            }
        }));
    };

    const handleNewEvaluation = () => {
        setViewMode(false);
        setStudentId('');
        const today = new Date().toISOString().split('T')[0];
        setPeriodStart(today);
        setPeriodEnd(today);
        setComments('');

        const initialScores = {};
        EVALUATION_AREAS.forEach(area => {
            initialScores[area.id] = {};
            area.questions.forEach(q => {
                initialScores[area.id][q.id] = 5;
            });
        });
        setCriteriaScores(initialScores);
        setShowModal(true);
    };

    const handleViewEvaluation = (evaluation) => {
        setStudentId(evaluation.student);
        setPeriodStart(evaluation.evaluation_period_start);
        setPeriodEnd(evaluation.evaluation_period_end);
        setComments(evaluation.comments || '');
        setCriteriaScores(evaluation.criteria_scores || {});
        setViewMode(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');

            const payload = {
                student: studentId,
                evaluation_period_start: periodStart,
                evaluation_period_end: periodEnd,
                criteria_scores: criteriaScores,
                total_score: totalScore,
                grade: gradeEquivalent,
                comments: comments
            };

            await axios.post(`${baseURL}/evaluations/`, payload, {
                headers: { Authorization: `Token ${token}` }
            });

            setSuccess('Performance evaluation submitted successfully!');
            setShowModal(false);
            fetchHistory(); // Refresh history

            // Reset form
            setStudentId('');
            setPeriodStart('');
            setPeriodEnd('');
            setComments('');
            // Reset scores to default 5
            const initialScores = {};
            EVALUATION_AREAS.forEach(area => {
                initialScores[area.id] = {};
                area.questions.forEach(q => {
                    initialScores[area.id][q.id] = 5;
                });
            });
            setCriteriaScores(initialScores);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to submit evaluation. Please check all fields.');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <SupervisorHeader
                    title="Performance Evaluations"
                    subtitle="Evaluate intern performance using the standard evaluation form"
                />

                {error && <div className="error-banner">{error}</div>}
                {success && (
                    <div style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)'
                    }}>
                        {success}
                    </div>
                )}

                {/* Interns Grid */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>Your Interns</h2>
                        <button
                            onClick={handleNewEvaluation}
                            className="btn-primary"
                            style={{ width: 'auto', whiteSpace: 'nowrap' }}
                        >
                            + Submit Evaluation
                        </button>
                    </div>

                    {interns.length === 0 ? (
                        <div className="empty-state">No interns assigned yet</div>
                    ) : (
                        <div className="grid-cards">
                            {interns.map((intern) => (
                                <div key={intern.id} className="intern-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: (intern.profile_image || intern.profile_picture) ? 'transparent' : '#667eea',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', color: 'white', overflow: 'hidden', flexShrink: 0,
                                            border: (intern.profile_image || intern.profile_picture) ? '2px solid #e2e8f0' : 'none'
                                        }}>
                                            {(intern.profile_image || intern.profile_picture) ? (
                                                <img
                                                    src={intern.profile_image || intern.profile_picture}
                                                    alt={intern.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.style.background = '#667eea';
                                                        e.target.parentElement.innerText = intern.name?.charAt(0) || 'I';
                                                    }}
                                                />
                                            ) : (
                                                intern.name?.charAt(0) || 'I'
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a202c' }}>{intern.name}</h3>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096' }}>ID: {intern.student_id}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setStudentId(intern.id);
                                            setShowModal(true);
                                        }}
                                        className="btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        Evaluate Performance
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Evaluation History Section */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>Evaluation History</h2>
                    {history.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No evaluations submitted yet</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Student</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Date Evaluated</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568' }}>Grade</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568' }}>Total Score</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((evalItem) => (
                                        <tr
                                            key={evalItem.id}
                                            onClick={() => handleViewEvaluation(evalItem)}
                                            style={{ borderBottom: '1px solid #edf2f7', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#2d3748' }}>
                                                {evalItem.student_name || 'Unknown Student'}
                                            </td>
                                            <td style={{ padding: '16px', color: '#718096' }}>
                                                {new Date(evalItem.created_at || evalItem.submitted_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{
                                                    background: evalItem.grade <= 2.0 ? '#c6f6d5' : '#ffffaf',
                                                    color: evalItem.grade <= 2.0 ? '#22543d' : '#744210',
                                                    padding: '4px 12px', borderRadius: '99px', fontWeight: 'bold'
                                                }}>
                                                    {evalItem.grade}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                                                {evalItem.total_score}
                                            </td>
                                            <td style={{ padding: '16px', color: '#718096', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {evalItem.comments || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Evaluation Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content evaluation-modal">
                            <div className="modal-header">
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a202c' }}>
                                    {viewMode ? 'View Evaluation Details' : 'Performance Evaluation Form'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <fieldset disabled={viewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
                                    {/* Meta Data */}
                                    <div className="form-section">
                                        <div className="form-group">
                                            <label>Select Intern *</label>
                                            <select
                                                value={studentId}
                                                onChange={(e) => setStudentId(e.target.value)}
                                                required
                                                className="form-control"
                                            >
                                                <option value="">Choose an intern...</option>
                                                {interns.map(intern => (
                                                    <option key={intern.id} value={intern.id}>
                                                        {intern.name} ({intern.student_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Period Start *</label>
                                                <input
                                                    type="date"
                                                    value={periodStart}
                                                    onChange={(e) => setPeriodStart(e.target.value)}
                                                    required
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Period End *</label>
                                                <input
                                                    type="date"
                                                    value={periodEnd}
                                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                                    required
                                                    className="form-control"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rating-instruction">
                                        <p><strong>Directions:</strong> Please rate the trainee according to the scale:</p>
                                        <div className="scale-legend">
                                            <span><strong>5</strong> – Excellent</span>
                                            <span><strong>4</strong> – Very Good</span>
                                            <span><strong>3</strong> – Good</span>
                                            <span><strong>2</strong> – Poor</span>
                                            <span><strong>1</strong> – Needs Improvement</span>
                                        </div>
                                    </div>

                                    {/* Evaluation Criteria Areas */}
                                    {EVALUATION_AREAS.map(area => (
                                        <div key={area.id} className="area-section">
                                            <div className="area-header">
                                                <h3>{area.title}</h3>
                                                <span className="area-score">Score: {areaTotals[area.id] || 0} / {area.maxPoints}</span>
                                            </div>
                                            <div className="questions-grid">
                                                <div className="questions-header-row">
                                                    <div>Criteria</div>
                                                    <div className="rating-header">Rating</div>
                                                </div>
                                                {area.questions.map(q => (
                                                    <div key={q.id} className="question-row">
                                                        <div className="question-text">{q.text}</div>
                                                        <div className="rating-options">
                                                            {[5, 4, 3, 2, 1].map(val => (
                                                                <label key={val} className="rating-option">
                                                                    <input
                                                                        type="radio"
                                                                        name={`${area.id}_${q.id}`}
                                                                        value={val}
                                                                        checked={criteriaScores[area.id]?.[q.id] === val}
                                                                        onChange={() => handleScoreChange(area.id, q.id, val)}
                                                                    />
                                                                    <span className="rating-circle">{val}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Summary Section */}
                                    <div className="summary-section">
                                        <h3>SUMMARY (Total of Scores)</h3>
                                        <div className="summary-grid">
                                            {EVALUATION_AREAS.map(area => (
                                                <div key={area.id} className="summary-row">
                                                    <span>{area.title}</span>
                                                    <span className="summary-val">{areaTotals[area.id]} pts</span>
                                                </div>
                                            ))}
                                            <div className="summary-row total-row">
                                                <span><strong>Total</strong></span>
                                                <span className="summary-val total-val">{totalScore}</span>
                                            </div>
                                            <div className="summary-row grade-row">
                                                <span><strong>Grade Equivalent</strong></span>
                                                <span className="summary-val grade-val">{gradeEquivalent}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comments */}
                                    <div className="form-section">
                                        <div className="form-group">
                                            <label>Comments / Suggestions</label>
                                            <textarea
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                rows="4"
                                                className="form-control"
                                                placeholder="Enter any additional comments or feedback..."
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">{viewMode ? 'Close' : 'Cancel'}</button>
                                        {!viewMode && <button type="submit" className="btn-submit">Submit Evaluation</button>}
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .admin-dashboard-container { padding: 20px; background: #f7fafc; min-height: 100vh; }
                .admin-dashboard-main { max-width: 1200px; margin: 0 auto; }
                
                .btn-primary { 
                    padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
                }
                .btn-secondary {
                    padding: 10px; background: #4facfe; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
                }
                .btn-cancel {
                    padding: 12px 24px; background: #edf2f7; color: #4a5568; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
                }
                .btn-submit {
                    padding: 12px 32px; background: #48bb78; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
                }

                .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .intern-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
                    overflow: auto; padding: 20px;
                }
                .evaluation-modal {
                    background: white; width: 100%; max-width: 900px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    max-height: 90vh; overflow-y: auto; padding: 30px;
                }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #718096; }

                .form-control { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                .rating-instruction { background: #ebf8ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bee3f8; }
                .scale-legend { display: flex; gap: 20px; margin-top: 8px; flex-wrap: wrap; color: #2c5282; }

                .area-section { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden; }
                .area-header { background: #f7fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .area-header h3 { margin: 0; font-size: 1.1rem; color: #2d3748; }
                .area-score { font-weight: 700; color: #4a5568; }

                .questions-grid { padding: 0 20px; }
                .questions-header-row { display: grid; grid-template-columns: 1fr 200px; padding: 12px 0; border-bottom: 1px solid #edf2f7; font-weight: 600; color: #718096; }
                .rating-header { text-align: center; }
                .question-row { display: grid; grid-template-columns: 1fr 200px; padding: 16px 0; border-bottom: 1px solid #edf2f7; align-items: center; }
                .question-row:last-child { border-bottom: none; }
                .rating-options { display: flex; justify-content: center; gap: 12px; }
                
                .rating-option { cursor: pointer; display: flex; flex-direction: column; align-items: center; }
                .rating-option input { display: none; }
                .rating-circle {
                    width: 32px; height: 32px; border-radius: 50%; border: 2px solid #cbd5e0;
                    display: flex; align-items: center; justify-content: center; font-weight: 600; color: #718096; transition: all 0.2s;
                }
                .rating-option input:checked + .rating-circle {
                    background: #667eea; border-color: #667eea; color: white; transform: scale(1.1);
                }

                .summary-section { background: #f7fafc; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
                .summary-grid { max-width: 500px; margin-top: 16px; }
                .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e0; }
                .total-row { font-size: 1.1rem; border-top: 2px solid #cbd5e0; border-bottom: none; margin-top: 8px; padding-top: 12px; }
                .grade-row { font-size: 1.2rem; color: #2b6cb0; margin-top: 5px; }

                .modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 30px; }
                .error-banner { background: #fed7d7; color: #9b2c2c; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
            `}</style>
        </div>
    );
}

export default SupervisorEvaluations;
