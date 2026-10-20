import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import VerifyCertificate from "./VerifyCertificate.jsx";
import VerificationResult from "./VerificationResult.jsx";
import InstitutionLogin from "./InstitutionLogin.jsx";
import InstitutionDashboard from "./InstitutionDashboard.jsx";
import IssueCertificate from "./IssueCertificate.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route
          path="/verify"
          element={<VerifyCertificate />}
        />

        <Route
          path="/result"
          element={<VerificationResult />}
        />

        <Route
          path="/institution-login"
          element={<InstitutionLogin />}
        />

        <Route
          path="/institution-dashboard"
          element={<InstitutionDashboard />}
        />

        <Route
          path="/issue-certificate"
          element={<IssueCertificate />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
