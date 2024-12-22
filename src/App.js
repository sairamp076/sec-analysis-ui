import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedCik, setSelectedCik] = useState("");
  const [isDownloadSuccess, setIsDownloadSuccess] = useState(false);
  const [isAnalyzable, setIsAnalyzable] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [isRateLimitExceeded, setIsRateLimitExceeded] = useState(false);
  const [isInvalidData, setIsInvalidData] = useState(false);

  useEffect(() => {
    axios
      .get("https://sec-scraper.vercel.app/api/companies/")
      .then((response) => setCompanies(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleSelectChange = (event) => {
    const cik = event.target.value;
    setSelectedCik(cik);

    // Reset the state when a new CIK is selected
    setIsDownloadComplete(false);
    setIsDownloadSuccess(false);
    setIsAnalyzable(false);
    setIsRateLimitExceeded(false);
    setIsInvalidData(false);
    setJsonData(null); // Optionally clear previously fetched JSON data
  };

  const handleDownloadClick = () => {
    axios
      .post(`https://sec-scraper.vercel.app/api/process-cid?cid=${selectedCik}`)
      .then((response) => {
        if (response.status === 200) {
          console.log("Dataset downloaded successfully!");
          setIsDownloadSuccess(true);
          setIsDownloadComplete(true); // Set download completion to true
          setIsAnalyzable(true); // Enable analyze button
          // Update the company's downloaded status to true
          setCompanies((prevCompanies) =>
            prevCompanies.map((company) =>
              company.cik === selectedCik
                ? { ...company, downloaded: true }
                : company
            )
          );
        }
      })
      .catch((error) => {
        console.error("Error downloading dataset:", error);
        setIsDownloadSuccess(false);
      });
  };

  const handleAnalyzeClick = () => {
    axios
      .post(`https://sec-scraper.vercel.app/api/analyse-cid?cid=${selectedCik}`)
      .then((response) => {
        setJsonData(response.data);
        // Check if the message key is null or data is invalid (rate limit exceeded)
        if (response.data && response.data.message === null) {
          setIsRateLimitExceeded(true); // Set rate limit exceeded state
          setIsInvalidData(true); // Indicate that data is invalid
        }
      })
      .catch((error) => {
        console.error("Error analyzing data:", error);
        setIsInvalidData(true); // Mark data as invalid on error
      });
  };

  const toggleExpandRow = (key) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderJson = (data) => {
    if (data === null) {
      return <span>null</span>;
    }
    if (data === undefined) {
      return <span>undefined</span>;
    }
    if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
      return <span>{String(data)}</span>;
    }
    if (Array.isArray(data)) {
      return (
        <div className="json-array">
          <ul>
            {data.map((item, index) => (
              <li key={index}>{renderJson(item)}</li>
            ))}
          </ul>
        </div>
      );
    }
    if (typeof data === "object" && data !== null) {
      return (
        <div className="json-object">
          {Object.keys(data).map((key) => {
            const value = data[key];
            return (
              <div key={key} className="json-row">
                <div className="json-key expandable" onClick={() => toggleExpandRow(key)}>
                  {capitalizeFirstLetter(key)}:
                </div>
                <div className="json-value">{renderJson(value)}</div>
              </div>
            );
          })}
        </div>
      );
    }
    return <span>{String(data)}</span>;
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="App">
      <h1 className="title">SEC 10-K Data Analysis</h1>
      <div className="dropdown-container">
        <select className="dropdown" onChange={handleSelectChange}>
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company.cik} value={company.cik}>
              {company.title}
            </option>
          ))}
        </select>
      </div>

      {selectedCik && (
        <div className="selected-cik">
          <p>Selected CIK: <strong>{selectedCik}</strong></p>
        </div>
      )}

      {/* Display rate limit or invalid data message */}
      {isRateLimitExceeded || isInvalidData ? (
        <div className="error-message">
          Rate limit exceeded or invalid data. Please contact support at <a href="mailto:support@app.com">support@app.com</a>
        </div>
      ) : null}

      {/* Download Dataset Button - only show if not already downloaded */}
      {!isDownloadComplete && !companies.find((company) => company.cik === selectedCik)?.downloaded ? (
        <button
          className={`download-button ${isDownloadSuccess ? "success" : ""}`}
          onClick={handleDownloadClick}
          disabled={!selectedCik}
        >
          Download Dataset
        </button>
      ) : (
        <div className="download-success-message">
          Dataset downloaded successfully!
        </div>
      )}

      {/* Analyze Button (enabled after successful download or if already downloaded) */}
      {(companies.find((company) => company.cik === selectedCik)?.downloaded || isDownloadComplete) && (
        <button
          className="analyze-button"
          onClick={handleAnalyzeClick}
          disabled={!isDownloadComplete && !companies.find((company) => company.cik === selectedCik)?.downloaded}
        >
          Analyze Data
        </button>
      )}

      {/* Render JSON Data only if no rate limit exceeded or invalid data */}
      {jsonData && !isRateLimitExceeded && !isInvalidData && (
        <div className="json-container">
          <h2>Analyzed Data</h2>
          <div className="json-list">
            {renderJson(jsonData)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
