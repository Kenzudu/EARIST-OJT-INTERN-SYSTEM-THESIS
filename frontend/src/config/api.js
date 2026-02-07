// API Configuration
// This file centralizes all API endpoint configurations

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default API_BASE_URL;

// Usage in components:
// import API_BASE_URL from '../config/api';
// const response = await axios.get(`${API_BASE_URL}/endpoint/`);
