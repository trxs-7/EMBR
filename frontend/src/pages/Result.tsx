import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/navbar";

export default function Result() {
  const location = useLocation();
  const { url } = location.state || {};
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!url) {
      setError("No URL provided!");
      return;
    }

    const fetchPrediction = async () => {
      try {
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const jsonResponse = await response.json();
        console.log("Fetched prediction:", jsonResponse);
        setResult(jsonResponse);
        setError("");
      } catch (err: any) {
        console.error("Error fetching prediction:", err);
        setError(err.message);
      }
    };

    fetchPrediction();
  }, [url]);

  let displayPrediction = "True";
  if (result && result.corrected_text) {
    displayPrediction = "Misinformation";
  }

  return (
    <>
      <Navbar />
      <div className="prediction">
        <h2>Results for: {url}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {result ? (
          <div>
            <h3>Prediction</h3>
            <p>{displayPrediction}</p>
            {result.corrected_text && (
              <>
                <h3>Corrected Text</h3>
                {result.corrected_text}
              </>
            )}
          </div>
        ) : (
          <p>Loading prediction...</p>
        )}
      </div>
    </>
  );
}
