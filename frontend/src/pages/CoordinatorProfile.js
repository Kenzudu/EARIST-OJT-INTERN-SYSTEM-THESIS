import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentProfile.css';
import CoordinatorHeader from './CoordinatorHeader';

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

function CoordinatorProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        user: {},
        first_name: '',
        last_name: '',
        college: '',
        phone: '',
        office_location: '',
        department: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        checkCoordinatorAccess();
        fetchProfile();
    }, []);

    const checkCoordinatorAccess = () => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'coordinator') {
            navigate('/login');
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/coordinator/profile/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const user = JSON.parse(localStorage.getItem('user'));
            const profileData = {
                user: user,
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                college: res.data.college || 'Not Assigned',
                phone: res.data.phone || '',
                office_location: res.data.office_location || '',
                department: res.data.department || ''
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

    const handleSave = async () => {
        try {
            setError('');
            setSuccess('');

            await axios.put(`${baseURL}/coordinator/profile/`, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                office_location: formData.office_location,
                department: formData.department
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

    // Get college full name
    const getCollegeName = (code) => {
        const college = COLLEGES.find(c => c.code === code);
        return college ? college.name : code;
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <CoordinatorHeader
                title="My Profile"
                subtitle="View and manage your coordinator profile"
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

                {/* College Assignment */}
                <div className="profile-section">
                    <h2>College Assignment</h2>
                    <div className="profile-grid">
                        <div className="profile-item">
                            <label>College Code</label>
                            <p className="profile-value" style={{ fontWeight: 'bold', color: '#667eea', fontSize: '1.1rem' }}>
                                {profile.college}
                            </p>
                        </div>
                        <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                            <label>College Name</label>
                            <p className="profile-value" style={{ fontWeight: '600', color: '#333' }}>
                                {getCollegeName(profile.college)}
                            </p>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: '#e8eaf6',
                        borderLeft: '4px solid #667eea',
                        borderRadius: '4px'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                            <strong>Note:</strong> You can manage students, applications, and internships for <strong>{getCollegeName(profile.college)}</strong>.
                        </p>
                    </div>
                </div>

                {/* Contact Information & Office Details */}
                <div className="profile-section">
                    <h2>Contact Information & Office Details</h2>
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
                                    maxLength="11"
                                />
                            </div>

                            <div className="form-group">
                                <label>Office Location</label>
                                <input
                                    type="text"
                                    name="office_location"
                                    value={formData.office_location}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Room 301, Admin Building"
                                />
                            </div>

                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="e.g., OJT Coordination Office"
                                />
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button onClick={handleSave} className="submit-btn" style={{ padding: '10px 20px' }}>
                                    Save Changes
                                </button>
                                <button onClick={handleCancel} className="cancel-btn" style={{ padding: '10px 20px' }}>
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
                                    <label>Office Location</label>
                                    <p className="profile-value">{profile.office_location || 'Not set'}</p>
                                </div>
                                <div className="profile-item">
                                    <label>Department</label>
                                    <p className="profile-value">{profile.department || 'Not set'}</p>
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

export default CoordinatorProfile;
