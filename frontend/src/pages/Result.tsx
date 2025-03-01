import { useEffect, useState } from "react";

export default function Result() {
  const [urls, setUrls] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await fetch("/api/urls");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setUrls(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchUrls();
  }, []);

  return (
    <div>
      <h2>All Data from Backend</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {urls.length ? (
        <ul>
          {urls.map((item) => (
            <li key={item._id}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <p>No data found.</p>
      )}
    </div>
  );
}
