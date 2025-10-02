import "./App.css";
import React, { useState, useEffect } from "react";

function App() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Date Formatter ---
  function formatDate(value) {
    if (!value) return "N/A";

    if (!isNaN(value)) {
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toLocaleDateString("en-GB");
    }

    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      return parsed.toLocaleDateString("en-GB");
    }

    return value;
  }

  // CSV to JSON parser
  const csvToJson = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(header => header.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const loadCSVData = async () => {
    try {
      setLoading(true);
      setError(false);

      // Use environment variables with fallback URLs
      const PRODUCTS_CSV_URL = process.env.REACT_APP_PRODUCTS_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6-9Cn52FwBQP_YP5NmYasHnqBnNZExfx4I2NUJtfEB0wD7kXXznrzr7fESOuccQ/pub?gid=269240112&single=true&output=csv";
      const SUPPLIERS_CSV_URL = process.env.REACT_APP_SUPPLIERS_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6-9Cn52FwBQP_YP5NmYasHnqBnNZExfx4I2NUJtfEB0wD7kXXznrzr7fESOuccQ/pub?gid=1184049021&single=true&output=csv";

      console.log("Loading products from:", PRODUCTS_CSV_URL);
      console.log("Loading suppliers from:", SUPPLIERS_CSV_URL);

      const [productsResponse, suppliersResponse] = await Promise.all([
        fetch(PRODUCTS_CSV_URL, { 
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(SUPPLIERS_CSV_URL, { 
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      if (!productsResponse.ok || !suppliersResponse.ok) {
        throw new Error('Failed to load data');
      }

      const productsText = await productsResponse.text();
      const suppliersText = await suppliersResponse.text();

      const productsData = csvToJson(productsText);
      const suppliersData = csvToJson(suppliersText);

      // Normalize headers
      const normalize = (rows) =>
        rows.map((row) => {
          const obj = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toUpperCase();
            obj[cleanKey] = typeof row[key] === "string" ? row[key].trim() : row[key];
          });
          return obj;
        });

      setProducts(normalize(productsData));
      setSuppliers(normalize(suppliersData));
      setError(false);

    } catch (err) {
      console.error("Failed to load CSV data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCSVData();
  }, []);

  const filtered = query
    ? products.filter((p) => {
        const productCode = String(p["PRODUCT CODE"] || "").toLowerCase();
        const supplierProductCode = String(p["SUPPLIER PRODUCT CODE"] || "").toLowerCase();
        const supplier = String(p["SUPPLIER"] || "").toLowerCase();
        const productName = String(p["PRODUCT"] || "").toLowerCase();

        return (
          productCode.includes(query.toLowerCase()) ||
          supplierProductCode.includes(query.toLowerCase()) ||
          supplier.includes(query.toLowerCase()) ||
          productName.includes(query.toLowerCase())
        );
      })
    : [];

  const getSupplierData = (supplierName) => {
    if (!supplierName) return null;
    const cleanName = supplierName.trim().toLowerCase();
    return suppliers.find(
      (s) => s["SUPPLIER"]?.trim().toLowerCase() === cleanName
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-3xl">
        <img
          src="/logo-GF.avif"
          alt="Company Logo"
          className="h-16 mx-auto mb-4"
        />

        <h1 className="text-2xl font-bold mb-4 text-center">
          Product Lookup Tool
        </h1>

        <input
          type="text"
          placeholder="Search by product code, name, or supplier"
          className="border p-2 mb-4 w-full text-center rounded"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && (
          <p className="text-blue-500 mb-4 text-center">
            📥 Loading product data...
          </p>
        )}

        {error && (
          <div className="text-red-500 mb-4 text-center">
            <p>❌ Could not load data.</p>
            <p className="text-sm mt-2">
              Please check your internet connection and try again.
            </p>
          </div>
        )}

        {!loading && !error && query && filtered.length === 0 && (
          <p className="text-gray-500 italic text-center">No results found.</p>
        )}

        {filtered.map((item, index) => {
          const supplierInfo = getSupplierData(item["SUPPLIER"]);

          return (
            <div key={index} className="border p-4 mb-4 rounded shadow bg-white">
              <h2 className="text-lg font-semibold mb-1">{item["PRODUCT"]}</h2>
              <p><strong>Product Code:</strong> {item["PRODUCT CODE"]}</p>
              <p><strong>Supplier Product Code:</strong> {item["SUPPLIER PRODUCT CODE"]}</p>
              <p><strong>Supplier:</strong> {item["SUPPLIER"]}</p>

              {supplierInfo && (
                <>
                  <p><strong>IFS Certificate Expiration:</strong> {formatDate(supplierInfo["IFS CERTIFICATE EXPIRATION"])}</p>
                  <p><strong>BRC Certificate Expiration:</strong> {formatDate(supplierInfo["BRC CERTIFICATE EXPIRATION"])}</p>
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {item["PRODUCT IMAGE"] && (
                  <a href={item["PRODUCT IMAGE"]} target="_blank" rel="noreferrer">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">View Image</button>
                  </a>
                )}
                {item["SPEC SHEET"] && (
                  <a href={item["SPEC SHEET"]} target="_blank" rel="noreferrer">
                    <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">View Spec Sheet</button>
                  </a>
                )}
                {item["FLOW CHART"] && (
                  <a href={item["FLOW CHART"]} target="_blank" rel="noreferrer">
                    <button className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">View Flow Chart</button>
                  </a>
                )}
                {supplierInfo?.["IFS CERTIFICATE"] && (
                  <a href={supplierInfo["IFS CERTIFICATE"]} target="_blank" rel="noreferrer">
                    <button className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">IFS Certificate</button>
                  </a>
                )}
                {supplierInfo?.["BRC CERTIFICATE"] && (
                  <a href={supplierInfo["BRC CERTIFICATE"]} target="_blank" rel="noreferrer">
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">BRC Certificate</button>
                  </a>
                )}
                {supplierInfo?.["OTHER CERTIFICATES"] && (
                  <a href={supplierInfo["OTHER CERTIFICATES"]} target="_blank" rel="noreferrer">
                    <button className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">Other Certificates</button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;