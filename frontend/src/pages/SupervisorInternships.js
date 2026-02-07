import React, { useState, useEffect } from "react";
import axios from "axios";
import SupervisorSidebar from "./SupervisorSidebar";
import "./AdminDashboard.css";

function SupervisorInternships() {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        position: "",
        description: "",
        slots: 1,
        required_skills: "",
        required_courses: "",
        work_location: "Manila",
        work_location: "Manila",
        stipend: "",
        position_type: "Full-time"
    });

    const LOCATIONS = [
        "Manila", "Makati", "Taguig (BGC)", "Quezon City", "Pasig (Ortigas)",
        "Mandaluyong", "Pasay", "Caloocan", "Las Piñas", "Malabon", "Marikina",
        "Muntinlupa", "Navotas", "Parañaque", "San Juan", "Valenzuela",
        "Remote", "Hybrid"
    ];
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchInternships();
    }, []);

    const fetchInternships = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8000/api/internships/", {
                headers: { Authorization: `Token ${token}` },
            });
            setInternships(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching internships:", err);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openNewModal = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            position: "",
            description: "",
            slots: 1,
            required_skills: "",
            required_courses: "",
            work_location: "Manila",
            work_location: "Manila",
            stipend: "",
            position_type: "Full-time"
        });
        setShowModal(true);
    };

    const handleEdit = (internship) => {
        setIsEditing(true);
        setEditId(internship.id);
        setFormData({
            position: internship.position,
            description: internship.description,
            slots: internship.slots,
            required_skills: internship.required_skills || "",
            required_courses: internship.required_courses || "",
            work_location: internship.work_location || "Manila",
            work_location: internship.work_location || "Manila",
            stipend: internship.stipend || "",
            position_type: internship.position_type || "Full-time",
            company_id: internship.company.id
        });
        setShowModal(true);
    };

    const handleDisable = async (internship) => {
        if (!window.confirm("Disable this position? (Sets slots to 0)")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:8000/api/internships/${internship.id}/`,
                { ...internship, slots: 0 },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess("Internship disabled");
            fetchInternships();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error disabling:", err);
            setError("Failed to disable internship");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleEnable = async (internship) => {
        const slots = window.prompt("Enter number of slots to enable:", "1");
        if (slots === null) return;
        const numSlots = parseInt(slots);
        if (isNaN(numSlots) || numSlots < 0) return alert("Invalid slots number");

        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:8000/api/internships/${internship.id}/`,
                { ...internship, slots: numSlots },
                { headers: { Authorization: `Token ${token}` } }
            );
            setSuccess("Internship enabled");
            fetchInternships();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error enabling:", err);
            setError("Failed to enable internship");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this internship posting?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:8000/api/internships/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setSuccess("Internship deleted successfully");
            fetchInternships();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Failed to delete internship");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            if (isEditing) {
                await axios.put(`http://localhost:8000/api/internships/${editId}/`, formData, {
                    headers: { Authorization: `Token ${token}` },
                });
                setSuccess("Internship updated successfully!");
            } else {
                await axios.post("http://localhost:8000/api/internships/", formData, {
                    headers: { Authorization: `Token ${token}` },
                });
                setSuccess("Internship posted successfully!");
            }

            setShowModal(false);
            fetchInternships();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to save internship");
        }
    };

    return (
        <div className="admin-container">
            <SupervisorSidebar />
            <div className="admin-content">
                <header className="admin-header">
                    <h1>Internship Postings</h1>
                    <button className="add-btn" onClick={openNewModal}>
                        + Post New Internship
                    </button>
                </header>

                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div>
                        {internships.length === 0 ? (
                            <div className="no-data">
                                <p>No internships posted yet.</p>
                                <button className="btn-primary" onClick={openNewModal} style={{ marginTop: '10px' }}>
                                    Create Your First Posting
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '220px 120px 80px 150px 120px 100px 160px',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    background: '#f8f9fa',
                                    borderRadius: '8px 8px 0 0',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '2px solid #e5e7eb'
                                }}>
                                    <div>Position</div>
                                    <div>Type</div>
                                    <div>Slots</div>

                                    <div>Location</div>
                                    <div>Date Posted</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                </div>

                                {/* Table Body */}
                                <div style={{ background: 'white', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                    {internships.map((internship, index) => (
                                        <div
                                            key={internship.id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '220px 120px 80px 150px 120px 100px 160px',
                                                gap: '16px',
                                                padding: '20px',
                                                borderBottom: index < internships.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                transition: 'background 0.2s ease',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Position */}
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                                {internship.position}
                                            </div>

                                            {/* Type */}
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {internship.position_type || internship.type}
                                            </div>

                                            {/* Slots */}
                                            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                                                {internship.slots}
                                            </div>

                                            {/* Hours */}


                                            {/* Location */}
                                            <div style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {internship.work_location || internship.location || "N/A"}
                                            </div>

                                            {/* Date Posted */}
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {new Date(internship.created_at).toLocaleDateString()}
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background: internship.slots > 0 ? '#10b981' : '#9ca3af',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    display: 'inline-block'
                                                }}>
                                                    {internship.slots > 0 ? 'ACTIVE' : 'FILLED'}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleEdit(internship)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                {internship.slots > 0 ? (
                                                    <button
                                                        onClick={() => handleDisable(internship)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#f59e0b',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Disable
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEnable(internship)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Enable
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(internship.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{isEditing ? 'Edit Internship' : 'Post New Internship'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Position Title *</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Web Developer Intern"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Position Type</label>
                                            <select
                                                name="position_type"
                                                value={formData.position_type}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Slots Available *</label>
                                            <input
                                                type="number"
                                                name="slots"
                                                value={formData.slots}
                                                onChange={handleInputChange}
                                                min="0"
                                                required
                                            />
                                            <small style={{ color: '#666', fontSize: '11px' }}>Set to 0 to disable/mark as filled</small>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Description *</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                            rows="4"
                                            placeholder="Describe the role, responsibilities, and what students will learn..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Required Skills</label>
                                        <input
                                            type="text"
                                            name="required_skills"
                                            value={formData.required_skills}
                                            onChange={handleInputChange}
                                            placeholder="e.g. React, Python, SQL (comma separated)"
                                        />
                                    </div>

                                    <div className="form-row">

                                        <div className="form-group">
                                            <label>Work Location *</label>
                                            <select
                                                name="work_location"
                                                value={formData.work_location}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                {LOCATIONS.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Stipend (optional)</label>
                                        <input
                                            type="text"
                                            name="stipend"
                                            value={formData.stipend}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 5000 or Unpaid"
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary">
                                            {isEditing ? 'Update Internship' : 'Post Internship'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupervisorInternships;
