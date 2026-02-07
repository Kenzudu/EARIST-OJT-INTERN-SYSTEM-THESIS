import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./AdminUsers.css";
import { Edit, Trash2, Eye, UserCog, FileText, FileX, CheckCircle, LineChart } from 'lucide-react';
import progressIcon from "./images/1810679.png";

const baseURL = "http://localhost:8000/api";
const mediaURL = "http://localhost:8000";

// Helper function to get full URL for COR document
const getCorDocumentUrl = (corUrl) => {
  if (!corUrl) return null;
  // If it's already a full URL, return it
  if (corUrl.startsWith('http://') || corUrl.startsWith('https://')) {
    return corUrl;
  }
  // If it starts with /media/, just prepend the base URL
  if (corUrl.startsWith('/media/')) {
    return `${mediaURL}${corUrl}`;
  }
  // Otherwise, assume it's a relative path and prepend /media/
  return `${mediaURL}/media/${corUrl}`;
};

// Helper function to mask phone number
const maskPhone = (phone) => {
  if (!phone) return "—";
  if (phone.length <= 4) return "*".repeat(phone.length);

  const visiblePart = phone.substring(0, phone.length - 4);
  return `${visiblePart}****`;
};

// All available courses grouped by college/department
const COURSES_BY_COLLEGE = {
  "College of Architecture and Fine Arts": [
    "Bachelor of Science in Architecture (BS ARCHI.)",
    "Bachelor of Science in Interior Design (BSID)",
    "Bachelor in Fine Arts (BFA) - Major in Painting",
    "Bachelor in Fine Arts (BFA) - Major in Visual Communication"
  ],
  "College of Arts and Sciences": [
    "Bachelor of Science in Applied Physics with Computer Science Emphasis (BSAP)",
    "Bachelor of Science in Psychology (BSPSYCH)",
    "Bachelor of Science in Mathematics (BSMATH)"
  ],
  "College of Computer Studies": [
    "Bachelor of Science in Computer Science (BSCS)",
    "Bachelor of Science in Information Technology (BS INFO. TECH.)"
  ],
  "College of Business Administration": [
    "Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management",
    "Bachelor of Science in Business Administration (BSBA) - Major in Human Resource Development Management (HRDM)",
    "Bachelor of Science in Entrepreneurship (BSEM)",
    "Bachelor of Science in Office Administration (BSOA)"
  ],
  "College of Education": [
    "Bachelor in Secondary Education (BSE) - Major in Science",
    "Bachelor in Secondary Education (BSE) - Major in Mathematics",
    "Bachelor in Secondary Education (BSE) - Major in Filipino",
    "Bachelor in Special Needs Education (BSNEd)",
    "Bachelor in Technology and Livelihood Education (BTLE) - Major in Home Economics",
    "Bachelor in Technology and Livelihood Education (BTLE) - Major in Industrial Arts",
    "Professional Education / Subjects 18 units (TCP)"
  ],
  "College of Engineering": [
    "Bachelor of Science in Chemical Engineering (BSCHE)",
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Electrical Engineering (BSEE)",
    "Bachelor of Science in Electronics and Communication Engineering (BSECE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Science in Computer Engineering (BSCOE)"
  ],
  "College of Hospitality Management": [
    "Bachelor of Science in Tourism Management (BST)",
    "Bachelor of Science in Hospitality Management (BSHM)"
  ],
  "College of Industrial Technology": [
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Automotive Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Electrical Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Electronics Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Food Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Fashion and Apparel Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Industrial Chemistry",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Drafting Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Machine Shop Technology",
    "Bachelor of Science in Industrial Technology (BSIT) - Major in Refrigeration and Air Conditioning"
  ],
  "College of Public Administration and Criminology": [
    "Bachelor in Public Administration (BPA)",
    "Bachelor of Science in Criminology (BSCRIM)"
  ]
};

const COLLEGE_CODES = {
  'CAS': 'College of Arts and Sciences',
  'CBA': 'College of Business Administration',
  'CED': 'College of Education',
  'CEN': 'College of Engineering',
  'CHM': 'College of Hospitality Management',
  'CIT': 'College of Industrial Technology',
  'CPAC': 'College of Public Administration and Criminology',
  'CAFA': 'College of Architecture and Fine Arts',
  'CCS': 'College of Computer Studies',
  'GS': 'Graduate School'
};

// Flatten all courses for filtering logic
const ALL_COURSES = Object.values(COURSES_BY_COLLEGE).flat();

// All available years
const ALL_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year"
];

