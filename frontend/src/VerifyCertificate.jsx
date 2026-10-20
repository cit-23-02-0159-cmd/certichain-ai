import { useEffect, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { Html5Qrcode } from "html5-qrcode";

import {

  getCertificateFromBlockchain,

  verifyUploadedCertificate,

} from "./blockchain";

import { API_BASE_URL } from "./api";

import "./VerifyCertificate.css";

async function recordVerificationInBackend({
  certificateId,
  documentHash,
  status,
}) {
  const response = await fetch(`${API_BASE_URL}/verifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      certificateId,
      documentHash: documentHash || null,
      status,
    }),
  });

  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Unable to save verification record. HTTP ${response.status}`
    );
  }

  return data;
}

const QR_READER_ID = "certichain-qr-reader";

function extractCertificateIdFromQr(decodedText) {
  const value = String(decodedText || "").trim();

  if (!value) {
    return "";
  }

  const directMatch = value.match(/\bCCA-\d{4}-\d+\b/i);

  if (directMatch) {
    return directMatch[0].toUpperCase();
  }

  try {
    const parsed = JSON.parse(value);
    const jsonId =
      parsed?.certificateId ||
      parsed?.certificateID ||
      parsed?.id;

    if (jsonId) {
      const jsonMatch = String(jsonId).match(
        /\bCCA-\d{4}-\d+\b/i
      );

      if (jsonMatch) {
        return jsonMatch[0].toUpperCase();
      }
    }
  } catch {
    // Not JSON. Continue with URL parsing.
  }

  try {
    const url = new URL(value);
    const urlId =
      url.searchParams.get("certificateId") ||
      url.searchParams.get("id") ||
      url.searchParams.get("certificate");

    if (urlId) {
      const urlMatch = String(urlId).match(
        /\bCCA-\d{4}-\d+\b/i
      );

      if (urlMatch) {
        return urlMatch[0].toUpperCase();
      }
    }
  } catch {
    // Not a URL. No problem.
  }

  return "";
}

