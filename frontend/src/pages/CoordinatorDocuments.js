import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './AdminDashboard.css';
import CoordinatorHeader from './CoordinatorHeader';

function CoordinatorDocuments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [documentType, setDocumentType] = useState('endorsement_letter');
    const [students, setStudents] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [format, setFormat] = useState('pdf'); // Default to PDF


    const [documentTypes, setDocumentTypes] = useState([]);

    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        checkCoordinatorAccess();
        fetchStudents();
        fetchCompanies();
        fetchDocumentTypes();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator' && userRole !== 'admin') {
            setError('Access denied. Coordinators only.');
            setTimeout(() => navigate('/student/dashboard'), 1000);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            // Use coordinator-specific endpoint that filters by college
            const response = await axios.get(`${baseURL}coordinator/users/`, {
                headers: { Authorization: `Token ${token}` }
            });
            console.log('Coordinator students loaded:', response.data); // Debug
            setStudents(response.data);
        } catch (err) {
            console.error('Error fetching students:', err);
            // Fallback to regular users endpoint if coordinator endpoint fails
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${baseURL}users/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                const studentUsers = response.data.filter(user => !user.is_staff);
                setStudents(studentUsers);
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }
        }
    };

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}companies/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setCompanies(response.data);
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchDocumentTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/document-types/`, {
                headers: { Authorization: `Token ${token}` }
            });
            // Filter only enabled document types
            const enabledTypes = response.data.filter(dt => dt.is_enabled);
            setDocumentTypes(enabledTypes);

            // Set default document type if available
            if (enabledTypes.length > 0) {
                setDocumentType(enabledTypes[0].code);
            }
        } catch (err) {
            console.error('Error fetching document types:', err);
        }
    };

    const handleGenerateDocument = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            // Map frontend document types to backend expected values
            const documentTypeMap = {
                'recommendation_letter': 'recommendation',
                'waiver_consent': 'waiver',
                'consent_letter': 'consent_letter',
                'completion_certificate': 'certificate',
                'endorsement_letter': 'endorsement_letter',
                'acceptance_letter': 'acceptance_letter',
                'contract_moa': 'contract_moa',
                'progress_report': 'progress_report',
                'evaluation_summary': 'evaluation_summary',
                'training_plan': 'training_plan'
            };

            const mappedType = documentTypeMap[documentType] || documentType;

            if (!mappedType) {
                setError('Invalid document type selected');
                setLoading(false);
                return;
            }

            const requestData = {
                document_type: mappedType,
                format: format // Include format preference
            };

            // Validation based on document type
            const requiresStudent = ['recommendation_letter', 'waiver_consent', 'consent_letter', 'completion_certificate', 'endorsement_letter', 'training_plan'];
            const requiresCompany = ['endorsement_letter', 'acceptance_letter', 'contract_moa'];

            if (requiresStudent.includes(documentType)) {
                if (!selectedStudent) {
                    setError('Please select a student');
                    setLoading(false);
                    return;
                }
                requestData.student_id = selectedStudent;
            }

            if (requiresCompany.includes(documentType)) {
                if (!selectedCompany) {
                    setError('Please select a company');
                    setLoading(false);
                    return;
                }
                requestData.company_id = selectedCompany;
            }

            console.log('Sending request data (STRING):', JSON.stringify(requestData, null, 2));

            const response = await axios.post(
                `${baseURL}coordinator/documents/generate/`,
                requestData,
                {
                    headers: { Authorization: `Token ${token}` }
                }
            );

            // Backend returns JSON with download URL
            if (response.data && response.data.download_url) {
                const downloadUrl = `http://localhost:8000${response.data.download_url}`;
                const fileExtension = response.data.format || format;

                const studentData = students.find(s => s.id === parseInt(selectedStudent));
                const studentName = studentData ? `${studentData.first_name}_${studentData.last_name}`.replace(/\s+/g, '_') : 'Generated';

                if (fileExtension === 'pdf') {
                    // Open PDF in new tab for preview as requested
                    window.open(downloadUrl, '_blank');
                    setSuccess(`${response.data.message || 'Document generated successfully!'} - PDF opened in new tab`);
                } else {
                    // Download DOCX file
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', `${documentType}_${studentName}_${Date.now()}.${fileExtension}`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    setSuccess(`${response.data.message || 'Document generated successfully!'} (${fileExtension.toUpperCase()}) - Downloaded`);
                }
            } else {
                setError('Failed to generate document link');
            }
        } catch (err) {
            console.error('Error generating document:', err);
            console.log('Error response data:', JSON.stringify(err.response?.data, null, 2));
            console.log('Error status:', err.response?.status);

            if (err.response?.status === 400) {
                const errorMsg = err.response?.data?.error || 'Invalid request. Please check your selections.';
                setError(errorMsg);
            } else if (err.response?.status === 404) {
                setError('This document type is not yet implemented in the backend.');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to generate document. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    const getDocumentDescription = () => {
        const descriptions = {
            'endorsement_letter': 'Official letter endorsing a student for internship at a specific company',
            'acceptance_letter': 'Letter welcoming a company as a partner in the internship program',
            'progress_report': 'Summary report of internship program statistics and metrics',
            'evaluation_summary': 'Compiled evaluation data from company supervisors',
            'recommendation_letter': 'Recommendation letter for a student based on internship performance',
            'waiver_consent': 'Waiver and consent form for student participation in internship program',
            'consent_letter': 'Consent letter for student participation and data privacy agreement',
            'contract_moa': 'Memorandum of Agreement between institution and company',
            'completion_certificate': 'Certificate of completion for student who finished internship',
            'training_plan': 'Structured training plan outlining tasks, timeline, and expected outcomes for student'
        };
        return descriptions[documentType] || '';
    };

    const requiresStudent = ['recommendation_letter', 'waiver_consent', 'consent_letter', 'completion_certificate', 'endorsement_letter', 'training_plan'].includes(documentType);
    const requiresCompany = ['endorsement_letter', 'acceptance_letter', 'contract_moa'].includes(documentType);
    const autoGenerated = ['progress_report', 'evaluation_summary'].includes(documentType);

    // Get current document type config
    const currentDocType = documentTypes.find(dt => dt.code === documentType);
    const requiresStudentDynamic = currentDocType?.requires_student || false;
    const requiresCompanyDynamic = currentDocType?.requires_company || false;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <CoordinatorHeader
                    title="Generate Documents"
                    subtitle="Create official documents, letters, and certificates"
                />

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                <div className="form-container" style={{ maxWidth: '700px', margin: '30px auto' }}>
                    <form onSubmit={handleGenerateDocument}>
                        <div className="form-group">
                            <label htmlFor="documentType">Document Type</label>
                            <select
                                id="documentType"
                                value={documentType}
                                onChange={(e) => {
                                    setDocumentType(e.target.value);
                                    setSelectedStudent('');
                                    setSelectedCompany('');

                                    // Logic to auto-switch format if the new doc type doesn't support the current format
                                    const nextDocType = documentTypes.find(dt => dt.code === e.target.value);
                                    if (nextDocType && nextDocType.has_uploaded_pdf_template && !nextDocType.has_uploaded_template && !nextDocType.has_code_template) {
                                        setFormat('pdf');
                                    }
                                }}
                                required
                            >
                                {/* Group by category */}
                                {['Letters', 'Certificates', 'Legal Documents', 'Reports'].map(category => {
                                    const typesInCategory = documentTypes.filter(dt => dt.category === category);
                                    if (typesInCategory.length === 0) return null;

                                    return (
                                        <optgroup key={category} label={category}>
                                            {typesInCategory.map(dt => (
                                                <option key={dt.id} value={dt.code}>
                                                    {dt.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                            <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                {currentDocType?.description || ''}
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="format">Output Format</label>
                            <select
                                id="format"
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                required
                            >
                                <option value="pdf">PDF - Recommended for official documents</option>
                                {/* Show DOCX option only if:
                                    1. No doc type selected (default)
                                    2. User uploaded a DOCX template
                                    3. Has code-based template AND NO uploaded PDF template (if they uploaded PDF but not DOCX, they likely want to force PDF)
                                */}
                                {(!currentDocType ||
                                    currentDocType.has_uploaded_template ||
                                    (currentDocType.has_code_template && !currentDocType.has_uploaded_pdf_template)
                                ) && (
                                        <option value="docx">DOCX - Editable Word document</option>
                                    )}
                            </select>
                            <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                {format === 'pdf'
                                    ? 'PDF format is recommended for official documents and cannot be edited'
                                    : 'DOCX format allows editing but may be modified by recipients'}
                                {currentDocType?.has_uploaded_pdf_template && !currentDocType?.has_uploaded_template && !currentDocType?.has_code_template && (
                                    <span style={{ color: '#e74c3c', display: 'block', marginTop: '5px' }}>
                                        * Only PDF output is available for this document because only a PDF template was provided.
                                    </span>
                                )}
                            </small>
                        </div>

                        {(requiresStudent || requiresStudentDynamic) && (
                            <div className="form-group">
                                <label htmlFor="student">Select Student</label>
                                <Select
                                    id="student"
                                    value={students.find(s => s.id === parseInt(selectedStudent)) ? {
                                        value: selectedStudent,
                                        label: `${students.find(s => s.id === parseInt(selectedStudent)).first_name} ${students.find(s => s.id === parseInt(selectedStudent)).last_name} - ${students.find(s => s.id === parseInt(selectedStudent)).student_profile?.student_id || 'N/A'} (${students.find(s => s.id === parseInt(selectedStudent)).student_profile?.course || 'N/A'})`
                                    } : null}
                                    onChange={(option) => setSelectedStudent(option ? option.value : '')}
                                    options={students.map(student => ({
                                        value: student.id,
                                        label: `${student.first_name} ${student.last_name} - ${student.student_profile?.student_id || 'N/A'} (${student.student_profile?.course || 'N/A'})`
                                    }))}
                                    placeholder="Search for a student..."
                                    isClearable
                                    isSearchable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: '45px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        })
                                    }}
                                />
                            </div>
                        )}

                        {(requiresCompany || requiresCompanyDynamic) && (
                            <div className="form-group">
                                <label htmlFor="company">Select Company</label>
                                <Select
                                    id="company"
                                    value={companies.find(c => c.id === parseInt(selectedCompany)) ? {
                                        value: selectedCompany,
                                        label: companies.find(c => c.id === parseInt(selectedCompany)).name
                                    } : null}
                                    onChange={(option) => setSelectedCompany(option ? option.value : '')}
                                    options={companies.map(company => ({
                                        value: company.id,
                                        label: company.name
                                    }))}
                                    placeholder="Search for a company..."
                                    isClearable
                                    isSearchable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: '45px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        })
                                    }}
                                />
                            </div>
                        )}

                        {autoGenerated && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '12px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd',
                                fontSize: '14px',
                                color: '#0c4a6e'
                            }}>
                                This document will be generated automatically with current system data.
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Generating...' : `Generate ${format.toUpperCase()}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/coordinator/dashboard')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* Simple info section */}
                <div style={{
                    maxWidth: '700px',
                    margin: '30px auto',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                        Format Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '8px' }}>PDF Format</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                                <li>Cannot be edited (secure)</li>
                                <li>Professional appearance</li>
                                <li>Universal compatibility</li>
                                <li>Smaller file size</li>
                            </ul>
                        </div>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '8px' }}>DOCX Format</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                                <li>Can be edited</li>
                                <li>Good for templates</li>
                                <li>Easy to customize</li>
                                <li>Requires Word or compatible app</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CoordinatorDocuments;