function AdminUsers({ apiEndpoint }) {
  const isCoordinatorView = !!apiEndpoint;
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState("students"); // "students", "admins"
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [statistics, setStatistics] = useState({
    total_users: 0,
    total_students: 0,
    total_coordinators: 0,
    total_supervisors: 0,
    total_admins: 0,
  });
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_staff: false,
    role: "student",
    student_id: "",
    college: "",
    course: "",
    year: "",
    section: "",
    department: "",
    company_id: ""
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'role', direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Sync Top Scrollbar with Table Scrollbar
  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);

  // Handlers for Scroll Sync (Used in JSX onScroll)
  const handleTableScroll = (e) => {
    const top = topScrollRef.current;
    const table = e.target;
    // Check if difference is significant (>2px) to prevent loop
    if (top && table && Math.abs(top.scrollLeft - table.scrollLeft) > 2) {
      top.scrollLeft = table.scrollLeft;
    }
  };

  const handleTopScroll = (e) => {
    const table = tableContainerRef.current;
    const top = e.target;
    if (top && table && Math.abs(table.scrollLeft - top.scrollLeft) > 2) {
      table.scrollLeft = top.scrollLeft;
    }
  };

  // Initial Width Sync Effect
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const topScrollContainer = topScrollRef.current;
    if (!tableContainer || !topScrollContainer) return;

    // Sync width logic (DOM only)
    const syncWidth = () => {
      const dummy = topScrollContainer.querySelector('.top-scroll-dummy');
      const tableContent = tableContainer.querySelector('table');
      if (dummy && tableContent) {
        const width = tableContent.scrollWidth || tableContent.offsetWidth;
        dummy.style.width = `${width}px`;
      }
    };

    // Initial Position Sync
    const syncPosition = () => {
      if (Math.abs(topScrollContainer.scrollLeft - tableContainer.scrollLeft) > 2) {
        topScrollContainer.scrollLeft = tableContainer.scrollLeft;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      syncWidth();
    });

    const tableContent = tableContainer.querySelector('table');
    if (tableContent) {
      resizeObserver.observe(tableContent);
    }

    // Immediate sync
    setTimeout(() => {
      syncWidth();
      syncPosition();
    }, 0);
    setTimeout(() => {
      syncWidth();
      syncPosition();
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [users, isCoordinatorView, userTypeFilter]);

  useEffect(() => {
    checkAccess();
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${baseURL}/companies/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setCompanies(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const checkAccess = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData?.is_staff && userRole !== 'coordinator') {
      window.location.href = "/student/dashboard";
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = apiEndpoint ? `${baseURL}${apiEndpoint}` : `${baseURL}/users/`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Token ${token}` },
      });
      const userList = res.data.results || res.data;
      setUsers(userList);

      // Fetch profiles for all users (students, coordinators, supervisors)
      const profilesMap = {};
      const usersToFetchProfiles = userList.filter(u => u.username !== 'admin' && u.role !== 'admin'); // Skip main admin if desired, or just fetch all

      for (const user of usersToFetchProfiles) {
        try {
          const profileRes = await axios.get(`${baseURL}/users/${user.id}/`, {
            headers: { Authorization: `Token ${token}` },
          });
          if (profileRes.data.profile) {
            profilesMap[user.id] = profileRes.data.profile;
          }
        } catch (err) {
          console.error(`Failed to fetch profile for user ${user.id}:`, err);
        }
      }

      setUserProfiles(profilesMap);

      // Calculate statistics by role
      const roleCount = {
        admin: 0,
        coordinator: 0,
        supervisor: 0,
        student: 0
      };

      userList.forEach(user => {
        const role = user.role || (user.is_staff ? 'admin' : 'student');
        if (roleCount[role] !== undefined) {
          roleCount[role]++;
        }
      });

      setStatistics({
        total_users: userList.length,
        total_students: roleCount.student,
        total_admins: roleCount.admin,
        total_coordinators: roleCount.coordinator,
        total_supervisors: roleCount.supervisor,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        delete updateData.password; // Don't send password for update
        await axios.put(`${baseURL}/users/${editingUser.id}/`, updateData, {
          headers: { Authorization: `Token ${token}` },
        });
        setSuccess("User updated successfully!");
      } else {
        // Create new user
        await axios.post(`${baseURL}/users/`, formData, {
          headers: { Authorization: `Token ${token}` },
        });
        setSuccess("User created successfully!");
      }

      resetForm();
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to save user"
      );
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    const profile = userProfiles[user.id] || {};
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      is_staff: user.is_staff,
      role: user.role || (user.is_staff ? 'admin' : 'student'),
      student_id: profile.student_id || "",
      college: profile.college || "",
      course: profile.course || "",
      year: profile.year || "",
      section: profile.section || "",
      department: profile.department || "",
      company_id: profile.company || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setError("");
        await axios.delete(`${baseURL}/users/${userId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setSuccess("User deleted successfully!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to delete user"
        );
      }
    }
  };

  const handleChangeRole = (user) => {
    setSelectedUserForRole(user);
    setSelectedRole(user.is_staff ? "admin" : "student");
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedRole) {
      alert("Please select a role");
      return;
    }

    try {
      setError("");
      const res = await axios.put(
        `${baseURL}/admin/users/${selectedUserForRole.id}/assign-role/`,
        { role: selectedRole },
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess(res.data.message || "Role changed successfully!");
      setShowRoleModal(false);
      setSelectedUserForRole(null);
      setSelectedRole("");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change role");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      is_staff: false,
      role: "student",
      student_id: "",
      college: "",
      course: "",
      year: "",
      section: "",
      department: "",
      company_id: ""
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const fetchStudentProgress = async (studentId) => {
    console.log('🔍 Fetching student progress for ID:', studentId);
    setLoadingProgress(true);
    try {
      const url = `${baseURL}/supervisor/students/${studentId}/attendance/`;
      console.log('📡 API URL:', url);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');

      const res = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });

      console.log('✅ Student progress data received:', res.data);
      setSelectedStudentProgress(res.data);
      setShowProgressModal(true);
    } catch (err) {
      console.error('❌ Error fetching student progress:', err);
      console.error('📋 Error response:', err.response);

      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to load student progress";
      setError(errorMsg);
      alert(`Error: ${errorMsg}\n\nPlease check the console for more details.`);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Get unique values for filter dropdowns
  const uniqueCourses = useMemo(() => {
    let courses = new Set();

    if (isCoordinatorView) {
      // If coordinator, get their college full name
      const userData = JSON.parse(localStorage.getItem("user"));
      const collegeCode = userData?.college;
      const collegeName = COLLEGE_CODES[collegeCode];

      if (collegeName && COURSES_BY_COLLEGE[collegeName]) {
        // Add all courses for this college
        COURSES_BY_COLLEGE[collegeName].forEach(c => courses.add(c));
      }
    } else {
      // If admin, start with all courses
      courses = new Set(ALL_COURSES);
    }

    // Also add any courses from user profiles (in case there are custom courses)
    Object.values(userProfiles).forEach(profile => {
      if (profile.course) courses.add(profile.course);
    });
    return Array.from(courses).sort();
  }, [userProfiles, isCoordinatorView]);

  const uniqueYears = useMemo(() => {
    // Start with all available years
    const years = new Set(ALL_YEARS);
    // Also add any years from user profiles (in case there are custom years)
    Object.values(userProfiles).forEach(profile => {
      if (profile.year) years.add(profile.year);
    });
    return Array.from(years).sort();
  }, [userProfiles]);

  const uniqueSections = useMemo(() => {
    const sections = new Set();
    Object.values(userProfiles).forEach(profile => {
      if (profile.section) sections.add(profile.section);
    });
    return Array.from(sections).sort();
  }, [userProfiles]);

  // Filter users based on user type, course, year, and section
  const filteredUsers = useMemo(() => {
    const result = users.filter(user => {
      const userRole = user.role || (user.is_staff ? 'admin' : 'student');

      // Role Filter
      if (userTypeFilter === "students" && userRole !== 'student') return false;
      if (userTypeFilter === "coordinators" && userRole !== 'coordinator') return false;
      if (userTypeFilter === "supervisors" && userRole !== 'supervisor') return false;
      if (userTypeFilter === "admins" && userRole !== 'admin') return false;

      const profile = userProfiles[user.id] || {};

      // Search Filter
      const activeSearchLower = activeSearchQuery ? activeSearchQuery.toLowerCase() : "";
      const searchMatch = !activeSearchQuery ||
        (profile.student_id && profile.student_id.toLowerCase().includes(activeSearchLower)) ||
        (user.username && user.username.toLowerCase().includes(activeSearchLower)) ||
        (user.email && user.email.toLowerCase().includes(activeSearchLower)) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(activeSearchLower);

      if (!searchMatch) return false;

      // Course/Year/Section Filters (Apply mostly to students)
      const courseMatch = !filterCourse || profile.course === filterCourse;
      const yearMatch = !filterYear || profile.year === filterYear;
      const sectionMatch = !filterSection || profile.section === filterSection;

      // If user is student, enforce academic filters
      if (userRole === 'student') {
        return courseMatch && yearMatch && sectionMatch;
      }
      return true;
    });

    // Sort the result
    return result.sort((a, b) => {
      // Determine sort key and direction
      const { key, direction } = sortConfig;

      // Default Sort (Role Priority) if no key or key is 'role'
      if (!key || key === 'role') {
        const rolePriority = { 'admin': 0, 'coordinator': 1, 'supervisor': 2, 'student': 3 };
        const getRole = (u) => u.role || (u.is_staff ? 'admin' : 'student');
        const roleA = rolePriority[getRole(a)] || 4;
        const roleB = rolePriority[getRole(b)] || 4;

        if (roleA !== roleB) {
          return direction === 'asc' ? roleA - roleB : roleB - roleA;
        }
        // Secondary sort by name if roles equal
        const nameA = (a.last_name || a.username || "").toLowerCase();
        const nameB = (b.last_name || b.username || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }

      // Dynamic Sort based on key
      const profileA = userProfiles[a.id] || {};
      const profileB = userProfiles[b.id] || {};

      let valA, valB;

      switch (key) {
        case 'student_id':
          valA = profileA.student_id ? profileA.student_id.toLowerCase() : (a.username || "").toLowerCase();
          valB = profileB.student_id ? profileB.student_id.toLowerCase() : (b.username || "").toLowerCase();
          break;
        case 'email':
          valA = (a.email || "").toLowerCase();
          valB = (b.email || "").toLowerCase();
          break;
        case 'full_name':
          valA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase().trim();
          valB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase().trim();
          break;
        case 'course':
          valA = (profileA.course || "").toLowerCase();
          valB = (profileB.course || "").toLowerCase();
          break;
        case 'year':
          valA = (profileA.year || "");
          valB = (profileB.year || "");
          break;
        case 'section':
          valA = (profileA.section || "").toLowerCase();
          valB = (profileB.section || "").toLowerCase();
          break;
        case 'college':
          valA = (profileA.college || "").toLowerCase();
          valB = (profileB.college || "").toLowerCase();
          break;
        case 'department':
          valA = (profileA.department || "").toLowerCase();
          valB = (profileB.department || "").toLowerCase();
          break;
        case 'company':
          // Use company_name or department for sorting
          valA = (profileA.company_name || profileA.department || "").toLowerCase();
          valB = (profileB.company_name || profileB.department || "").toLowerCase();
          break;
        case 'position':
          valA = (profileA.position || "").toLowerCase();
          valB = (profileB.position || "").toLowerCase();
          break;
        case 'phone':
          valA = (profileA.phone || "").replace(/\D/g, '');
          valB = (profileB.phone || "").replace(/\D/g, '');
          break;
        case 'date_joined':
          valA = new Date(a.date_joined || 0).getTime();
          valB = new Date(b.date_joined || 0).getTime();
          break;
        default:
          return 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, userProfiles, userTypeFilter, filterCourse, filterYear, filterSection, activeSearchQuery, sortConfig]);

  const handleApproveStudent = async (userId) => {
    if (!window.confirm("Approve this student registration?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${baseURL}/coordinator/students/bulk-approve/`,
        { student_ids: [userId] },
        { headers: { Authorization: `Token ${token}` } }
      );
      setSuccess("Student approved successfully!");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to approve student.");
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseURL}/export/users/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export users.");
    }
  };

  if (loading) return <div className="admin-loading">Loading users...</div>;

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h1>{isCoordinatorView ? "Student Management" : "User Management"}</h1>
        <div>
          <button
            onClick={handleExport}
            style={{
              padding: '12px 25px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginRight: '10px'
            }}
          >
            Export CSV
          </button>
          {!isCoordinatorView && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`add-user-btn ${showForm ? "cancel" : ""}`}
            >
              {showForm ? "Cancel" : "+ Add New User"}
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="metrics-grid">
        {isCoordinatorView ? (
          <div className="metric-card">
            <div className="metric-icon-wrapper">
              <div className="metric-icon metric-icon-blue">
                <UserCog size={24} />
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{statistics.total_students}</div>
              <div className="metric-label">Total Students</div>
            </div>
          </div>
        ) : (
          <>
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <div className="metric-icon metric-icon-blue">
                  <UserCog size={24} />
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{statistics.total_users}</div>
                <div className="metric-label">Total Users</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <div className="metric-icon metric-icon-green">
                  <UserCog size={24} />
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{statistics.total_students}</div>
                <div className="metric-label">Students</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <div className="metric-icon metric-icon-orange">
                  <UserCog size={24} />
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{statistics.total_coordinators || 0}</div>
                <div className="metric-label">Coordinators</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <div className="metric-icon metric-icon-purple">
                  <UserCog size={24} />
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{statistics.total_supervisors || 0}</div>
                <div className="metric-label">Supervisors</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <div className="metric-icon metric-icon-red">
                  <UserCog size={24} />
                </div>
              </div>
              <div className="metric-content">
                <div className="metric-value">{statistics.total_admins}</div>
                <div className="metric-label">Admins</div>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* User Type Filter Dropdown */}
      <div className="user-type-filter-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          {!isCoordinatorView && (
            <>
              <label style={{ fontSize: '1rem', fontWeight: '600', color: '#333', margin: 0 }}>View:</label>
              <select
                value={userTypeFilter}
                onChange={(e) => {
                  setUserTypeFilter(e.target.value);
                  // Clear filters and search when switching views
                  setFilterCourse("");
                  setFilterYear("");
                  setFilterSection("");
                  setSearchQuery("");
                  setActiveSearchQuery("");
                }}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  minWidth: '180px'
                }}
              >
                <option value="students">Students</option>
                <option value="coordinators">Coordinators</option>
                <option value="supervisors">Supervisors</option>
                <option value="admins">Admins</option>
                <option value="all">All Users</option>
              </select>
            </>
          )}

          {/* Search Input */}
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '250px', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder={userTypeFilter === "students" ? "Search by Student ID, Name, or Email..." : "Search by Username, Name, or Email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearchQuery(searchQuery);
                }
              }}
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            />
            <button
              onClick={() => {
                setIsSearching(true);
                setTimeout(() => {
                  setActiveSearchQuery(searchQuery);
                  setIsSearching(false);
                }, 1000);
              }}
              disabled={isSearching}
              style={{
                padding: '10px 20px',
                backgroundColor: isSearching ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                minWidth: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSearching ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid white',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    marginRight: '8px',
                    animation: 'spin 0.75s linear infinite',
                    display: 'inline-block'
                  }}></span>
                  Searching...
                </>
              ) : (
                '🔍 Search'
              )}
            </button>
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>

          {(searchQuery || activeSearchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveSearchQuery("");
              }}
              style={{
                padding: '10px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Student Filters - Only show when viewing students */}
      {userTypeFilter === "students" && (
        <div className="filter-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1rem', color: '#333' }}>Filter by Student Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Course</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={filterCourse || "Search or select course..."}
                  value={courseSearchTerm}
                  onChange={(e) => {
                    setCourseSearchTerm(e.target.value);
                    setShowCourseDropdown(true);
                    if (!e.target.value) {
                      setFilterCourse("");
                    }
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click events to fire
                    setTimeout(() => setShowCourseDropdown(false), 200);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize: '0.8rem',
                    color: '#666'
                  }}
                >
                  ▼
                </span>
                {showCourseDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      marginTop: '2px'
                    }}
                  >
                    {Object.entries(COURSES_BY_COLLEGE).map(([college, courses]) => {
                      // Filter courses based on search term
                      const filteredCourses = courses.filter(course => {
                        const matchesSearch = !courseSearchTerm ||
                          course.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                          college.toLowerCase().includes(courseSearchTerm.toLowerCase());
                        return matchesSearch && uniqueCourses.includes(course);
                      });

                      // Only show optgroup if it has matching courses
                      if (filteredCourses.length === 0) return null;

                      return (
                        <div key={college}>
                          <div
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#f8f9fa',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              color: '#555',
                              borderTop: '1px solid #eee',
                              borderBottom: '1px solid #eee'
                            }}
                          >
                            {college}
                          </div>
                          {filteredCourses.map(course => (
                            <div
                              key={course}
                              style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                backgroundColor: filterCourse === course ? '#e3f2fd' : 'white',
                                fontSize: '0.9rem',
                                borderLeft: filterCourse === course ? '3px solid #2196F3' : '3px solid transparent'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFilterCourse(course);
                                setCourseSearchTerm("");
                                setShowCourseDropdown(false);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = filterCourse === course ? '#e3f2fd' : 'white';
                              }}
                            >
                              {course}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {/* Show any custom courses not in the standard list */}
                    {uniqueCourses
                      .filter(course => {
                        const matchesSearch = !courseSearchTerm ||
                          course.toLowerCase().includes(courseSearchTerm.toLowerCase());
                        return matchesSearch && !ALL_COURSES.includes(course);
                      })
                      .map(course => (
                        <div
                          key={course}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            backgroundColor: filterCourse === course ? '#e3f2fd' : 'white',
                            fontSize: '0.9rem',
                            borderLeft: filterCourse === course ? '3px solid #2196F3' : '3px solid transparent'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFilterCourse(course);
                            setCourseSearchTerm("");
                            setShowCourseDropdown(false);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = filterCourse === course ? '#e3f2fd' : 'white';
                          }}
                        >
                          {course}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {filterCourse && (
                <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#666' }}>
                  Selected: <strong>{filterCourse}</strong>
                </div>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Section</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">All Sections</option>
                {uniqueSections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilterCourse("");
                  setFilterYear("");
                  setFilterSection("");
                  setCourseSearchTerm("");
                  setShowCourseDropdown(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}


      {/* Top Scrollbar for Horizontal Scrolling */}
      <div className="top-scroll-container" ref={topScrollRef} onScroll={handleTopScroll}>
        <div className="top-scroll-dummy"></div>
      </div>

      {/* Users Table */}
      <div className="users-table-container" ref={tableContainerRef} onScroll={handleTableScroll}>
        <table className="users-table">
          <thead>
            <tr>
              <th className="col-id clickable" onClick={() => handleSort('student_id')}>
                {userTypeFilter === "admins" ? "Username" : "Student ID"} {sortConfig.key === 'student_id' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-email clickable" onClick={() => handleSort('email')}>
                Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-name clickable" onClick={() => handleSort('full_name')}>
                Full Name {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              {userTypeFilter === "students" && (
                <>
                  <th className="col-course clickable" onClick={() => handleSort('course')}>
                    Course {sortConfig.key === 'course' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="col-year clickable" onClick={() => handleSort('year')}>
                    Year {sortConfig.key === 'year' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="col-section clickable" onClick={() => handleSort('section')}>
                    Section {sortConfig.key === 'section' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                </>
              )}

              {userTypeFilter === "coordinators" && (
                <>
                  <th className="col-college clickable" onClick={() => handleSort('college')}>
                    College {sortConfig.key === 'college' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="col-department clickable" onClick={() => handleSort('department')}>
                    Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                </>
              )}

              {userTypeFilter === "supervisors" && (
                <>
                  <th className="col-company clickable" onClick={() => handleSort('company')}>
                    Company / Department {sortConfig.key === 'company' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="col-position clickable" onClick={() => handleSort('position')}>
                    Position {sortConfig.key === 'position' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                </>
              )}

              {/* Phone is common for all non-admin roles */}
              {userTypeFilter !== "admins" && (
                <th className="col-phone clickable" onClick={() => handleSort('phone')}>
                  Phone Number {sortConfig.key === 'phone' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
              )}
              <th className="col-date clickable" onClick={() => handleSort('date_joined')}>
                Registered Date {sortConfig.key === 'date_joined' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-role clickable" onClick={() => handleSort('role')}>
                Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const profile = userProfiles[user.id] || {};
              const isHovered = hoveredUserId === user.id;
              // Determine if user is a student (either explicit role 'student' or not staff/other roles)
              const isStudent = user.role === 'student' || (!user.role && !user.is_staff);

              return (
                <tr
                  key={user.id}
                  onMouseEnter={() => isStudent && setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
                  style={{ position: 'relative' }}
                >
                  <td>{user.is_staff ? user.username : (profile.student_id || user.username)}</td>
                  <td>{user.email}</td>
                  <td>{`${user.first_name} ${user.last_name}`.trim() || "—"}</td>
                  {userTypeFilter === "students" && (
                    <>
                      <td>{profile.course || "—"}</td>
                      <td>{profile.year || "—"}</td>
                      <td>{profile.section || "—"}</td>
                    </>
                  )}
                  {userTypeFilter === "coordinators" && (
                    <>
                      <td>{profile.college || "—"}</td>
                      <td>{profile.department || "—"}</td>
                    </>
                  )}
                  {userTypeFilter === "supervisors" && (
                    <>
                      <td>{profile.company_name || profile.department || "—"}</td>
                      <td>{profile.position || "—"}</td>
                    </>
                  )}
                  {userTypeFilter !== "admins" && (
                    <td>{maskPhone(profile.phone)}</td>
                  )}
                  <td>
                    {user.date_joined ? new Date(user.date_joined).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "—"}
                  </td>
                  <td>
                    {(() => {
                      const userRole = user.role || (user.is_staff ? 'admin' : 'student');
                      const roleDisplay = {
                        'admin': 'Administrator',
                        'coordinator': 'Coordinator',
                        'supervisor': 'Supervisor',
                        'student': 'Student'
                      }[userRole] || 'Unknown';

                      const roleClass = {
                        'admin': 'admin',
                        'coordinator': 'coordinator',
                        'supervisor': 'supervisor',
                        'student': 'student'
                      }[userRole] || 'student';

                      return (
                        <span className={`role-badge ${roleClass}`}>
                          {roleDisplay}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="actions">
                    {/* Progress */}
                    {!isCoordinatorView && isStudent && isHovered && (
                      <button
                        onClick={() => fetchStudentProgress(user.id)}
                        className="action-icon-btn progress"
                        title="Check Intern Progress"
                      >
                        <LineChart size={18} />
                      </button>
                    )}

                    {/* Approve */}
                    {isStudent && !user.is_active && (
                      <button
                        onClick={() => handleApproveStudent(user.id)}
                        className="action-icon-btn approve"
                        title="Approve Registration"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}

                    {/* COR Actions */}
                    {!user.is_staff && (
                      profile.certificate_of_registration ? (
                        <button
                          onClick={() => {
                            const url = getCorDocumentUrl(profile.certificate_of_registration);
                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="action-icon-btn cor"
                          title="View Certificate of Registration"
                        >
                          <FileText size={18} />
                        </button>
                      ) : (
                        <div className="action-icon-btn disabled" title="No COR Uploaded">
                          <FileX size={18} />
                        </div>
                      )
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(user)}
                      className="action-icon-btn edit"
                      title="Edit User"
                    >
                      <Edit size={18} />
                    </button>

                    {/* Change Role */}
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="action-icon-btn role"
                      title="Change Role"
                    >
                      <UserCog size={18} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="action-icon-btn delete"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {
        filteredUsers.length === 0 && (
          <div className="no-data">
            <p>
              {filterCourse || filterYear || filterSection
                ? "No users found matching the selected filters."
                : "No users found. Create your first user to get started."}
            </p>
          </div>
        )
      }

      {/* Progress Modal */}
      {
        showProgressModal && selectedStudentProgress && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setShowProgressModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                width: '98%',
                maxWidth: '1400px',
                height: '95vh',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '28px 32px',
                borderBottom: '2px solid #e0e0e0',
                background: 'linear-gradient(135deg, #C41E3A 0%, #A01729 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                        Student Details
                      </h2>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', opacity: 0.95 }}>
                      {selectedStudentProgress.student_name}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>{selectedStudentProgress.student_email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{selectedStudentProgress.student_id_number}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>{selectedStudentProgress.course}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '15px', opacity: 0.9, marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        <span>{selectedStudentProgress.position}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span>{selectedStudentProgress.company_name}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProgressModal(false)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      fontSize: '28px',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Progress Overview */}
              <div style={{
                padding: '28px 32px',
                background: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0'
              }}>
                {/* Progress Bar */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', fontSize: '16px' }}>Overall Progress</span>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#C41E3A' }}>
                      {selectedStudentProgress.progress_percentage}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '28px',
                    background: '#e0e0e0',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${selectedStudentProgress.progress_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #C41E3A 0%, #A01729 100%)',
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>
                        {selectedStudentProgress.total_hours}h / {selectedStudentProgress.required_hours}h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Total Hours */}
                  <div style={{
                    background: 'linear-gradient(135deg, #C41E3A 0%, #A01729 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(196, 30, 58, 0.4)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>Total Hours</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700' }}>
                      {selectedStudentProgress.total_hours}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px' }}>
                      of {selectedStudentProgress.required_hours} required
                    </div>
                  </div>

                  {/* Present */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid #C41E3A'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Present</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#C41E3A' }}>
                      {selectedStudentProgress.present_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                      of {selectedStudentProgress.total_records} records
                    </div>
                  </div>

                  {/* Late */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid #FF9800'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Late</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#FF9800' }}>
                      {selectedStudentProgress.late_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                      {selectedStudentProgress.attendance_hours}h from attendance
                    </div>
                  </div>

                  {/* Absent */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid #f44336'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Absent</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#f44336' }}>
                      {selectedStudentProgress.absent_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                      {selectedStudentProgress.journal_hours}h from journals
                    </div>
                  </div>

                  {/* Tasks */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid #2196F3'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Tasks</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3' }}>
                      {selectedStudentProgress.completed_tasks}/{selectedStudentProgress.total_tasks}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                      completed
                    </div>
                  </div>

                  {/* Journals */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid #9C27B0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Journals</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#9C27B0' }}>
                      {selectedStudentProgress.journal_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                      entries submitted
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Sheet */}
              <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>
                    Attendance Sheet
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5', zIndex: 1 }}>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Date</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Time In</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Time Out</th>
                        <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Status</th>
                        <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Hours</th>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentProgress.attendance_records && selectedStudentProgress.attendance_records.map((record, index) => (
                        <tr key={record.id} style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: index % 2 === 0 ? 'white' : '#fafafa',
                          transition: 'background 0.2s'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                          onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                        >
                          <td style={{ padding: '14px', fontSize: '14px', fontWeight: '500' }}>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '14px', fontSize: '14px' }}>
                            {record.time_in || '-'}
                          </td>
                          <td style={{ padding: '14px', fontSize: '14px' }}>
                            {record.time_out || '-'}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '6px 14px',
                              background: record.status === 'Present' ? '#C41E3A' :
                                record.status === 'Late' ? '#FF9800' :
                                  record.status === 'Absent' ? '#f44336' : '#2196F3',
                              color: 'white',
                              borderRadius: '14px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'inline-block'
                            }}>
                              {record.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px', fontSize: '15px', fontWeight: '700', textAlign: 'center', color: '#C41E3A' }}>
                            {record.hours_rendered ? `${record.hours_rendered}h` : '-'}
                          </td>
                          <td style={{ padding: '14px', fontSize: '14px', color: '#666', maxWidth: '300px' }}>
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!selectedStudentProgress.attendance_records || selectedStudentProgress.attendance_records.length === 0) && (
                    <div style={{
                      textAlign: 'center',
                      padding: '80px 20px',
                      color: '#999',
                      background: '#fafafa',
                      borderRadius: '12px',
                      marginTop: '20px'
                    }}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No attendance records found</div>
                      <div style={{ fontSize: '15px' }}>This student hasn't logged any attendance yet</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div >
        )
      }

      {
        loadingProgress && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading progress...</div>
          </div>
        )
      }

      {/* Role Change Modal */}
      {
        showRoleModal && selectedUserForRole && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '10px', color: '#111827', fontSize: '1.5rem' }}>
                Change User Role
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '0.95rem' }}>
                Changing role for: <strong>{selectedUserForRole.username}</strong> ({selectedUserForRole.first_name} {selectedUserForRole.last_name})
              </p>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '600', color: '#374151' }}>
                  Select New Role:
                </label>

                {[
                  { value: 'admin', label: '🔐 Administrator', desc: 'Full system access, user management, backups' },
                  { value: 'coordinator', label: '🏫 Coordinator', desc: 'Manage students, companies, internships' },
                  { value: 'supervisor', label: '👔 Supervisor', desc: 'Manage assigned interns only' },
                  { value: 'student', label: '🎓 Student', desc: 'Access own profile and applications' }
                ].map(role => (
                  <div
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    style={{
                      padding: '15px',
                      border: selectedRole === role.value ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedRole === role.value ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedRole !== role.value) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRole !== role.value) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={() => setSelectedRole(role.value)}
                        style={{ marginRight: '10px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                        {role.label}
                      </span>
                    </div>
                    <div style={{ marginLeft: '28px', fontSize: '0.85rem', color: '#6b7280' }}>
                      {role.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUserForRole(null);
                    setSelectedRole("");
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Add/Edit Form */}
      {
        showForm && (
          <div className="admin-modal-overlay" onClick={resetForm}>
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password {editingUser ? "(leave blank to keep current)" : "*"}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder="Enter password"
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="student">Student Intern</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Student ID</label>
                        <input
                          type="text"
                          name="student_id"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          placeholder="Enter Student ID"
                        />
                      </div>
                      <div className="form-group">
                        <label>College</label>
                        <select
                          name="college"
                          value={formData.college}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Select College</option>
                          {Object.entries(COLLEGE_CODES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Course</label>
                        <select
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Select Course</option>
                          {formData.college && COURSES_BY_COLLEGE[COLLEGE_CODES[formData.college]] ? (
                            COURSES_BY_COLLEGE[COLLEGE_CODES[formData.college]].map(course => (
                              <option key={course} value={course}>{course}</option>
                            ))
                          ) : (
                            Object.entries(COURSES_BY_COLLEGE).map(([collegeName, courses]) => (
                              <optgroup key={collegeName} label={collegeName}>
                                {courses.map(course => (
                                  <option key={course} value={course}>{course}</option>
                                ))}
                              </optgroup>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Year</label>
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Select Year</option>
                          {ALL_YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Section</label>
                      <input
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        placeholder="Enter Section"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'coordinator' && (
                  <>
                    <div className="form-group">
                      <label>College</label>
                      <select
                        name="college"
                        value={formData.college}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="">Select College</option>
                        {Object.entries(COLLEGE_CODES).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Enter Department"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'supervisor' && (
                  <div className="form-group">
                    <label>Company</label>
                    <select
                      name="company_id"
                      value={formData.company_id}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                  <button type="button" onClick={resetForm} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

    </div >
  );
}

export default AdminUsers;
