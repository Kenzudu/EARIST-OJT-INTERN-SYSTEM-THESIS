import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import earistLogo from './earist-logo.png';
import './AdminDashboard.css';
import CoordinatorHeader from './CoordinatorHeader';

// Evaluation Criteria Structure (Same as Public Form)
const evaluationCriteria = {
    area1: { title: "AREA 1: COMPETENCE AND DEPENDABILITY", weight: 0.30, maxPoints: 30, criteria: [{ id: 'quality_assigned', label: 'Quality of work (performs an assigned job efficiently as possible)', max: 5 }, { id: 'quality_additional', label: 'Quality of work (can cope with the demand of additional unexpected work load in a limited time)', max: 5 }, { id: 'application_knowledge', label: 'Application of acquired knowledge & skill', max: 5 }, { id: 'use_tools', label: 'Use of tools and equipment', max: 5 }, { id: 'care_materials', label: 'Care of materials and supplies', max: 5 }, { id: 'knowledge_vocabulary', label: 'Knowledge of the vocabulary related to the job', max: 5 }] },
    area2: { title: "AREA 2: ACCURACY & WORK HABITS", weight: 0.25, maxPoints: 25, criteria: [{ id: 'reliability', label: 'Reliability', max: 5 }, { id: 'initiative', label: 'Initiative', max: 5 }, { id: 'self_dependence', label: 'Self-dependence', max: 5 }, { id: 'attendance', label: 'Attendance and punctuality', max: 5 }, { id: 'follow_direction', label: 'Ability to follow direction', max: 5 }] },
    area3: { title: "AREA 3: INTEREST / COOPERATION", weight: 0.25, maxPoints: 25, criteria: [{ id: 'work_together', label: 'Ability to work together with other people', max: 5 }, { id: 'control_emotions', label: 'Ability to control one\'s emotions (self-control)', max: 5 }, { id: 'self_confidence', label: 'Demonstrate self-confidence appropriate for the job', max: 5 }, { id: 'follow_directions', label: 'Willingness to follow directions or instructions', max: 5 }, { id: 'adjust_problems', label: 'Ability to adjust to new problems and changing situations', max: 5 }] },
    area4: { title: "AREA 4: PERSONALITY / INTERPERSONAL RELATIONSHIP", weight: 0.20, maxPoints: 20, criteria: [{ id: 'handle_issues', label: 'Ability to handle issues and constructive criticism', max: 5 }, { id: 'personality_character', label: 'Personality and character', max: 5 }, { id: 'human_relations', label: 'Human and public relations', max: 5 }, { id: 'grooming', label: 'Grooming / Dress Code', max: 5 }] }
};

const calculateGrade = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 97) return '1.0'; if (numScore >= 94) return '1.25'; if (numScore >= 91) return '1.5'; if (numScore >= 88) return '1.75';
    if (numScore >= 85) return '2.0'; if (numScore >= 82) return '2.25'; if (numScore >= 79) return '2.5'; if (numScore >= 76) return '2.75';
    if (numScore >= 73) return '3.0'; if (numScore >= 72) return '3.0'; return '5.0';
};

