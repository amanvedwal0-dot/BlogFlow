import { useState } from "react";
import "./AuthPages.css";
import API from "./api";

// Step 1: Enter email → Step 2: Enter OTP → Step 3: Enter new password → Done
function ForgotPasswordPage({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1 | 2 | 3 | "done"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);

  const showMsg = (message, type = "error") => {
    setFlash({ message, type });
    if (type === "success") setTimeout(() => setFlash(null), 4000);
  };

  // ── Step 1: Request OTP ──────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) { showMsg("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email });
      showMsg(res.data.message, "success");
      setStep(2);
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { showMsg("Please enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      showMsg(res.data.message, "success");
      setStep(3);
    } catch (err) {
      showMsg(err.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set new password ─────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const specialCharRegex = /[!@#$%^&*()\-_=+{};:,<.>/?`~|[\]\\'\"]/;
    if (newPassword.length < 8) { showMsg("Password must be at least 8 characters."); return; }
    if (!specialCharRegex.test(newPassword)) { showMsg("Password must contain at least one special character (e.g. #, @, !)."); return; }
    if (newPassword !== confirmPassword) { showMsg("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await API.post("/auth/reset-password", { email, otp, newPassword });
      onBackToLogin(res.data.message || "Password reset successfully. You can now log in.");
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = newPassword;
    if (!p) return null;
    const hasSpecial = /[!@#$%^&*()\-_=+{};:,<.>/?`~|[\]\\'\"@]/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    if (p.length < 8 || !hasSpecial) return { label: "Too weak", level: 1, color: "#ef4444" };
    if (p.length < 10) return { label: "Fair", level: 2, color: "#f97316" };
    if (hasUpper && hasNumber && hasSpecial) return { label: "Strong", level: 4, color: "#22c55e" };
    return { label: "Good", level: 3, color: "#3b82f6" };
  };

  const strength = getPasswordStrength();

  // Step labels
  const steps = ["Enter Email", "Verify OTP", "New Password"];
  const currentStepIndex = step - 1;

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-container">
        {/* Left Brand Panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <span className="auth-logo-icon">✦</span>
              <span className="auth-logo-text">BlogFlow</span>
            </div>
            <h1 className="auth-brand-headline">Reset your password securely.</h1>
            <p className="auth-brand-sub">
              Enter your registered email, receive a one-time code, and set a new password. The OTP expires in 15 minutes.
            </p>

            {/* Step progress */}
            <div className="fp-steps">
              {steps.map((label, i) => (
                <div
                  key={i}
                  className={`fp-step ${i < currentStepIndex ? "fp-step-done" : ""} ${i === currentStepIndex ? "fp-step-active" : ""}`}
                >
                  <div className="fp-step-circle">
                    {i < currentStepIndex ? "✓" : i + 1}
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-card">

            {/* ── STEP 1: Email ── */}
            {step === 1 && (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-title">Forgot password?</h2>
                  <p className="auth-subtitle">We'll send a 6-digit OTP to your email</p>
                </div>
                {flash && (
                  <div className={`auth-flash auth-flash-${flash.type}`}>
                    {flash.type === "error" ? "⚠️" : "✅"} {flash.message}
                  </div>
                )}
                <form className="auth-form-inner" onSubmit={handleRequestOtp} id="forgot-email-form">
                  <div className="auth-field">
                    <label htmlFor="fp-email">Registered email address</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">📧</span>
                      <input
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <button id="send-otp-btn" className="auth-submit-btn" type="submit" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : <>Send OTP <span className="btn-arrow">→</span></>}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 2 && (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-title">Enter OTP</h2>
                  <p className="auth-subtitle">Check your inbox at <strong>{email}</strong></p>
                </div>
                {flash && (
                  <div className={`auth-flash auth-flash-${flash.type}`}>
                    {flash.type === "error" ? "⚠️" : "✅"} {flash.message}
                  </div>
                )}
                <form className="auth-form-inner" onSubmit={handleVerifyOtp} id="verify-otp-form">
                  <div className="auth-field">
                    <label htmlFor="fp-otp">6-digit OTP</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔢</span>
                      <input
                        id="fp-otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        required
                        autoComplete="one-time-code"
                        className="otp-input"
                      />
                    </div>
                    <p className="password-hint">OTP expires in 15 minutes. Check your spam folder if not received.</p>
                  </div>
                  <button id="verify-otp-btn" className="auth-submit-btn" type="submit" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : <>Verify OTP <span className="btn-arrow">→</span></>}
                  </button>
                </form>
                <div className="auth-divider"><span>Wrong email?</span></div>
                <button className="auth-switch-btn" onClick={() => { setStep(1); setOtp(""); setFlash(null); }}>
                  Go back &amp; change email
                </button>
              </>
            )}

            {/* ── STEP 3: New Password ── */}
            {step === 3 && (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-title">Set new password</h2>
                  <p className="auth-subtitle">Choose a strong password for your account</p>
                </div>
                {flash && (
                  <div className={`auth-flash auth-flash-${flash.type}`}>
                    {flash.type === "error" ? "⚠️" : "✅"} {flash.message}
                  </div>
                )}
                <form className="auth-form-inner" onSubmit={handleResetPassword} id="reset-password-form">
                  <div className="auth-field">
                    <label htmlFor="fp-new-password">New password</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔒</span>
                      <input
                        id="fp-new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" className="auth-eye-toggle" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {strength && (
                      <div className="password-strength">
                        <div className="strength-bars">
                          {[1, 2, 3, 4].map((level) => (
                            <div key={level} className="strength-bar"
                              style={{ background: strength.level >= level ? strength.color : "var(--border-color)" }} />
                          ))}
                        </div>
                        <span style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                    )}
                    <p className="password-hint">
                      Min. 8 characters &amp; at least one special character (e.g. <code>#</code>, <code>@</code>, <code>!</code>)
                    </p>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="fp-confirm-password">Confirm new password</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">🔑</span>
                      <input
                        id="fp-confirm-password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" className="auth-eye-toggle" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <button id="reset-password-btn" className="auth-submit-btn" type="submit" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : <>Reset Password <span className="btn-arrow">→</span></>}
                  </button>
                </form>
              </>
            )}

            {/* Back to login link */}
            <div className="auth-divider"><span>Remember your password?</span></div>
            <button id="back-to-login-btn" className="auth-switch-btn" onClick={onBackToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
