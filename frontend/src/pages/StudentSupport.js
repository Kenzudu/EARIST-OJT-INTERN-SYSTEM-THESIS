import React from "react";
import "./StudentDashboard.css";
import StudentHeader from "./StudentHeader";

function StudentSupport() {
  return (
    <div className="student-dashboard">
      <div className="student-dashboard__content">
        <StudentHeader 
          title="Internship Support"
          subtitle="We're here to help. Reach out any time you need assistance or guidance."
        />

        <section className="student-section">
          <div className="support-card large-support-card">
            <h3>EARIST Internship Coordination Office</h3>
            <p>Email: internship.support@earist.edu.ph</p>
            <p>Phone: (02) 1234 5678</p>
            <p>Office Hours: Monday – Friday, 9:00 AM – 4:00 PM</p>
            <hr />
            <p>Visit us at the CCS building, 2nd floor. Bring your student ID for faster assistance.</p>
            <p>
              For urgent matters, please coordinate with your assigned program coordinator or send us a message through
              the portal.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentSupport;


