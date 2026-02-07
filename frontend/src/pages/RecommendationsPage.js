import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentHeader from './StudentHeader';
import CareerPathGraph from './CareerPathGraph';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("matched");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchedInternships, setMatchedInternships] = useState([]);
  const [careerGuidance, setCareerGuidance] = useState(null);

  const [studentProfile, setStudentProfile] = useState(null);
  const [aiModel, setAiModel] = useState('models/gemini-2.5-flash');
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(true);

  const baseURL = 'http://localhost:8000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRecommendations();
    fetchStudentProfile();
  }, [aiModel]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const [matched, career] = await Promise.all([
        axios.get(`${baseURL}/recommendations/matched-internships/?model=${aiModel}&top_n=10`, {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get(`${baseURL}/recommendations/career-guidance/?model=${aiModel}&top_n=10`, {
          headers: { Authorization: `Token ${token}` }
        })
      ]);

      const matchedData = matched.data || {};
      if (matchedData.error) {
        console.error('Matched internships error:', matchedData.error);
        setMatchedInternships([]);
      } else {
        setMatchedInternships(matchedData.recommendations || matchedData || []);
      }

      const careerData = career.data || {};
      if (careerData.error) {
        console.error('Career guidance error:', careerData.error);
        setCareerGuidance(null);
      } else {
        console.log('[CareerGuidance] Received data:', careerData);
        console.log('[CareerGuidance] Career paths:', careerData.career_paths);
        setCareerGuidance(careerData);
      }


    } catch (err) {
      console.error('Error fetching recommendations:', err);
      if (err.response && err.response.status === 403 && err.response.data.error === 'Pre-training requirements incomplete') {
        setError(err.response.data);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const response = await axios.get(`${baseURL}/my-profile/`, {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('[StudentProfile] Received profile:', response.data);
      setStudentProfile(response.data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  const analyzeText = async () => {
    if (!analyzeInput.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoadingAnalysis(true);
    setError('');
    setAnalyzeResult(null);

    try {
      const response = await axios.post(
        `${baseURL}/recommendations/analyze-text/`,
        {
          text: analyzeInput,
          model: aiModel,
          include_profile: includeProfile
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      setAnalyzeResult(response.data);
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError(err.response?.data?.error || 'Failed to analyze text');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleModelChange = (model) => {
    setAiModel(model);
  };

  const handleApplyNow = (internshipId) => {
    navigate(`/student/apply?internship_id=${internshipId}`);
  };

  if (loading) return <div className="recommendations-loading">Loading recommendations...</div>;

  // Handle Restricted Access
  if (error && error.missing_requirements) {
    return (
      <div className="admin-dashboard-container" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: '1100px' }}>
          <StudentHeader title="Access Restricted" subtitle="You simply need to complete a few steps first." />
        </div>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '600px',
          margin: '40px auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ color: '#d32f2f', marginTop: 0 }}>Access Locked</h2>
          <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '30px' }}>
            {error.message || "AI Recommendations are locked until all required pre-training documents are approved."}
          </p>

          <div style={{ textAlign: 'left', background: '#ffebee', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>Missing Approved Documents:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {error.missing_requirements.map((req, i) => (
                <li key={i} style={{ color: '#b71c1c', marginBottom: '5px' }}>{req}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/student/pre-training')}
            className="action-button"
            style={{ padding: '12px 30px', fontSize: '1.1rem', width: 'auto', display: 'inline-block' }}
          >
            Go to Pre-Training Requirements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main">
        <StudentHeader
          title="AI Recommendations"
          subtitle="Personalized recommendations powered by AI"
        />

        {error && typeof error === 'string' && <div className="error-message">{error}</div>}

        {/* AI Model Selector */}
        <div className="ai-model-selector" style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <label style={{ fontWeight: '600', color: '#333' }}>AI Model:</label>
          <select
            value={aiModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '14px'
            }}
          >
            <option value="models/gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
            <option value="models/gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option>
            <option value="models/gemini-pro-latest">Gemini Pro Latest</option>
          </select>
        </div>

        {/* AI Test Analyzer */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>AI Test Analyzer</h3>
          <textarea
            value={analyzeInput}
            onChange={(e) => setAnalyzeInput(e.target.value)}
            placeholder="Enter text to analyze (e.g., job description, skills requirement, career question...)"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={includeProfile}
                onChange={(e) => setIncludeProfile(e.target.checked)}
              />
              Include my profile in analysis
            </label>
            <button
              onClick={analyzeText}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loadingAnalysis ? 'not-allowed' : 'pointer',
                opacity: loadingAnalysis ? 0.6 : 1
              }}
              disabled={loadingAnalysis}
            >
              Analyze Text
            </button>
            <button
              onClick={() => { setAnalyzeInput(''); setAnalyzeResult(null); setError(''); }}
              style={{ padding: '8px 12px', backgroundColor: '#eee', border: '1px solid #ddd' }}
            >
              Clear
            </button>
          </div>

          {analyzeResult && (
            <div className="analysis-result" style={{ marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 6, border: '1px solid #e6e6e6' }}>
              <h4>Analysis Result:</h4>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{analyzeResult.analysis}</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="recommendations-tabs">
          <button
            className={`tab-btn ${activeTab === "matched" ? "active" : ""}`}
            onClick={() => setActiveTab("matched")}
          >
            AI Recommend Jobs
          </button>
          <button
            className={`tab-btn ${activeTab === "guidance" ? "active" : ""}`}
            onClick={() => setActiveTab("guidance")}
          >
            Career Guidance
          </button>

        </div>

        {/* Tab Content */}
        <div className="recommendations-content">
          {activeTab === "matched" && (
            <div className="tab-content matched-tab">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ marginBottom: '5px' }}>Recommended Internships for You</h2>
                  <p className="tab-subtitle" style={{ margin: 0 }}>
                    Based on your skills, interests, and application history
                  </p>
                </div>
                <button
                  onClick={fetchRecommendations}
                  className="refresh-btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9em',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>↻</span> Refresh
                </button>
              </div>

              {matchedInternships.length > 0 ? (
                <div className="internships-list">
                  {matchedInternships.map((internship, idx) => (
                    <div
                      key={internship.id || idx}
                      className="recommendation-card"
                      onClick={() => setSelectedInternship(internship)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-rank">#{idx + 1}</div>
                      <div className="card-content">
                        <h3>{internship.position || internship.title || 'Untitled Position'}</h3>
                        <p className="company">
                          {internship.company?.name || internship.company_name || 'Company not specified'}
                        </p>
                        <div className="internship-details">
                          <span>
                            Duration: {internship.duration_weeks ? (
                              internship.duration_weeks === 1 ? '1 week' :
                                internship.duration_weeks < 4 ? `${internship.duration_weeks} weeks` :
                                  internship.duration_weeks < 8 ? `${Math.floor(internship.duration_weeks / 4)} month${Math.floor(internship.duration_weeks / 4) > 1 ? 's' : ''}` :
                                    `${Math.floor(internship.duration_weeks / 4)} months`
                            ) : 'Not specified'}
                          </span>
                          <span>Location: {internship.work_location || 'Not specified'}</span>
                        </div>
                        <button
                          className="apply-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyNow(internship.id);
                          }}
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <h3>No Recommendations Available</h3>
                  <p>We couldn't find matching internships based on your profile.</p>
                  <button
                    onClick={() => navigate('/student/profile')}
                    className="action-button"
                  >
                    Complete Your Profile →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "guidance" && (
            <div className="tab-content guidance-tab">
              <h2>Career Guidance</h2>

              {/* Profile Information Used for Analysis */}
              {studentProfile && (
                <div className="profile-summary" style={{
                  backgroundColor: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginTop: 0 }}>Your Profile (Used for AI Analysis)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                    {studentProfile.course && (
                      <div>
                        <strong>Course / Program:</strong>
                        <p style={{ margin: '5px 0' }}>{studentProfile.course}</p>
                      </div>
                    )}
                    {studentProfile.bio && (
                      <div>
                        <strong>Bio:</strong>
                        <p style={{ margin: '5px 0' }}>{studentProfile.bio}</p>
                      </div>
                    )}
                    {studentProfile.skills && (
                      <div>
                        <strong>Skills:</strong>
                        <p style={{ margin: '5px 0' }}>{studentProfile.skills}</p>
                      </div>
                    )}
                    {studentProfile.career_interests && (
                      <div>
                        <strong>Career Interests:</strong>
                        <p style={{ margin: '5px 0' }}>{studentProfile.career_interests}</p>
                      </div>
                    )}
                    {studentProfile.certifications && (
                      <div>
                        <strong>Certifications:</strong>
                        <p style={{ margin: '5px 0' }}>{studentProfile.certifications}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {careerGuidance && !careerGuidance.error ? (
                <>
                  {/* Skill Gaps */}
                  {careerGuidance.skill_gaps && Array.isArray(careerGuidance.skill_gaps) && careerGuidance.skill_gaps.length > 0 && (
                    <div className="guidance-section">
                      <h3>Skills to Develop</h3>
                      {careerGuidance.skill_gaps.map((gap, idx) => (
                        <div key={idx} className="guidance-item">
                          <div className="skill-name">{gap.skill || 'Unknown Skill'}</div>
                          {gap.frequency && (
                            <p className="frequency">Requested {gap.frequency} {gap.frequency === 1 ? 'time' : 'times'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {careerGuidance.certifications && Array.isArray(careerGuidance.certifications) && careerGuidance.certifications.length > 0 && (
                    <div className="guidance-section">
                      <h3>Recommended Certifications</h3>
                      {careerGuidance.certifications.map((cert, idx) => (
                        <div key={idx} className="guidance-item cert-item">
                          {cert}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Career Paths */}
                  {careerGuidance.career_paths && Array.isArray(careerGuidance.career_paths) && careerGuidance.career_paths.length > 0 && (
                    <div className="guidance-section">
                      <h3>Potential Career Paths</h3>
                      {!studentProfile || (!studentProfile.course && !studentProfile.skills && !studentProfile.career_interests) ? (
                        <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', marginBottom: '15px' }}>
                          <p style={{ margin: 0, color: '#856404' }}>
                            💡 <strong>Tip:</strong> Complete your profile (course, skills, interests) to see a visual career path graph showing connections between your profile and these career opportunities!
                          </p>
                        </div>
                      ) : null}
                      <CareerPathGraph
                        profile={studentProfile || { course: '', skills: '', career_interests: '' }}
                        paths={careerGuidance.career_paths}
                      />
                      {/* Also show list below graph */}
                      <div style={{ marginTop: '20px' }}>
                        <h4>Career Paths List:</h4>
                        {careerGuidance.career_paths.map((path, idx) => (
                          <div key={idx} style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            marginBottom: '10px',
                            borderLeft: '4px solid #ea5455'
                          }}>
                            <strong>{idx + 1}.</strong> {path}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Analysis */}
                  {careerGuidance.analysis && (
                    <div className="guidance-section">
                      <h3>Your Profile Analysis</h3>
                      <div className="analysis-box">
                        {typeof careerGuidance.analysis === 'string'
                          ? careerGuidance.analysis
                          : (careerGuidance.analysis.analysis || 'No analysis available')}
                      </div>
                      {/* Show summary if available */}
                      {careerGuidance.analysis.summary && (
                        <div style={{ marginTop: '15px' }}>
                          {careerGuidance.analysis.summary.strengths && careerGuidance.analysis.summary.strengths.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong>Strengths:</strong>
                              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                {careerGuidance.analysis.summary.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {careerGuidance.analysis.summary.improvements && careerGuidance.analysis.summary.improvements.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong>Areas for Improvement:</strong>
                              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                {careerGuidance.analysis.summary.improvements.map((imp, i) => (
                                  <li key={i}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show message if no data available */}
                  {(!careerGuidance.skill_gaps || careerGuidance.skill_gaps.length === 0) &&
                    (!careerGuidance.certifications || careerGuidance.certifications.length === 0) &&
                    (!careerGuidance.career_paths || careerGuidance.career_paths.length === 0) &&
                    !careerGuidance.analysis && (
                      <div className="no-data">
                        <p>No career guidance data available. Complete your profile to get personalized recommendations.</p>
                      </div>
                    )}
                </>
              ) : (
                <div className="no-data">
                  <h3>💡 Career Guidance Unavailable</h3>
                  <p>We need more information to provide personalized career guidance.</p>
                  <div className="recommendation-requirements">
                    <h4>To unlock career guidance:</h4>
                    <ul>
                      {!studentProfile?.skills && <li>✓ Add technical and soft skills</li>}
                      {!studentProfile?.career_interests && <li>✓ Specify your career interests</li>}
                      {!studentProfile?.certifications && <li>✓ List your certifications</li>}
                      <li>✓ Apply to multiple internships</li>
                      <li>✓ Request feedback from employers</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}


        </div>

        {/* Internship Details Modal */}
        {selectedInternship && (
          <div className="modal-overlay" onClick={() => setSelectedInternship(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedInternship(null)}>×</button>
              <h2>{selectedInternship.position || selectedInternship.title}</h2>
              <p className="company-name">{selectedInternship.company?.name || selectedInternship.company_name}</p>

              <div className="modal-details">
                <div className="detail-row">
                  <strong>Duration:</strong>
                  <span>{selectedInternship.duration_weeks ? `${selectedInternship.duration_weeks} weeks` : 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <strong>Location:</strong>
                  <span>{selectedInternship.location || 'Not specified'}</span>
                </div>
                {selectedInternship.description && (
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <p>{selectedInternship.description}</p>
                  </div>
                )}
                {selectedInternship.requirements && (
                  <div className="detail-row">
                    <strong>Requirements:</strong>
                    <p>{selectedInternship.requirements}</p>
                  </div>
                )}
              </div>

              <button
                className="apply-btn"
                onClick={() => {
                  setSelectedInternship(null);
                  handleApplyNow(selectedInternship.id);
                }}
              >
                Apply Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
