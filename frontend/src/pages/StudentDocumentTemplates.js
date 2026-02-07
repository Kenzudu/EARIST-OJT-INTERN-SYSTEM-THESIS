import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDocuments.css"; // Reuse styling from Admin Documents

function StudentDocumentTemplates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    const baseURL = "http://localhost:8000/api/";
    const mediaURL = "http://localhost:8000";

    const templateTypes = [
        "Endorsement Letter",
        "Acceptance Letter",
        "Evaluation Form",
        "Waiver",
        "Consent Letter",
        "Training Plan",
        "Contract",
        "Medical Certificate",
        "Other"
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            const res = await axios.get(`${baseURL}document-templates/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setTemplates(res.data);
            setError("");
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Unable to load document templates. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return null;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        if (fileUrl.startsWith('/media/')) {
            return `${mediaURL}${fileUrl}`;
        }
        return `${mediaURL}/media/${fileUrl}`;
    };

    // Filter and Sort Logic
    const filteredTemplates = templates
        .filter((template) => {
            const matchesSearch =
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (template.template_type && template.template_type.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = filterType === "All" || template.template_type === filterType;

            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
            if (sortBy === "oldest") {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            }
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });

    return (
        <div className="admin-documents-page">
            <div className="dashboard-content">
                <div className="page-header">
                    <div>
                        <h1>Document Templates</h1>
                        <p className="page-subtitle">
                            Download necessary forms and templates for your internship requirements.
                        </p>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {loading && <div className="alert alert-info">Loading templates...</div>}

                {!loading && (
                    <div className="filter-controls">
                        <div className="search-box">
                            <div className="search-input-wrapper">
                                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#999" />
                                    <path d="M21 21L16.65 16.65" stroke="#999" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="filter-select"
                            >
                                <option value="All">All Categories</option>
                                {templateTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="data-section">
                    <div className="section-header">
                        <h2>
                            {filterType === "All" ? "All Documents" : `${filterType}s`}
                            <span className="count-badge">{filteredTemplates.length}</span>
                        </h2>
                    </div>

                    {filteredTemplates.length > 0 ? (
                        <div className="templates-grid">
                            {filteredTemplates.map((template) => (
                                <div key={template.id} className="template-card">
                                    <div className="template-icon">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#4CAF50" />
                                            <polyline points="14 2 14 8 20 8" stroke="#4CAF50" />
                                            <line x1="16" y1="13" x2="8" y2="13" stroke="#4CAF50" />
                                            <line x1="16" y1="17" x2="8" y2="17" stroke="#4CAF50" />
                                            <polyline points="10 9 9 9 8 9" stroke="#4CAF50" />
                                        </svg>
                                    </div>
                                    <div className="template-info">
                                        <h3>{template.name}</h3>
                                        {template.description && (
                                            <p className="template-description">{template.description}</p>
                                        )}
                                        <div className="template-meta">
                                            <span className="category-badge">{template.template_type || 'Uncategorized'}</span>
                                        </div>
                                    </div>
                                    <div className="template-actions">
                                        {template.file && (
                                            <a
                                                href={getFileUrl(template.file)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-view"
                                                title="Download Template"
                                                style={{ width: '100%', textAlign: 'center', display: 'block' }}
                                            >
                                                Download
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No templates found matching your criteria.</p>
                            {searchTerm && <button className="btn-secondary" onClick={() => setSearchTerm("")}>Clear Search</button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentDocumentTemplates;
