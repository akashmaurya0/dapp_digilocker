import React, { useState } from 'react';
import { useWeb3 } from '../Web3Context';
import axios from 'axios';
import "./Verify.css"

const VerifyDocument = () => {
  const { contract, account } = useWeb3();
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [status, setStatus] = useState("");


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Function to generate SHA-256 hash of a file
  const generateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  // Function to fetch file from IPFS and generate its SHA-256 hash
  const fetchAndHashIPFSFile = async (ipfsHash) => {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, { responseType: 'arraybuffer' });
      const arrayBuffer = response.data;
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error("Error fetching file from IPFS:", error);
      return null;
    }
  };

  const verifyFile = async () => {
    if (!file || !documentId) {
      setStatus("⚠️ Please upload a file and enter a valid document ID.");
      return;
    }

    try {
      // Generate SHA-256 hash for the uploaded file
      const userFileHash = await generateFileHash(file);
      console.log("User File SHA-256 Hash:", userFileHash);

      // Fetch original IPFS hash from the blockchain
      const docData = await contract.methods.getDocument(documentId).call({ from: account });
      const ipfsHash = docData[1]; // Assuming IPFS hash is at index 1
      console.log("Fetched IPFS Hash:", ipfsHash);

      // Fetch and hash the original file from IPFS
      const originalFileHash = await fetchAndHashIPFSFile(ipfsHash);
      console.log("Original File SHA-256 Hash:", originalFileHash);

      if (!originalFileHash) {
        setStatus("❌ Error retrieving the original file from IPFS.");
        return;
      }

      // Compare hashes
      if (userFileHash === originalFileHash) {
        setStatus("✅ File is authentic and matches the original.");
      } else {
        setStatus("⚠️ File has been altered or is different from the original.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setStatus("❌ Error occurred during verification.");
    }
  };

  return (
    <div className="verify-container">
      <h2>Verify Document Integrity</h2>
      <input type="text" placeholder="Enter Document ID" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
      <input type="file" onChange={handleFileChange} />
      <button onClick={verifyFile}>Verify File</button>
      <p>{status}</p>
    </div>
  );
};

export default VerifyDocument;
