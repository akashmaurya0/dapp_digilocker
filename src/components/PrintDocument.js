import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../Web3Context';
import "./Print.css";

const PrintDocument = () => {
  const { contract, account } = useWeb3();
  const [documents, setDocuments] = useState([]);
  const [isFetched, setIsFetched] = useState(false);

  // Function to fetch all documents
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

        const docs = ids.map((id, index) => ({
          id: ids[index],
          name: names[index],
          owner: owners[index],
        }));

        setDocuments(docs);
        setIsFetched(true);
      } else {
        console.error("Unexpected data structure:", docDetails);
      }
    } catch (error) {
      console.error("Failed to fetch all documents:", error);
      alert("An error occurred while fetching document details.");
    }
  };

  // Function to handle printing
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

  return (<>
    
      <h2>Print All Documents</h2>
      <button className="btn" onClick={fetchAllDocuments}>Fetch All Document Details</button>
      <div >
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
    <button className="btn" onClick={handlePrint}>
        Print All Documents
    </button>
</div>

        </div>
      ) : (
        <p style={{"textAlign":"center"}}>No documents found.</p>
      )}
    </div>
    </>
  );
};

export default PrintDocument;
