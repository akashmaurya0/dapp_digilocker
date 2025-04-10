import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import "./UploadDocument.css"

const UploadDocuments = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);  // Added account state
  const [accessibleDocuments, setAccessibleDocuments] = useState([]);

  const API_KEY = "f0c384f5eee6810aa146";
  const API_SECRET = "2d883da419c7c9dcbe463138e4d607dac97cfae88352a2c8a43447bd4731e3b8";

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);  // Set the account state
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
      } else {
        alert("Please install MetaMask to use this feature.");
      }
    };
    initWeb3();
  }, []);

  useEffect(() => {
    if (contract && account) {
      fetchAccessibleDocuments();
    }
  }, [contract, account]);

  const fetchAccessibleDocuments = async () => {
    try {
      const docIds = await contract.methods.getAccessibleDocuments().call({ from: account });

      const docs = await Promise.all(docIds.map(async (docId) => {
        const doc = await contract.methods.getDocument(docId).call();
        return {
          docId,
          fileName: doc[0],
          ipfsHash: doc[1],
          uploadTimestamp: new Date(Number(doc[2]) * 1000).toLocaleString(),
        };
      }));

      setAccessibleDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch accessible documents:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setPopup({ type: 'error', message: 'No file selected!' });
      return;
    }

    setLoading(true);
    setPopup(null);

    try {
      const selectedFileName = file.name;
      const documentExists = await contract.methods.documentExists(selectedFileName).call({ from: account });

      if (documentExists) {
        const confirmReplace = window.confirm("Document already exists. Do you want to replace it?");
        if (!confirmReplace) {
          setLoading(false);
          return;
        }
      }

      const fileData = new FormData();
      fileData.append("file", file);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        fileData,
        {
          headers: {
            pinata_api_key: API_KEY,
            pinata_secret_api_key: API_SECRET,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const uploadedFileUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      setFileUrl(uploadedFileUrl);
      console.log("Uploaded file URL:", uploadedFileUrl);

      const gasEstimate = await contract.methods.uploadOrReplaceDocument(response.data.IpfsHash, selectedFileName)
        .estimateGas({ from: account });

      await contract.methods.uploadOrReplaceDocument(response.data.IpfsHash, selectedFileName)
        .send({ from: account, gas: gasEstimate });

      setPopup({
        type: 'success',
        message: (
          <span>
            File uploaded and URL stored on blockchain successfully! View it{' '}
            <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">here</a>.
          </span>
        ),
      });

      // Refresh accessible documents after upload
      fetchAccessibleDocuments();

    } catch (error) {
      console.error("Error uploading file or storing URL on blockchain:", error);
      setPopup({ type: 'error', message: 'Error uploading file or storing URL on blockchain!' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (ipfsHash) => {
    window.open(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, "_blank");
  };

  const handleDownload = async (ipfsHash, fileName) => {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download document:", error);
    }
  };

  return (
    <div>
      <div className="container">
        <h1 style={{ textAlign: "center" }}>IPFS File Upload</h1>
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            name="file" 
            id="file" 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {popup && (
        <div className={`popup ${popup.type}`}>
          <p>{popup.message}</p>
          <button onClick={() => setPopup(null)}>Close</button>
        </div>
      )}

      <h2>Accessible Documents</h2>
      {accessibleDocuments.length > 0 ? (
        accessibleDocuments.map((doc) => (
          <div key={doc.docId.toLocaleString()} className="document-item">
            <p><strong>File Name:</strong> {doc.fileName}</p>
            <p><strong>Upload Time:</strong> {doc.uploadTimestamp}</p>
            <button onClick={() => handlePreview(doc.ipfsHash)}>Preview</button>
            <button onClick={() => handleDownload(doc.ipfsHash, doc.fileName)}>Download</button>
          </div>
        ))
      ) : (
        <p>No requested documents found.</p>
      )}
    </div>
  );
};

export default UploadDocuments;
