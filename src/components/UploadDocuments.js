import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

const UploadDocuments = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  const API_KEY = "f0c384f5eee6810aa146";
  const API_SECRET = "2d883da419c7c9dcbe463138e4d607dac97cfae88352a2c8a43447bd4731e3b8";

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
      } else {
        alert("Please install MetaMask to use this feature.");
      }
    };
    initWeb3();
  }, []);

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
      const accounts = await web3.eth.getAccounts();
      const documentExists = await contract.methods.documentExists(selectedFileName).call({ from: accounts[0] });

      if (documentExists) {
        const confirmReplace = window.confirm("Document already exists. Do you want to replace it?");
        if (!confirmReplace) {
          setLoading(false);
          return;
        }
      }

      const fileData = new FormData();
      fileData.append("file", file);

      const response = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: fileData,
        headers: {
          pinata_api_key: API_KEY,
          pinata_secret_api_key: API_SECRET,
          "Content-Type": "multipart/form-data"
        }
      });

      const uploadedFileUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      setFileUrl(uploadedFileUrl);

      const gasEstimate = await contract.methods.uploadOrReplaceDocument(response.data.IpfsHash, selectedFileName).estimateGas({ from: accounts[0] });
      await contract.methods.uploadOrReplaceDocument(response.data.IpfsHash, selectedFileName).send({ from: accounts[0], gas: gasEstimate });

      setPopup({
        type: 'success',
        message: (
          <span>
            File uploaded and URL stored on blockchain successfully! View it <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">here</a>.
          </span>
        ),
      });
    } catch (error) {
      console.error("Error uploading file or storing URL on blockchain:", error);
      setPopup({ type: 'error', message: 'Error uploading file or storing URL on blockchain!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="container">
        <h1>IPFS File Upload</h1>
        <form>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            name="file" 
            id="file" 
          />
          <button type="submit" name="Upload" onClick={handleSubmit} disabled={loading}>
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
    </div>
  );
};

export default UploadDocuments;