function VerifyCertificate() {

  const navigate = useNavigate();

  const [verificationMethod, setVerificationMethod] =

    useState("upload");

  const [selectedFile, setSelectedFile] = useState(null);

  const [certificateId, setCertificateId] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);

  const [isQrScannerActive, setIsQrScannerActive] =
    useState(false);

  const [qrStatusMessage, setQrStatusMessage] =
    useState("Camera is ready to be enabled.");

  const [qrError, setQrError] = useState("");

  const fileInputRef = useRef(null);

  const qrScannerRef = useRef(null);

  const qrScanHandledRef = useRef(false);

  const stopQrScanner = async () => {
    const scanner = qrScannerRef.current;

    if (!scanner) {
      setIsQrScannerActive(false);
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Scanner may already be stopped.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore cleanup errors.
    }

    qrScannerRef.current = null;
    setIsQrScannerActive(false);
  };

  useEffect(() => {
    return () => {
      const scanner = qrScannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });
      }
    };
  }, []);

  const changeVerificationMethod = async (method) => {
    if (verificationMethod === "qr" && method !== "qr") {
      await stopQrScanner();
    }

    setQrError("");
    setVerificationMethod(method);
  };

  const handleFileChange = (event) => {

    const file = event.target.files[0];

    if (!file) {

      return;

    }

    const allowedTypes = [

      "application/pdf",

      "image/png",

      "image/jpeg",

    ];

    if (!allowedTypes.includes(file.type)) {

      alert(

        "Please select a PDF, PNG or JPG certificate."

      );

      event.target.value = "";

      return;

    }

    if (file.size > 10 * 1024 * 1024) {

      alert(

        "The certificate file must be smaller than 10 MB."

      );

      event.target.value = "";

      return;

    }

    setSelectedFile(file);

  };

  const removeFile = () => {

    setSelectedFile(null);

    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };

  const saveAndOpenResult = (

    certificate,

    verificationDetails

  ) => {

    const completeResult = {

      ...certificate,

      ...verificationDetails,

    };

    sessionStorage.setItem(

      "verifiedCertificate",

      JSON.stringify(completeResult)

    );

    navigate("/result", {

      state: {

        certificate: completeResult,

        blockchainVerified: true,

      },

    });

  };

  const verifyByCertificateId = async (
    cleanCertificateId,
    verificationType = "id"
  ) => {

    const certificate =

      await getCertificateFromBlockchain(

        cleanCertificateId

      );

    const isRevoked =

      certificate?.revoked === true ||

      certificate?.isRevoked === true ||

      String(certificate?.status || "").toUpperCase() ===

        "REVOKED";

    try {

      await recordVerificationInBackend({

        certificateId: cleanCertificateId,

        documentHash:

          certificate?.documentHash || null,

        status: isRevoked

          ? "INVALID"

          : "VALID",

      });

    } catch (backendError) {

      console.error(

        "Verification tracking error:",

        backendError

      );

    }

    saveAndOpenResult(certificate, {

      verificationType,

      hashMatched: null,

      isRevoked,

    });

  };

  const verifyUploadedFile = async (

    cleanCertificateId

  ) => {

    const result =

      await verifyUploadedCertificate(

        cleanCertificateId,

        selectedFile

      );

    let verificationStatus = "VALID";

    if (result.isRevoked) {

      verificationStatus = "INVALID";

    } else if (!result.hashMatched) {

      verificationStatus = "SUSPICIOUS";

    }

    try {

      await recordVerificationInBackend({

        certificateId: cleanCertificateId,

        documentHash:

          result.uploadedFileHash || null,

        status: verificationStatus,

      });

    } catch (backendError) {

      console.error(

        "Verification tracking error:",

        backendError

      );

    }

    saveAndOpenResult(result.certificate, {

      verificationType: "file",

      uploadedFileName: selectedFile.name,

      uploadedFileHash: result.uploadedFileHash,

      blockchainHash: result.blockchainHash,

      hashMatched: result.hashMatched,

      isRevoked: result.isRevoked,

    });

  };

  const verifyScannedCertificate = async (
    scannedCertificateId
  ) => {
    try {
      setIsVerifying(true);
      setQrStatusMessage(
        `QR detected: ${scannedCertificateId}. Checking blockchain...`
      );

      await verifyByCertificateId(
        scannedCertificateId,
        "qr"
      );
    } catch (error) {
      console.error("QR verification error:", error);
      setQrError(
        error?.message ||
          "Unable to verify the scanned certificate."
      );
      setQrStatusMessage(
        "QR was read, but certificate verification failed."
      );
      qrScanHandledRef.current = false;
    } finally {
      setIsVerifying(false);
    }
  };

  const startQrScanner = async () => {
    if (isQrScannerActive || isVerifying) {
      return;
    }

    setQrError("");
    setQrStatusMessage("Requesting camera permission...");
    qrScanHandledRef.current = false;

    try {
      const readerElement =
        document.getElementById(QR_READER_ID);

      if (!readerElement) {
        throw new Error(
          "QR scanner area is not available."
        );
      }

      const scanner = new Html5Qrcode(QR_READER_ID);
      qrScannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 230,
            height: 230,
          },
          aspectRatio: 1.333333,
        },
        async (decodedText) => {
          if (qrScanHandledRef.current) {
            return;
          }

          const scannedCertificateId =
            extractCertificateIdFromQr(decodedText);

          if (!scannedCertificateId) {
            setQrError(
              "QR code was detected, but it does not contain a valid CertiChain Certificate ID."
            );
            return;
          }

          qrScanHandledRef.current = true;
          setCertificateId(scannedCertificateId);
          setQrError("");
          setQrStatusMessage(
            `Certificate ID found: ${scannedCertificateId}`
          );

          await stopQrScanner();
          await verifyScannedCertificate(
            scannedCertificateId
          );
        },
        () => {
          // Normal frame scan misses are intentionally ignored.
        }
      );

      setIsQrScannerActive(true);
      setQrStatusMessage(
        "Camera is active. Point it at the certificate QR code."
      );
    } catch (error) {
      console.error("QR camera error:", error);

      try {
        await stopQrScanner();
      } catch {
        // Ignore cleanup errors.
      }

      setQrError(
        "Unable to open the camera. Allow camera permission and make sure no other app is using the camera."
      );
      setQrStatusMessage("Camera could not be started.");
    }
  };

  const handleVerify = async () => {

    const cleanCertificateId =

      certificateId.trim().toUpperCase();

    if (verificationMethod === "qr") {
      await startQrScanner();
      return;
    }

    if (!cleanCertificateId) {

      alert("Please enter the Certificate ID.");

      return;

    }

    if (

      verificationMethod === "upload" &&

      !selectedFile

    ) {

      alert("Please upload a certificate first.");

      return;

    }

    try {

      setIsVerifying(true);

      if (verificationMethod === "upload") {

        await verifyUploadedFile(cleanCertificateId);

      } else {

        await verifyByCertificateId(

          cleanCertificateId

        );

      }

    } catch (error) {

      console.error(error);

      alert(

        "Verification failed. Check the Certificate ID and make sure the blockchain is running."

      );

    } finally {

      setIsVerifying(false);

    }

  };

  return (

    <div className="verify-page">

      <nav className="verify-navbar">

        <Link to="/" className="verify-logo">

          <div className="verify-logo-icon">✓</div>

          <div>

            <h2>CertiChain AI</h2>

            <span>Trusted Digital Credentials</span>

          </div>

        </Link>

        <div className="verify-nav-links">

          <Link to="/">Home</Link>

          <a href="#verification">

            Verify Certificate

          </a>

          <Link

            to="/institution-login"

            className="verify-login-button"

          >

            Institution Login

          </Link>

          <button

            type="button"

            className="verify-wallet-button"

          >

            Connect Wallet

          </button>

        </div>

      </nav>

      <main

        className="verify-main"

        id="verification"

      >

        <div className="verify-heading">

          <div className="verify-badge">

            ✦ AI + Blockchain Verification

          </div>

          <h1>Verify an academic certificate</h1>

          <p>

            Upload a certificate file or enter its unique

            ID to check its blockchain registration and

            revocation status.

          </p>

        </div>

        <div className="verification-layout">

          <section className="verification-panel">

            <div className="method-tabs">

              <button

                type="button"

                className={

                  verificationMethod === "upload"

                    ? "active"

                    : ""

                }

                onClick={() =>

                  changeVerificationMethod("upload")

                }

              >

                <span>⇧</span>

                Upload Certificate

              </button>

              <button

                type="button"

                className={

                  verificationMethod === "id"

                    ? "active"

                    : ""

                }

                onClick={() =>

                  changeVerificationMethod("id")

                }

              >

                <span>#</span>

                Certificate ID

              </button>

              <button

                type="button"

                className={

                  verificationMethod === "qr"

                    ? "active"

                    : ""

                }

                onClick={() =>

                  changeVerificationMethod("qr")

                }

              >

                <span>▦</span>

                Scan QR Code

              </button>

            </div>

            {verificationMethod === "upload" && (

              <div className="method-content">

                <div className="method-title">

                  <h2>Upload your certificate</h2>

                  <p>

                    Supported formats: PDF, PNG and JPG.

                    Maximum size: 10 MB.

                  </p>

                </div>

                {!selectedFile ? (

                  <div

                    className="upload-area"

                    onClick={() =>

                      fileInputRef.current?.click()

                    }

                  >

                    <input

                      ref={fileInputRef}

                      type="file"

                      accept=".pdf,.png,.jpg,.jpeg"

                      onChange={handleFileChange}

                      hidden

                    />

                    <div className="upload-icon">

                      ⇧

                    </div>

                    <h3>

                      Drop your certificate here

                    </h3>

                    <p>

                      or click to browse from your

                      computer

                    </p>

                    <button type="button">

                      Choose Certificate

                    </button>

                  </div>

                ) : (

                  <div className="selected-file">

                    <div className="file-icon">

                      {selectedFile.type ===

                      "application/pdf"

                        ? "PDF"

                        : "IMG"}

                    </div>

                    <div className="file-information">

                      <strong>

                        {selectedFile.name}

                      </strong>

                      <span>

                        {(

                          selectedFile.size /

                          1024 /

                          1024

                        ).toFixed(2)}{" "}

                        MB

                      </span>

                    </div>

                    <div className="file-ready">

                      ✓ Ready

                    </div>

                    <button

                      type="button"

                      className="remove-file"

                      onClick={removeFile}

                      aria-label="Remove selected file"

                    >

                      ×

                    </button>

                  </div>

                )}

                <div className="certificate-id-box">

                  <label htmlFor="uploadCertificateId">

                    Certificate ID

                  </label>

                  <div className="certificate-id-input">

                    <span>#</span>

                    <input

                      id="uploadCertificateId"

                      type="text"

                      placeholder="Example: CCA-2026-0159"

                      value={certificateId}

                      onChange={(event) =>

                        setCertificateId(

                          event.target.value

                        )

                      }

                    />

                  </div>

                </div>

                <div className="privacy-message">

                  <span>🔒</span>

                  <div>

                    <strong>

                      Your certificate remains private

                    </strong>

                    <p>

                      The file stays inside your browser.

                      Only its SHA-256 fingerprint is

                      compared with the blockchain record.

                    </p>

                  </div>

                </div>

              </div>

            )}

            {verificationMethod === "id" && (

              <div className="method-content">

                <div className="method-title">

                  <h2>

                    Enter the certificate ID

                  </h2>

                  <p>

                    You can find the unique ID near the QR

                    code on the certificate.

                  </p>

                </div>

                <div className="certificate-id-box">

                  <label htmlFor="certificateId">

                    Certificate ID

                  </label>

                  <div className="certificate-id-input">

                    <span>#</span>

                    <input

                      id="certificateId"

                      type="text"

                      placeholder="Example: CCA-2026-0159"

                      value={certificateId}

                      onChange={(event) =>

                        setCertificateId(

                          event.target.value

                        )

                      }

                    />

                  </div>

                </div>

                <div className="id-example">

                  <div>i</div>

                  <p>

                    The ID is case-insensitive. Spaces

                    before or after the ID will be ignored.

                  </p>

                </div>

              </div>

            )}

            {verificationMethod === "qr" && (

              <div className="method-content">

                <div className="method-title">

                  <h2>

                    Scan the certificate QR code

                  </h2>

                  <p>

                    Position the QR code clearly inside

                    the camera scanning area.

                  </p>

                </div>

                <div className="qr-scanner">

                  <div
                    id={QR_READER_ID}
                    style={{
                      width: "100%",
                      maxWidth: "430px",
                      margin: "0 auto 14px",
                      overflow: "hidden",
                      borderRadius: "14px",
                    }}
                  ></div>

                  {!isQrScannerActive && (
                    <div className="qr-frame">

                      <span className="corner top-left"></span>

                      <span className="corner top-right"></span>

                      <span className="corner bottom-left"></span>

                      <span className="corner bottom-right"></span>

                      <div className="qr-symbol">

                        ▦

                      </div>

                    </div>
                  )}

                  <h3>
                    {isQrScannerActive
                      ? "Camera is scanning"
                      : "Camera access is required"}
                  </h3>

                  <p>{qrStatusMessage}</p>

                  {certificateId && (
                    <p>
                      Detected Certificate ID:{" "}
                      <strong>{certificateId}</strong>
                    </p>
                  )}

                  {qrError && (
                    <p
                      style={{
                        color: "#c2410c",
                        fontWeight: 700,
                      }}
                    >
                      {qrError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={
                      isQrScannerActive
                        ? stopQrScanner
                        : startQrScanner
                    }
                    disabled={isVerifying}
                  >

                    {isQrScannerActive
                      ? "Stop Camera"
                      : "Enable Camera"}

                  </button>

                </div>

              </div>

            )}

            {verificationMethod !== "qr" && (
              <button

                type="button"

                className="start-verification"

                onClick={handleVerify}

                disabled={isVerifying}

              >

                <span>✦</span>

                {isVerifying

                  ? "Calculating Hash & Checking Blockchain..."

                  : "Start AI & Blockchain Verification"}

                <span>→</span>

              </button>
            )}

          </section>

          <aside className="verification-info">

            <div className="info-card">

              <div className="info-card-heading">

                <div className="info-heading-icon">

                  ✓

                </div>

                <div>

                  <span>VERIFICATION PROCESS</span>

                  <h3>What we check</h3>

                </div>

              </div>

              <div className="check-list">

                <div className="check-item">

                  <div className="check-item-icon purple">

                    ✦

                  </div>

                  <div>

                    <strong>

                      AI Fraud Analysis

                    </strong>

                    <p>

                      Detects text mismatches and

                      suspicious document changes.

                    </p>

                  </div>

                </div>

                <div className="check-item">

                  <div className="check-item-icon blue">

                    ⬡

                  </div>

                  <div>

                    <strong>

                      Blockchain Record

                    </strong>

                    <p>

                      Compares the uploaded file hash with

                      the immutable original hash.

                    </p>

                  </div>

                </div>

                <div className="check-item">

                  <div className="check-item-icon green">

                    ⌂

                  </div>

                  <div>

                    <strong>

                      Issuing Institution

                    </strong>

                    <p>

                      Confirms whether the institution is

                      registered and approved.

                    </p>

                  </div>

                </div>

                <div className="check-item">

                  <div className="check-item-icon orange">

                    !

                  </div>

                  <div>

                    <strong>

                      Revocation Status

                    </strong>

                    <p>

                      Checks whether the certificate has

                      been officially revoked.

                    </p>

                  </div>

                </div>

              </div>

            </div>

            <div className="result-preview">

              <div className="preview-icon">

                ✓

              </div>

              <div>

                <span>INSTANT RESULT</span>

                <h3>Clear and explainable</h3>

                <p>

                  Receive the blockchain status, file-hash

                  match result and verification details.

                </p>

              </div>

            </div>

            <p className="verification-help">

              Need assistance?{" "}

              <a href="#support">

                Contact verification support

              </a>

            </p>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default VerifyCertificate;
