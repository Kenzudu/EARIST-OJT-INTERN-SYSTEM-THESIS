import React from 'react';
import AdminUsers from './AdminUsers';

// Coordinator view of students - same component, different route
function CoordinatorStudents() {
    return <AdminUsers apiEndpoint="/coordinator/users/" />;
}

export default CoordinatorStudents;