function CoordinatorMonitoring() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [filterCourse, setFilterCourse] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail Modal
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);

    const baseURL = 'http://localhost:8000/api';

    useEffect(() => {
        checkCoordinatorAccess();
        fetchData();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator' && userRole !== 'admin') {
            setError('Access denied. Coordinators only.');
            setTimeout(() => navigate('/student/dashboard'), 1000);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const studentsRes = await axios.get(`${baseURL}/coordinator/users/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const companiesRes = await axios.get(`${baseURL}/companies/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const studentData = await Promise.all(
                studentsRes.data.map(async (student) => {
                    try {
                        const profileRes = await axios.get(`${baseURL}/users/${student.id}/`, {
                            headers: { Authorization: `Token ${token}` }
                        });

                        const progressRes = await axios.get(`${baseURL}/progress/${student.id}/`, {
                            headers: { Authorization: `Token ${token}` }
                        }).catch(() => ({ data: null }));

                        return {
                            ...student,
                            student_profile: profileRes.data.profile || {},
                            progress: progressRes.data
                        };
                    } catch (err) {
                        return {
                            ...student,
                            student_profile: {},
                            progress: null
                        };
                    }
                })
            );

            setStudents(studentData);
            setCompanies(companiesRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetails = async (studentId) => {
        try {
            const token = localStorage.getItem('token');

            const attendanceRes = await axios.get(`${baseURL}/attendance/?student=${studentId}`, {
                headers: { Authorization: `Token ${token}` }
            });

            const journalsRes = await axios.get(`${baseURL}/journals/?student=${studentId}`, {
                headers: { Authorization: `Token ${token}` }
            });

            setAttendanceLogs(attendanceRes.data.results || attendanceRes.data || []);
            setJournalEntries(journalsRes.data.results || journalsRes.data || []);
        } catch (err) {
            console.error('Error fetching student details:', err);
        }
    };

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setShowDetailModal(true);
        fetchStudentDetails(student.id);
    };

    const getInternshipStatus = (student) => {
        if (!student.progress) return 'Not Started';
        if (student.progress.overall_progress >= 100) return 'Completed';
        if (student.progress.overall_progress > 0) return 'Active';
        return 'Not Started';
    };

    const getCompanyName = (student) => {
        return student.progress?.company_name || '—';
    };

    const filteredStudents = students.filter(student => {
        const profile = student.student_profile || {};
        const status = getInternshipStatus(student);
        const companyName = getCompanyName(student);

        if (filterCourse && profile.course !== filterCourse) return false;
        if (filterCompany && companyName !== filterCompany) return false;
        if (filterStatus && status !== filterStatus) return false;

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
            const studentId = profile.student_id?.toLowerCase() || '';
            if (!fullName.includes(searchLower) && !studentId.includes(searchLower)) {
                return false;
            }
        }

        return true;
    });

    const uniqueCourses = [...new Set(students.map(s => s.student_profile?.course).filter(Boolean))];
    const uniqueCompanies = [...new Set(students.map(s => getCompanyName(s)).filter(c => c !== '—'))];

    const generateEvaluationPDF = (student, evalItem) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let yPosition = 15;
        const logoWidth = 80; const logoHeight = 80;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = (pageHeight - logoHeight) / 2;

        const addWatermark = () => {
            doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
        };
        addWatermark();

        // Header
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF', pageWidth / 2, yPosition, { align: 'center' }); yPosition += 5;
        doc.text('SCIENCE AND TECHNOLOGY', pageWidth / 2, yPosition, { align: 'center' }); yPosition += 5;
        doc.setFontSize(10);
        doc.text('STUDENT PERFORMANCE EVALUATION FORM', pageWidth / 2, yPosition, { align: 'center' }); yPosition += 10;

        // Info Box
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`Name of Student: ${student.first_name} ${student.last_name}`, 14, yPosition); yPosition += 4;
        doc.text(`Student ID: ${student.student_profile?.student_id || 'N/A'}`, 14, yPosition);
        doc.text(doc.splitTextToSize(`Course: ${student.student_profile?.course || 'N/A'}`, 100), 110, yPosition); yPosition += 4;

        doc.text(doc.splitTextToSize(`Company: ${student.progress?.company_name || 'N/A'}`, pageWidth - 28), 14, yPosition); yPosition += 4;

        if (evalItem.evaluation_period_start && evalItem.evaluation_period_end) {
            doc.text(`Evaluation Period: ${new Date(evalItem.evaluation_period_start).toLocaleDateString()} - ${new Date(evalItem.evaluation_period_end).toLocaleDateString()}`, 14, yPosition);
            yPosition += 4;
        }

        doc.text(`Evaluated by: ${evalItem.supervisor_name || 'N/A'}`, 14, yPosition); yPosition += 4;
        doc.text(`Email: ${evalItem.supervisor_email || 'N/A'}`, 14, yPosition); yPosition += 4;
        doc.text(`Hours Rendered: ${evalItem.hours_rendered || 'N/A'}`, 14, yPosition); yPosition += 6;

        // Instructions
        doc.setFontSize(8); doc.setFont('helvetica', 'italic');
        doc.text('Instructions: Rate the student on each criterion. Scores are marked with [X].', 14, yPosition); yPosition += 6;

        // Criteria Box Loop
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);

        Object.keys(evaluationCriteria).forEach((area) => {
            const areaData = evaluationCriteria[area];
            if (yPosition > 240) { doc.addPage(); addWatermark(); yPosition = 20; }

            // Area Title with Shading
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPosition - 4, pageWidth - 28, 7, 'F');
            doc.text(areaData.title, 16, yPosition);
            yPosition += 8;

            doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

            areaData.criteria.forEach(crit => {
                const score = evalItem.criteria_scores?.[area]?.[crit.id] ? parseInt(evalItem.criteria_scores[area][crit.id]) : 0;

                if (yPosition > 250) { doc.addPage(); addWatermark(); yPosition = 20; }

                const labelText = doc.splitTextToSize(crit.label, 90);
                doc.text(labelText, 16, yPosition);
                const labelHeight = labelText.length * 4;

                // Draw Boxes
                let xPos = pageWidth - 48;
                const boxYPos = yPosition - 2.5;
                for (let i = 0; i <= 5; i++) {
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

                // Show Score Text
                doc.setFont('helvetica', 'bold');
                doc.text(`${score}/${crit.max}`, pageWidth - 14, yPosition, { align: 'right' });
                doc.setFont('helvetica', 'normal');

                yPosition += Math.max(labelHeight + 1, 5);
            });

            // Area Total
            const total = evalItem.criteria_scores?.[area] ? Object.values(evalItem.criteria_scores[area]).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
            doc.text(`Area Total: ${total}/${areaData.maxPoints} (Weight: ${(areaData.weight * 100)}%)`, 16, yPosition); yPosition += 8;
            doc.setFont('helvetica', 'normal');
        });

        // Summary Section
        if (yPosition > 220) { doc.addPage(); addWatermark(); yPosition = 20; }
        yPosition += 5;
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY (Total of Scores)', 14, yPosition); yPosition += 7;

        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        Object.keys(evaluationCriteria).forEach((area) => {
            const areaData = evaluationCriteria[area];
            const areaTotal = evalItem.criteria_scores?.[area] ? Object.values(evalItem.criteria_scores[area]).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
            const areaName = areaData.title.replace('AREA ', 'Area ').split(':')[0];

            doc.text(`${areaName} (${areaData.maxPoints} pts)`, 16, yPosition);
            doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
            doc.text(areaTotal.toString(), pageWidth - 22, yPosition, { align: 'center' });
            yPosition += 7;
        });

        // Total
        doc.text('Total', 16, yPosition);
        doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
        doc.text((evalItem.total_score || 0).toString(), pageWidth - 22, yPosition, { align: 'center' });
        yPosition += 7;

        // Grade
        doc.setFont('helvetica', 'bold');
        doc.text('Grade Equivalent', 16, yPosition);
        doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
        doc.text(evalItem.grade || calculateGrade(evalItem.total_score), pageWidth - 22, yPosition, { align: 'center' });
        yPosition += 10;

        // Comments
        if (yPosition > pageHeight - 100) { doc.addPage(); addWatermark(); yPosition = 20; }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text('Comments / Suggestions:', 14, yPosition); yPosition += 5;

        if (evalItem.comments) {
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            const splitComments = doc.splitTextToSize(evalItem.comments, pageWidth - 28);
            if (yPosition + (splitComments.length * 5) > pageHeight - 50) {
                doc.addPage(); addWatermark(); yPosition = 20;
                doc.text('Comments (continued):', 14, yPosition); yPosition += 5;
            }
            doc.text(splitComments, 14, yPosition);
            yPosition += (splitComments.length * 5) + 5;
        } else {
            yPosition += 10;
        }

        // Signature
        if (yPosition > pageHeight - 80) { doc.addPage(); addWatermark(); yPosition = 20; }
        yPosition += 10;
        doc.setFontSize(10); doc.text('Rated by:', 14, yPosition); yPosition += 15;

        const leftX = 30; const rightX = pageWidth / 2 + 20; const lineWidth = 85;

        if (evalItem.supervisor_signature) {
            try {
                doc.addImage(evalItem.supervisor_signature, 'PNG', leftX + 2, yPosition - 25, 75, 18);
            } catch (e) { }
        }

        doc.setLineWidth(0.5);
        doc.line(leftX, yPosition, leftX + lineWidth, yPosition);
        doc.line(rightX, yPosition, rightX + lineWidth, yPosition);

        yPosition += 4;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        if (evalItem.supervisor_name) {
            doc.text(evalItem.supervisor_name, leftX + (lineWidth / 2), yPosition - 5, { align: 'center' });
        }

        doc.setFontSize(8); doc.setFont('helvetica', 'italic');
        doc.text('Signature over printed name', leftX + (lineWidth / 2), yPosition, { align: 'center' });
        doc.text('Position / Date', rightX + (lineWidth / 2), yPosition, { align: 'center' });

        yPosition += 1;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        const dateStr = new Date(evalItem.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        doc.text(`${evalItem.supervisor_position || ''} / ${dateStr}`, rightX + (lineWidth / 2), yPosition - 5, { align: 'center' });

        doc.save(`${student.last_name}_Evaluation_${new Date(evalItem.submitted_at).toISOString().split('T')[0]}.pdf`);
    };

    const generateMonitoringReport = (data) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPosition = 15;
        const logoWidth = 20; const logoHeight = 20;
        doc.addImage(earistLogo, 'PNG', 14, 10, logoWidth, logoHeight);

        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('Student Evaluation Summary', 40, 20);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 26);
        yPosition += 20;

        // Table Header
        const headers = ['Student Name', 'ID', 'Area 1', 'Area 2', 'Area 3', 'Area 4', 'Grade'];
        const colWidths = [50, 30, 20, 20, 20, 20, 20];
        let xPos = 14;

        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);

        headers.forEach((header, i) => {
            doc.text(header, xPos, yPosition);
            xPos += colWidths[i];
        });
        yPosition += 8;

        // Rows
        doc.setFont('helvetica', 'normal');
        data.forEach((student, index) => {
            if (yPosition > 270) { doc.addPage(); yPosition = 20; }

            const evaluations = student.progress?.evaluations || [];
            const latestEval = evaluations.length > 0
                ? [...evaluations].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]
                : null;

            const getScore = (area) => latestEval?.criteria_scores?.[area]
                ? Object.values(latestEval.criteria_scores[area]).reduce((a, b) => a + (Number(b) || 0), 0)
                : 0;

            const rowData = [
                `${student.first_name} ${student.last_name}`,
                student.student_profile?.student_id || '-',
                latestEval ? `${getScore('area1')}/30` : '-',
                latestEval ? `${getScore('area2')}/25` : '-',
                latestEval ? `${getScore('area3')}/25` : '-',
                latestEval ? `${getScore('area4')}/20` : '-',
                latestEval ? (latestEval.grade || 'N/A') : '-'
            ];

            xPos = 14;
            rowData.forEach((text, i) => {
                let cellText = text;
                // Simple truncation
                if (i === 0 && text.length > 25) cellText = text.substring(0, 23) + '...';
                doc.text(cellText.toString(), xPos, yPosition);
                xPos += colWidths[i];
            });
            yPosition += 7;

            doc.setDrawColor(230);
            doc.line(14, yPosition - 4, pageWidth - 14, yPosition - 4);
        });

        doc.save(`Student_Evaluation_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateStudentSummaryPDF = (student) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPosition = 20;

        doc.addImage(earistLogo, 'PNG', pageWidth - 30, 10, 20, 20);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text('Student Monitoring Report', 14, yPosition); yPosition += 10;

        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${student.first_name} ${student.last_name}`, 14, yPosition); yPosition += 6;
        doc.text(`ID: ${student.student_profile?.student_id || 'N/A'}`, 14, yPosition); yPosition += 6;
        doc.text(`Course: ${student.student_profile?.course || 'N/A'}`, 14, yPosition); yPosition += 6;
        doc.text(`Company: ${student.progress?.company_name || 'N/A'}`, 14, yPosition); yPosition += 10;

        // Progress
        doc.setFont('helvetica', 'bold'); doc.text('Progress Overview', 14, yPosition); yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Hours Rendered: ${student.progress?.total_hours_rendered || 0} / ${student.progress?.required_hours || 'N/A'}`, 14, yPosition); yPosition += 6;
        doc.text(`Progress: ${student.progress?.overall_progress || 0}%`, 14, yPosition); yPosition += 10;

        // Evaluations
        doc.setFont('helvetica', 'bold'); doc.text('Evaluations', 14, yPosition); yPosition += 6;
        doc.setFont('helvetica', 'normal');
        if (student.progress?.evaluations?.length > 0) {
            student.progress.evaluations.forEach(ev => {
                doc.text(`${new Date(ev.submitted_at).toLocaleDateString()} - Grade: ${ev.grade || 'N/A'} (Score: ${ev.total_score})`, 14, yPosition);
                yPosition += 6;
            });
        } else {
            doc.text('No evaluations recorded.', 14, yPosition); yPosition += 6;
        }
        yPosition += 5;

        // Journals
        doc.setFont('helvetica', 'bold'); doc.text('Journals', 14, yPosition); yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Entries: ${student.progress?.journal_entries_count || 0}`, 14, yPosition);

        doc.save(`${student.last_name}_Monitoring_Report.pdf`);
    };

    if (loading) {
        return (
            <div className="admin-dashboard-container">
                <div className="admin-dashboard-main">
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>Loading monitoring data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <CoordinatorHeader
                    title="Student Monitoring and Evaluation"
                    subtitle="Real-time view of students' performance, evaluations, and grades"
                />

                {error && <div className="error-banner">{error}</div>}

                {/* Filters */}
                <div className="filter-section" style={{
                    marginBottom: '20px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '1rem', color: '#333' }}>Filters</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}>
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Not Started">Not Started</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Search</label>
                            <input type="text" placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            {(filterStatus || searchQuery) && (
                                <button onClick={() => { setFilterStatus(''); setSearchQuery(''); }} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => generateMonitoringReport(filteredStudents)}
                            style={{ padding: '8px 16px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="Generate report for filtered students"
                        >
                            📄 Generate Report
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '15px', color: '#666', fontSize: '0.95rem' }}>
                    Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
                </div>

                {/* Monitoring Table */}
                <div className="table-responsive">
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Student Name</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Student ID</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Area 1</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Area 2</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Area 3</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Area 4</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Overall (Grade)</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Remaining</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Journals</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No students found matching the filters.</td></tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const profile = student.student_profile || {};
                                    const progress = student.progress || {};
                                    const status = getInternshipStatus(student);
                                    const hoursRendered = progress.total_hours_rendered || 0;
                                    const requiredHours = progress.required_hours || 200;
                                    const remaining = Math.max(0, requiredHours - hoursRendered);
                                    const journals = progress.journal_entries_count || 0;

                                    // Get Latest Evaluation
                                    const evaluations = progress.evaluations || [];
                                    const latestEval = evaluations.length > 0
                                        ? [...evaluations].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]
                                        : null;

                                    const getScore = (area) => latestEval?.criteria_scores?.[area]
                                        ? Object.values(latestEval.criteria_scores[area]).reduce((a, b) => a + (Number(b) || 0), 0)
                                        : 0;

                                    return (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}><strong>{student.first_name} {student.last_name}</strong></td>
                                            <td style={{ padding: '12px', color: '#666' }}>{profile.student_id || '—'}</td>

                                            {/* Area 1: Competence (30) */}
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{latestEval ? `${getScore('area1')}/30` : '-'}</td>
                                            {/* Area 2: Work Habits (25) */}
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{latestEval ? `${getScore('area2')}/25` : '-'}</td>
                                            {/* Area 3: Interest (25) */}
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{latestEval ? `${getScore('area3')}/25` : '-'}</td>
                                            {/* Area 4: Personality (20) */}
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{latestEval ? `${getScore('area4')}/20` : '-'}</td>

                                            {/* Overall Grade */}
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7c3aed' }}>
                                                {latestEval ? (latestEval.grade || 'N/A') : '-'}
                                            </td>

                                            <td style={{ padding: '12px', textAlign: 'center', color: remaining > 50 ? '#dc3545' : '#28a745' }}>{remaining.toFixed(1)} hrs</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{journals}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', display: 'inline-block', backgroundColor: status === 'Completed' ? '#d4edda' : status === 'Active' ? '#fff3cd' : '#f8d7da', color: status === 'Completed' ? '#155724' : status === 'Active' ? '#856404' : '#721c24' }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button onClick={() => handleViewDetails(student)} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,123,255,0.2)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#0056b3'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 8px rgba(0,123,255,0.3)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#007bff'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(0,123,255,0.2)'; }}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Enhanced Detail Modal */}
                {showDetailModal && selectedStudent && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowDetailModal(false)}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '0', maxWidth: '950px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e5e7eb' }} onClick={(e) => e.stopPropagation()}>
                            {/* Gradient Header */}
                            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 30px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '600' }}>{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                                    <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Student ID: {selectedStudent.student_profile?.student_id || 'N/A'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowDetailModal(false)} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', fontSize: '1.5rem', cursor: 'pointer', color: 'white', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; e.target.style.transform = 'rotate(90deg)'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'rotate(0deg)'; }}>×</button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '30px' }}>
                                {/* Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(102,126,234,0.3)' }}>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>Course</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedStudent.student_profile?.course || 'N/A'}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(240,147,251,0.3)' }}>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>Progress</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedStudent.progress?.overall_progress || 0}%</div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(79,172,254,0.3)' }}>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>Hours</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedStudent.progress?.total_hours_rendered || 0} / {selectedStudent.progress?.required_hours || 200}</div>
                                    </div>
                                </div>

                                {/* Attendance Logs */}
                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
                                        <span style={{ fontSize: '1.5rem' }}></span>
                                        <h3 style={{ color: '#1f2937', fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>Attendance Logs</h3>
                                    </div>
                                    {attendanceLogs.length > 0 ? (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'transparent' }}>
                                                        <th style={{ padding: '10px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '0.85rem' }}>DATE</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '0.85rem' }}>TIME IN</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '0.85rem' }}>TIME OUT</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '0.85rem' }}>HOURS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceLogs.map((log, idx) => (
                                                        <tr key={idx} style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                                                            <td style={{ padding: '12px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', fontWeight: '500' }}>{log.date}</td>
                                                            <td style={{ padding: '12px', color: '#059669' }}>{log.time_in || '—'}</td>
                                                            <td style={{ padding: '12px', color: '#dc2626' }}>{log.time_out || '—'}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#667eea', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>{log.hours_rendered || 0} hrs</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
                                            <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}> No attendance logs found.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Journal Entries */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
                                        <span style={{ fontSize: '1.5rem' }}></span>
                                        <h3 style={{ color: '#1f2937', fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>Recent Journal Entries</h3>
                                    </div>
                                    {journalEntries.length > 0 ? (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {journalEntries.slice(0, 10).map((journal, idx) => (
                                                <div key={idx} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#667eea', marginBottom: '8px', fontWeight: '600' }}>{journal.date}</div>
                                                    <div style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.5' }}>{journal.activities || journal.content || 'No content'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
                                            <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}> No journal entries found.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Performance Evaluation */}
                                <div style={{ marginTop: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
                                        <span style={{ fontSize: '1.5rem' }}></span>
                                        <h3 style={{ color: '#1f2937', fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>Performance Evaluations</h3>
                                    </div>
                                    {selectedStudent.progress?.evaluations && selectedStudent.progress.evaluations.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '15px' }}>
                                            {selectedStudent.progress.evaluations.map((evalItem, idx) => (
                                                <div key={idx} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.9rem', color: '#6b7280', display: 'block' }}>Evaluation Date</span>
                                                            <strong style={{ color: '#1f2937' }}>{new Date(evalItem.submitted_at).toLocaleDateString()}</strong>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <span style={{ fontSize: '0.9rem', color: '#6b7280', display: 'block' }}>Overall Rating (Grade)</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                                                <strong style={{ fontSize: '1.2rem', color: '#7c3aed' }}>{evalItem.grade || evalItem.total_score || 'N/A'}</strong>
                                                                <button
                                                                    onClick={() => generateEvaluationPDF(selectedStudent, evalItem)}
                                                                    style={{ padding: '4px 10px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
                                                                    title="Download evaluation copy"
                                                                >
                                                                    ⬇ PDF
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                                                        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Area 1: Competence</div>
                                                            <div style={{ fontWeight: '600', color: '#374151' }}>
                                                                {evalItem.criteria_scores?.area1 ? Object.values(evalItem.criteria_scores.area1).reduce((a, b) => a + (Number(b) || 0), 0) : 0}/30
                                                            </div>
                                                        </div>
                                                        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Area 2: Work Habits</div>
                                                            <div style={{ fontWeight: '600', color: '#374151' }}>
                                                                {evalItem.criteria_scores?.area2 ? Object.values(evalItem.criteria_scores.area2).reduce((a, b) => a + (Number(b) || 0), 0) : 0}/25
                                                            </div>
                                                        </div>
                                                        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Area 3: Interest</div>
                                                            <div style={{ fontWeight: '600', color: '#374151' }}>
                                                                {evalItem.criteria_scores?.area3 ? Object.values(evalItem.criteria_scores.area3).reduce((a, b) => a + (Number(b) || 0), 0) : 0}/25
                                                            </div>
                                                        </div>
                                                        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Area 4: Personality</div>
                                                            <div style={{ fontWeight: '600', color: '#374151' }}>
                                                                {evalItem.criteria_scores?.area4 ? Object.values(evalItem.criteria_scores.area4).reduce((a, b) => a + (Number(b) || 0), 0) : 0}/20
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {evalItem.comments && (
                                                        <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fdf2f8', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: '600', marginBottom: '4px' }}>Supervisor Comments</div>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#831843', fontStyle: 'italic' }}>"{evalItem.comments}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
                                            <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}> No performance evaluations submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CoordinatorMonitoring;
