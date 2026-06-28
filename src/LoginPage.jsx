import { useState } from "react";
import "./AuthPages.css";

function LoginPage({ onLogin, onSwitchToRegister, onForgotPassword, onContinueAsVisitor, flash }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(form);
    setLoading(false);
  };

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
              Where ideas come to life.
            </h1>
            <p className="auth-brand-sub">
              Write, publish, and share your stories. Engage with readers, get notified on activity, and manage everything from one place.
            </p>
          </div>
        </div>

        {/* Right Panel – Form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Sign in to continue your journey</p>
            </div>

            {flash && (
              <div className={`auth-flash auth-flash-${flash.type}`}>
                {flash.type === "error" ? "⚠️" : "✅"} {flash.message}
              </div>
            )}

            <form className="auth-form-inner" onSubmit={handleSubmit} id="login-form">
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📧</span>
                  <input
                    id="login-email"
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
                <label htmlFor="login-password">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
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
              </div>

              <div className="fp-link-row">
                <button
                  id="forgot-password-link"
                  type="button"
                  className="fp-link-btn"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <button
                id="login-submit-btn"
                className="auth-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Sign In <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Don't have an account?</span>
            </div>

            <button
              id="switch-to-register-btn"
              className="auth-switch-btn"
              onClick={onSwitchToRegister}
              type="button"
            >
              Create a free account
            </button>

            {onContinueAsVisitor && (
              <div className="auth-visitor-row">
                <button
                  id="continue-as-visitor-btn"
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

export default LoginPage;
