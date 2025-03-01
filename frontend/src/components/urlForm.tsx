import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Send URL to save in database
    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit URL");
      }

      const data = await response.json();
      console.log("URL submitted successfully", data);
      setError("");
      setUrl("");
    } catch (error) {
      console.error("Error submitting URL:", error);
      setError("Error submitting URL");
    }

    navigate("/result", { state: { url } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Article Truth Detector</h3>
      <label htmlFor="urlInput">Submit a URL:</label>
      <input
        type="url"
        id="urlInput"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        style={{ marginRight: "0.5rem" }}
      />
      <button type="submit">Submit</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
