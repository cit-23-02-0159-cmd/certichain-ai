import { Link, useLocation } from "react-router-dom";

import "./VerificationResult.css";



function VerificationResult() {

  const location = useLocation();



  const savedResult =

    sessionStorage.getItem("verifiedCertificate");



  const certificate =

    location.state?.certificate ||

    (savedResult ? JSON.parse(savedResult) : null);



  if (!certificate) {

    return (

      <div className="result-page">

        <nav className="result-navbar">

          <Link to="/" className="result-logo">

            <div className="result-logo-icon">✓</div>



            <div>

              <h2>CertiChain AI</h2>

              <span>Trusted Digital Credentials</span>

            </div>

          </Link>

        </nav>



        <main className="result-main">

          <section className="result-card">

            <h2>No verification result found</h2>



            <p>

              Verify a certificate before opening the

              result page.

            </p>



            <Link

              to="/verify"

              className="verify-another-button"

            >

              Verify a Certificate

            </Link>

          </section>

        </main>

      </div>

    );

  }



  const isFileVerification =

    certificate.verificationType === "file";

  const isQrVerification =
    certificate.verificationType === "qr";



  const isHashMatched =

    certificate.hashMatched === true;



  const isHashMismatch =

    isFileVerification &&

    certificate.hashMatched === false;



  const isRevoked =

    certificate.revoked ||

    certificate.isRevoked;



  const isValid =

    !isRevoked &&

    (!isFileVerification || isHashMatched);



  const studentInitials = String(
    certificate.studentName || "Unknown"
  )
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();



  let finalTitle = "Verified Blockchain Record";



  let finalMessage =

    "This certificate ID exists on the blockchain and its status is active.";



  if (isFileVerification && isHashMatched) {

    finalTitle = "Authentic Certificate File";



    finalMessage =

      "The uploaded certificate hash exactly matches the immutable blockchain record.";

  }



  if (isHashMismatch) {

    finalTitle = "Certificate File Modified";



    finalMessage =

      "The uploaded file hash does not match the original blockchain record.";

  }



  if (isRevoked) {

    finalTitle = "Revoked Certificate";



    finalMessage =

      "This certificate exists on the blockchain but has been officially revoked.";

  }



  return (

    <div className="result-page">

      <nav className="result-navbar">

        <Link to="/" className="result-logo">

          <div className="result-logo-icon">✓</div>



          <div>

            <h2>CertiChain AI</h2>

            <span>Trusted Digital Credentials</span>

          </div>

        </Link>



        <div className="result-nav-actions">

          <Link to="/" className="result-home-link">

            Home

          </Link>



          <Link

            to="/verify"

            className="verify-another-button"

          >

            Verify Another Certificate

          </Link>



          <button

            type="button"

            className="result-wallet-button"

          >

            Connect Wallet

          </button>

        </div>

      </nav>



      <main className="result-main">

        <div className="result-heading">

          <div className={`result-heading-icon ${isValid ? "" : "failed"}`}>

            {isValid ? "✓" : "!"}

          </div>



          <div>

            <span>VERIFICATION COMPLETE</span>



            <h1>Certificate verification result</h1>



            <p>

              Blockchain record, document fingerprint and

              revocation checks have been completed.

            </p>

          </div>

        </div>



        <section

          className="authentic-banner"

          style={

            isValid

              ? undefined

              : {

                  background:

                    "linear-gradient(135deg, #dc3545, #f06b73)",

                }

          }

        >

          <div className="authentic-icon">

            {isValid ? "✓" : "!"}

          </div>



          <div className="authentic-content">

            <span>FINAL VERIFICATION STATUS</span>



            <h2>{finalTitle}</h2>



            <p>{finalMessage}</p>

          </div>



          <div className="confidence-box">

            <span>Status</span>



            <strong>

              {isValid ? "PASS" : "FAIL"}

            </strong>

          </div>

        </section>



        <div className="result-layout">

          <div className="result-left">

            <section className="result-card certificate-information-card">

              <div className="result-card-heading">

                <div>

                  <span>CERTIFICATE INFORMATION</span>

                  <h2>

                    Registered credential details

                  </h2>

                </div>



                <div className="extracted-badge">

                  ⬡ On-Chain Data

                </div>

              </div>



              <div className="certificate-owner">

                <div className="owner-avatar">

                  {studentInitials}

                </div>



                <div>

                  <span>Certificate issued to</span>



                  <h3>

                    {certificate.studentName}

                  </h3>



                  <p>

                    {isFileVerification
                      ? `Uploaded file: ${certificate.uploadedFileName}`
                      : isQrVerification
                        ? "Verified using QR Code"
                        : "Verified using Certificate ID"}

                  </p>

                </div>



                <div className={`matched-badge ${isValid ? "" : "failed"}`}>

                  {isValid ? "✓ Verified" : "! Failed"}

                </div>

              </div>



              <div className="details-grid">

                <div className="detail-item">

                  <span>Certificate ID</span>



                  <strong>

                    {certificate.certificateId}

                  </strong>

                </div>



                <div className="detail-item">

                  <span>Qualification</span>



                  <strong>

                    {certificate.qualification}

                  </strong>

                </div>



                <div className="detail-item">

                  <span>Issuing Institution</span>



                  <strong>

                    {certificate.institutionName}

                  </strong>

                </div>



                <div className="detail-item">

                  <span>Issue Date</span>



                  <strong>

                    {certificate.issuedAt}

                  </strong>

                </div>



                <div className="detail-item">

                  <span>Verification Method</span>



                  <strong>

                    {isFileVerification
                      ? "File Hash Verification"
                      : isQrVerification
                        ? "QR Code Scan"
                        : "Certificate ID Lookup"}

                  </strong>

                </div>



                <div className="detail-item">

                  <span>Current Status</span>



                  <strong
                    className={
                      isRevoked
                        ? "revoked-status"
                        : isHashMismatch
                          ? "mismatch-status"
                          : "active-status"
                    }
                  >
                    {isRevoked
                      ? "Revoked"
                      : isHashMismatch
                        ? "Hash Mismatch"
                        : "Active"}
                  </strong>

                </div>

              </div>

            </section>



            <section className="result-card blockchain-card">

              <div className="result-card-heading">

                <div>

                  <span>BLOCKCHAIN VALIDATION</span>



                  <h2>

                    Immutable certificate record

                  </h2>

                </div>



                <div className="blockchain-verified-badge">

                  ✓ Record Found

                </div>

              </div>



              <div className="blockchain-details">

                <div className="blockchain-detail">

                  <span>Network</span>



                  <strong>

                    Hardhat Ethereum Local Network

                  </strong>

                </div>



                <div className="blockchain-detail">

                  <span>Smart Contract</span>



                  <strong>

                    CertiChainRegistry

                  </strong>

                </div>



                <div className="blockchain-detail full-width">

                  <span>Original Blockchain Hash</span>



                  <div className="hash-value">

                    {certificate.blockchainHash ||

                      certificate.documentHash}

                  </div>

                </div>



                {isFileVerification && (

                  <div className="blockchain-detail full-width">

                    <span>Uploaded File Hash</span>



                    <div

                      className="hash-value"

                      style={{

                        color: isHashMatched

                          ? "#159b68"

                          : "#dc3545",

                      }}

                    >

                      {certificate.uploadedFileHash}

                    </div>

                  </div>

                )}



                {isFileVerification && (

                  <div className="blockchain-detail full-width">

                    <span>Hash Comparison Result</span>



                    <strong

                      style={{

                        color: isHashMatched

                          ? "#159b68"

                          : "#dc3545",

                      }}

                    >

                      {isHashMatched

                        ? "✓ HASHES MATCH"

                        : "✕ HASH MISMATCH"}

                    </strong>

                  </div>

                )}



                <div className="blockchain-detail full-width">

                  <span>Issuer Wallet Address</span>



                  <div className="hash-value">

                    {certificate.issuedBy}

                  </div>

                </div>



                <div className="blockchain-detail full-width">

                  <span>Smart Contract Address</span>



                  <div className="hash-value">

                    0x5FbDB2315678afecb367f032d93F642f64180aa3

                  </div>

                </div>

              </div>

            </section>



            <section className="result-card analysis-card">

              <div className="result-card-heading">

                <div>

                  <span>VERIFICATION DETAILS</span>



                  <h2>

                    Verification explanation

                  </h2>

                </div>

              </div>



              <div className="analysis-list">

                <div className="analysis-item">

                  <div className="analysis-check">

                    ✓

                  </div>



                  <div>

                    <strong>

                      Certificate record found

                    </strong>



                    <p>

                      The Certificate ID exists in the

                      CertiChain smart contract.

                    </p>

                  </div>



                  <span className="passed-label">

                    Passed

                  </span>

                </div>



                {isFileVerification && (

                  <div className="analysis-item">

                    <div className="analysis-check">

                      {isHashMatched ? "✓" : "!"}

                    </div>



                    <div>

                      <strong>

                        Document fingerprint check

                      </strong>



                      <p>

                        {isHashMatched

                          ? "The uploaded file is identical to the registered original."

                          : "The uploaded file differs from the registered original."}

                      </p>

                    </div>



                    <span

                      className="passed-label"

                      style={{

                        color: isHashMatched

                          ? "#159b68"

                          : "#dc3545",

                      }}

                    >

                      {isHashMatched

                        ? "Matched"

                        : "Failed"}

                    </span>

                  </div>

                )}



                <div className="analysis-item">

                  <div className="analysis-check">

                    ✓

                  </div>



                  <div>

                    <strong>

                      Institution confirmed

                    </strong>



                    <p>

                      The registered issuer is{" "}

                      {certificate.institutionName}.

                    </p>

                  </div>



                  <span className="passed-label">

                    Verified

                  </span>

                </div>



                <div className="analysis-item">

                  <div className={`analysis-check ${isRevoked ? "failed" : ""}`}>

                    {isRevoked ? "!" : "✓"}

                  </div>



                  <div>

                    <strong>

                      Revocation status checked

                    </strong>



                    <p>

                      The blockchain revocation status is{" "}

                      {isRevoked ? "Revoked" : "Active"}.

                    </p>

                  </div>



                  <span className={`passed-label ${isRevoked ? "failed" : ""}`}>

                    {isRevoked ? "Revoked" : "Active"}

                  </span>

                </div>

              </div>

            </section>

          </div>



          <aside className="result-right">

            <section className="risk-card">

              <div className="risk-card-heading">
                <span>⬡</span>

                <h3>
                  {isFileVerification
                    ? "Document Integrity"
                    : isQrVerification
                      ? "QR Blockchain Check"
                      : "Blockchain Record"}
                </h3>
              </div>



              <div className="risk-circle">

                <div className="risk-circle-inner">

                  <strong>
                    {isFileVerification
                      ? isHashMatched
                        ? "100%"
                        : "0%"
                      : "FOUND"}
                  </strong>

                  <span>
                    {isFileVerification
                      ? isHashMatched
                        ? "Hash Match"
                        : "Mismatch"
                      : isQrVerification
                        ? "QR Verified"
                        : "Record Found"}
                  </span>

                </div>

              </div>



              <p>
                {isFileVerification
                  ? isHashMatched
                    ? "The uploaded document matches the immutable blockchain fingerprint."
                    : "The uploaded document does not match the blockchain fingerprint."
                  : isQrVerification
                    ? "The QR code resolved to this certificate ID and the blockchain record was found."
                    : "The certificate ID was found in the immutable blockchain registry."}
              </p>



              <div className="risk-scale">

                <div className="scale-labels">

                  <span>Failed</span>

                  <span>Pending</span>

                  <span>Verified</span>

                </div>



                <div className="scale-bar">

                  <div className="risk-position"></div>

                </div>

              </div>

            </section>



            <section className="status-card">

              <h3>Verification Summary</h3>



              <div className="status-list">

                <div>

                  <span className="status-icon success">

                    ✓

                  </span>



                  <p>Blockchain Record</p>

                  <strong>Found</strong>

                </div>



                {isFileVerification && (

                  <div>

                    <span className="status-icon success">

                      {isHashMatched ? "✓" : "!"}

                    </span>



                    <p>Document Hash</p>



                    <strong>

                      {isHashMatched

                        ? "Matched"

                        : "Mismatch"}

                    </strong>

                  </div>

                )}



                <div>

                  <span className="status-icon success">

                    ✓

                  </span>



                  <p>Institution Status</p>

                  <strong>Verified</strong>

                </div>



                <div>

                  <span className={`status-icon ${isRevoked ? "failed" : "success"}`}>

                    {isRevoked ? "!" : "✓"}

                  </span>

                  <p>Revocation Status</p>

                  <strong className={isRevoked ? "failed-status" : ""}>

                    {isRevoked ? "Revoked" : "Active"}

                  </strong>

                </div>

              </div>

            </section>



            <section className="institution-card">

              <span>VERIFIED ISSUER</span>



              <div className="institution-details">

                <div className="institution-logo">

                  {certificate.institutionName

                    .charAt(0)

                    .toUpperCase()}

                </div>



                <div>

                  <h3>

                    {certificate.institutionName}

                  </h3>



                  <p>

                    Registered Academic Institution

                  </p>

                </div>

              </div>



              <div className="institution-verified">

                ✓ Institution identity verified

              </div>

            </section>



            <Link

              to="/verify"

              className="new-verification-link"

            >

              Verify another certificate

            </Link>

          </aside>

        </div>



        <div className="result-disclaimer">

          <span>i</span>



          <p>

            File verification uses SHA-256 fingerprint

            comparison with the blockchain record. AI

            visual fraud analysis will be added in the next

            stage.

          </p>

        </div>

      </main>

    </div>

  );

}



export default VerificationResult;
