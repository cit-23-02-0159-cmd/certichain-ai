import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "./api";

import { revokeCertificateOnBlockchain } from "./blockchain";

import "./InstitutionDashboard.css";

function InstitutionDashboard() {

  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);

  const [loadingCertificates, setLoadingCertificates] = useState(true);

  const [certificateError, setCertificateError] = useState("");

  const [verificationStats, setVerificationStats] = useState({
    total: 0,
    valid: 0,
    suspicious: 0,
    invalid: 0,
  });

  const [loadingVerifications, setLoadingVerifications] = useState(true);

  const [verificationError, setVerificationError] = useState("");

  const [verificationRecords, setVerificationRecords] = useState([]);

  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {

    const loadCertificates = async () => {

      try {

        setLoadingCertificates(true);

        setCertificateError("");

        const response = await fetch(`${API_BASE_URL}/certificates`);

        const data = await response.json();

        if (!response.ok) {

          throw new Error(data.message || "Failed to load certificates");

        }

        setCertificates(

          Array.isArray(data.certificates) ? data.certificates : []

        );

      } catch (error) {

        console.error("Dashboard certificate load error:", error);

        setCertificateError(

          error?.message ||

            "Unable to load certificate data from the backend."

        );

      } finally {

        setLoadingCertificates(false);

      }

    };

    loadCertificates();

  }, []);

  useEffect(() => {
    const loadVerificationStats = async () => {
      try {
        setLoadingVerifications(true);
        setVerificationError("");

        const response = await fetch(`${API_BASE_URL}/verifications/stats`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load verification statistics");
        }

        setVerificationStats({
          total: Number(data.total || 0),
          valid: Number(data.valid || 0),
          suspicious: Number(data.suspicious || 0),
          invalid: Number(data.invalid || 0),
        });
      } catch (error) {
        console.error("Dashboard verification load error:", error);
        setVerificationError(
          error?.message ||
            "Unable to load verification statistics from the backend."
        );
      } finally {
        setLoadingVerifications(false);
      }
    };

    loadVerificationStats();
  }, []);

  useEffect(() => {
    const loadVerificationRecords = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/verifications`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load verification records");
        }

        const records = Array.isArray(data.verifications)
          ? data.verifications
          : Array.isArray(data.records)
            ? data.records
            : Array.isArray(data)
              ? data
              : [];

        setVerificationRecords(records);
      } catch (error) {
        console.error("Dashboard verification records load error:", error);
      }
    };

    loadVerificationRecords();
  }, []);

  const normaliseStatus = (status) =>

    String(status || "ACTIVE").trim().toUpperCase();

  const formatStatus = (status) => {

    const value = normaliseStatus(status);

    return value.charAt(0) + value.slice(1).toLowerCase();

  };

  const formatDate = (dateValue) => {

    if (!dateValue) {

      return "Not available";

    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {

      return dateValue;

    }

    return date.toLocaleDateString("en-GB", {

      day: "2-digit",

      month: "short",

      year: "numeric",

    });

  };

  const totalCertificates = certificates.length;

  const activeCertificates = certificates.filter(

    (certificate) =>

      normaliseStatus(certificate.status) === "ACTIVE"

  ).length;

  const revokedCertificates = certificates.filter(

    (certificate) =>

      normaliseStatus(certificate.status) === "REVOKED"

  ).length;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const issuedThisMonth = certificates.filter((certificate) =>

    String(certificate.issueDate || "").startsWith(currentMonth)

  ).length;

  const activePercentage =

    totalCertificates === 0

      ? "0.0"

      : (

          (activeCertificates / totalCertificates) *

          100

        ).toFixed(1);

  const revokedPercentage =

    totalCertificates === 0

      ? "0.0"

      : (

          (revokedCertificates / totalCertificates) *

          100

        ).toFixed(1);

  const recentCertificates = [...certificates]

    .sort((first, second) => {

      const firstDate = new Date(

        first.createdAt || first.issueDate || 0

      );

      const secondDate = new Date(

        second.createdAt || second.issueDate || 0

      );

      return secondDate - firstDate;

    })

    .slice(0, 5)

    .map((certificate) => ({

      id: certificate.certificateId,

      student: certificate.studentName,

      course: certificate.qualification,

      date: formatDate(certificate.issueDate),

      status: formatStatus(certificate.status),

    }));

  const getLocalDateKey = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const verificationChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = getLocalDateKey(date);

    const count = verificationRecords.filter((record) => {
      const recordDate =
        record.verifiedAt ||
        record.createdAt ||
        record.timestamp ||
        record.date;

      return getLocalDateKey(recordDate) === key;
    }).length;

    return {
      key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      count,
      isToday: index === 6,
    };
  });

  const highestDailyVerification = Math.max(
    0,
    ...verificationChartData.map((day) => day.count)
  );

  const chartAxisTop = Math.max(
    3,
    Math.ceil(highestDailyVerification / 3) * 3
  );

  const chartAxisMiddleHigh = Math.round((chartAxisTop * 2) / 3);
  const chartAxisMiddleLow = Math.round(chartAxisTop / 3);

  const handleRevokeCertificate = async () => {
    if (isRevoking) {
      return;
    }

    const enteredCertificateId = window.prompt(
      "Enter the Certificate ID you want to revoke:"
    );

    if (!enteredCertificateId) {
      return;
    }

    const cleanCertificateId = enteredCertificateId
      .trim()
      .toUpperCase();

    const certificate = certificates.find(
      (item) =>
        String(item.certificateId || "")
          .trim()
          .toUpperCase() === cleanCertificateId
    );

    if (!certificate) {
      window.alert(
        "Certificate not found in the backend. Check the Certificate ID."
      );
      return;
    }

    if (normaliseStatus(certificate.status) === "REVOKED") {
      window.alert("This certificate is already revoked.");
      return;
    }

    const reason = window.prompt(
      "Enter the reason for revoking this certificate:"
    );

    if (!reason || !reason.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Revoke ${cleanCertificateId}?\n\nThis blockchain action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsRevoking(true);

      const blockchainResult =
        await revokeCertificateOnBlockchain(
          cleanCertificateId,
          reason.trim()
        );

      const response = await fetch(
        `${API_BASE_URL}/certificates/${encodeURIComponent(
          cleanCertificateId
        )}/revoke`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim(),
            transactionHash:
              blockchainResult.transactionHash,
            blockNumber:
              blockchainResult.blockNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Blockchain revoke succeeded, but backend update failed."
        );
      }

      setCertificates((currentCertificates) =>
        currentCertificates.map((item) =>
          String(item.certificateId || "")
            .trim()
            .toUpperCase() === cleanCertificateId
            ? data.certificate
            : item
        )
      );

      window.alert(
        `Certificate ${cleanCertificateId} revoked successfully.`
      );
    } catch (error) {
      console.error("Certificate revoke error:", error);

      window.alert(
        error?.message ||
          "Unable to revoke the certificate. Check MetaMask and the blockchain."
      );
    } finally {
      setIsRevoking(false);
    }
  };

  const goToIssueCertificate = () => {

    navigate("/issue-certificate");

  };

  return (

    <div className="institution-dashboard">

      <aside className="dashboard-sidebar">

        <Link to="/" className="dashboard-logo">

          <div className="dashboard-logo-icon">✓</div>

          <div>

            <h2>CertiChain AI</h2>

            <span>Institution Portal</span>

          </div>

        </Link>

        <div className="institution-profile">

          <div className="institution-profile-logo">S</div>

          <div>

            <h3>SLTC Research University</h3>

            <p>Verified Institution</p>

          </div>

          <span className="institution-profile-check">✓</span>

        </div>

        <nav className="dashboard-menu">

          <p>MAIN MENU</p>

          <a href="#overview" className="dashboard-menu-item active">

            <span>▦</span>

            Overview

          </a>

          <a href="#certificates" className="dashboard-menu-item">

            <span>◇</span>

            Certificates

            <strong>{loadingCertificates ? "..." : totalCertificates}</strong>

          </a>

          <button

            type="button"

            className="dashboard-menu-item"

            onClick={goToIssueCertificate}

          >

            <span>＋</span>

            Issue Certificate

          </button>

          <Link to="/verify" className="dashboard-menu-item">

            <span>✓</span>

            Verifications

            <strong>{loadingVerifications ? "..." : verificationStats.total}</strong>

          </Link>

          <a href="#blockchain" className="dashboard-menu-item">

            <span>⬡</span>

            Blockchain Records

          </a>

          <p className="management-label">MANAGEMENT</p>

          <a href="#students" className="dashboard-menu-item">

            <span>♙</span>

            Students

          </a>

          <a href="#templates" className="dashboard-menu-item">

            <span>▤</span>

            Templates

          </a>

          <a href="#settings" className="dashboard-menu-item">

            <span>⚙</span>

            Settings

          </a>

        </nav>

        <div className="sidebar-security">

          <div>🔒</div>

          <div>

            <strong>Blockchain Secured</strong>

            <p>All records are protected</p>

          </div>

        </div>

        <Link to="/institution-login" className="dashboard-logout">

          <span>↪</span>

          Sign Out

        </Link>

      </aside>

      <div className="dashboard-content">

        <header className="dashboard-header">

          <div>

            <h1>Institution Dashboard</h1>

            <p>

              {new Date().toLocaleDateString("en-GB", {

                weekday: "long",

                day: "2-digit",

                month: "long",

                year: "numeric",

              })}

            </p>

          </div>

          <div className="dashboard-header-actions">

            <button type="button" className="notification-button">

              ♢

              <span></span>

            </button>

            <button type="button" className="dashboard-wallet">

              <span>⬡</span>

              0x7099...79C8

            </button>

            <div className="admin-profile">

              <div className="admin-avatar">VI</div>

              <div>

                <strong>Volga Indeewari</strong>

                <span>Institution Admin</span>

              </div>

            </div>

          </div>

        </header>

        <main className="dashboard-main" id="overview">

          <section className="welcome-banner">

            <div>

              <span>WELCOME BACK</span>

              <h2>Manage trusted academic credentials</h2>

              <p>

                Issue, verify and manage blockchain-secured certificates from

                your institution workspace.

              </p>

            </div>

            <button

              type="button"

              onClick={goToIssueCertificate}

            >

              <span>＋</span>

              Issue New Certificate

            </button>

          </section>

          {certificateError && (

            <p

              style={{

                margin: "0 0 18px",

                padding: "12px 14px",

                borderRadius: "10px",

                background: "#fff1f2",

                color: "#be123c",

                fontWeight: 600,

              }}

            >

              Backend error: {certificateError}

            </p>

          )}

          {verificationError && (
            <p
              style={{
                margin: "0 0 18px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fff7ed",
                color: "#c2410c",
                fontWeight: 600,
              }}
            >
              Verification API error: {verificationError}
            </p>
          )}

          <section className="dashboard-statistics">

            <article className="stat-card">

              <div className="stat-icon purple">◇</div>

              <div className="stat-card-top">

                <span>Total Certificates</span>

                <strong className="positive-change">LIVE</strong>

              </div>

              <h3>{loadingCertificates ? "..." : totalCertificates}</h3>

              <p>{issuedThisMonth} issued this month</p>

            </article>

            <article className="stat-card">

              <div className="stat-icon green">✓</div>

              <div className="stat-card-top">

                <span>Active Certificates</span>

                <strong className="positive-change">

                  {activePercentage}%

                </strong>

              </div>

              <h3>{loadingCertificates ? "..." : activeCertificates}</h3>

              <p>{activeCertificates} active backend records</p>

            </article>

            <article className="stat-card">

              <div className="stat-icon blue">◎</div>

              <div className="stat-card-top">

                <span>Total Verifications</span>

                <strong className="positive-change">LIVE</strong>

              </div>

              <h3>{loadingVerifications ? "..." : verificationStats.total}</h3>

              <p>
                {verificationStats.valid} valid · {verificationStats.suspicious} suspicious
              </p>

            </article>

            <article className="stat-card">

              <div className="stat-icon orange">!</div>

              <div className="stat-card-top">

                <span>Revoked Certificates</span>

                <strong>{revokedPercentage}%</strong>

              </div>

              <h3>{loadingCertificates ? "..." : revokedCertificates}</h3>

              <p>{revokedCertificates} revoked backend records</p>

            </article>

          </section>

          <div className="dashboard-grid">

            <section className="dashboard-panel activity-panel">

              <div className="panel-heading">

                <div>

                  <span>VERIFICATION ACTIVITY</span>

                  <h2>Certificate verifications</h2>

                </div>

                <select defaultValue="7-days">

                  <option value="7-days">Last 7 days</option>

                  <option value="30-days">Last 30 days</option>

                  <option value="90-days">Last 90 days</option>

                </select>

              </div>

              <div className="chart-summary">

                <div>

                  <span>Total verifications</span>

                  <strong>{loadingVerifications ? "..." : verificationStats.total}</strong>

                </div>

                <div>

                  <span className="chart-dot valid"></span>

                  Valid

                  <strong>{loadingVerifications ? "..." : verificationStats.valid}</strong>

                </div>

                <div>

                  <span className="chart-dot suspicious"></span>

                  Suspicious

                  <strong>{loadingVerifications ? "..." : verificationStats.suspicious}</strong>

                </div>

                <div>

                  <span className="chart-dot invalid"></span>

                  Invalid

                  <strong>{loadingVerifications ? "..." : verificationStats.invalid}</strong>

                </div>

              </div>

              <div className="activity-chart">

                <div className="chart-y-axis">

                  <span>{chartAxisTop}</span>

                  <span>{chartAxisMiddleHigh}</span>

                  <span>{chartAxisMiddleLow}</span>

                  <span>0</span>

                </div>

                <div className="chart-area">

                  <div className="chart-grid-line line-one"></div>

                  <div className="chart-grid-line line-two"></div>

                  <div className="chart-grid-line line-three"></div>

                  <div className="chart-grid-line line-four"></div>

                  <div className="chart-bars">

                    {verificationChartData.map((day) => {
                      const barHeight =
                        day.count === 0
                          ? "0px"
                          : `${Math.max(
                              12,
                              (day.count / chartAxisTop) * 100
                            )}%`;

                      return (
                        <div className="chart-column" key={day.key}>
                          <div
                            className={`chart-bar${day.isToday ? " today" : ""}`}
                            style={{
                              height: barHeight,
                              minHeight: day.count === 0 ? "0px" : "10px",
                            }}
                            title={`${day.label}: ${day.count} verification${
                              day.count === 1 ? "" : "s"
                            }`}
                          ></div>

                          <span>{day.label}</span>
                        </div>
                      );
                    })}

                  </div>

                </div>

              </div>

            </section>

            <aside className="dashboard-panel quick-actions-panel">

              <div className="panel-heading">

                <div>

                  <span>QUICK ACCESS</span>

                  <h2>Quick actions</h2>

                </div>

              </div>

              <div className="quick-actions">

                <button

                  type="button"

                  onClick={goToIssueCertificate}

                >

                  <div className="quick-icon purple">＋</div>

                  <div>

                    <strong>Issue Certificate</strong>

                    <span>Create a new blockchain credential</span>

                  </div>

                  <b>→</b>

                </button>

                <Link to="/verify">

                  <div className="quick-icon blue">✓</div>

                  <div>

                    <strong>Verify Certificate</strong>

                    <span>Check certificate authenticity</span>

                  </div>

                  <b>→</b>

                </Link>

                <button type="button">

                  <div className="quick-icon green">⇧</div>

                  <div>

                    <strong>Bulk Upload</strong>

                    <span>Issue multiple certificates</span>

                  </div>

                  <b>→</b>

                </button>

                <button
                  type="button"
                  onClick={handleRevokeCertificate}
                  disabled={isRevoking}
                >

                  <div className="quick-icon orange">!</div>

                  <div>

                    <strong>
                      {isRevoking
                        ? "Revoking Certificate..."
                        : "Revoke Certificate"}
                    </strong>

                    <span>
                      {isRevoking
                        ? "Waiting for MetaMask and blockchain confirmation"
                        : "Update a certificate status"}
                    </span>

                  </div>

                  <b>→</b>

                </button>

              </div>

            </aside>

          </div>

          <section

            className="dashboard-panel recent-certificates"

            id="certificates"

          >

            <div className="panel-heading">

              <div>

                <span>RECENT RECORDS</span>

                <h2>Recently issued certificates</h2>

              </div>

              <button type="button" className="view-all-button">

                View All Certificates →

              </button>

            </div>

            <div className="certificate-table-wrapper">

              <table className="certificate-table">

                <thead>

                  <tr>

                    <th>Certificate ID</th>

                    <th>Student</th>

                    <th>Qualification</th>

                    <th>Issue Date</th>

                    <th>Status</th>

                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {loadingCertificates ? (

                    <tr>

                      <td colSpan="6">

                        Loading certificate records...

                      </td>

                    </tr>

                  ) : recentCertificates.length === 0 ? (

                    <tr>

                      <td colSpan="6">

                        No certificates saved in the backend yet.

                      </td>

                    </tr>

                  ) : (

                    recentCertificates.map((certificate) => (

                      <tr key={certificate.id}>

                        <td>

                          <strong>{certificate.id}</strong>

                        </td>

                        <td>

                          <div className="student-cell">

                            <div>

                              {String(certificate.student || "?")

                                .split(" ")

                                .filter(Boolean)

                                .map((name) => name[0])

                                .join("")

                                .slice(0, 2)}

                            </div>

                            <span>{certificate.student}</span>

                          </div>

                        </td>

                        <td>{certificate.course}</td>

                        <td>{certificate.date}</td>

                        <td>

                          <span

                            className={`certificate-table-status ${certificate.status.toLowerCase()}`}

                          >

                            {certificate.status}

                          </span>

                        </td>

                        <td>

                          <button

                            type="button"

                            className="table-action"

                          >

                            •••

                          </button>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>

          <section className="blockchain-status" id="blockchain">

            <div className="blockchain-status-icon">⬡</div>

            <div>

              <span>BLOCKCHAIN NETWORK</span>

              <h3>Ethereum Local Network is operational</h3>

              <p>

                Certificate issuing and verification are connected to the Hardhat Local blockchain.

              </p>

            </div>

            <div className="network-status">

              <span></span>

              Network Active

            </div>

          </section>

        </main>

      </div>

    </div>

  );

}

export default InstitutionDashboard;
