import React, { useState } from 'react';
import { useWeb3 } from '../Web3Context';
import "./Print.css";

const PrintDocument = () => {
  const { contract, account } = useWeb3();
  const [documents, setDocuments] = useState([]);
  const [isFetched, setIsFetched] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility

  const fetchAllDocuments = async () => {
    if (!contract) {
      console.error("Contract is not loaded.");
      return;
    }

    if (isFetched) {
      console.log("Documents are already fetched.");
      return;
    }

    try {
      const docDetails = await contract.methods.getAllDocumentDetails().call();
      if (docDetails && docDetails[0] && docDetails[1] && docDetails[2]) {
        const { 0: ids, 1: names, 2: owners } = docDetails;

        const docs = ids.map((id, index) => {
          const name = names[index] || "Unknown";
          const owner = owners[index] || "0x0000000000000000000000000000000000000000";

          // Skip invalid entries
          if (!id || owner === "0x0000000000000000000000000000000000000000") {
            console.warn(`Skipping invalid document entry at index ${index}`);
            return null;
          }

          return { id, name, owner };
        }).filter(Boolean);

        if (docs.length === 0) {
          setShowPopup(true); // Show popup if no valid documents are found
        } else {
          setDocuments(docs);
          setIsFetched(true);
        }
      } else {
        setShowPopup(true); // Show popup if the structure is invalid
      }
    } catch (error) {
      console.error("Failed to fetch all documents:", error);
      alert("An error occurred while fetching document details.");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
      <head>
        <title>Print Documents</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            text-align: center;
            color: #00c8ff;
          }
          .doc {
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <h1>Documents List</h1>
    `);

    documents.forEach((doc) => {
      printWindow.document.write(`
        <div class="doc">
          <p><strong>Document ID:</strong> ${doc.id.toString()}</p>
          <p><strong>Document Name:</strong> ${doc.name}</p>
          <p><strong>Owner:</strong> ${doc.owner}</p>
        </div>
      `);
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="print-documents-container">
      <h2>Print All Documents</h2>
      <button className="btn" onClick={fetchAllDocuments}>Fetch All Document Details</button>
      {documents.length > 0 ? (
        <div className="document-list card-container">
          {documents.map((doc) => (
            <div className="card" key={doc.id.toString()}>
              <h3>Document ID: {doc.id.toString()}</h3>
              <p>Document Name: {doc.name}</p>
              <p>Owner: {doc.owner}</p>
            </div>
          ))}
         
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
             <br/>
            <button className="btn" onClick={handlePrint}>
              Print All Documents
            </button>
          </div>
        </div>
      ) : null}

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>No documents found.</p>
            <button className="btn" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintDocument;
