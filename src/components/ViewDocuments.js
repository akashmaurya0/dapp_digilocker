import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import './View.css';

const API_KEY = "f0c384f5eee6810aa146";
const API_SECRET = "2d883da419c7c9dcbe463138e4d607dac97cfae88352a2c8a43447bd4731e3b8";

const ViewDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState("");

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          setWeb3(web3Instance);
          
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
          setContract(contractInstance);

          fetchUserDocuments(contractInstance, accounts[0]);
          fetchSharedDocuments(contractInstance, accounts[0]);
        } catch (err) {
          setError("Failed to connect to Web3 or fetch account.");
          console.error(err);
        }
      } else {
        setError("Please install MetaMask to view documents.");
      }
    };
    initWeb3();
  }, []);

  const fetchUserDocuments = async (contract, account) => {
    try {
      const userDocIds = await contract.methods.getUserDocuments().call({ from: account });
      const documentsData = await Promise.all(userDocIds.map(async (docId) => {
        try {
          const doc = await contract.methods.getDocument(docId).call({ from: account });
          return {
            docId,
            fileName: doc[0],
            ipfsHash: doc[1],
            uploadTimestamp: new Date(Number(doc[2]) * 1000).toLocaleString(),
          };
        } catch (err) {
          console.error(`No access to document with ID ${docId}:`, err);
          return null;
        }
      }));
      setDocuments(documentsData.filter(doc => doc !== null));
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Error fetching documents from the blockchain.");
    }
  };

  const fetchSharedDocuments = async (contract, account) => {
    try {
      const sharedDocIds = await contract.methods.getSharedDocuments().call({ from: account });
      const sharedData = await Promise.all(sharedDocIds.map(async (docId) => {
        try {
          const doc = await contract.methods.getDocument(docId).call({ from: account });
          return {
            docId,
            fileName: doc[0],
            ipfsHash: doc[1],
            uploadTimestamp: new Date(Number(doc[2]) * 1000).toLocaleString(),
          };
        } catch (err) {
          console.error(`No access to shared document with ID ${docId}:`, err);
          return null;
        }
      }));
      setSharedDocuments(sharedData.filter(doc => doc !== null));
    } catch (error) {
      console.error("Error fetching shared documents:", error);
    }
  };

  const handleDelete = async (docId, ipfsHash) => {
    try {
      // Delete from blockchain
      await contract.methods.deleteDocument(docId).send({ from: account });
      console.log(`Document ${docId} deleted from blockchain.`);

      // Delete from Pinata
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
        headers: {
          pinata_api_key: API_KEY,
          pinata_secret_api_key: API_SECRET,
        },
      });
      console.log(`Document ${ipfsHash} unpinned from Pinata.`);

      // Refresh document list
      fetchUserDocuments(contract, account);
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document.");
    }
  };

  const st = {
    backgroundColor: "rgba(0, 200, 255, 0.1)",
    height: "25px",
    width: "80px",
    border: "0.4px solid blue",
    borderRadius: "10px",
    padding: "5px"
  };

  return (
    <div className="view-documents-container">
      <h1>View Uploaded Documents</h1>
      <p id="account">Connected Account: {account}</p>
      {error && <div className="error">{error}</div>}

      <h2>Your Documents</h2>
      {documents.length > 0 ? (
        <ul className="document-list">
          {documents.map((doc, index) => (
            <li key={index} className="document-item">
              <p><strong>File Name:</strong> {doc.fileName}</p>
              <p><strong>Upload Time:</strong> {doc.uploadTimestamp}</p>
              <p>
                <strong>IPFS Link:</strong>{' '}
                <a id="account" style={st} href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </p>
              <button style={{ color: "red" }} onClick={() => handleDelete(doc.docId, doc.ipfsHash)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No documents found.</p>
      )}

      <h2>Shared Documents</h2>
      {sharedDocuments.length > 0 ? (
        <ul className="document-list">
          {sharedDocuments.map((doc, index) => (
            <li key={index} className="document-item">
              <p><strong>File Name:</strong> {doc.fileName} (Shared Document)</p>
              <p><strong>Upload Time:</strong> {doc.uploadTimestamp}</p>
              <p>
                <strong>IPFS Link:</strong>{' '}
                <a style={st} href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No shared documents found.</p>
      )}
    </div>
  );
};

export default ViewDocuments;
