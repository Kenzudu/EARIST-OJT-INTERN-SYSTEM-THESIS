import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentProfile.css';
import SupervisorHeader from './SupervisorHeader';

const baseURL = 'http://localhost:8000/api';

const COLLEGES = [
    { code: 'CAS', name: 'College of Arts and Sciences' },
    { code: 'CBA', name: 'College of Business Administration' },
    { code: 'CED', name: 'College of Education' },
    { code: 'CEN', name: 'College of Engineering' },
    { code: 'CHM', name: 'College of Hospitality Management' },
    { code: 'CIT', name: 'College of Industrial Technology' },
    { code: 'CPAC', name: 'College of Public Administration and Criminology' },
    { code: 'CAFA', name: 'College of Architecture and Fine Arts' },
    { code: 'CCS', name: 'College of Computing Studies' }
];

function SupervisorProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        user: {},
        first_name: '',
        last_name: '',
        company: '',
        position: '',
        phone: '',
        target_colleges: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkSupervisorAccess();
        fetchProfile();
    }, []);

    const checkSupervisorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'supervisor') {
            navigate('/login');
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/supervisor/profile/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const user = JSON.parse(localStorage.getItem('user'));
            const profileData = {
                user: user,
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                company: res.data.company_name || 'Not Assigned',
                position: res.data.position || 'OJT Supervisor',
                phone: res.data.phone || '',
                target_colleges: res.data.target_colleges || []
            };

            setProfile(profileData);
            setFormData(profileData);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone" && !/^\d*$/.test(value)) {
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleCollegeToggle = (collegeCode) => {
        const currentColleges = formData.target_colleges || [];
        const newColleges = currentColleges.includes(collegeCode)
            ? currentColleges.filter(c => c !== collegeCode)
            : [...currentColleges, collegeCode];
        setFormData({ ...formData, target_colleges: newColleges });
    };

    const handleSelectAll = () => {
        const allCodes = COLLEGES.map(c => c.code);
        setFormData({ ...formData, target_colleges: allCodes });
    };

    const handleDeselectAll = () => {
        setFormData({ ...formData, target_colleges: [] });
    };

    const handleSave = async () => {
        try {
            setError('');
            setSuccess('');

            await axios.put(`${baseURL}/supervisor/profile/`, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                target_colleges: formData.target_colleges
            }, {
                headers: { Authorization: `Token ${token}` }
            });

            // Update user in localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                user.first_name = formData.first_name;
                user.last_name = formData.last_name;
                user.full_name = `${formData.first_name} ${formData.last_name}`.trim();
                localStorage.setItem('user', JSON.stringify(user));
            }

            setProfile(formData);
            setEditMode(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleCancel = () => {
        setFormData({ ...profile });
        setEditMode(false);
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <SupervisorHeader
                title="My Profile"
                subtitle="View and manage your supervisor profile"
            />

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="profile-content">
                {/* Account Information */}
                <div className="profile-section">
                    <h2>Account Information</h2>
                    {editMode ? (
                        <div className="profile-form">
                            <div className="form-group-row" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        placeholder="First Name"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-grid">
                            <div className="profile-item">
                                <label>Username</label>
                                <p className="profile-value">{profile.user.username || 'N/A'}</p>
                            </div>
                            <div className="profile-item">
                                <label>Email</label>
                                <p className="profile-value">{profile.user.email || 'N/A'}</p>
                            </div>
                            <div className="profile-item">
                                <label>Full Name</label>
                                <p className="profile-value">
                                    {profile.first_name && profile.last_name
                                        ? `${profile.first_name} ${profile.last_name}`
                                        : profile.user.first_name && profile.user.last_name
                                            ? `${profile.user.first_name} ${profile.user.last_name}`
                                            : 'Not set'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Company Assignment */}
                <div className="profile-section">
                    <h2>Company Assignment</h2>
                    <div className="profile-grid">
                        <div className="profile-item">
                            <label>Company</label>
                            <p className="profile-value" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                {profile.company}
                            </p>
                        </div>
                        <div className="profile-item">
                            <label>Position</label>
                            <p className="profile-value">{profile.position}</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information & Target Colleges */}
                <div className="profile-section">
                    <h2>Contact Information & Target Colleges</h2>
                    {editMode ? (
                        <div className="profile-form">
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Your phone number"
                                />
                            </div>

                            <div className="form-group">
                                <label>Target Colleges</label>
                                <div style={{ marginBottom: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        style={{
                                            padding: '6px 12px',
                                            marginRight: '8px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '10px',
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    background: '#f9f9f9'
                                }}>
                                    {COLLEGES.map(college => (
                                        <label key={college.code} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            background: 'white',
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.target_colleges || []).includes(college.code)}
                                                onChange={() => handleCollegeToggle(college.code)}
                                                style={{ marginRight: '10px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '14px' }}>
                                                <strong>{college.code}</strong> - {college.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <small style={{ display: 'block', marginTop: '8px', color: '#666', fontSize: '0.85rem' }}>
                                    Select all colleges that can see your company's job postings
                                </small>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button onClick={handleSave} className="submit-btn">
                                    Save Changes
                                </button>
                                <button onClick={handleCancel} className="cancel-btn">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="profile-grid">
                                <div className="profile-item">
                                    <label>Phone</label>
                                    <p className="profile-value">{profile.phone || 'Not set'}</p>
                                </div>
                                <div className="profile-item">
                                    <label>Target Colleges</label>
                                    <p className="profile-value">
                                        {profile.target_colleges && profile.target_colleges.length > 0
                                            ? profile.target_colleges.join(', ')
                                            : 'No colleges selected'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <button onClick={() => setEditMode(true)} className="edit-btn">
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SupervisorProfile;
