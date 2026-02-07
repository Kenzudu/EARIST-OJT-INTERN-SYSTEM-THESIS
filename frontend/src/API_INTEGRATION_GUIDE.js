// =============================================================
// API Integration Guide - Frontend Usage
// =============================================================

/**
 * BASE CONFIGURATION
 */

// File: src/api.js (Already configured)
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

export default api;


/**
 * AUTHENTICATION FUNCTIONS
 */

// 1. Register New User
async function registerUser(username, email, password) {
  try {
    const response = await api.post('register/', {
      username,
      email,
      password
    });
    console.log('User registered:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data);
    throw error;
  }
}

// 2. Login User
async function loginUser(username, password) {
  try {
    const response = await api.post('login/', {
      username,
      password
    });

    // Store token and user info
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data);
    throw error;
  }
}

// 3. Logout User
function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('User logged out');
}

// 4. Get Token from Storage
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
}


/**
 * DASHBOARD API CALLS
 */

// 1. Get General Dashboard
async function getDashboard() {
  try {
    const response = await api.get('dashboard/', {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    throw error;
  }
}

// 2. Get Admin Dashboard
async function getAdminDashboard() {
  try {
    const response = await api.get('admin/dashboard/', {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Admin dashboard fetch error:', error);
    throw error;
  }
}

// 3. Get Student Dashboard
async function getStudentDashboard() {
  try {
    const response = await api.get('student/dashboard/', {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Student dashboard fetch error:', error);
    throw error;
  }
}


/**
 * COMPANIES API CALLS
 */

// 1. Get All Companies
async function getAllCompanies() {
  try {
    const response = await api.get('companies/');
    return response.data;
  } catch (error) {
    console.error('Get companies error:', error);
    throw error;
  }
}

// 2. Get Single Company
async function getCompanyDetail(id) {
  try {
    const response = await api.get(`companies/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Get company detail error:', error);
    throw error;
  }
}

// 3. Create Company (Admin only)
async function createCompany(name, address, contactPerson, contactEmail) {
  try {
    const response = await api.post('companies/', {
      name,
      address,
      contact_person: contactPerson,
      contact_email: contactEmail
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Create company error:', error);
    throw error;
  }
}

// 4. Update Company
async function updateCompany(id, companyData) {
  try {
    const response = await api.put(`companies/${id}/`, companyData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Update company error:', error);
    throw error;
  }
}

// 5. Delete Company
async function deleteCompany(id) {
  try {
    await api.delete(`companies/${id}/`, {
      headers: getAuthHeader()
    });
    console.log('Company deleted successfully');
  } catch (error) {
    console.error('Delete company error:', error);
    throw error;
  }
}


/**
 * INTERNSHIPS API CALLS
 */

// 1. Get All Internships
async function getAllInternships() {
  try {
    const response = await api.get('internships/');
    return response.data;
  } catch (error) {
    console.error('Get internships error:', error);
    throw error;
  }
}

// 2. Get Single Internship
async function getInternshipDetail(id) {
  try {
    const response = await api.get(`internships/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Get internship detail error:', error);
    throw error;
  }
}

// 3. Create Internship (Admin only)
async function createInternship(company, position, description, slots) {
  try {
    const response = await api.post('internships/', {
      company,
      position,
      description,
      slots
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Create internship error:', error);
    throw error;
  }
}

// 4. Update Internship
async function updateInternship(id, internshipData) {
  try {
    const response = await api.put(`internships/${id}/`, internshipData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Update internship error:', error);
    throw error;
  }
}

// 5. Delete Internship
async function deleteInternship(id) {
  try {
    await api.delete(`internships/${id}/`, {
      headers: getAuthHeader()
    });
    console.log('Internship deleted successfully');
  } catch (error) {
    console.error('Delete internship error:', error);
    throw error;
  }
}


/**
 * APPLICATIONS API CALLS
 */

// 1. Get All Applications
async function getAllApplications() {
  try {
    const response = await api.get('applications/', {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get applications error:', error);
    throw error;
  }
}

// 2. Get Single Application
async function getApplicationDetail(id) {
  try {
    const response = await api.get(`applications/${id}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get application detail error:', error);
    throw error;
  }
}

// 3. Create Application (Student applies for internship)
async function createApplication(internshipId) {
  try {
    const response = await api.post('applications/', {
      internship: internshipId
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Create application error:', error);
    throw error;
  }
}

// 4. Update Application Status (Admin updates status)
async function updateApplication(id, status) {
  try {
    const response = await api.put(`applications/${id}/`, {
      status
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Update application error:', error);
    throw error;
  }
}

// 5. Delete Application
async function deleteApplication(id) {
  try {
    await api.delete(`applications/${id}/`, {
      headers: getAuthHeader()
    });
    console.log('Application deleted successfully');
  } catch (error) {
    console.error('Delete application error:', error);
    throw error;
  }
}


/**
 * EXAMPLE USAGE IN REACT COMPONENT
 */

/*

import React, { useEffect, useState } from 'react';
import {
  loginUser,
  logoutUser,
  getStudentDashboard,
  getAllInternships,
  createApplication,
  getAuthHeader
} from '../api-helpers';

function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getStudentDashboard();
      const internshipsData = await getAllInternships();

      setDashboard(dashboardData);
      setInternships(internshipsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (internshipId) => {
    try {
      await createApplication(internshipId);
      alert('Application submitted successfully!');
      fetchData(); // Refresh dashboard
    } catch (error) {
      alert('Failed to submit application');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Applications: {dashboard?.total_applications}</p>

      <h2>Available Internships</h2>
      {internships.map(internship => (
        <div key={internship.id}>
          <h3>{internship.position}</h3>
          <p>{internship.description}</p>
          <button onClick={() => handleApply(internship.id)}>
            Apply Now
          </button>
        </div>
      ))}
    </div>
  );
}

export default StudentDashboard;

*/


/**
 * ERROR HANDLING BEST PRACTICES
 */

// Always wrap API calls in try-catch
// Handle different error statuses:
// - 401: Unauthorized (token expired, needs login)
// - 403: Forbidden (not enough permissions)
// - 404: Not Found
// - 400: Bad Request (validation error)
// - 500: Server Error

// Example error handler:
/*
function handleApiError(error) {
  if (error.response?.status === 401) {
    // Token expired, redirect to login
    logoutUser();
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Not authorized for this action
    alert('You do not have permission to perform this action');
  } else if (error.response?.status === 400) {
    // Validation error
    alert('Invalid data: ' + JSON.stringify(error.response.data));
  } else {
    // Generic error
    alert('An error occurred. Please try again.');
  }
}
*/
