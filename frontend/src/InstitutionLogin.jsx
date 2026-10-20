import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./InstitutionLogin.css";

function InstitutionLogin() {
  const navigate = useNavigate();

  const [institutionId, setInstitutionId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();

    if (!institutionId.trim() || !email.trim() || !password.trim()) {
      alert("Please complete all required fields.");
      return;
    }

    navigate("/institution-dashboard");
  };

  return (
    <div className="institution-login-page">
      <section className="login-brand-section">
        <Link to="/" className="login-brand-logo">
          <div className="login-brand-icon">✓</div>

          <div>
            <h2>CertiChain AI</h2>
            <span>Trusted Digital Credentials</span>
          </div>
        </Link>

        <div className="login-brand-content">
          <div className="login-brand-label">
            <span>✦</span>
            Secure Institution Portal
          </div>

          <h1>
            Issue trusted credentials with
            <span> blockchain security.</span>
          </h1>

          <p>
            Access your verified institution workspace to issue certificates,
            manage credential records and protect academic achievements using
            AI and blockchain technology.
          </p>

          <div className="login-feature-list">
            <div className="login-feature">
              <div className="login-feature-icon purple">⬡</div>

              <div>
                <h3>Immutable Certificate Records</h3>

                <p>
                  Register certificate fingerprints securely on the
                  blockchain.
                </p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon blue">✦</div>

              <div>
                <h3>AI-Assisted Fraud Protection</h3>

                <p>
                  Detect suspicious certificates and information mismatches.
                </p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon green">▦</div>

              <div>
                <h3>QR Credential Verification</h3>

                <p>
                  Allow employers to verify issued certificates instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-security-card">
          <div className="security-shield">✓</div>

          <div>
            <span>SECURE ACCESS</span>
            <strong>Protected institution authentication</strong>
          </div>
        </div>

        <p className="login-copyright">
          © 2026 CertiChain AI. Securing academic credentials.
        </p>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrapper">
          <Link to="/" className="back-home-link">
            ← Back to Home
          </Link>

          <div className="login-heading">
            <div className="mobile-login-logo">
              <div className="login-brand-icon">✓</div>
              <strong>CertiChain AI</strong>
            </div>

            <span>INSTITUTION ACCESS</span>

            <h2>Welcome back</h2>

            <p>
              Sign in using your approved institution administrator account.
            </p>
          </div>

          <form
            className="institution-login-form"
            onSubmit={handleLogin}
          >
            <div className="login-input-group">
              <label htmlFor="institutionId">
                Institution ID
              </label>

              <div className="login-input">
                <span>⌂</span>

                <input
                  id="institutionId"
                  type="text"
                  placeholder="Example: INST-SL-001"
                  value={institutionId}
                  onChange={(event) =>
                    setInstitutionId(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="institutionEmail">
                Administrator Email
              </label>

              <div className="login-input">
                <span>✉</span>

                <input
                  id="institutionEmail"
                  type="email"
                  placeholder="admin@institution.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="login-input-group">
              <div className="password-label-row">
                <label htmlFor="institutionPassword">
                  Password
                </label>

                <a href="#forgot-password">
                  Forgot password?
                </a>
              </div>

              <div className="login-input">
                <span>🔒</span>

                <input
                  id="institutionPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="show-password-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
              />

              <span>Remember this device for 30 days</span>
            </label>

            <button
              type="submit"
              className="institution-sign-in-button"
            >
              Sign In to Institution Portal
              <span>→</span>
            </button>
          </form>

          <div className="login-divider">
            <span></span>
            <p>New institution?</p>
            <span></span>
          </div>

          <button
            type="button"
            className="request-access-button"
          >
            Request Institution Verification
          </button>

          <div className="institution-notice">
            <span>i</span>

            <p>
              Only verified universities, institutes and authorised training
              organisations can access this portal.
            </p>
          </div>

          <p className="login-support">
            Need help accessing your account?{" "}
            <a href="#support">Contact support</a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default InstitutionLogin;