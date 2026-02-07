import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, CheckCircle, XCircle, Search } from 'lucide-react';
import "./AdminUsers.css";

// Updated: 2026-01-15 - Fixed status logic for incomplete requirements

const baseURL = "http://localhost:8000/api";
const mediaURL = "http://localhost:8000";

// Helper function to get full URL for document
const getDocumentUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('/media/')) {
        return `${mediaURL}${url}`;
    }
    return `${mediaURL}/media/${url}`;
};

function CoordinatorRequirements() {
    const [students, setStudents] = useState([]);
    const [requirementsMap, setRequirementsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // "all", "pending", "missing", "verified"

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // 1. Fetch Students
            const studentsRes = await axios.get(`${baseURL}/coordinator/users/`, {
                headers: { Authorization: `Token ${token}` },
            });
            const studentsList = studentsRes.data;

            // 2. Fetch Pre-training Requirements (All)
            // Assuming the endpoints returns all for coordinator/staff
            let allRequirements = [];
            try {
                const reqsRes = await axios.get(`${baseURL}/pre-training-requirements/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                allRequirements = reqsRes.data;
            } catch (e) {
                console.error("Failed to fetch pre-training requirements", e);
                // If 403 or empty, we proceed with empty map
            }

            // Group requirements by student ID
            const reqMap = {};
            // Assuming the API returns a list of requirement objects
            if (Array.isArray(allRequirements)) {
                allRequirements.forEach(req => {
                    const studentId = req.student; // Assuming the serializer returns fields 'student' as ID
                    if (!reqMap[studentId]) {
                        reqMap[studentId] = {};
                    }
                    reqMap[studentId][req.requirement_type] = req; // Store the whole object
                });
            }
            setRequirementsMap(reqMap);

            // 3. Fetch Student Profiles (Parallel)
            const studentsWithProfiles = await Promise.all(studentsList.map(async (student) => {
                let profile = {};
                try {
                    const profileRes = await axios.get(`${baseURL}/users/${student.id}/`, {
                        headers: { Authorization: `Token ${token}` }
                    });
                    profile = profileRes.data.profile || {};
                } catch (e) {
                    profile = student.student_profile || student.profile || {};
                }

                const corUrl = getDocumentUrl(profile.certificate_of_registration || student.certificate_of_registration);

                // Check if ALL pre-training requirements are approved
                const studentReqs = reqMap[student.id] || {};
                const resumeApproved = studentReqs['Resume/CV']?.status === 'Approved';
                const appLetterApproved = studentReqs['Application Letter']?.status === 'Approved';
                const endorsementApproved = studentReqs['Endorsement Letter']?.status === 'Approved';

                // Student is verified only if ALL requirements are approved
                const isFullyVerified = corUrl && resumeApproved && appLetterApproved && endorsementApproved;

                return {
                    ...student,
                    profile: profile,
                    corUrl: corUrl,
                    isVerified: isFullyVerified  // Changed from student.is_active
                };
            }));

            setStudents(studentsWithProfiles);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load students data.");
        } finally {
            setLoading(false);
        }
    };

    const getRequirementStatus = (student, type) => {
        // COR is special, handled via profile
        if (type === 'COR') {
            return student.corUrl ? { status: 'Submitted', url: student.corUrl } : { status: 'Missing', url: null };
        }

        // Other requirements from PreTrainingRequirement model
        const studentReqs = requirementsMap[student.id] || {};

        // Resume might also be in profile
        if (type === 'Resume/CV') {
            // Check requirements app first (if they submitted securely there)
            if (studentReqs['Resume/CV']) {
                const r = studentReqs['Resume/CV'];
                return { status: r.status || 'Submitted', url: getDocumentUrl(r.document_file || r.document_url) };
            }
            // Fallback to profile resume
            if (student.profile?.resume || student.profile?.resume_url) {
                return { status: 'Submitted', url: getDocumentUrl(student.profile.resume || student.profile.resume_url) };
            }
            return { status: 'Missing', url: null };
        }

        const req = studentReqs[type];
        if (req) {
            return { status: req.status || 'Submitted', url: getDocumentUrl(req.document_file || req.document_url) };
        }
        return { status: 'Missing', url: null };
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            ((student.first_name || "") + ' ' + (student.last_name || "")).toLowerCase().includes(searchQuery.toLowerCase());

        const corStatus = getRequirementStatus(student, 'COR').status;
        const resumeStatus = getRequirementStatus(student, 'Resume/CV').status;
        const appLetterStatus = getRequirementStatus(student, 'Application Letter').status;
        const endorStatus = getRequirementStatus(student, 'Endorsement Letter').status;

        // Check if ALL requirements are submitted (not missing)
        const hasAllReqs = corStatus !== 'Missing' && resumeStatus !== 'Missing' && appLetterStatus !== 'Missing' && endorStatus !== 'Missing';
        const hasSomeMissing = !hasAllReqs;

        if (filterStatus === "pending") {
            // Has submitted all docs but not yet verified by coordinator
            return matchesSearch && hasAllReqs && !student.isVerified;
        }
        if (filterStatus === "missing") {
            return matchesSearch && hasSomeMissing;
        }
        if (filterStatus === "verified") {
            return matchesSearch && student.isVerified;
        }
        return matchesSearch;
    });

    const handleApprove = async (userId) => {
        if (!window.confirm("Are you sure you want to verify this student's requirements? This will approve their registration.")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post(`${baseURL}/coordinator/students/bulk-approve/`,
                { student_ids: [userId] },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess("Student requirements verified successfully!");
            fetchData(); // Refresh list
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Failed to verify student.");
            setTimeout(() => setError(""), 3000);
        }
    };

    // Helper to determine overall student status
    const getOverallStatus = (student) => {
        const corStatus = getRequirementStatus(student, 'COR').status;
        const resumeStatus = getRequirementStatus(student, 'Resume/CV').status;
        const appLetterStatus = getRequirementStatus(student, 'Application Letter').status;
        const endorStatus = getRequirementStatus(student, 'Endorsement Letter').status;

        // If already verified by coordinator
        if (student.isVerified) {
            return { label: 'Verified', color: '#d4edda', textColor: '#155724' };
        }

        // Check if any document is missing
        const hasMissing = corStatus === 'Missing' || resumeStatus === 'Missing' ||
            appLetterStatus === 'Missing' || endorStatus === 'Missing';

        if (hasMissing) {
            return { label: 'Incomplete', color: '#f8d7da', textColor: '#721c24' };
        }

        // All documents submitted, pending verification
        return { label: 'Pending Verification', color: '#fff3cd', textColor: '#856404' };
    };

    // Helper to check if student can be verified (all docs submitted)
    const canVerify = (student) => {
        if (student.isVerified) return false;

        const corStatus = getRequirementStatus(student, 'COR').status;
        const resumeStatus = getRequirementStatus(student, 'Resume/CV').status;
        const appLetterStatus = getRequirementStatus(student, 'Application Letter').status;
        const endorStatus = getRequirementStatus(student, 'Endorsement Letter').status;

        // All must be submitted (not missing)
        return corStatus !== 'Missing' && resumeStatus !== 'Missing' &&
            appLetterStatus !== 'Missing' && endorStatus !== 'Missing';
    };

    const renderRequirementCell = (student, type) => {
        const { status, url } = getRequirementStatus(student, type);

        if (status === 'Missing') {
            return <span className="req-missing"><XCircle size={14} /> Missing</span>;
        }

        return (
            <div className="req-item">
                <a href={url} target="_blank" rel="noopener noreferrer" className="req-link" title="View Document">
                    <FileText size={14} /> View
                </a>
                {/* Optional: Show specific status if needed, e.g. 'Rejected' */}
                {status === 'Rejected' && <span className="status-dot rejected" title="Rejected"></span>}
            </div>
        );
    };

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-main">
                <div className="page-header">
                    <h1>Student Requirements Verification</h1>
                    <p>Review and verify submitted requirements for students in your college.</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="filter-section" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={20} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: filterStatus === 'all' ? '#6c757d' : 'white', color: filterStatus === 'all' ? 'white' : '#333', cursor: 'pointer', marginRight: '5px' }}
                        >
                            All Students
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('pending')}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: filterStatus === 'pending' ? '#007bff' : 'white', color: filterStatus === 'pending' ? 'white' : '#333', cursor: 'pointer', marginRight: '5px' }}
                        >
                            Pending Verification
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'missing' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('missing')}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: filterStatus === 'missing' ? '#dc3545' : 'white', color: filterStatus === 'missing' ? 'white' : '#333', cursor: 'pointer', marginRight: '5px' }}
                        >
                            Missing Requirements
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'verified' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('verified')}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: filterStatus === 'verified' ? '#28a745' : 'white', color: filterStatus === 'verified' ? 'white' : '#333', cursor: 'pointer' }}
                        >
                            Verified
                        </button>
                    </div>
                </div>

                <div className="users-table-container">
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px' }}>
                            <FileText size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>No students found matching your filters.</p>
                        </div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>COR</th>
                                    <th>Resume/CV</th>
                                    <th>App Letter</th>
                                    <th>Endorsement</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.profile?.student_id || student.username}</td>
                                        <td>{student.first_name} {student.last_name}</td>
                                        <td>{renderRequirementCell(student, 'COR')}</td>
                                        <td>{renderRequirementCell(student, 'Resume/CV')}</td>
                                        <td>{renderRequirementCell(student, 'Application Letter')}</td>
                                        <td>{renderRequirementCell(student, 'Endorsement Letter')}</td>
                                        <td>
                                            {(() => {
                                                const status = getOverallStatus(student);
                                                return (
                                                    <span className="badge" style={{ background: status.color, color: status.textColor, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                                                        {status.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            {canVerify(student) && (
                                                <button
                                                    onClick={() => handleApprove(student.id)}
                                                    className="action-btn approve-btn"
                                                    title="Verify & Approve"
                                                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                >
                                                    <CheckCircle size={16} />
                                                    Verify
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>


                <style>{`
                    .req-missing {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        color: #dc3545;
                        font-size: 0.85rem;
                    }
                    .req-link {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        color: #007bff;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 0.85rem;
                        padding: 4px 8px;
                        border-radius: 4px;
                        background: #f0f7ff;
                    }
                    .req-link:hover {
                        background: #e0efff;
                    }
                    .req-item {
                        display: flex;
                        align-items: center;
                    }
                `}</style>
            </div>
        </div>
    );
}

export default CoordinatorRequirements;
