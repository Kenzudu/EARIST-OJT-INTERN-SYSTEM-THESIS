import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import CoordinatorHeader from './CoordinatorHeader';

function CoordinatorSettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('hours');
    const [coordinatorCollege, setCoordinatorCollege] = useState('');

    // College to Courses mapping - Using database short codes
    const collegeCourses = {
        'CAFA': [  // College of Architecture and Fine Arts
            'BS ARCHI.',
            'BSID',
            'BFA - Major in Painting',
            'BFA - Major in Visual Communication'
        ],
        'CCS': [  // College of Computing Studies
            'BSCS',
            'BS INFO. TECH.'
        ],
        'CAS': [  // College of Arts and Sciences
            'BSAP',
            'BSPSYCH',
            'BSMATH'
        ],
        'CBA': [  // College of Business Administration
            'BSBA - Major in Marketing Management',
            'BSBA - Major in Human Resource Development Management (HRDM)',
            'BSEM',
            'BSOA'
        ],
        'CED': [  // College of Education
            'BSE - Major in Science',
            'BSE - Major in Mathematics',
            'BSE - Major in Filipino',
            'BSNEd',
            'BTLE - Major in Home Economics',
            'BTLE - Major in Industrial Arts',
            'TCP'
        ],
        'CEN': [  // College of Engineering
            'BSCHE',
            'BSCE',
            'BSEE',
            'BSECE',
            'BSME',
            'BSCOE'
        ],
        'CHM': [  // College of Hospitality Management
            'BST',
            'BSHM'
        ],
        'CIT': [  // College of Industrial Technology
            'BSIT - Major in Automotive Technology',
            'BSIT - Major in Electrical Technology',
            'BSIT - Major in Electronics Technology',
            'BSIT - Major in Food Technology',
            'BSIT - Major in Fashion and Apparel Technology',
            'BSIT - Major in Industrial Chemistry',
            'BSIT - Major in Drafting Technology',
            'BSIT - Major in Machine Shop Technology',
            'BSIT - Major in Refrigeration and Air Conditioning'
        ],
        'CPAC': [  // College of Administration and Criminology
            'BPA',
            'BSCRIM'
        ]
    };

    // Hours Configuration - will be filtered based on college
    const [hoursConfig, setHoursConfig] = useState([]);

    // Required Documents
    const [requiredDocs, setRequiredDocs] = useState([
        { id: 1, name: 'Resume/CV', required: true },
        { id: 2, name: 'Application Letter', required: true },
        { id: 3, name: 'Endorsement Letter', required: true },
        { id: 4, name: 'Medical Certificate', required: false },
        { id: 5, name: 'NBI Clearance', required: false },
        { id: 6, name: 'Barangay Clearance', required: false }
    ]);

    // Cut-off Dates
    const [cutoffDates, setCutoffDates] = useState({
        applicationDeadline: '',
        midtermReportDeadline: '',
        finalReportDeadline: '',
        evaluationDeadline: ''
    });

    // Calendar Activities
    const [activities, setActivities] = useState([
        { id: 1, name: 'Orientation', date: '', description: 'Student orientation for internship program' },
        { id: 2, name: 'Application Period Start', date: '', description: 'Start of company application period' },
        { id: 3, name: 'Application Period End', date: '', description: 'End of company application period' },
        { id: 4, name: 'Internship Start', date: '', description: 'Official start of internship' },
        { id: 5, name: 'Midterm Evaluation', date: '', description: 'Midterm evaluation period' },
        { id: 6, name: 'Final Evaluation', date: '', description: 'Final evaluation period' },
        { id: 7, name: 'Internship End', date: '', description: 'Official end of internship' }
    ]);

    // Document Types
    const [documentTypes, setDocumentTypes] = useState([]);
    const [editingDocType, setEditingDocType] = useState(null);
    const [newDocType, setNewDocType] = useState({
        name: '',
        code: '',
        description: '',
        category: 'Letters',
        requires_student: false,
        requires_company: false,
        is_enabled: true
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedDocTypeForTemplate, setSelectedDocTypeForTemplate] = useState(null);
    const [templateFile, setTemplateFileUpload] = useState(null);
    const [pdfTemplateFile, setPdfTemplateFileUpload] = useState(null);
    const [uploadingTemplate, setUploadingTemplate] = useState(false);

    // Search and Filter State
    const [docSearchTerm, setDocSearchTerm] = useState('');
    const [docFilterStatus, setDocFilterStatus] = useState('all');

    const baseURL = 'http://localhost:8000/api/';

    useEffect(() => {
        checkCoordinatorAccess();
        loadSettings();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator' && userRole !== 'admin') {
            setError('Access denied. Coordinators only.');
            setTimeout(() => navigate('/student/dashboard'), 1000);
        }
    };

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/settings/`, {
                headers: { Authorization: `Token ${token}` }
            });

            // Get coordinator's college
            const college = response.data.college || '';
            setCoordinatorCollege(college);

            // Initialize hours config based on coordinator's college
            if (college && collegeCourses[college]) {
                const courses = collegeCourses[college];
                const initialHoursConfig = courses.map(program => ({
                    program: program,
                    requiredHours: 486 // Default hours
                }));

                // Only override with saved data if it exists and is not empty
                // Merge saved settings with default course list to ensure all courses are shown
                const savedConfig = response.data.hours_config || [];

                const mergedConfig = initialHoursConfig.map(initial => {
                    // Try to find matching saved config
                    // Fuzzy match program name to handle dot differences
                    const saved = savedConfig.find(s =>
                        s.program === initial.program ||
                        (s.program && s.program.replace(/\./g, '') === initial.program.replace(/\./g, ''))
                    );

                    if (saved) {
                        return { ...initial, requiredHours: saved.requiredHours };
                    }
                    return initial;
                });

                setHoursConfig(mergedConfig);
            }

            if (response.data.required_docs && response.data.required_docs.length > 0) {
                setRequiredDocs(response.data.required_docs);
            }
            // Otherwise keep the default documents from useState

            if (response.data.cutoff_dates) setCutoffDates(response.data.cutoff_dates);
            if (response.data.activities) setActivities(response.data.activities);

            // Load document types
            loadDocumentTypes();
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${baseURL}coordinator/settings/`,
                {
                    hours_config: hoursConfig,
                    required_docs: requiredDocs,
                    cutoff_dates: cutoffDates,
                    activities: activities
                },
                { headers: { Authorization: `Token ${token}` } }
            );

            setSuccess('Settings saved successfully!');
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const updateHours = (index, value) => {
        const updated = [...hoursConfig];
        updated[index].requiredHours = parseInt(value) || 0;
        setHoursConfig(updated);
    };

    const toggleDocRequired = (id) => {
        setRequiredDocs(requiredDocs.map(doc =>
            doc.id === id ? { ...doc, required: !doc.required } : doc
        ));
    };

    const addNewDocument = () => {
        const newId = Math.max(...requiredDocs.map(d => d.id)) + 1;
        setRequiredDocs([...requiredDocs, { id: newId, name: 'New Document', required: false }]);
    };

    const updateDocName = (id, name) => {
        setRequiredDocs(requiredDocs.map(doc =>
            doc.id === id ? { ...doc, name } : doc
        ));
    };

    const removeDocument = (id) => {
        setRequiredDocs(requiredDocs.filter(doc => doc.id !== id));
    };

    const updateActivity = (id, field, value) => {
        setActivities(activities.map(activity =>
            activity.id === id ? { ...activity, [field]: value } : activity
        ));
    };

    const loadDocumentTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseURL}coordinator/document-types/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setDocumentTypes(response.data);
        } catch (err) {
            console.error('Error loading document types:', err);
        }
    };

    const handleAddDocType = async () => {
        if (!newDocType.name || !newDocType.code) {
            setError('Name and code are required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${baseURL}coordinator/document-types/`, newDocType, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Document type added successfully!');
            setNewDocType({
                name: '',
                code: '',
                description: '',
                category: 'Letters',
                requires_student: false,
                requires_company: false,
                is_enabled: true
            });
            loadDocumentTypes();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add document type');
        }
    };

    const handleUpdateDocType = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${baseURL}coordinator/document-types/${id}/`, editingDocType, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Document type updated successfully!');
            setEditingDocType(null);
            loadDocumentTypes();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update document type');
        }
    };

    const handleToggleDocType = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${baseURL}coordinator/document-types/${id}/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Document type status updated!');
            loadDocumentTypes();
        } catch (err) {
            setError('Failed to toggle document type');
        }
    };

    const handleDeleteDocType = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document type?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}coordinator/document-types/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setSuccess('Document type deleted successfully!');
            loadDocumentTypes();
        } catch (err) {
            setError('Failed to delete document type');
        }
    };

    const handleUploadTemplate = async (fileType = 'docx') => {
        const fileToUpload = fileType === 'pdf' ? pdfTemplateFile : templateFile;

        if (!fileToUpload) {
            setError(`Please select a ${fileType.toUpperCase()} template file`);
            return;
        }

        setUploadingTemplate(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            console.log(`DEBUG: Uploading ${fileType} template:`, fileToUpload);
            formData.append('template_file', fileToUpload);

            await axios.post(
                `${baseURL}coordinator/document-types/${selectedDocTypeForTemplate.id}/upload-template/`,
                formData,
                {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            );

            setSuccess(`${fileType.toUpperCase()} Template uploaded successfully!`);
            if (fileType === 'docx') setTemplateFileUpload(null);
            else setPdfTemplateFileUpload(null);

            // Refresh list and also update the local modal state to show the checkmark
            const updatedDocType = { ...selectedDocTypeForTemplate };
            if (fileType === 'docx') updatedDocType.has_uploaded_template = true;
            else updatedDocType.has_uploaded_pdf_template = true;
            updatedDocType.has_template = true;
            setSelectedDocTypeForTemplate(updatedDocType);

            loadDocumentTypes();
            // Don't close modal yet so they can upload the other one if needed
        } catch (err) {
            setError(err.response?.data?.error || `Failed to upload ${fileType} template`);
        } finally {
            setUploadingTemplate(false);
        }
    };

    const handleViewTemplate = async (docType) => {
        try {
            const token = localStorage.getItem('token');
            let downloadUrl;

            if (docType.has_uploaded_pdf_template) {
                downloadUrl = `http://localhost:8000${docType.template_file_pdf}`;
            } else if (docType.has_uploaded_template) {
                downloadUrl = `http://localhost:8000${docType.template_file}`;
            } else {
                downloadUrl = `http://localhost:8000/api/coordinator/document-types/${docType.id}/preview-template/`;
            }

            // Show loading state if needed, or just toast
            setSuccess('Opening template...');

            const response = await fetch(downloadUrl, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch template');

            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);

            // Open in new tab
            window.open(fileURL, '_blank');

            // Note: We can't revoke the URL immediately if we want the new tab to use it.
            // Browsers handle cleanup eventually, or we could set a timeout.
            setTimeout(() => window.URL.revokeObjectURL(fileURL), 60000); // Cleanup after 1 min

        } catch (err) {
            console.error(err);
            setError('Failed to open template');
        }
    };

    const openTemplateModal = (docType) => {
        setSelectedDocTypeForTemplate(docType);
        setShowTemplateModal(true);
        setTemplateFileUpload(null);
    };

    // Edit Document Type State & Handlers
    const [showEditDocModal, setShowEditDocModal] = useState(false);
    const [editDocFormData, setEditDocFormData] = useState({
        id: null,
        name: '',
        code: '',
        category: 'Letters',
        requires_student: false,
        requires_company: false,
        is_enabled: true
    });

    const handleEditDocType = (docType) => {
        setEditDocFormData({
            id: docType.id,
            name: docType.name,
            code: docType.code,
            category: docType.category,
            requires_student: docType.requires_student,
            requires_company: docType.requires_company,
            is_enabled: docType.is_enabled
        });
        setShowEditDocModal(true);
    };

    const handleSaveEditDocType = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!editDocFormData.name || !editDocFormData.code) {
                setError('Name and Code are required');
                return;
            }

            await axios.put(
                `${baseURL}coordinator/document-types/${editDocFormData.id}/`,
                editDocFormData,
                { headers: { Authorization: `Token ${token}` } }
            );

            setSuccess('Document type updated successfully');
            setShowEditDocModal(false);
            loadDocumentTypes();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update document type');
        }
    };

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <CoordinatorHeader
                    title=" System Configuration"
                    subtitle="Configure internship program settings and requirements"
                />

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab ${activeTab === 'hours' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hours')}
                    >
                        ⏱ Required Hours
                    </button>
                    <button
                        className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        Required Documents
                    </button>

                    <button
                        className={`tab ${activeTab === 'doctypes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('doctypes')}
                    >
                        Document Types
                    </button>
                </div>

                <div className="settings-content">
                    {/* Required Hours Tab */}
                    {activeTab === 'hours' && (
                        <div className="settings-section">
                            <h2>Required Hours by Program</h2>
                            <p style={{ color: '#666', marginBottom: '20px' }}>
                                Set the required internship hours for each program/course
                            </p>
                            <table className="settings-table">
                                <thead>
                                    <tr>
                                        <th>Program/Course</th>
                                        <th>Required Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hoursConfig.map((config, index) => (
                                        <tr key={config.program}>
                                            <td><strong>{config.program}</strong></td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={config.requiredHours}
                                                    onChange={(e) => updateHours(index, e.target.value)}
                                                    min="0"
                                                    style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                                <span style={{ marginLeft: '8px', color: '#666' }}>hours</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Required Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="settings-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2>Required Documents Checklist</h2>
                                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                                        Manage the list of documents required from students
                                    </p>
                                </div>
                                <button onClick={addNewDocument} className="btn-add">
                                    + Add Document
                                </button>
                            </div>
                            <div className="documents-list">
                                {requiredDocs.map(doc => (
                                    <div key={doc.id} className="document-item">
                                        <input
                                            type="checkbox"
                                            checked={doc.required}
                                            onChange={() => toggleDocRequired(doc.id)}
                                            style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={doc.name}
                                            onChange={(e) => updateDocName(doc.id, e.target.value)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                        <span style={{
                                            marginLeft: '12px',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            backgroundColor: doc.required ? '#d4edda' : '#f8d7da',
                                            color: doc.required ? '#155724' : '#721c24'
                                        }}>
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                        <button
                                            onClick={() => removeDocument(doc.id)}
                                            style={{
                                                marginLeft: '12px',
                                                padding: '6px 12px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Document Types Tab */}
                    {activeTab === 'doctypes' && (
                        <div className="settings-section">
                            <h2>Document Type Management</h2>
                            <p style={{ color: '#666', marginBottom: '20px' }}>
                                Configure which document types are available for generation
                            </p>

                            {/* Add New Document Type */}
                            <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
                                <h3 style={{ marginTop: 0 }}>Add New Document Type</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Name</label>
                                        <input
                                            type="text"
                                            value={newDocType.name}
                                            onChange={(e) => setNewDocType({ ...newDocType, name: e.target.value })}
                                            placeholder="e.g., Internship Agreement"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Code</label>
                                        <input
                                            type="text"
                                            value={newDocType.code}
                                            onChange={(e) => setNewDocType({ ...newDocType, code: e.target.value })}
                                            placeholder="e.g., internship_agreement"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Category</label>
                                        <select
                                            value={newDocType.category}
                                            onChange={(e) => setNewDocType({ ...newDocType, category: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        >
                                            <option value="Letters">Letters</option>
                                            <option value="Certificates">Certificates</option>
                                            <option value="Legal Documents">Legal Documents</option>
                                            <option value="Reports">Reports</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={newDocType.requires_student}
                                                onChange={(e) => setNewDocType({ ...newDocType, requires_student: e.target.checked })}
                                            />
                                            Requires Student
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={newDocType.requires_company}
                                                onChange={(e) => setNewDocType({ ...newDocType, requires_company: e.target.checked })}
                                            />
                                            Requires Company
                                        </label>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Description</label>
                                    <textarea
                                        value={newDocType.description}
                                        onChange={(e) => setNewDocType({ ...newDocType, description: e.target.value })}
                                        placeholder="Brief description of this document type"
                                        rows="2"
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <button onClick={handleAddDocType} className="btn-add">
                                    + Add Document Type
                                </button>
                            </div>

                            {/* Document Types List */}
                            <div style={{ overflowX: 'auto', paddingBottom: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Existing Document Types</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="Search name or code..."
                                            value={docSearchTerm}
                                            onChange={(e) => setDocSearchTerm(e.target.value)}
                                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '200px' }}
                                        />
                                        <select
                                            value={docFilterStatus}
                                            onChange={(e) => setDocFilterStatus(e.target.value)}
                                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="enabled">Active</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>
                                </div>
                                <table className="settings-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Code</th>
                                            <th>Category</th>
                                            <th>Requirements</th>
                                            <th>Template</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documentTypes.filter(doc => {
                                            const term = docSearchTerm.toLowerCase();
                                            const matchesSearch = doc.name.toLowerCase().includes(term) ||
                                                doc.code.toLowerCase().includes(term);
                                            if (docFilterStatus === 'enabled') return matchesSearch && doc.is_enabled;
                                            if (docFilterStatus === 'disabled') return matchesSearch && !doc.is_enabled;
                                            return matchesSearch;
                                        }).map(docType => (
                                            <tr key={docType.id} style={{ opacity: docType.is_enabled ? 1 : 0.5 }}>
                                                <td><strong>{docType.name}</strong></td>
                                                <td><code>{docType.code}</code></td>
                                                <td>{docType.category}</td>
                                                <td>
                                                    {docType.requires_student && <span style={{ marginRight: '5px', padding: '2px 6px', background: '#e3f2fd', borderRadius: '3px', fontSize: '0.85em' }}>Student</span>}
                                                    {docType.requires_company && <span style={{ padding: '2px 6px', background: '#fff3e0', borderRadius: '3px', fontSize: '0.85em' }}>Company</span>}
                                                    {!docType.requires_student && !docType.requires_company && <span style={{ color: '#999' }}>None</span>}
                                                </td>
                                                <td>
                                                    {docType.has_uploaded_template ? (
                                                        <span style={{ color: '#28a745', fontWeight: '600' }}>✓ Custom</span>
                                                    ) : docType.has_code_template ? (
                                                        <span style={{ color: '#007bff', fontWeight: '600' }}>✓ Default</span>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>No template</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        backgroundColor: docType.is_enabled ? '#d4edda' : '#f8d7da',
                                                        color: docType.is_enabled ? '#155724' : '#721c24'
                                                    }}>
                                                        {docType.is_enabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td style={{ minWidth: '480px' }}>
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
                                                        {docType.has_template ? (
                                                            <button
                                                                onClick={() => handleViewTemplate(docType)}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    background: '#17a2b8',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                                View
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    background: '#ccc',
                                                                    color: '#666',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'not-allowed',
                                                                    fontSize: '0.8rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    whiteSpace: 'nowrap',
                                                                    opacity: 0.6
                                                                }}
                                                                title="No template available"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                                View
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openTemplateModal(docType)}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: '#007bff',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                            </svg>
                                                            Template
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditDocType(docType)}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                whiteSpace: 'nowrap',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleDocType(docType.id)}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: docType.is_enabled ? '#ffc107' : '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {docType.is_enabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDocType(docType.id)}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div style={{ maxWidth: '1200px', margin: '30px auto', textAlign: 'right' }}>
                    <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="btn-save"
                    >
                        {loading ? ' Saving...' : ' Save All Settings'}
                    </button>
                </div>

                {/* Template Upload Modal */}
                {showTemplateModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '10px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                        }}>
                            <h2 style={{ marginTop: 0 }}>Manage Template - {selectedDocTypeForTemplate?.name}</h2>

                            {selectedDocTypeForTemplate?.has_template && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px' }}>
                                    <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Current Template:</p>
                                    <button
                                        onClick={() => handleViewTemplate(selectedDocTypeForTemplate)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 16px',
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download Current Template
                                    </button>
                                </div>
                            )}

                            <div style={{ marginBottom: '25px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                    Step 1: Upload DOCX Template
                                    {selectedDocTypeForTemplate?.has_uploaded_template && (
                                        <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '0.8rem' }}>✓ Uploaded</span>
                                    )}
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="file"
                                        accept=".docx,.doc"
                                        onChange={(e) => setTemplateFileUpload(e.target.files[0])}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                    <button
                                        onClick={() => handleUploadTemplate('docx')}
                                        disabled={!templateFile || uploadingTemplate}
                                        style={{ padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!templateFile || uploadingTemplate) ? 0.6 : 1 }}
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '25px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                    Step 2: Upload PDF Template (For Consistency)
                                    {selectedDocTypeForTemplate?.has_uploaded_pdf_template && (
                                        <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '0.8rem' }}>✓ Uploaded</span>
                                    )}
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setPdfTemplateFileUpload(e.target.files[0])}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                    <button
                                        onClick={() => handleUploadTemplate('pdf')}
                                        disabled={!pdfTemplateFile || uploadingTemplate}
                                        style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!pdfTemplateFile || uploadingTemplate) ? 0.6 : 1 }}
                                    >
                                        Upload
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>
                                    Tip: Provide both DOCX and PDF versions of the same template for perfectly consistent generation.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        setTemplateFileUpload(null);
                                        setPdfTemplateFileUpload(null);
                                        setSelectedDocTypeForTemplate(null);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        setTemplateFileUpload(null);
                                        setPdfTemplateFileUpload(null);
                                        setSelectedDocTypeForTemplate(null);
                                        setSuccess('');
                                        setError('');
                                    }}
                                    style={{
                                        padding: '10px 30px',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Doc Type Modal */}
                {showEditDocModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1001
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '10px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Document Type</h2>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Name</label>
                                <input
                                    type="text"
                                    value={editDocFormData.name}
                                    onChange={(e) => setEditDocFormData({ ...editDocFormData, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Code</label>
                                <input
                                    type="text"
                                    value={editDocFormData.code}
                                    onChange={(e) => setEditDocFormData({ ...editDocFormData, code: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
                                <select
                                    value={editDocFormData.category}
                                    onChange={(e) => setEditDocFormData({ ...editDocFormData, category: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                >
                                    <option value="Certificates">Certificates</option>
                                    <option value="Legal Documents">Legal Documents</option>
                                    <option value="Letters">Letters</option>
                                    <option value="Reports">Reports</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '25px', display: 'flex', gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editDocFormData.requires_student}
                                        onChange={(e) => setEditDocFormData({ ...editDocFormData, requires_student: e.target.checked })}
                                    />
                                    Requires Student
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editDocFormData.requires_company}
                                        onChange={(e) => setEditDocFormData({ ...editDocFormData, requires_company: e.target.checked })}
                                    />
                                    Requires Company
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowEditDocModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEditDocType}
                                    style={{
                                        padding: '10px 30px',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .tabs-container {
                    display: flex;
                    gap: 10px;
                    margin: 30px 0;
                    border-bottom: 2px solid #e0e0e0;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .tab {
                    padding: 12px 24px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #666;
                    transition: all 0.3s ease;
                }

                .tab:hover {
                    color: #333;
                    background: #f5f5f5;
                }

                .tab.active {
                    color: #4CAF50;
                    border-bottom-color: #4CAF50;
                }

                .settings-content {
                    max-width: 1200px;
                    margin: 30px auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .settings-section h2 {
                    margin-top: 0;
                    color: #333;
                }

                .settings-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .settings-table th,
                .settings-table td {
                    padding: 15px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }

                .settings-table th {
                    background: #f5f5f5;
                    font-weight: 600;
                }

                .documents-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .document-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                }

                .cutoff-dates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }

                .date-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }

                .date-input:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
                }

                .activities-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .activity-item {
                    padding: 16px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                }

                .activity-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .btn-add {
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .btn-add:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
                }

                .btn-save {
                    padding: 14px 32px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }

                .btn-save:hover:not(:disabled) {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
                }

                .btn-save:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .success-banner {
                    background-color: #d4edda;
                    color: #155724;
                    padding: 15px 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #c3e6cb;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .error-banner {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 15px 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #f5c6cb;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
}

export default CoordinatorSettings;
