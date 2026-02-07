import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // Reuse register styles
import earistLogo from "./images/earist.png";

function VerifyEmail() {
    const [verificationCode, setVerificationCode] = useState(["", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [registrationData, setRegistrationData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const data = sessionStorage.getItem('pendingRegistration');
        if (!data) {
            navigate('/register');
            return;
        }

        const parsedData = JSON.parse(data);

        // Validate data format: If missing required fields, force re-registration
        if (!parsedData.first_name || !parsedData.last_name || !parsedData.birth_date) {
            // Clear invalid data
            sessionStorage.removeItem('pendingRegistration');
            // Redirect to register to fill in new form
            navigate('/register');
            return;
        }

        setRegistrationData(parsedData);
    }, [navigate]);

    const handleCodeInputChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        if (value && index < 3) {
            const nextInput = document.getElementById(`code-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
            const prevInput = document.getElementById(`code-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleCodePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        const newCode = ["", "", "", ""];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setVerificationCode(newCode);
        const nextIndex = Math.min(pastedData.length, 3);
        const nextInput = document.getElementById(`code-input-${nextIndex}`);
        if (nextInput) nextInput.focus();
    };

    const handleVerifyAndRegister = async () => {
        const codeString = verificationCode.join("");
        if (codeString.length !== 4) {
            setError("Please enter the complete 4-digit code");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // 1. Verify the code
            await axios.post("http://localhost:8000/api/verify-email-code/", {
                email: registrationData.email,
                code: codeString,
            });

            // 2. Register the user
            await axios.post("http://localhost:8000/api/register/", registrationData);

            setSuccess("Registration successful! Redirecting to login...");
            sessionStorage.removeItem('pendingRegistration');
            setTimeout(() => navigate("/login"), 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.error || "Verification failed. Please check the code and try again.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await axios.post("http://localhost:8000/api/send-verification-code/", {
                email: registrationData.email,
            });
            setSuccess("Verification code resent!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Failed to resend code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!registrationData) return null;

    return (
        <div className="register-container">
            <div className="register-card">
                <img src={earistLogo} alt="EARIST Logo" className="register-logo" />
                <h1>Verify Your Email</h1>
                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                    We sent a verification code to<br />
                    <strong>{registrationData.email}</strong>
                </p>

                {success && <div className="register-success">{success}</div>}
                {error && <div className="register-error">{error}</div>}

                <div className="form-group">
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                        {[0, 1, 2, 3].map((index) => (
                            <input
                                key={index}
                                id={`code-input-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={verificationCode[index]}
                                onChange={(e) => handleCodeInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                onPaste={index === 0 ? handleCodePaste : undefined}
                                className="register-input"
                                disabled={loading}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    border: '2px solid #d1d5db',
                                    borderRadius: '8px',
                                    padding: '0'
                                }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleVerifyAndRegister}
                    className="register-button"
                    disabled={loading || verificationCode.join("").length !== 4}
                >
                    {loading ? "Verifying..." : "Verify & Complete Registration"}
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        onClick={handleResendCode}
                        disabled={loading}
                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Resend Code
                    </button>
                </div>

                <div className="register-footer">
                    <p>Wrong email? <span onClick={() => navigate('/register')} style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Go back</span></p>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
