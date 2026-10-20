import { Link } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="logo">
          <div className="logo-icon">✓</div>

          <div>
            <h2>CertiChain AI</h2>
            <span>Trusted Digital Credentials</span>
          </div>
        </Link>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#process">How It Works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/institution-login" className="login-button">
            Institution Login
          </Link>

          <button type="button" className="wallet-button">
            Connect Wallet
          </button>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="hero-label">
              <span>✦</span>
              AI-Powered Blockchain Verification
            </div>

            <h1>
              Verify certificates with
              <span> intelligence and trust.</span>
            </h1>

            <p className="hero-description">
              Detect fake, modified and revoked academic certificates using
              artificial intelligence, blockchain technology and secure QR
              verification.
            </p>

            <div className="hero-buttons">
              <Link to="/verify" className="primary-button">
                Verify a Certificate
                <span>→</span>
              </Link>

              <Link
                to="/institution-login"
                className="secondary-button"
              >
                Issue a Certificate
              </Link>
            </div>

            <div className="trust-items">
              <div>
                <span className="check">✓</span>
                Tamper Detection
              </div>

              <div>
                <span className="check">✓</span>
                Blockchain Secured
              </div>

              <div>
                <span className="check">✓</span>
                Privacy Protected
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow"></div>

            <div className="certificate-card">
              <div className="certificate-top">
                <div className="certificate-logo">C</div>

                <div className="certificate-status">
                  <span>✓</span>
                  Verified
                </div>
              </div>

              <div className="certificate-body">
                <p>ACADEMIC CERTIFICATE</p>

                <h3>BSc (Hons) Software Engineering</h3>

                <div className="certificate-line"></div>

                <span>Issued to</span>

                <h4>Volga Indeewari</h4>

                <div className="certificate-details">
                  <div>
                    <span>Certificate ID</span>
                    <strong>CCA-2026-0159</strong>
                  </div>

                  <div>
                    <span>Issue Date</span>
                    <strong>06 Aug 2026</strong>
                  </div>
                </div>
              </div>

              <div className="blockchain-record">
                <div className="chain-icon">⬡</div>

                <div>
                  <span>Blockchain Record</span>
                  <strong>0x8F2A...91C7</strong>
                </div>

                <div className="record-check">✓</div>
              </div>
            </div>

            <div className="ai-card">
              <div className="ai-icon">✦</div>

              <div>
                <span>AI Fraud Analysis</span>
                <strong>Low Risk · 4%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span>POWERFUL VERIFICATION</span>

            <h2>One platform. Multiple layers of trust.</h2>

            <p>
              CertiChain AI combines intelligent fraud detection with
              immutable blockchain records.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon purple">✦</div>

              <h3>AI Fraud Detection</h3>

              <p>
                Extract certificate information, detect suspicious changes
                and generate an explainable fraud-risk score.
              </p>

              <a href="#process">Learn more →</a>
            </article>

            <article className="feature-card">
              <div className="feature-icon blue">⬡</div>

              <h3>Blockchain Security</h3>

              <p>
                Store certificate fingerprints as permanent Ethereum records
                that cannot be secretly changed or removed.
              </p>

              <a href="#process">Learn more →</a>
            </article>

            <article className="feature-card">
              <div className="feature-icon green">▦</div>

              <h3>QR Verification</h3>

              <p>
                Scan a secure QR code to instantly check authenticity,
                institution approval and revocation status.
              </p>

              <a href="#process">Learn more →</a>
            </article>
          </div>
        </section>

        <section className="process" id="process">
          <div className="section-heading">
            <span>SIMPLE PROCESS</span>

            <h2>Verify a certificate in three steps</h2>
          </div>

          <div className="process-grid">
            <div className="process-step">
              <div className="step-number">01</div>

              <h3>Upload or Scan</h3>

              <p>
                Upload the certificate file or scan its unique QR code.
              </p>
            </div>

            <div className="process-arrow">→</div>

            <div className="process-step">
              <div className="step-number">02</div>

              <h3>AI and Blockchain Check</h3>

              <p>
                The system compares extracted information with the permanent
                blockchain record.
              </p>
            </div>

            <div className="process-arrow">→</div>

            <div className="process-step">
              <div className="step-number">03</div>

              <h3>Receive the Result</h3>

              <p>
                View the authenticity result, fraud-risk score and clear
                explanation.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer id="about">
        <div className="footer-logo">CertiChain AI</div>

        <p>
          Building trust in academic credentials through AI and blockchain.
        </p>

        <span>© 2026 CertiChain AI</span>
      </footer>
    </div>
  );
}

export default App;