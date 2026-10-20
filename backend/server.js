const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------
// Local data storage
// ------------------------------------
const dataDirectory = path.join(__dirname, "data");

const certificateFile = path.join(
  dataDirectory,
  "certificates.json"
);

const verificationFile = path.join(
  dataDirectory,
  "verifications.json"
);

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, {
    recursive: true,
  });
}

if (!fs.existsSync(certificateFile)) {
  fs.writeFileSync(
    certificateFile,
    JSON.stringify([], null, 2)
  );
}

if (!fs.existsSync(verificationFile)) {
  fs.writeFileSync(
    verificationFile,
    JSON.stringify([], null, 2)
  );
}

// ------------------------------------
// Certificate file helpers
// ------------------------------------
function readCertificates() {
  const data = fs.readFileSync(
    certificateFile,
    "utf8"
  );

  return JSON.parse(data || "[]");
}

function saveCertificates(certificates) {
  fs.writeFileSync(
    certificateFile,
    JSON.stringify(certificates, null, 2)
  );
}

// ------------------------------------
// Verification file helpers
// ------------------------------------
function readVerifications() {
  const data = fs.readFileSync(
    verificationFile,
    "utf8"
  );

  return JSON.parse(data || "[]");
}

function saveVerifications(verifications) {
  fs.writeFileSync(
    verificationFile,
    JSON.stringify(verifications, null, 2)
  );
}

// ====================================
// HEALTH API
// ====================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message:
      "CertiChain AI Backend API is running",
  });
});

// ====================================
// CERTIFICATE APIs
// ====================================

// Save certificate
app.post("/api/certificates", (req, res) => {
  try {
    const certificate = req.body;

    if (
      !certificate.certificateId ||
      !certificate.studentName ||
      !certificate.qualification
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required certificate data is missing",
      });
    }

    const cleanCertificateId = String(
      certificate.certificateId
    )
      .trim()
      .toUpperCase();

    const certificates = readCertificates();

    const alreadyExists = certificates.find(
      (item) =>
        String(item.certificateId)
          .trim()
          .toUpperCase() === cleanCertificateId
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Certificate already exists",
      });
    }

    const newCertificate = {
      ...certificate,

      certificateId: cleanCertificateId,

      status:
        certificate.status || "ACTIVE",

      createdAt: new Date().toISOString(),
    };

    certificates.push(newCertificate);

    saveCertificates(certificates);

    res.status(201).json({
      success: true,
      message:
        "Certificate saved successfully",
      certificate: newCertificate,
    });
  } catch (error) {
    console.error(
      "Certificate save error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while saving certificate",
    });
  }
});

// Get all certificates
app.get("/api/certificates", (req, res) => {
  try {
    const certificates = readCertificates();

    res.json({
      success: true,
      total: certificates.length,
      certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Unable to load certificates",
    });
  }
});

// Get certificate by ID
app.get(
  "/api/certificates/:id",
  (req, res) => {
    try {
      const cleanCertificateId = String(
        req.params.id
      )
        .trim()
        .toUpperCase();

      const certificates =
        readCertificates();

      const certificate =
        certificates.find(
          (item) =>
            String(item.certificateId)
              .trim()
              .toUpperCase() ===
            cleanCertificateId
        );

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found",
        });
      }

      res.json({
        success: true,
        certificate,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Unable to load certificate",
      });
    }
  }
);

// ------------------------------------
// Revoke certificate in backend
// IMPORTANT:
// Call this endpoint only AFTER the blockchain
// revoke transaction succeeds.
// ------------------------------------
app.patch(
  "/api/certificates/:id/revoke",
  (req, res) => {
    try {
      const cleanCertificateId = String(
        req.params.id
      )
        .trim()
        .toUpperCase();

      const reason = String(
        req.body.reason || ""
      ).trim();

      const transactionHash =
        req.body.transactionHash || null;

      const blockNumber =
        req.body.blockNumber ?? null;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message:
            "Revocation reason is required",
        });
      }

      const certificates =
        readCertificates();

      const certificateIndex =
        certificates.findIndex(
          (item) =>
            String(item.certificateId)
              .trim()
              .toUpperCase() ===
            cleanCertificateId
        );

      if (certificateIndex === -1) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found",
        });
      }

      const currentCertificate =
        certificates[certificateIndex];

      if (
        String(
          currentCertificate.status || ""
        ).toUpperCase() === "REVOKED"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Certificate is already revoked",
          certificate:
            currentCertificate,
        });
      }

      const updatedCertificate = {
        ...currentCertificate,

        status: "REVOKED",

        revokeReason: reason,

        revokedAt:
          new Date().toISOString(),

        revokeTransactionHash:
          transactionHash,

        revokeBlockNumber:
          blockNumber,

        updatedAt:
          new Date().toISOString(),
      };

      certificates[certificateIndex] =
        updatedCertificate;

      saveCertificates(certificates);

      res.json({
        success: true,
        message:
          "Certificate revoked successfully in backend",
        certificate:
          updatedCertificate,
      });
    } catch (error) {
      console.error(
        "Certificate revoke update error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update revoked certificate",
      });
    }
  }
);

// ====================================
// VERIFICATION APIs
// ====================================

// Save verification event
app.post(
  "/api/verifications",
  (req, res) => {
    try {
      const {
        certificateId,
        documentHash,
        status,
      } = req.body;

      if (!certificateId) {
        return res.status(400).json({
          success: false,
          message:
            "Certificate ID is required",
        });
      }

      const allowedStatuses = [
        "VALID",
        "SUSPICIOUS",
        "INVALID",
      ];

      const verificationStatus =
        allowedStatuses.includes(
          String(status).toUpperCase()
        )
          ? String(status).toUpperCase()
          : "VALID";

      const verifications =
        readVerifications();

      const newVerification = {
        verificationId: `VER-${Date.now()}`,

        certificateId: String(
          certificateId
        )
          .trim()
          .toUpperCase(),

        documentHash:
          documentHash || null,

        status: verificationStatus,

        verifiedAt:
          new Date().toISOString(),
      };

      verifications.push(
        newVerification
      );

      saveVerifications(
        verifications
      );

      res.status(201).json({
        success: true,
        message:
          "Verification recorded successfully",
        verification:
          newVerification,
      });
    } catch (error) {
      console.error(
        "Verification save error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to save verification",
      });
    }
  }
);

// Get all verification records
app.get(
  "/api/verifications",
  (req, res) => {
    try {
      const verifications =
        readVerifications();

      res.json({
        success: true,
        total:
          verifications.length,
        verifications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Unable to load verifications",
      });
    }
  }
);

// Verification statistics
app.get(
  "/api/verifications/stats",
  (req, res) => {
    try {
      const verifications =
        readVerifications();

      const valid =
        verifications.filter(
          (item) =>
            item.status === "VALID"
        ).length;

      const suspicious =
        verifications.filter(
          (item) =>
            item.status ===
            "SUSPICIOUS"
        ).length;

      const invalid =
        verifications.filter(
          (item) =>
            item.status === "INVALID"
        ).length;

      res.json({
        success: true,

        total:
          verifications.length,

        valid,

        suspicious,

        invalid,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Unable to load verification statistics",
      });
    }
  }
);

// ====================================
// SERVER
// ====================================
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `CertiChain API running on http://localhost:${PORT}`
  );
});
