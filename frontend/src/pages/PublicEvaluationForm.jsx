import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import './PublicEvaluationForm.css';
import earistLogo from './earist-logo.png';

const PublicEvaluationForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEvaluation, setSubmittedEvaluation] = useState(null);

  const [formData, setFormData] = useState({
    supervisor_name: '',
    supervisor_email: '',
    supervisor_position: '',
    supervisor_signature: '',
    evaluation_period_start: '',
    evaluation_period_end: '',
    hours_rendered: '',
    comments: '',
    criteria_scores: {
      area1: {}, // Competence and Dependability
      area2: {}, // Accuracy & Work Habits
      area3: {}, // Interest / Cooperation
      area4: {}  // Personality / Interpersonal Relationship
    }
  });

  // Evaluation Criteria Structure (Based on Official EARIST Form)
  // Rating Scale: 5-Excellent, 4-Very Good, 3-Good, 2-Poor, 1-Needs Improvement
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

  useEffect(() => {
    fetchStudentProfile();
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, []);

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

  // Signature Canvas Functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');

    setIsDrawing(true);
    ctx.beginPath();

    if (e.type === 'mousedown') {
      ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    } else if (e.type === 'touchstart') {
      // Prevent default to stop scrolling
      // but 'touch-action: none' in CSS handles most of it.
      // We check if cancelable to avoid console warnings
      if (e.cancelable) e.preventDefault();

      const touch = e.touches[0];
      ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');

    if (e.type === 'mousemove') {
      ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      ctx.stroke();
    } else if (e.type === 'touchmove') {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const signatureImage = canvas.toDataURL('image/png');
      setSignatureData(signatureImage);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScoreChange = (area, criteriaId, value, maxLimit = 5) => {
    // Allow empty string to let user clear the field
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        criteria_scores: {
          ...prev.criteria_scores,
          [area]: {
            ...prev.criteria_scores[area],
            [criteriaId]: ''
          }
        }
      }));
      return;
    }

    // Parse and clamp value between 0 and maxLimit
    const score = Math.min(Math.max(parseFloat(value) || 0, 0), maxLimit);

    setFormData(prev => ({
      ...prev,
      criteria_scores: {
        ...prev.criteria_scores,
        [area]: {
          ...prev.criteria_scores[area],
          [criteriaId]: score
        }
      }
    }));
  };

  const calculateAreaTotal = (area) => {
    const scores = formData.criteria_scores[area];
    return Object.values(scores).reduce((sum, score) => sum + (parseFloat(score) || 0), 0);
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.keys(evaluationCriteria).forEach(area => {
      total += calculateAreaTotal(area);
    });
    return total.toFixed(2);
  };

  const calculateGrade = (score) => {
    const numScore = parseFloat(score);
    // Official EARIST Grade Equivalent Table
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
    return '5.0'; // Below 72 = Failed
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not specified';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const generatePDF = () => {
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
    doc.text('Name of Student: ' + studentData.student_name, 14, yPosition);
    yPosition += 4;
    doc.text('Student ID: ' + studentData.student_id, 14, yPosition);
    const courseText = doc.splitTextToSize('Course: ' + studentData.course, 80);
    doc.text(courseText, 110, yPosition);
    yPosition += 4;
    if (studentData.position && studentData.company_name) {
      const posText = doc.splitTextToSize('Position: ' + studentData.position, pageWidth - 28);
      doc.text(posText, 14, yPosition);
      yPosition += 4;
      const compText = doc.splitTextToSize('Company: ' + studentData.company_name, pageWidth - 28);
      doc.text(compText, 14, yPosition);
      yPosition += 4;
    }
    if (studentData.start_date && studentData.end_date) {
      doc.text('Internship Period: ' + formatDate(studentData.start_date) + ' - ' + formatDate(studentData.end_date), 14, yPosition);
      yPosition += 4;
    }

    yPosition += 2;
    doc.text('Evaluated by: ' + submittedEvaluation.supervisor_name, 14, yPosition);
    yPosition += 4;
    doc.text('Email: ' + submittedEvaluation.supervisor_email, 14, yPosition);
    yPosition += 4;
    doc.text('Evaluation Period: ' + formatDate(submittedEvaluation.evaluation_period_start) + ' - ' + formatDate(submittedEvaluation.evaluation_period_end), 14, yPosition);
    yPosition += 4;
    doc.text('Hours Rendered: ' + (submittedEvaluation.hours_rendered || 'N/A'), 14, yPosition);
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
        const score = parseInt(submittedEvaluation.criteria_scores[area][criterion.id]) || 0;
        const maxScore = criterion.max;

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Criterion label - wrap at 90 units to prevent collision with boxes
        const labelText = doc.splitTextToSize(criterion.label, 90);
        doc.text(labelText, 16, yPosition);
        const labelHeight = labelText.length * 4;

        // Score boxes - positioned to the right, aligned with first line of label
        let xPos = pageWidth - 48;
        const boxYPos = yPosition - 2.5;
        for (let i = 0; i <= maxScore; i++) {
          doc.rect(xPos, boxYPos, 3.5, 3.5);
          if (i === score) {
            // Fill the box for the selected score
            doc.setFillColor(0, 0, 0);
            doc.rect(xPos, boxYPos, 3.5, 3.5, 'F');
          }
          doc.setFontSize(5);
          doc.text(i.toString(), xPos + 0.8, boxYPos + 2.5);
          doc.setFontSize(7);
          xPos += 4;
        }

        // Show score / max on the first line
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`${score}/${maxScore}`, pageWidth - 14, yPosition, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        yPosition += Math.max(labelHeight + 1, 5);
      });

      // Area Total
      const areaTotal = Object.values(submittedEvaluation.criteria_scores[area]).reduce((sum, s) => sum + parseFloat(s), 0);
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
      const areaTotal = Object.values(submittedEvaluation.criteria_scores[area]).reduce((sum, s) => sum + parseFloat(s), 0);
      const areaName = areaData.title.replace('AREA ', 'Area ').split(':')[0];

      doc.text(`${areaName} (${areaData.maxPoints} pts)`, 16, yPosition);
      doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
      doc.text(areaTotal.toString(), pageWidth - 22, yPosition, { align: 'center' });
      yPosition += 7;
    });

    // Total and Grade Equivalent
    doc.text('Total', 16, yPosition);
    doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
    doc.text(submittedEvaluation.total_score, pageWidth - 22, yPosition, { align: 'center' });
    yPosition += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Grade Equivalent', 16, yPosition);
    doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
    doc.text(calculateGrade(submittedEvaluation.total_score), pageWidth - 22, yPosition, { align: 'center' });
    yPosition += 10;

    // Check if we need a new page before comments - more conservative check
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 15;
      // Add watermark to new page
      doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
    }

    // Comments/Suggestions Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Comments / Suggestions:', 14, yPosition);
    yPosition += 5;

    if (submittedEvaluation.comments) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitComments = doc.splitTextToSize(submittedEvaluation.comments, pageWidth - 28);

      // Check if comments would overflow the page - more conservative
      const commentsHeight = splitComments.length * 5;
      if (yPosition + commentsHeight > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
        // Add watermark to new page
        doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
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

    // Check if we need a new page for signature - more conservative
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 15;
      // Add watermark to new page
      doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
    }

    // Rated by label
    yPosition += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rated by:', 14, yPosition);
    yPosition += 15;

    // Signature section positioning
    const leftX = 30;
    const rightX = pageWidth / 2 + 20;
    const lineWidth = 85;

    // Add e-signature image above the left line
    if (submittedEvaluation.supervisor_signature) {
      try {
        doc.addImage(submittedEvaluation.supervisor_signature, 'PNG', leftX + 2, yPosition - 25, 75, 18);
      } catch (e) {
        console.error('Failed to add signature image to generatePDF', e);
      }
    }

    // Draw signature lines
    doc.setLineWidth(0.5);
    doc.line(leftX, yPosition, leftX + lineWidth, yPosition);
    doc.line(rightX, yPosition, rightX + lineWidth, yPosition);

    yPosition += 1;

    // Add supervisor name above the line label (centered in signature area)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (submittedEvaluation.supervisor_name) {
      doc.text(submittedEvaluation.supervisor_name, leftX + (lineWidth / 2), yPosition, { align: 'center' });
    }

    yPosition += 4;

    // Labels under lines
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature over printed name', leftX + (lineWidth / 2), yPosition, { align: 'center' });
    doc.text('Position / Date', rightX + (lineWidth / 2), yPosition, { align: 'center' });

    yPosition += 1;

    // Add position/date on the right side
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const evalDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const positionDate = `${submittedEvaluation.supervisor_position || ''} / ${evalDate}`;
    doc.text(positionDate, rightX + (lineWidth / 2), yPosition - 4, { align: 'center' });

    // Footer
    yPosition = pageHeight - 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save PDF with format: STUDENTNAME_EVAL_DATE
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
    const fileName = `${studentData.student_name.replace(/\s+/g, '_')}_EVAL_${dateStr}.pdf`;
    doc.save(fileName);
  };

  const printPDF = () => {
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
    yPosition += 5;
    doc.text('SCIENCE AND TECHNOLOGY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(10);
    doc.text('STUDENT PERFORMANCE EVALUATION FORM', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Student Information Box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Name of Student: ' + studentData.student_name, 14, yPosition);
    yPosition += 4;
    doc.text('Student ID: ' + studentData.student_id, 14, yPosition);
    const courseText = doc.splitTextToSize('Course: ' + studentData.course, 80);
    doc.text(courseText, 110, yPosition);
    yPosition += 4;
    if (studentData.position && studentData.company_name) {
      const posText = doc.splitTextToSize('Position: ' + studentData.position, pageWidth - 28);
      doc.text(posText, 14, yPosition);
      yPosition += 4;
      const compText = doc.splitTextToSize('Company: ' + studentData.company_name, pageWidth - 28);
      doc.text(compText, 14, yPosition);
      yPosition += 4;
    }
    if (studentData.start_date && studentData.end_date) {
      doc.text('Internship Period: ' + formatDate(studentData.start_date) + ' - ' + formatDate(studentData.end_date), 14, yPosition);
      yPosition += 4;
    }

    yPosition += 2;
    doc.text('Evaluated by: ' + submittedEvaluation.supervisor_name, 14, yPosition);
    yPosition += 4;
    doc.text('Email: ' + submittedEvaluation.supervisor_email, 14, yPosition);
    yPosition += 4;
    doc.text('Evaluation Period: ' + formatDate(submittedEvaluation.evaluation_period_start) + ' - ' + formatDate(submittedEvaluation.evaluation_period_end), 14, yPosition);
    yPosition += 4;
    doc.text('Hours Rendered: ' + (submittedEvaluation.hours_rendered || 'N/A'), 14, yPosition);
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
        const score = parseInt(submittedEvaluation.criteria_scores[area][criterion.id]) || 0;
        const maxScore = criterion.max;

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Criterion label - wrap at 90 units to prevent collision with boxes
        const labelText = doc.splitTextToSize(criterion.label, 90);
        doc.text(labelText, 16, yPosition);
        const labelHeight = labelText.length * 4;

        // Score boxes - positioned to the right, aligned with first line of label
        let xPos = pageWidth - 48;
        const boxYPos = yPosition - 2.5;
        for (let i = 0; i <= maxScore; i++) {
          doc.rect(xPos, boxYPos, 3.5, 3.5);
          if (i === score) {
            // Fill the box for the selected score
            doc.setFillColor(0, 0, 0);
            doc.rect(xPos, boxYPos, 3.5, 3.5, 'F');
          }
          doc.setFontSize(5);
          doc.text(i.toString(), xPos + 0.8, boxYPos + 2.5);
          doc.setFontSize(7);
          xPos += 4;
        }

        // Show score / max on the first line
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`${score}/${maxScore}`, pageWidth - 14, yPosition, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        yPosition += Math.max(labelHeight + 1, 5);
      });

      // Area Total
      const areaTotal = Object.values(submittedEvaluation.criteria_scores[area]).reduce((sum, s) => sum + parseFloat(s), 0);
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
      const areaTotal = Object.values(submittedEvaluation.criteria_scores[area]).reduce((sum, s) => sum + parseFloat(s), 0);
      const areaName = areaData.title.replace('AREA ', 'Area ').split(':')[0];

      doc.text(`${areaName} (${areaData.maxPoints} pts)`, 16, yPosition);
      doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
      doc.text(areaTotal.toString(), pageWidth - 22, yPosition, { align: 'center' });
      yPosition += 7;
    });

    // Total and Grade Equivalent
    doc.text('Total', 16, yPosition);
    doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
    doc.text(submittedEvaluation.total_score, pageWidth - 22, yPosition, { align: 'center' });
    yPosition += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Grade Equivalent', 16, yPosition);
    doc.rect(pageWidth - 30, yPosition - 4, 16, 6);
    doc.text(calculateGrade(submittedEvaluation.total_score), pageWidth - 22, yPosition, { align: 'center' });
    yPosition += 10;

    // Check if we need a new page before comments - more conservative check
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 15;
      // Add watermark to new page
      doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
    }

    // Comments/Suggestions Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Comments / Suggestions:', 14, yPosition);
    yPosition += 5;

    if (submittedEvaluation.comments) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitComments = doc.splitTextToSize(submittedEvaluation.comments, pageWidth - 28);

      // Check if comments would overflow the page - more conservative
      const commentsHeight = splitComments.length * 5;
      if (yPosition + commentsHeight > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
        // Add watermark to new page
        doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
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

    // Check if we need a new page for signature - more conservative
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 15;
      // Add watermark to new page
      doc.addImage(earistLogo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'NONE', 0.1);
    }

    // Rated by label
    yPosition += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rated by:', 14, yPosition);
    yPosition += 15;

    // Signature section positioning
    const leftX = 30;
    const rightX = pageWidth / 2 + 20;
    const lineWidth = 85;

    // Add e-signature image above the left line
    if (submittedEvaluation.supervisor_signature) {
      try {
        doc.addImage(submittedEvaluation.supervisor_signature, 'PNG', leftX + 2, yPosition - 25, 75, 18);
      } catch (e) {
        console.error('Failed to add signature image to printPDF', e);
      }
    }

    // Draw signature lines
    doc.setLineWidth(0.5);
    doc.line(leftX, yPosition, leftX + lineWidth, yPosition);
    doc.line(rightX, yPosition, rightX + lineWidth, yPosition);

    yPosition += 1;

    // Add supervisor name above the line label (centered in signature area)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (submittedEvaluation.supervisor_name) {
      doc.text(submittedEvaluation.supervisor_name, leftX + (lineWidth / 2), yPosition, { align: 'center' });
    }

    yPosition += 4;

    // Labels under lines
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature over printed name', leftX + (lineWidth / 2), yPosition, { align: 'center' });
    doc.text('Position / Date', rightX + (lineWidth / 2), yPosition, { align: 'center' });

    yPosition += 1;

    // Add position/date on the right side
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const evalDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const positionDate = `${submittedEvaluation.supervisor_position || ''} / ${evalDate}`;
    doc.text(positionDate, rightX + (lineWidth / 2), yPosition - 4, { align: 'center' });

    // Footer
    yPosition = pageHeight - 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });

    // Open print dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.supervisor_name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.supervisor_email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.supervisor_email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!signatureData) {
      setError('Please provide your e-signature by drawing it');
      return;
    }

    if (!formData.evaluation_period_start || !formData.evaluation_period_end) {
      setError('Please select evaluation period dates');
      return;
    }

    if (!formData.hours_rendered) {
      setError('Please enter total hours rendered');
      return;
    }

    // Check if all scores are filled
    let allScoresFilled = true;
    Object.keys(evaluationCriteria).forEach(area => {
      evaluationCriteria[area].criteria.forEach(criterion => {
        if (!formData.criteria_scores[area][criterion.id]) {
          allScoresFilled = false;
        }
      });
    });

    if (!allScoresFilled) {
      setError('Please fill in all evaluation scores');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const totalScore = calculateTotalScore();

      const evaluationData = {
        supervisor_name: formData.supervisor_name,
        supervisor_email: formData.supervisor_email,
        supervisor_position: formData.supervisor_position,
        supervisor_signature: signatureData,
        evaluation_period_start: formData.evaluation_period_start,
        evaluation_period_end: formData.evaluation_period_end,
        hours_rendered: formData.hours_rendered,
        criteria_scores: formData.criteria_scores,
        total_score: totalScore,
        comments: formData.comments
      };

      const apiBaseURL = process.env.REACT_APP_API_URL || 'https://terminably-untensible-paulina.ngrok-free.dev/api';
      const response = await axios.post(`${apiBaseURL}/public/evaluate/${token}/`, evaluationData);

      // Store evaluation data with student info for PDF generation
      setSubmittedEvaluation({
        ...evaluationData,
        student_name: studentData.full_name,
        student_id: studentData.student_id,
        course: studentData.course
      });
      setSuccess(true);

      // Don't auto-redirect anymore, let user download PDF first

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit evaluation');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="evaluation-form-container">
        {/* Loading state handled by global loader or blank screen */}
      </div>
    );
  }

  if (success) {
    return (
      <div className="evaluation-form-container">
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <h2>Evaluation Submitted Successfully!</h2>
          <p>A copy has been sent to your email.</p>
          <p>You can also download or print a copy below:</p>

          <div className="pdf-actions">
            <button onClick={generatePDF} className="download-btn">
              <i className="fas fa-download"></i> Download PDF
            </button>
            <button onClick={printPDF} className="print-btn">
              <i className="fas fa-print"></i> Print Copy
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData || !studentData.has_active_internship) {
    return (
      <div className="evaluation-form-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Cannot Evaluate</h2>
          <p>This student does not have an active internship.</p>
          <button onClick={() => navigate(`/public/student/${token}`)}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const grade = calculateGrade(totalScore);

  return (
    <div className="evaluation-form-container">
      <div className="evaluation-form-card">
        <div className="form-header">
          <h1>Performance Evaluation</h1>
          <div className="student-info-section">
            <div className="student-info-badge">
              <div className="badge-header">
                <i className="fas fa-user-graduate"></i>
                <strong>{studentData.student_name}</strong>
              </div>
              <div className="badge-details">
                <div className="badge-detail-item">
                  <i className="fas fa-id-card"></i>
                  <span>Student ID: {studentData.student_id}</span>
                </div>
                <div className="badge-detail-item">
                  <i className="fas fa-graduation-cap"></i>
                  <span>Course: {studentData.course || 'Not specified'}</span>
                </div>
                <div className="badge-detail-item">
                  <i className="fas fa-briefcase"></i>
                  <span>{studentData.position} at {studentData.company_name}</span>
                </div>
                {(studentData.start_date || studentData.end_date) && (
                  <div className="badge-detail-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(studentData.start_date)} - {formatDate(studentData.end_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Supervisor Information */}
          <div className="form-section">
            <h2>Supervisor Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="supervisor_name"
                  value={formData.supervisor_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Email *</label>
                <input
                  type="email"
                  name="supervisor_email"
                  value={formData.supervisor_email}
                  onChange={handleInputChange}
                  placeholder="your.email@company.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Your Position/Title *</label>
                <input
                  type="text"
                  name="supervisor_position"
                  value={formData.supervisor_position}
                  onChange={handleInputChange}
                  placeholder="e.g., HR Manager, Department Head"
                  required
                />
              </div>
            </div>

            <div className="signature-section">
              <label>Your E-Signature *</label>
              <p className="signature-instruction">
                <i className="fas fa-pencil-alt"></i> Draw your signature below
              </p>

              <div className="signature-canvas-container">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                />
                {!signatureData && (
                  <div className="signature-placeholder">
                    <i className="fas fa-signature"></i>
                    <span>Draw your signature here</span>
                  </div>
                )}
              </div>

              <div className="signature-controls">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="btn-clear-signature"
                >
                  <i className="fas fa-eraser"></i> Clear
                </button>
              </div>
            </div>

            <p className="form-note">
              <i className="fas fa-info-circle"></i>
              A copy of this evaluation will be sent to your email
            </p>
          </div>

          {/* Evaluation Period */}
          <div className="form-section">
            <h2>Evaluation Period</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="evaluation_period_start"
                  value={formData.evaluation_period_start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="evaluation_period_end"
                  value={formData.evaluation_period_end}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hours Rendered *</label>
                <input
                  type="number"
                  name="hours_rendered"
                  value={formData.hours_rendered}
                  onChange={handleInputChange}
                  placeholder="Total hours rendered for this period"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rating Scale Guide */}
          <div className="form-section rating-scale-guide">
            <h2>
              <i className="fas fa-star"></i> Rating Scale Guide
            </h2>
            <p className="scale-instruction">Please rate the trainee according to the different areas / job factors below by indicating the corresponding points according to the scale:</p>
            <div className="rating-scale-boxes">
              <div className="scale-box excellent">
                <div className="scale-number">5</div>
                <div className="scale-label">Excellent</div>
              </div>
              <div className="scale-box very-good">
                <div className="scale-number">4</div>
                <div className="scale-label">Very Good</div>
              </div>
              <div className="scale-box good">
                <div className="scale-number">3</div>
                <div className="scale-label">Good</div>
              </div>
              <div className="scale-box poor">
                <div className="scale-number">2</div>
                <div className="scale-label">Poor</div>
              </div>
              <div className="scale-box needs-improvement">
                <div className="scale-number">1</div>
                <div className="scale-label">Needs Improvement</div>
              </div>
            </div>

            <div className="grade-equivalent-section">
              <h3>
                <i className="fas fa-chart-line"></i> Grade Equivalent
              </h3>
              <p className="grade-instruction">The total score will be converted to a grade equivalent as follows:</p>
              <div className="grade-table">
                <div className="grade-row">
                  <div className="grade-cell">97 – 100</div>
                  <div className="grade-cell grade-value">1.0</div>
                  <div className="grade-cell">82 – 84</div>
                  <div className="grade-cell grade-value">2.25</div>
                </div>
                <div className="grade-row">
                  <div className="grade-cell">94 – 96</div>
                  <div className="grade-cell grade-value">1.25</div>
                  <div className="grade-cell">79 – 81</div>
                  <div className="grade-cell grade-value">2.5</div>
                </div>
                <div className="grade-row">
                  <div className="grade-cell">91 – 93</div>
                  <div className="grade-cell grade-value">1.5</div>
                  <div className="grade-cell">76 – 78</div>
                  <div className="grade-cell grade-value">2.75</div>
                </div>
                <div className="grade-row">
                  <div className="grade-cell">88 – 90</div>
                  <div className="grade-cell grade-value">1.75</div>
                  <div className="grade-cell">73 – 75</div>
                  <div className="grade-cell grade-value">3.0</div>
                </div>
                <div className="grade-row">
                  <div className="grade-cell">85 – 87</div>
                  <div className="grade-cell grade-value">2.0</div>
                  <div className="grade-cell">72 – below</div>
                  <div className="grade-cell grade-value failing">5.0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Criteria */}
          {Object.keys(evaluationCriteria).map(areaKey => {
            const area = evaluationCriteria[areaKey];
            return (
              <div key={areaKey} className="form-section criteria-section">
                <h2>{area.title}</h2>
                <div className="criteria-list">
                  {area.criteria.map(criterion => (
                    <div key={criterion.id} className="criterion-row">
                      <label>{criterion.label}</label>
                      <div className="score-input-group">
                        <input
                          type="number"
                          min="0"
                          max={criterion.max}
                          step="0.5"
                          value={formData.criteria_scores[areaKey][criterion.id] || ''}
                          onChange={(e) => handleScoreChange(areaKey, criterion.id, e.target.value, criterion.max)}
                          placeholder="0"
                          required
                        />
                        <span className="max-score">/ {criterion.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="area-total">
                  Area {areaKey.replace('area', '')} Total: <strong>{calculateAreaTotal(areaKey).toFixed(2)}</strong>
                </div>
              </div>
            );
          })}

          {/* Comments */}
          <div className="form-section">
            <h2>Comments / Suggestions</h2>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Provide additional feedback, comments, or suggestions..."
              rows="5"
            />
          </div>

          {/* Total Score Display */}
          <div className="score-summary">
            <div className="score-item">
              <span>Total Score:</span>
              <strong className="total-score">{totalScore}</strong>
            </div>
            <div className="score-item">
              <span>Grade Equivalent:</span>
              <strong className="grade">{grade}</strong>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/public/student/${token}`)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Evaluation
                </>
              )}
            </button>
          </div>

          <p className="submission-note">
            <i className="fas fa-exclamation-circle"></i>
            You can only submit <strong>one evaluation per day</strong> for this student
          </p>
        </form>
      </div>
    </div>
  );
};

export default PublicEvaluationForm;
