import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentReports.css";
import StudentHeader from "./StudentHeader";

const baseURL = "http://localhost:8000/api";

function StudentReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [reportType, setReportType] = useState("Midterm");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/narrative-reports/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setReports(res.data);
        } catch (err) {
            setError("Failed to load reports.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("report_type", reportType);

        try {
            setUploading(true);
            setError("");
            setSuccess("");
            await axios.post(`${baseURL}/narrative-reports/`, formData, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            setSuccess("Report submitted successfully!");
            setSelectedFile(null);
            // Reset file input
            document.querySelector('input[type="file"]').value = "";
            fetchReports();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to upload report. You may have already submitted this type.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        try {
            await axios.delete(`${baseURL}/narrative-reports/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setSuccess("Report deleted successfully.");
            fetchReports();
        } catch (err) {
            setError("Failed to delete report.");
        }
    };

    return (
        <div className="student-reports-container">
            <StudentHeader
                title="Narrative Reports"
                subtitle="Submit your Midterm and Final Narrative Reports."
            />

            <div className="reports-content">
                <div className="upload-section">
                    <h3>Submit New Report</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="form-control"
                            >
                                <option value="Midterm">Midterm Narrative Report</option>
                                <option value="Final">Final Narrative Report</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>File (PDF/DOCX)</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                className="form-control"
                            />
                        </div>
                        <button type="submit" className="submit-btn" disabled={uploading}>
                            {uploading ? "Uploading..." : "Submit Report"}
                        </button>
                    </form>
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                </div>

                <div className="reports-list">
                    <h3>My Submissions</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : reports.length === 0 ? (
                        <p>No reports submitted yet.</p>
                    ) : (
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Date Submitted</th>
                                    <th>Status</th>
                                    <th>File</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report.id}>
                                        <td>{report.report_type}</td>
                                        <td>{new Date(report.submitted_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${report.status.toLowerCase()}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td>
                                            <a href={report.file} target="_blank" rel="noopener noreferrer">
                                                View File
                                            </a>
                                        </td>
                                        <td>
                                            {report.status === "Submitted" && (
                                                <button
                                                    onClick={() => handleDelete(report.id)}
                                                    className="delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentReports;
