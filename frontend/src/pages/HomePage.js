import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./HomePage.css";
import earistLogo from "./images/earist.png";

import logoChtm from "../assets/college-logos/logo_chtm.png";
import logoCcssg from "../assets/college-logos/logo_ccssg.png";
import logoCcje from "../assets/college-logos/logo_ccje.png";
import logoCafa from "../assets/college-logos/logo_cafa.png";
import logoCba from "../assets/college-logos/logo_cba.png";
import logoCit from "../assets/college-logos/logo_cit.png";
import logoCas from "../assets/college-logos/logo_cas.png";
import logoCe from "../assets/college-logos/logo_ce.png";
import logoCed from "../assets/college-logos/logo_ced.png";
import speakerIcon from "./images/Speaker.png";
import corporateIcon from "./images/corporate-alt.png";
import envelopeIcon from "./images/envelope.png";
import gearIcon from "./images/gears.png";

function HomePage() {
  const navigate = useNavigate();

  // College data with logos and information
  const colleges = [
    {
      logo: logoChtm,
      name: "College of Hospitality and Tourism Management",
      abbreviation: "CHTM",
      description: "Dedicated to developing skilled professionals in hospitality, tourism, and culinary arts. CHTM provides comprehensive training in hotel management, food service, and tourism operations, preparing students for successful careers in the dynamic hospitality industry."
    },
    {
      logo: logoCcssg,
      name: "College of Computing Studies Students Government",
      abbreviation: "CCSSG",
      description: "Empowering future technology leaders through innovative computing education. The college offers programs in computer science, information technology, and software engineering, equipping students with cutting-edge skills for the digital age."
    },
    {
      logo: logoCcje,
      name: "College of Criminal Justice Education",
      abbreviation: "CCJE",
      description: "Training the next generation of law enforcement and criminal justice professionals. CCJE provides comprehensive education in criminology, forensic science, and public safety, preparing students to serve and protect their communities with integrity and excellence."
    },
    {
      logo: logoCafa,
      name: "College of Architecture and Fine Arts",
      abbreviation: "CAFA",
      description: "Nurturing creative minds in architecture, design, and fine arts. CAFA combines artistic expression with technical expertise, developing professionals who shape the built environment and contribute to cultural enrichment through innovative design and artistic excellence."
    },
    {
      logo: logoCba,
      name: "College of Business Administration",
      abbreviation: "CBA",
      description: "Developing future business leaders and entrepreneurs. CBA offers comprehensive programs in management, marketing, finance, and entrepreneurship, preparing students to excel in the dynamic world of business and commerce with strategic thinking and ethical leadership."
    },
    {
      logo: logoCit,
      name: "College of Industrial Technology",
      abbreviation: "CIT",
      description: "Advancing technical excellence in industrial and manufacturing fields. CIT provides hands-on training in various technical disciplines, preparing skilled professionals for careers in industry, manufacturing, and technical services with practical expertise and innovation."
    },
    {
      logo: logoCas,
      name: "College of Arts and Sciences",
      abbreviation: "CAS",
      description: "Fostering intellectual growth and academic excellence across diverse disciplines. CAS offers programs in humanities, social sciences, and natural sciences, developing well-rounded individuals with critical thinking skills and a broad understanding of the world."
    },
    {
      logo: logoCe,
      name: "College of Engineering",
      abbreviation: "CE",
      description: "Engineering solutions for tomorrow's challenges. The College of Engineering provides rigorous education in various engineering disciplines, combining theoretical knowledge with practical application to develop innovative engineers who drive technological advancement and sustainable development."
    },
    {
      logo: logoCed,
      name: "College of Education",
      abbreviation: "CED",
      description: "Shaping the future through quality education. CED prepares passionate educators and educational leaders who inspire learning, foster development, and make a lasting impact on students' lives through innovative teaching methods and dedication to educational excellence."
    }
  ];

  const [currentCollegeIndex, setCurrentCollegeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCollegeIndex((prevIndex) => (prevIndex + 1) % colleges.length);
    }, 5000); // Change college every 5 seconds

    return () => clearInterval(interval);
  }, [colleges.length]);

  const handlePrevCollege = () => {
    setCurrentCollegeIndex((prevIndex) =>
      prevIndex === 0 ? colleges.length - 1 : prevIndex - 1
    );
  };

  const handleNextCollege = () => {
    setCurrentCollegeIndex((prevIndex) =>
      (prevIndex + 1) % colleges.length
    );
  };

  const currentCollege = colleges[currentCollegeIndex];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <img src={earistLogo} alt="EARIST Logo" className="nav-logo" />
            <div className="nav-brand-text">
              <h1>EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY MANILA</h1>
              <p>Internship Portal</p>
            </div>
          </div>
          <div className="nav-actions">
            <button className="btn-nav-login" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn-nav-register" onClick={() => navigate("/register")}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to EARIST <span className="highlight">Internship Portal</span>
            </h1>
            <p className="hero-subtitle">
              Your gateway to professional growth and career opportunities. Connect with leading companies,
              apply for internships, and track your journey to success.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={() => navigate("/register")}>
                Start Your Journey
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>
          </div>

          <div className="hero-image">
            <div className="college-carousel">
              {/* Previous Arrow */}
              <button className="carousel-arrow carousel-arrow-left" onClick={handlePrevCollege} aria-label="Previous college">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* College Logo */}
              <div className="hero-card">
                <img
                  src={currentCollege.logo}
                  alt={`${currentCollege.abbreviation} Logo`}
                  className="fade-in-logo"
                  key={currentCollegeIndex}
                />
              </div>

              {/* Next Arrow */}
              <button className="carousel-arrow carousel-arrow-right" onClick={handleNextCollege} aria-label="Next college">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header-center">
            <h2>Explore Our Portal</h2>
            <p>Everything you need to succeed in your internship journey</p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon">
                <img src={corporateIcon} alt="Internship Program" />
              </div>
              <h3>Internship Program</h3>
              <p>
                Discover comprehensive information about our internship program, including requirements,
                duration, and benefits. Learn how EARIST prepares you for the professional world.
              </p>
              <ul className="feature-list">
                <li>✓ Program overview and objectives</li>
                <li>✓ Eligibility requirements</li>
                <li>✓ Timeline and duration</li>
                <li>✓ Partner companies</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon">
                <img src={speakerIcon} alt="About Portal" />
              </div>
              <h3>About Internship Portal</h3>
              <p>
                Get familiar with our portal's features and guidelines. Learn how to navigate the system,
                submit applications, and track your progress throughout your internship.
              </p>
              <ul className="feature-list">
                <li>✓ Portal navigation guide</li>
                <li>✓ Application process</li>
                <li>✓ Document requirements</li>
                <li>✓ Progress tracking</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon">
                <img src={gearIcon} alt="Help Desk" />
              </div>
              <h3>Help Desk & Support</h3>
              <p>
                Need assistance? Our dedicated support team is here to help. Submit inquiries, get answers
                to common questions, and receive personalized guidance.
              </p>
              <ul className="feature-list">
                <li>✓ 24/7 support availability</li>
                <li>✓ FAQ and knowledge base</li>
                <li>✓ Technical assistance</li>
                <li>✓ Quick response time</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon">
                <img src={envelopeIcon} alt="Contact" />
              </div>
              <h3>Contact Administration</h3>
              <p>
                Connect directly with our administration team. Access multiple communication channels
                including email, phone, and in-person office hours.
              </p>
              <ul className="feature-list">
                <li>✓ Email support</li>
                <li>✓ Phone consultation</li>
                <li>✓ Office hours</li>
                <li>✓ Location and directions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header-center">
            <h2>How It Works</h2>
            <p>Simple steps to kickstart your internship journey</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Create Account</h3>
              <p>Register with your EARIST credentials and complete your profile</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3>Browse Opportunities</h3>
              <p>Explore available internship positions from our partner companies</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Submit Application</h3>
              <p>Upload your documents and apply to your preferred internships</p>
            </div>

            <div className="step-card">
              <div className="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Track Progress</h3>
              <p>Monitor your application status and internship journey</p>
            </div>
          </div>
        </div>
      </section>



      {/* Contact Us Section */}
      <section className="contact-section">
        <div className="contact-container">
          <div className="section-header-center">
            <h2>Contact Us</h2>
            <p>Get in touch with us for any inquiries or assistance</p>
          </div>

          <div className="contact-grid">
            <div
              className="contact-card clickable-card"
              onClick={() => window.open("https://www.google.com/maps/search/?api=1&query=Eulogio+Amang+Rodriguez+Institute+of+Science+and+Technology+Nagtahan+St+Sampaloc+Manila", "_blank")}
            >
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>Location</h3>
              <p>Nagtahan St, Sampaloc,<br />Manila, 1008 Metro Manila</p>
            </div>

            <div
              className="contact-card clickable-card"
              onClick={() => window.location.href = "tel:+6322439467"}
            >
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3>Phone</h3>
              <p>(028) 243-9467</p>
            </div>

            <div
              className="contact-card clickable-card"
              onClick={() => window.open("mailto:internship@earist.edu.ph?subject=Inquiry%20from%20Internship%20Portal", "_self")}
            >
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>Email</h3>
              <p>internship@earist.edu.ph</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* Contact Us */}
            <div className="footer-section">
              <h4>Contact Us</h4>
              <div className="footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div>
                  <p className="contact-label">Location</p>
                  <p>Nagtahan St, Sampaloc, Manila, 1008 Metro Manila</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <div>
                  <p className="contact-label">Email</p>
                  <p>earistojtsys@gmail.com</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <div>
                  <p className="contact-label">Phone</p>
                  <p>(028) 243-9467</p>
                </div>
              </div>
            </div>

            {/* Follow Us & Quick Links */}
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="https://www.facebook.com/EARIST.Manila" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://twitter.com/EARIST_Manila" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/earist.manila/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>

              <h4 className="footer-subsection">Quick Links</h4>
              <ul>
                <li><a href="https://earist.edu.ph/" target="_blank" rel="noopener noreferrer">EARIST Website</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Login</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>Register</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
