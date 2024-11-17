import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

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

          // Fetch user's own documents and shared documents
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
            fileName: doc[0],
            ipfsHash: doc[1],
            uploadTimestamp: new Date(Number(doc[2]) * 1000).toLocaleString(),
          };
        } catch (err) {
          console.error(`No access to document with ID ${docId}:`, err);
          return null;
        }
      }));
      setDocuments(documentsData.filter(doc => doc !== null)); // Filter out any null results
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
            fileName: doc[0],
            ipfsHash: doc[1],
            uploadTimestamp: new Date(Number(doc[2]) * 1000).toLocaleString(),
          };
        } catch (err) {
          console.error(`No access to shared document with ID ${docId}:`, err);
          return null;
        }
      }));
      setSharedDocuments(sharedData.filter(doc => doc !== null)); // Filter out any null results
    } catch (error) {
      console.error("Error fetching shared documents:", error);
    }
  };

  return (
    <div className="view-documents-container">
      <h1>View Uploaded Documents</h1>
      <p>Connected Account: {account}</p>
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
                <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">
                  {doc.ipfsHash}
                </a>
              </p>
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
                <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">
                  {doc.ipfsHash}
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
