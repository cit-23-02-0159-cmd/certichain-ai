import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { issueCertificateOnBlockchain } from "./blockchain";
import { saveCertificateToBackend } from "./api";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";

import "./IssueCertificate.css";

function IssueCertificate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [certificateFile, setCertificateFile] = useState(null);
  const [confirmDetails, setConfirmDetails] = useState(false);
  const [storeOnBlockchain, setStoreOnBlockchain] = useState(true);
  const [generateQrCode, setGenerateQrCode] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);

  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    studentEmail: "",
    qualification: "",
    certificateType: "",
    faculty: "",
    issueDate: "",
    completionDate: "",
    finalGrade: "",
    certificateId: `CCA-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`,
    description: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please select a PDF certificate file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("The certificate PDF must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setCertificateFile(file);
  };

  const removeFile = () => {
    setCertificateFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to Embed QR Code directly into the PDF File
  const embedQrCodeInPdf = async (pdfFile, certificateId) => {
    try {
      // 1. Generate QR Code Data URL
      const qrDataUrl = await QRCode.toDataURL(certificateId, {
        width: 300,
        margin: 1,
        errorCorrectionLevel: "H",
      });

      // 2. Read the uploaded PDF file as ArrayBuffer
      const existingPdfBytes = await pdfFile.arrayBuffer();

      // 3. Load PDF via pdf-lib
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // 4. Convert QR Data URL to PNG Image object
      const qrImageBytes = await fetch(qrDataUrl).then((res) =>
        res.arrayBuffer()
      );
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      // 5. Get the first page of the PDF
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();

      // 6. Draw QR Code on the Bottom Right Corner of the PDF
      const qrSize = 80; // Size of QR code in PDF points
      firstPage.drawImage(qrImage, {
        x: width - qrSize - 20, // 20px margin from right
        y: 20, // 20px margin from bottom
        width: qrSize,
        height: qrSize,
      });

      // 7. Save and return modified PDF File object
      const pdfBytes = await pdfDoc.save();
      const stampedBlob = new Blob([pdfBytes], { type: "application/pdf" });

      return new File(
        [stampedBlob],
        `CertiChain_${certificateId}_Stamped.pdf`,
        { type: "application/pdf" }
      );
    } catch (error) {
      console.error("Failed to embed QR code into PDF:", error);
      // Fallback to original file if embedding fails
      return pdfFile;
    }
  };

  const generateAndDownloadQrCode = async (certificateId) => {
    const qrPayload = certificateId;

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    const downloadLink = document.createElement("a");
    downloadLink.href = qrDataUrl;
    downloadLink.download = `CertiChain_QR_${certificateId}.png`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    return {
      qrPayload,
      qrDataUrl,
    };
  };

  const handleIssueCertificate = async (event) => {
    event.preventDefault();

    const requiredFields = [
      formData.studentName,
      formData.studentId,
      formData.studentEmail,
      formData.qualification,
      formData.certificateType,
      formData.issueDate,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      alert("Please complete all required certificate fields.");
      return;
    }

    if (!certificateFile) {
      alert("Please upload the official certificate PDF.");
      return;
    }

    if (!confirmDetails) {
      alert("Please confirm that the certificate details are correct.");
      return;
    }

    if (!storeOnBlockchain) {
      alert("Please enable blockchain registration.");
      return;
    }

    try {
      setIsIssuing(true);

      // A. Embed QR Code directly inside PDF if selected & Auto Download Stamped PDF
      let fileToProcess = certificateFile;
      if (generateQrCode) {
        fileToProcess = await embedQrCodeInPdf(
          certificateFile,
          formData.certificateId
        );

        // Auto-download the Stamped PDF to the user's Downloads folder
        const pdfUrl = URL.createObjectURL(fileToProcess);
        const pdfDownloadLink = document.createElement("a");
        pdfDownloadLink.href = pdfUrl;
        pdfDownloadLink.download = fileToProcess.name;
        document.body.appendChild(pdfDownloadLink);
        pdfDownloadLink.click();
        pdfDownloadLink.remove();
        URL.revokeObjectURL(pdfUrl);
      }

      // 1. Register the stamped certificate fingerprint on the blockchain.
      const result = await issueCertificateOnBlockchain({
        certificateId: formData.certificateId,
        studentName: formData.studentName,
        qualification: formData.qualification,
        file: fileToProcess,
      });

      // 2. Save the full certificate metadata in the backend API.
      try {
        await saveCertificateToBackend({
          ...formData,
          institution: "SLTC Research University",
          documentHash: result.documentHash,
          transactionHash: result.transactionHash,
          blockNumber:
            result.blockNumber?.toString?.() ?? result.blockNumber,
          fileName: fileToProcess.name,
          generateQrCode,
          qrPayload: generateQrCode ? formData.certificateId : null,
          blockchainNetwork: "Hardhat Local",
          status: "ACTIVE",
        });
      } catch (backendError) {
        console.error("Backend save error:", backendError);

        alert(
          `Blockchain registration succeeded, but the backend save failed.

Certificate ID:
${result.certificateId}

Do not issue this certificate again. Check the backend server and save the metadata again.`
        );

        navigate("/institution-dashboard");
        return;
      }

      let qrStatus = "QR Code: Not generated";

      if (generateQrCode) {
        await generateAndDownloadQrCode(
          result.certificateId || formData.certificateId
        );

        qrStatus = "QR Code: Embedded into PDF & Auto-Downloaded";
      }

      alert(
        `Certificate issued successfully!

Certificate ID:
${result.certificateId}

Document Hash:
${result.documentHash}

Transaction Hash:
${result.transactionHash}

Block Number:
${result.blockNumber}

Backend: Saved successfully
${qrStatus}`
      );

      navigate("/institution-dashboard");
    } catch (error) {
      console.error("Certificate issuing error:", error);

      let message =
        error?.reason ||
        error?.shortMessage ||
        error?.message ||
        "Certificate issuing failed.";

      if (
        message.includes("user rejected") ||
        message.includes("ACTION_REJECTED")
      ) {
        message = "MetaMask transaction was cancelled.";
      }

      alert(message);
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="issue-certificate-page">
      <aside className="issue-sidebar">
        <Link to="/" className="issue-sidebar-logo">
          <div className="issue-sidebar-logo-icon">✓</div>

          <div>
            <h2>CertiChain AI</h2>
            <span>Institution Portal</span>
          </div>
        </Link>

        <div className="issue-institution">
          <div className="issue-institution-logo">S</div>

          <div>
            <h3>SLTC Research University</h3>
            <p>✓ Verified Institution</p>
          </div>
        </div>

        <nav className="issue-menu">
          <p>MAIN MENU</p>

          <Link to="/institution-dashboard">
            <span>▦</span>
            Dashboard
          </Link>

          <a href="#certificates">
            <span>◇</span>
            Certificates
          </a>

          <a href="#issue" className="active">
            <span>＋</span>
            Issue Certificate
          </a>

          <Link to="/verify">
            <span>✓</span>
            Verify Certificate
          </Link>

          <a href="#blockchain">
            <span>⬡</span>
            Blockchain Records
          </a>

          <p className="issue-management-label">MANAGEMENT</p>

          <a href="#students">
            <span>♙</span>
            Students
          </a>

          <a href="#templates">
            <span>▤</span>
            Templates
          </a>

          <a href="#settings">
            <span>⚙</span>
            Settings
          </a>
        </nav>

        <div className="issue-sidebar-security">
          <span>🔒</span>

          <div>
            <strong>Secure Issuing Process</strong>
            <p>Blockchain protected credentials</p>
          </div>
        </div>

        <Link to="/institution-login" className="issue-sign-out">
          <span>↪</span>
          Sign Out
        </Link>
      </aside>

      <div className="issue-content">
        <header className="issue-header">
          <div>
            <Link to="/institution-dashboard">← Back to Dashboard</Link>

            <h1>Issue New Certificate</h1>

            <p>Create and register a trusted academic credential.</p>
          </div>

          <div className="issue-header-actions">
            <button type="button" className="issue-draft-button">
              Save Draft
            </button>

            <div className="issue-admin-profile">
              <div>VI</div>

              <span>
                <strong>Volga Indeewari</strong>
                Institution Admin
              </span>
            </div>
          </div>
        </header>

        <main className="issue-main" id="issue">
          <div className="issue-page-heading">
            <div>
              <span>CERTIFICATE ISSUING</span>

              <h2>Create a blockchain-secured credential</h2>

              <p>
                Complete the student and qualification details before
                registering the certificate.
              </p>
            </div>

            <div className="issue-process-status">
              <div className="issue-process-step active">
                <span>1</span>
                Details
              </div>

              <div className="issue-process-line"></div>

              <div className="issue-process-step">
                <span>2</span>
                Review
              </div>

              <div className="issue-process-line"></div>

              <div className="issue-process-step">
                <span>3</span>
                Blockchain
              </div>
            </div>
          </div>

          <form
            className="issue-form-layout"
            onSubmit={handleIssueCertificate}
          >
            <div className="issue-form-left">
              <section className="issue-form-card">
                <div className="issue-card-heading">
                  <div className="issue-heading-icon purple">♙</div>

                  <div>
                    <span>SECTION 01</span>

                    <h3>Student Information</h3>

                    <p>
                      Enter the certificate recipient’s personal details.
                    </p>
                  </div>
                </div>

                <div className="issue-input-grid">
                  <div className="issue-input-group full-width">
                    <label htmlFor="studentName">
                      Student Full Name <span>*</span>
                    </label>

                    <input
                      id="studentName"
                      name="studentName"
                      type="text"
                      placeholder="Enter the name exactly as it should appear"
                      value={formData.studentName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="studentId">
                      Student ID <span>*</span>
                    </label>

                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      placeholder="Example: CIT-23-02-0159"
                      value={formData.studentId}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="studentEmail">
                      Student Email <span>*</span>
                    </label>

                    <input
                      id="studentEmail"
                      name="studentEmail"
                      type="email"
                      placeholder="student@email.com"
                      value={formData.studentEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </section>

              <section className="issue-form-card">
                <div className="issue-card-heading">
                  <div className="issue-heading-icon blue">◇</div>

                  <div>
                    <span>SECTION 02</span>

                    <h3>Qualification Details</h3>

                    <p>
                      Provide the academic programme and award information.
                    </p>
                  </div>
                </div>

                <div className="issue-input-grid">
                  <div className="issue-input-group full-width">
                    <label htmlFor="qualification">
                      Qualification or Course <span>*</span>
                    </label>

                    <input
                      id="qualification"
                      name="qualification"
                      type="text"
                      placeholder="Example: BSc (Hons) Software Engineering"
                      value={formData.qualification}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="certificateType">
                      Certificate Type <span>*</span>
                    </label>

                    <select
                      id="certificateType"
                      name="certificateType"
                      value={formData.certificateType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select certificate type</option>

                      <option value="Degree">Academic Degree</option>

                      <option value="Diploma">Diploma</option>

                      <option value="Certificate">
                        Professional Certificate
                      </option>

                      <option value="Training">Training Completion</option>

                      <option value="Achievement">Achievement Award</option>
                    </select>
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="faculty">Faculty or Department</label>

                    <input
                      id="faculty"
                      name="faculty"
                      type="text"
                      placeholder="Example: Faculty of Computing"
                      value={formData.faculty}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="issueDate">
                      Issue Date <span>*</span>
                    </label>

                    <input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="completionDate">Completion Date</label>

                    <input
                      id="completionDate"
                      name="completionDate"
                      type="date"
                      value={formData.completionDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="finalGrade">Final Grade</label>

                    <input
                      id="finalGrade"
                      name="finalGrade"
                      type="text"
                      placeholder="Example: First Class"
                      value={formData.finalGrade}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group">
                    <label htmlFor="certificateId">Certificate ID</label>

                    <input
                      id="certificateId"
                      name="certificateId"
                      type="text"
                      value={formData.certificateId}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="issue-input-group full-width">
                    <label htmlFor="description">
                      Additional Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      placeholder="Enter honours, specialisation or other relevant details"
                      value={formData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </section>

              <section className="issue-form-card">
                <div className="issue-card-heading">
                  <div className="issue-heading-icon green">⇧</div>

                  <div>
                    <span>SECTION 03</span>

                    <h3>Certificate Document</h3>

                    <p>
                      Upload the official certificate PDF for verification.
                    </p>
                  </div>
                </div>

                {!certificateFile ? (
                  <div
                    className="issue-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      hidden
                    />

                    <div className="issue-upload-icon">⇧</div>

                    <h4>Upload certificate PDF</h4>

                    <p>Click to browse. Maximum file size: 10 MB.</p>

                    <button type="button">Choose PDF Document</button>
                  </div>
                ) : (
                  <div className="issue-selected-file">
                    <div className="issue-file-icon">PDF</div>

                    <div>
                      <strong>{certificateFile.name}</strong>

                      <span>
                        {(certificateFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <p>✓ Ready for hashing & QR embedding</p>

                    <button type="button" onClick={removeFile}>
                      ×
                    </button>
                  </div>
                )}
              </section>
            </div>

            <aside className="issue-form-right">
              <section className="issue-summary-card">
                <div className="issue-summary-heading">
                  <div className="issue-summary-icon">◇</div>

                  <div>
                    <span>CERTIFICATE PREVIEW</span>
                    <h3>Issuing Summary</h3>
                  </div>
                </div>

                <div className="issue-preview">
                  <div className="issue-preview-top">
                    <div>C</div>
                    <span>Draft</span>
                  </div>

                  <p>ACADEMIC CERTIFICATE</p>

                  <h3>
                    {formData.qualification || "Qualification Name"}
                  </h3>

                  <div className="issue-preview-line"></div>

                  <span>Issued to</span>

                  <h4>{formData.studentName || "Student Full Name"}</h4>

                  <div className="issue-preview-details">
                    <div>
                      <span>Certificate ID</span>

                      <strong>{formData.certificateId}</strong>
                    </div>

                    <div>
                      <span>Issue Date</span>

                      <strong>
                        {formData.issueDate || "Not selected"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="issue-summary-list">
                  <div>
                    <span>Institution</span>

                    <strong>SLTC Research University</strong>
                  </div>

                  <div>
                    <span>Student ID</span>

                    <strong>
                      {formData.studentId || "Not entered"}
                    </strong>
                  </div>

                  <div>
                    <span>Certificate Type</span>

                    <strong>
                      {formData.certificateType || "Not selected"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="issue-options-card">
                <span>ISSUING OPTIONS</span>

                <h3>Security and verification</h3>

                <label className="issue-option">
                  <input
                    type="checkbox"
                    checked={storeOnBlockchain}
                    onChange={(event) =>
                      setStoreOnBlockchain(event.target.checked)
                    }
                  />

                  <div>
                    <strong>Register on blockchain</strong>

                    <p>
                      Store the SHA-256 certificate fingerprint permanently.
                    </p>
                  </div>
                </label>

                <label className="issue-option">
                  <input
                    type="checkbox"
                    checked={generateQrCode}
                    onChange={(event) =>
                      setGenerateQrCode(event.target.checked)
                    }
                  />

                  <div>
                    <strong>Generate verification QR code</strong>

                    <p>
                      Embed unique QR code into PDF for public checking.
                    </p>
                  </div>
                </label>
              </section>

              <section
                className="issue-blockchain-card"
                id="blockchain"
              >
                <div className="issue-blockchain-icon">⬡</div>

                <div>
                  <span>BLOCKCHAIN NETWORK</span>

                  <h3>Ethereum Local Network</h3>

                  <p>Network active · MetaMask transaction required</p>
                </div>

                <div className="issue-network-dot"></div>
              </section>

              <label className="issue-confirmation">
                <input
                  type="checkbox"
                  checked={confirmDetails}
                  onChange={(event) =>
                    setConfirmDetails(event.target.checked)
                  }
                />

                <span>
                  I confirm that all certificate details are correct and
                  authorised by the issuing institution.
                </span>
              </label>

              <button
                type="submit"
                className="issue-certificate-button"
                disabled={isIssuing}
              >
                <span>⬡</span>

                {isIssuing
                  ? "Registering on Blockchain..."
                  : "Issue and Register Certificate"}

                <span>→</span>
              </button>

              <p className="issue-warning">
                Certificate records cannot be secretly changed after
                blockchain registration.
              </p>
            </aside>
          </form>
        </main>
      </div>
    </div>
  );
}

export default IssueCertificate;