const API_BASE_URL = "http://localhost:5000/api";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend API connection failed");
  }

  return response.json();
}

export async function saveCertificateToBackend(certificateData) {
  const response = await fetch(`${API_BASE_URL}/certificates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(certificateData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save certificate");
  }

  return data;
}

export { API_BASE_URL };