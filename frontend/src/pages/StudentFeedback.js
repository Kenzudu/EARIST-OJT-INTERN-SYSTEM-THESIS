import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentHeader from './StudentHeader';
import './StudentDashboard.css';
import jsPDF from 'jspdf';
import earistLogo from './earist-logo.png';

// Chart.js Imports
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const StudentFeedback = () => {

    // Helper for Grade Description
    const getGradeDescription = (grade) => {
        const g = parseFloat(grade);
        if (isNaN(g)) return grade; // Fallback for legacy text grades
        if (g <= 1.5) return 'Excellent';
        if (g <= 2.5) return 'Very Good';
        if (g <= 3.5) return 'Good';
        if (g <= 4.5) return 'Satisfactory';
        return 'Needs Improvement';
    };

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState([]);
    const [feedbackAnalysis, setFeedbackAnalysis] = useState(null);
    const [aiModel, setAiModel] = useState('models/gemini-2.5-flash');
    const [error, setError] = useState('');
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [showAiInfoModal, setShowAiInfoModal] = useState(false);

    const baseURL = 'http://localhost:8000/api';
    const token = localStorage.getItem('token');

    // Evaluation Criteria Structure (same as public form)
    const evaluationCriteria = {
        area1: {
            title: "AREA 1: COMPETENCE AND DEPENDABILITY",
            weight: 0.30,
            maxPoints: 30,
            criteria: [
                { id: 'quality_assigned', label: 'Quality of work (performs an assigned job efficiently as possible)', max: 5 },
                { id: 'quality_additional', label: 'Quality of work (can cope with the demand of additional unexpected work load in a limited time)', max: 5 },
                { id: 'application_knowledge', label: 'Application of acquired knowledge & skill', max: 5 },
                { id: 'use_tools', label: 'Use of tools and equipment', max: 5 },
                { id: 'care_materials', label: 'Care of materials and supplies', max: 5 },
                { id: 'knowledge_vocabulary', label: 'Knowledge of the vocabulary related to the job', max: 5 }
            ]
        },
        area2: {
            title: "AREA 2: ACCURACY & WORK HABITS",
            weight: 0.25,
            maxPoints: 25,
            criteria: [
                { id: 'reliability', label: 'Reliability', max: 5 },
                { id: 'initiative', label: 'Initiative', max: 5 },
                { id: 'self_dependence', label: 'Self-dependence', max: 5 },
                { id: 'attendance', label: 'Attendance and punctuality', max: 5 },
                { id: 'follow_direction', label: 'Ability to follow direction', max: 5 }
            ]
        },
        area3: {
            title: "AREA 3: INTEREST / COOPERATION",
            weight: 0.25,
            maxPoints: 25,
            criteria: [
                { id: 'work_together', label: 'Ability to work together with other people', max: 5 },
                { id: 'control_emotions', label: 'Ability to control one\'s emotions (self-control)', max: 5 },
                { id: 'self_confidence', label: 'Demonstrate self-confidence appropriate for the job', max: 5 },
                { id: 'follow_directions', label: 'Willingness to follow directions or instructions', max: 5 },
                { id: 'adjust_problems', label: 'Ability to adjust to new problems and changing situations', max: 5 }
            ]
        },
        area4: {
            title: "AREA 4: PERSONALITY / INTERPERSONAL RELATIONSHIP",
            weight: 0.20,
            maxPoints: 20,
            criteria: [
                { id: 'handle_issues', label: 'Ability to handle issues and constructive criticism', max: 5 },
                { id: 'personality_character', label: 'Personality and character', max: 5 },
                { id: 'human_relations', label: 'Human and public relations', max: 5 },
                { id: 'grooming', label: 'Grooming / Dress Code', max: 5 }
            ]
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Not specified';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const calculateGrade = (score) => {
        const numScore = parseFloat(score);
        if (numScore >= 97 && numScore <= 100) return '1.0';
        if (numScore >= 94 && numScore <= 96) return '1.25';
        if (numScore >= 91 && numScore <= 93) return '1.5';
        if (numScore >= 88 && numScore <= 90) return '1.75';
        if (numScore >= 85 && numScore <= 87) return '2.0';
        if (numScore >= 82 && numScore <= 84) return '2.25';
        if (numScore >= 79 && numScore <= 81) return '2.5';
        if (numScore >= 76 && numScore <= 78) return '2.75';
        if (numScore >= 73 && numScore <= 75) return '3.0';
        if (numScore >= 72) return '3.0';
        return '5.0';
    };

    const generatePDF = (evalItem) => {
        console.log('Generating PDF for evaluation:', evalItem);
        console.log('Supervisor data:', {
            name: evalItem.supervisor_name,
            email: evalItem.supervisor_email,
            position: evalItem.supervisor_position,
            signature: evalItem.supervisor_signature ? 'EXISTS' : 'MISSING'
        });
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let yPosition = 15;

        // Add watermark logo in background
        const logoWidth = 80;
        const logoHeight = 80;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = (pageHeight - logoHeight) / 2;
        doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);

        // Header - Title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text('SCIENCE AND TECHNOLOGY', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.setFontSize(10);
        doc.text('STUDENT PERFORMANCE EVALUATION FORM', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
        
        // Student Information Box
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Name of Student: ' + (evalItem.student_name || 'Student'), 14, yPosition);
        yPosition += 4;
        doc.text('Student ID: ' + (evalItem.student_id || ''), 14, yPosition);
        doc.text('Course: ' + (evalItem.course || ''), 110, yPosition);
        yPosition += 4;
        if (evalItem.position && evalItem.company_name) {
            const posText = doc.splitTextToSize('Position: ' + evalItem.position, pageWidth - 28);
            doc.text(posText, 14, yPosition);
            yPosition += 4;
            const compText = doc.splitTextToSize('Company: ' + evalItem.company_name, pageWidth - 28);
            doc.text(compText, 14, yPosition);
            yPosition += 4;
        }
        
        yPosition += 2;
        doc.text('Evaluated by: ' + (evalItem.supervisor_name || evalItem.evaluated_by_name || 'Supervisor'), 14, yPosition);
        yPosition += 4;
        doc.text('Email: ' + (evalItem.supervisor_email || ''), 14, yPosition);
        yPosition += 4;
        doc.text('Evaluation Period: ' + formatDate(evalItem.evaluation_period_start) + ' - ' + formatDate(evalItem.evaluation_period_end), 14, yPosition);
        yPosition += 6;
        
        // Instructions
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const instText = doc.splitTextToSize('Instructions: Rate the student on each criterion. Scores are marked with [X].', pageWidth - 28);
        doc.text(instText, 14, yPosition);
        yPosition += 6;
        
        // Evaluation Criteria Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        Object.keys(evaluationCriteria).forEach((area) => {
            const areaData = evaluationCriteria[area];
            
            // Check if we need a new page
            if (yPosition > 240) {
                doc.addPage();
                // Add watermark to new page
                doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
                yPosition = 20;
            }
            
            // Area Title
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPosition - 4, pageWidth - 28, 7, 'F');
            doc.text(areaData.title, 16, yPosition);
            yPosition += 8;
            
            // Criteria
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            
            areaData.criteria.forEach(criterion => {
                const score = evalItem.criteria_scores?.[area]?.[criterion.id] ? parseInt(evalItem.criteria_scores[area][criterion.id]) : 0;
                const maxScore = criterion.max;
                
                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
                    yPosition = 20;
                }
                
                // Criterion label - wrap at 90 units
                const labelText = doc.splitTextToSize(criterion.label, 90);
                doc.text(labelText, 16, yPosition);
                const labelHeight = labelText.length * 4;
                
                // Score boxes
                let xPos = pageWidth - 48;
                const boxYPos = yPosition - 2.5;
                for (let i = 0; i <= maxScore; i++) {
                    doc.rect(xPos, boxYPos, 3.5, 3.5);
                    if (i === score) {
                        doc.setFillColor(0, 0, 0);
                        doc.rect(xPos, boxYPos, 3.5, 3.5, 'F');
                    }
                    doc.setFontSize(5);
                    doc.text(i.toString(), xPos + 0.8, boxYPos + 2.5);
                    doc.setFontSize(7);
                    xPos += 4;
                }
                
                // Show score / max
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text(`${score}/${maxScore}`, pageWidth - 14, yPosition, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                
                yPosition += Math.max(labelHeight + 1, 5);
            });
            
            // Area Total
            const areaTotal = Object.values(evalItem.criteria_scores?.[area] || {}).reduce((sum, s) => sum + parseFloat(s || 0), 0);
            const areaMax = areaData.criteria.reduce((sum, c) => sum + c.max, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(`Area Total: ${areaTotal}/${areaMax} (Weight: ${(areaData.weight * 100)}%)`, 16, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
        });
        
        // SUMMARY section
        yPosition += 2;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY (Total of Scores)', 14, yPosition);
        yPosition += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Calculate each area total
        Object.keys(evaluationCriteria).forEach((area) => {
            const areaData = evaluationCriteria[area];
            const areaTotal = Object.values(evalItem.criteria_scores?.[area] || {}).reduce((sum, s) => sum + parseFloat(s || 0), 0);
            const areaName = areaData.title.replace('AREA ', 'Area ').split(':')[0];
            
            doc.text(`${areaName} (${areaData.maxPoints} pts)`, 16, yPosition);
            doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
            doc.text(areaTotal.toString(), pageWidth - 22, yPosition, { align: 'center' });
            yPosition += 7;
        });
        
        // Total and Grade Equivalent
        doc.text('Total', 16, yPosition);
        doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
        doc.text((evalItem.total_score || '0').toString(), pageWidth - 22, yPosition, { align: 'center' });
        yPosition += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Grade Equivalent', 16, yPosition);
        doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
        doc.text(calculateGrade(evalItem.total_score || 0), pageWidth - 22, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Comments/Suggestions Section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Check page overflow before comments
        if (yPosition > pageHeight - 100) {
            doc.addPage();
            doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
            yPosition = 20;
        }
        
        doc.text('Comments / Suggestions:', 14, yPosition);
        yPosition += 5;
        
        if (evalItem.comments) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const splitComments = doc.splitTextToSize(evalItem.comments, pageWidth - 28);
            const commentsHeight = splitComments.length * 5;
            
            // Check if comments will overflow
            if (yPosition + commentsHeight > pageHeight - 80) {
                doc.addPage();
                doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
                yPosition = 20;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Comments / Suggestions (continued):', 14, yPosition);
                yPosition += 5;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
            }
            
            doc.text(splitComments, 14, yPosition);
            yPosition += commentsHeight + 5;
        } else {
            yPosition += 10;
        }
        
        // Signature Section - "Rated by:"
        // Check page overflow before signature
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
            yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Rated by:', 14, yPosition + 5);
        yPosition += 15;
        
        // Signature lines
        const leftX = 30;
        const rightX = pageWidth / 2 + 20;
        const lineWidth = 85;
        
        // Draw signature lines
        doc.line(leftX, yPosition, leftX + lineWidth, yPosition);
        doc.line(rightX, yPosition, rightX + lineWidth, yPosition);
        
        // If supervisor has e-signature, display it
        if (evalItem.supervisor_signature) {
            try {
                console.log('Adding signature to PDF:', evalItem.supervisor_signature ? 'Signature exists' : 'No signature');
                doc.addImage(evalItem.supervisor_signature, 'PNG', leftX + 2, yPosition - 25, 75, 18);
            } catch (e) {
                console.error('Error adding signature image:', e);
            }
        } else {
            console.log('No supervisor signature found for evaluation ID:', evalItem.id);
        }
        
        // Supervisor name above left line
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const supervisorName = evalItem.supervisor_name || evalItem.evaluated_by_name || 'Supervisor';
        doc.text(supervisorName, leftX + (lineWidth / 2), yPosition, { align: 'center' });
        
        // Position/Date above right line
        const supervisorPosition = evalItem.supervisor_position || 'Supervisor';
        const evalDate = formatDate(evalItem.evaluation_period_end);
        doc.text(`${supervisorPosition} / ${evalDate}`, rightX + (lineWidth / 2), yPosition - 4, { align: 'center' });
        
        // Labels below lines
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Signature over printed name', leftX + (lineWidth / 2), yPosition + 4, { align: 'center' });
        doc.text('Position / Date', rightX + (lineWidth / 2), yPosition + 4, { align: 'center' });
        
        // Footer
        yPosition = pageHeight - 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Generated on ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
        
        // Save PDF with format: EVALUATION_STUDENTNAME_DATE
        const today = new Date();
        const dateStr = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
        const studentName = evalItem.student_name?.replace(/\s+/g, '_') || 'Student';
        const fileName = `EVALUATION_${studentName}_${dateStr}.pdf`;
        doc.save(fileName);
    };

    useEffect(() => {
        fetchFeedbackData();
    }, [aiModel]);

    const fetchFeedbackData = async () => {
        setLoading(true);
        setError('');
        try {
            const [evalsResponse, analysisResponse, appsResponse] = await Promise.all([
                axios.get(`${baseURL}/evaluations/`, { headers: { Authorization: `Token ${token}` } }),
                axios.get(`${baseURL}/recommendations/feedback-analysis/?model=${aiModel}`, { headers: { Authorization: `Token ${token}` } }),
                axios.get(`${baseURL}/applications/`, { headers: { Authorization: `Token ${token}` } })
            ]);

            const hasApproved = appsResponse.data.some(app => app.status === 'Approved');
            if (!hasApproved) {
                setError("You need an approved internship to view evaluations.");
                setLoading(false);
                return;
            }

            // Sort evaluations by date  (oldest first for trend line)
            let sortedEvals = (evalsResponse.data.results || evalsResponse.data || []).sort((a, b) =>
                new Date(a.created_at) - new Date(b.created_at)
            );

            // Process evaluations to map criteria_scores (JSON) to flat fields for charts if needed
            sortedEvals = sortedEvals.map(ev => {
                if (ev.criteria_scores && (!ev.work_quality || !ev.punctuality)) {
                    const scores = ev.criteria_scores;
                    const getScore = (area, q) => scores[area] && scores[area][q] ? parseInt(scores[area][q]) : 0;

                    // Helper to get average of an area (scores are 1-5)
                    const getAreaAvg = (area) => {
                        if (!scores[area]) return 0;
                        const values = Object.values(scores[area]).map(v => parseInt(v) || 0);
                        if (values.length === 0) return 0;
                        return values.reduce((a, b) => a + b, 0) / values.length;
                    };

                    // Scale 1-5 to 1-10 (multiply by 2)
                    // Mapping based on SupervisorEvaluations.js structure:
                    // Area 1: Competence (Work Quality)
                    // Area 2: Accuracy/Habits (Punctuality q4, Initiative q2)
                    // Area 3: Interest/Cooperation (Teamwork q1, Problem Solving q5)
                    // Area 4: Personality (Communication/Relations q3)

                    return {
                        ...ev,
                        work_quality: parseFloat((getAreaAvg('area1') * 2).toFixed(1)),
                        punctuality: parseFloat(((getScore('area2', 'q4') || getAreaAvg('area2')) * 2).toFixed(1)),
                        teamwork: parseFloat(((getScore('area3', 'q1') || getAreaAvg('area3')) * 2).toFixed(1)),
                        initiative: parseFloat(((getScore('area2', 'q2') || getAreaAvg('area2')) * 2).toFixed(1)),
                        problem_solving: parseFloat(((getScore('area3', 'q5') || getAreaAvg('area3')) * 2).toFixed(1)),
                        communication: parseFloat(((getScore('area4', 'q3') || getAreaAvg('area4')) * 2).toFixed(1))
                    };
                }
                return ev;
            });

            setEvaluations(sortedEvals);
            setFeedbackAnalysis(analysisResponse.data);

        } catch (err) {
            console.error('Error fetching feedback data:', err);
            setError('Failed to load feedback data.');
        } finally {
            setLoading(false);
        }
    };

    const handleModelChange = (model) => {
        setAiModel(model);
    };

    const getGradeColor = (grade) => {
        const numGrade = parseFloat(grade);
        if (numGrade >= 90) return '#4CAF50'; // Green
        if (numGrade >= 80) return '#2196F3'; // Blue
        if (numGrade >= 75) return '#FF9800'; // Orange
        return '#f44336'; // Red
    };

    // Sort evaluations by submission time (newest first)
    const sortedEvaluations = [...evaluations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Radar Chart Data (For Selected Evaluation)
    const getRadarData = (evaluation) => {
        const scores = evaluation.criteria_scores || {};

        // Helper to get average of an area * 2 (for 10pt scale)
        const getAreaAvg = (areaKey) => {
            const area = scores[areaKey] || {};
            const values = Object.values(area);
            if (values.length === 0) return 0;
            const sum = values.reduce((a, b) => a + b, 0);
            return (sum / values.length) * 2;
        };

        return {
            labels: ['Competence', 'Work Quality', 'Teamwork', 'Initiative'],
            datasets: [
                {
                    label: 'Score (1-10)',
                    data: [
                        getAreaAvg('area1'),
                        getAreaAvg('area2'),
                        getAreaAvg('area3'),
                        getAreaAvg('area4')
                    ],
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: '#2196F3',
                    borderWidth: 2,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2196F3'
                },
            ],
        };
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: '#eee' },
                grid: { color: '#eee' },
                suggestedMin: 0,
                suggestedMax: 10,
                ticks: { stepSize: 2, backdropColor: 'transparent' }
            }
        },
        plugins: { legend: { display: false } }
    };


    if (loading) return <div className="loading">Loading feedback...</div>;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <StudentHeader
                    title="Feedback & Evaluations"
                    subtitle="Track your performance and view detailed insights"
                />

                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                {/* Evaluations List */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#333', margin: 0 }}>Evaluation History</h2>
                </div>

                {sortedEvaluations.length > 0 ? (
                    <div className="evaluations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {sortedEvaluations.map((evalItem) => (
                                    <div
                                        key={evalItem.id}
                                        className="evaluation-card hover-card"
                                        onClick={() => setSelectedEvaluation(evalItem)}
                                        style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            border: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                                            e.currentTarget.style.borderColor = '#f0f0f0';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                                                {new Date(evalItem.evaluation_period_end).toLocaleDateString()}
                                            </span>
                                            {evalItem.grade && (
                                                <span style={{
                                                    color: getGradeColor(evalItem.grade),
                                                    background: `${getGradeColor(evalItem.grade)}10`,
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {evalItem.grade}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#1e293b', fontWeight: '700', letterSpacing: '-0.3px', lineHeight: '1.3' }}>
                                                Evaluated by: {evalItem.supervisor_name || evalItem.evaluated_by_name || 'Supervisor'}
                                            </h3>
                                            {evalItem.supervisor_email && (
                                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                    {evalItem.supervisor_email}
                                                </div>
                                            )}
                                            {evalItem.evaluator_company && (
                                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>
                                                    {evalItem.evaluator_company}
                                                </div>
                                            )}
                                            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                {new Date(evalItem.evaluation_period_start).toLocaleDateString()} — {new Date(evalItem.evaluation_period_end).toLocaleDateString()}
                                            </p>

                                            {evalItem.comments ? (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#475569',
                                                    lineHeight: '1.6',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    background: '#f8fafc',
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #f1f5f9',
                                                    fontStyle: 'italic',
                                                    marginBottom: '16px'
                                                }}>
                                                    "{evalItem.comments}"
                                                </div>
                                            ) : <div style={{ height: '20px' }}></div>}

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>
                                                View Full Report
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-card" style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <p style={{ color: '#666' }}>No evaluations yet.</p>
                            </div>
                        )}

                {/* --- DETAILED MODAL WITH RADAR CHART --- */}
                {selectedEvaluation && (
                    <div className="modal-overlay" onClick={() => setSelectedEvaluation(null)} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                            background: 'white', padding: '0', borderRadius: '20px',
                            width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            {/* Modal Header */}
                            <div style={{ padding: '25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#1a202c', fontSize: '24px' }}>Performance Review</h2>
                                    <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '14px' }}>
                                        {new Date(selectedEvaluation.evaluation_period_start).toLocaleDateString()} — {new Date(selectedEvaluation.evaluation_period_end).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => generatePDF(selectedEvaluation)} 
                                        style={{ 
                                            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 20px', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                        Print Evaluation
                                    </button>
                                    <button onClick={() => setSelectedEvaluation(null)} style={{ background: 'transparent', border: 'none', fontSize: '28px', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                                </div>
                            </div>

                            <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                                {/* Left: Radar Chart */}
                                <div>
                                    <h4 style={{ margin: '0 0 20px 0', color: '#4a5568', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>Skill Breakdown</h4>
                                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '16px' }}>
                                        <Radar data={getRadarData(selectedEvaluation)} options={radarOptions} />
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                        <span style={{
                                            background: getGradeColor(selectedEvaluation.grade),
                                            color: 'white',
                                            padding: '8px 20px',
                                            borderRadius: '30px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            Final Grade: {selectedEvaluation.grade} ({getGradeDescription(selectedEvaluation.grade)})
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Qualitative Feedback */}
                                <div>
                                    <div style={{ marginBottom: '25px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#4a5568', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>Evaluator Feedback</h4>
                                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', color: '#2d3748', lineHeight: '1.7', fontSize: '15px', borderLeft: '4px solid #4299e1' }}>
                                            {selectedEvaluation.comments || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No written feedback provided.</span>}
                                        </div>
                                    </div>

                                    {/* Score Summary */}
                                    <div style={{ marginBottom: '25px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#4a5568', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>Score Summary</h4>
                                        <div style={{ background: '#fff', padding: '0', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
                                            {[
                                                { key: 'area1', label: 'Competence & Dependability', max: 30 },
                                                { key: 'area2', label: 'Work Quality', max: 30 },
                                                { key: 'area3', label: 'Communication & Teamwork', max: 20 },
                                                { key: 'area4', label: 'Initiative & Problem Solving', max: 20 }
                                            ].map((area, idx) => {
                                                const areaScores = selectedEvaluation.criteria_scores?.[area.key] || {};
                                                const total = Object.values(areaScores).reduce((a, b) => a + b, 0);
                                                return (
                                                    <div key={area.key} style={{
                                                        display: 'flex', justifyContent: 'space-between', padding: '12px 20px',
                                                        borderBottom: '1px solid #edf2f7', background: idx % 2 === 0 ? '#fafbfc' : 'white'
                                                    }}>
                                                        <span style={{ color: '#4a5568', fontSize: '14px' }}>{area.label}</span>
                                                        <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{total} <span style={{ color: '#a0aec0', fontWeight: 'normal', fontSize: '12px' }}>/ {area.max}</span></span>
                                                    </div>
                                                );
                                            })}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#ebf8ff', borderTop: '1px solid #bee3f8' }}>
                                                <span style={{ fontWeight: 'bold', color: '#2c5282' }}>Total Score</span>
                                                <span style={{ fontWeight: 'bold', color: '#2b6cb0', fontSize: '18px' }}>
                                                    {selectedEvaluation.total_score} <span style={{ color: '#63b3ed', fontWeight: 'normal', fontSize: '14px' }}>/ 100</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedEvaluation.strengths || selectedEvaluation.areas_for_improvement) && (
                                        <div style={{ display: 'grid', gap: '15px' }}>
                                            {selectedEvaluation.strengths && (
                                                <div style={{ background: '#F0FFF4', padding: '15px', borderRadius: '10px', border: '1px solid #C6F6D5' }}>
                                                    <div style={{ color: '#2F855A', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>✨ Key Strengths</div>
                                                    <div style={{ color: '#276749', fontSize: '14px' }}>{selectedEvaluation.strengths}</div>
                                                </div>
                                            )}
                                            {selectedEvaluation.areas_for_improvement && (
                                                <div style={{ background: '#FFF5F5', padding: '15px', borderRadius: '10px', border: '1px solid #FED7D7' }}>
                                                    <div style={{ color: '#C53030', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>📈 Areas to Improve</div>
                                                    <div style={{ color: '#9B2C2C', fontSize: '14px' }}>{selectedEvaluation.areas_for_improvement}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* --- AI INFO MODAL --- */}
                {showAiInfoModal && (
                    <div className="modal-overlay" onClick={() => setShowAiInfoModal(false)} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                    }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                            background: 'white', padding: '30px', borderRadius: '20px',
                            width: '500px', maxWidth: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: '64px', height: '64px', borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', margin: '0 auto 15px auto', boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)'
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10h-10V2z" /><path d="M12 12 2.3 2.3" /></svg>
                                </div>
                                <h3 style={{ margin: '0', fontSize: '22px', color: '#1a202c' }}>How AI Analysis Works</h3>
                                <p style={{ color: '#718096', margin: '10px 0 0 0' }}>Powered by Google Gemini AI Engine</p>
                            </div>

                            <div style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '15px' }}>
                                <p>Our intelligent system analyzes the qualitative feedback written by your supervisors across all your evaluations to provide you with a personalized dashboard summary.</p>

                                <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '12px', margin: '20px 0' }}>
                                    <ul style={{ margin: 0, paddingLeft: '20px', gap: '10px', display: 'grid' }}>
                                        <li><strong>Identify Strengths:</strong> Finds recurring positive patterns in your performance.</li>
                                        <li><strong>Target Growth:</strong> Pinpoints specific skills or habits that need attention.</li>
                                        <li><strong>Actionable Tips:</strong> Generates concrete advice to help you excel in your next tasks.</li>
                                    </ul>
                                </div>

                                <p style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic', textAlign: 'center' }}>
                                    This analysis is private and visible only to you to help your professional growth.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowAiInfoModal(false)}
                                style={{
                                    width: '100%', padding: '14px', background: '#3182ce', color: 'white',
                                    border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px',
                                    cursor: 'pointer', marginTop: '20px', transition: 'background 0.2s'
                                }}
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentFeedback;
