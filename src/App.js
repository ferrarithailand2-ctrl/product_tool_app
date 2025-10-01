import "./App.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

function App() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  // --- Date Formatter ---
  function formatDate(value) {
    if (!value) return "N/A";

    // Excel serial number
    if (!isNaN(value)) {
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toLocaleDateString("en-GB"); // dd/mm/yyyy
    }

    // Already a string date
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      return parsed.toLocaleDateString("en-GB");
    }

    return value;
  }

  const handleFileRead = async () => {
    try {
      const res = await fetch("/products.xlsx");
      if (!res.ok) throw new Error("File not found");

      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const productSheet = workbook.Sheets[workbook.SheetNames[0]];
      const supplierSheet = workbook.Sheets[workbook.SheetNames[1]];

      const productData = XLSX.utils.sheet_to_json(productSheet);
      const supplierData = XLSX.utils.sheet_to_json(supplierSheet);

      // Normalize headers
      const normalize = (rows) =>
        rows.map((row) => {
          const obj = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toUpperCase();
            obj[cleanKey] =
              typeof row[key] === "string" ? row[key].trim() : row[key];
          });
          return obj;
        });

      setProducts(normalize(productData));
      setSuppliers(normalize(supplierData));
      setError(false);
    } catch (err) {
      console.error("Failed to load Excel:", err);
      setError(true);
    }
  };

  useEffect(() => {
    handleFileRead();
  }, []);

  const filtered = query
    ? products.filter((p) => {
        const productCode = String(p["PRODUCT CODE"] || "").toLowerCase();
        const supplierProductCode = String(
          p["SUPPLIER PRODUCT CODE"] || ""
        ).toLowerCase();
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

        {error && (
          <p className="text-red-500 mb-4 text-center">
            ❌ Could not load Excel file. Check filename or path.
          </p>
        )}

        {query && filtered.length === 0 && (
          <p className="text-gray-500 italic text-center">No results found.</p>
        )}

        {filtered.map((item, index) => {
          const supplierInfo = getSupplierData(item["SUPPLIER"]);

          return (
            <div
              key={index}
              className="border p-4 mb-4 rounded shadow bg-white"
            >
              <h2 className="text-lg font-semibold mb-1">{item["PRODUCT"]}</h2>
              <p>
                <strong>Product Code:</strong> {item["PRODUCT CODE"]}
              </p>
              <p>
                <strong>Supplier Product Code:</strong>{" "}
                {item["SUPPLIER PRODUCT CODE"]}
              </p>
              <p>
                <strong>Supplier:</strong> {item["SUPPLIER"]}
              </p>

              {/* Supplier Certificates */}
              {supplierInfo && (
                <>
                  <p>
                    <strong>IFS Certificate Expiration:</strong>{" "}
                    {formatDate(supplierInfo["IFS CERTIFICATE EXPIRATION"])}
                  </p>
                  <p>
                    <strong>BRC Certificate Expiration:</strong>{" "}
                    {formatDate(supplierInfo["BRC CERTIFICATE EXPIRATION"])}
                  </p>
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {/* Product-specific */}
                {item["PRODUCT IMAGE"] && (
                  <a
                    href={item["PRODUCT IMAGE"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                      View Image
                    </button>
                  </a>
                )}
                {item["SPEC SHEET"] && (
                  <a
                    href={item["SPEC SHEET"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                      View Spec Sheet
                    </button>
                  </a>
                )}
                {item["FLOW CHART"] && (
                  <a
                    href={item["FLOW CHART"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                      View Flow Chart
                    </button>
                  </a>
                )}

                {/* Supplier-level */}
                {supplierInfo?.["IFS CERTIFICATE"] && (
                  <a
                    href={supplierInfo["IFS CERTIFICATE"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">
                      IFS Certificate
                    </button>
                  </a>
                )}
                {supplierInfo?.["BRC CERTIFICATE"] && (
                  <a
                    href={supplierInfo["BRC CERTIFICATE"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                      BRC Certificate
                    </button>
                  </a>
                )}
                {supplierInfo?.["OTHER CERTIFICATES"] && (
                  <a
                    href={supplierInfo["OTHER CERTIFICATES"]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">
                      Other Certificates
                    </button>
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