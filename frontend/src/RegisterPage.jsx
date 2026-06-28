import { useState } from "react";
import "./AuthPages.css";

function RegisterPage({ onRegister, onSwitchToLogin, onContinueAsVisitor, flash }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "confirmPassword" || name === "password") {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

    if (form.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    if (!specialCharRegex.test(form.password)) {
      setPasswordError("Password must contain at least one special character (e.g. #, @, !)");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { confirmPassword, ...submitData } = form;
    await onRegister(submitData);
    setLoading(false);
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return null;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    if (p.length < 8 || !hasSpecial) return { label: "Too weak", level: 1, color: "#ef4444" };
    if (p.length < 10) return { label: "Fair", level: 2, color: "#f97316" };
    if (hasUpper && hasNumber && hasSpecial) return { label: "Strong", level: 4, color: "#22c55e" };
    return { label: "Good", level: 3, color: "#3b82f6" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-container">
        {/* Left Panel – Brand */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <span className="auth-logo-icon">✦</span>
              <span className="auth-logo-text">BlogFlow</span>
            </div>
            <h1 className="auth-brand-headline">
              Start your writing journey today.
            </h1>
            <p className="auth-brand-sub">
              Create a free account to publish blog posts, leave comments, bookmark stories, and stay updated with notifications.
            </p>
          </div>
        </div>

        {/* Right Panel – Form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Create account</h2>
              <p className="auth-subtitle">It's free and always will be</p>
            </div>

            {flash && (
              <div className={`auth-flash auth-flash-${flash.type}`}>
                {flash.type === "error" ? "⚠️" : "✅"} {flash.message}
              </div>
            )}

            <form className="auth-form-inner" onSubmit={handleSubmit} id="register-form">
              <div className="auth-field">
                <label htmlFor="reg-name">Full name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email">Email address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📧</span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {strength && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="strength-bar"
                          style={{
                            background: strength.level >= level ? strength.color : "var(--border-color)",
                          }}
                        />
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
                <label htmlFor="reg-confirm">Confirm password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔑</span>
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordError && <p className="field-error">{passwordError}</p>}
              </div>

              <button
                id="register-submit-btn"
                className="auth-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Create Account <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <button
              id="switch-to-login-btn"
              className="auth-switch-btn"
              onClick={onSwitchToLogin}
              type="button"
            >
              Sign in instead
            </button>

            {onContinueAsVisitor && (
              <div className="auth-visitor-row">
                <button
                  id="continue-as-visitor-register-btn"
                  type="button"
                  className="auth-visitor-btn"
                  onClick={onContinueAsVisitor}
                >
                  👁️ Continue as Visitor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
