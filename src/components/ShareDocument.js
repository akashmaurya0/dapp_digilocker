// import React, { useState } from 'react';
// import { useWeb3 } from '../Web3Context';

// const ShareDocument = () => {
//     const { contract, account } = useWeb3();
//     const [docId, setDocId] = useState('');
//     const [shareAddress, setShareAddress] = useState('');

//     const handleShare = async () => {
//         try {
//             // Trim and validate the document ID and address before sending the transaction
//             const cleanedDocId = docId.trim();
//             const cleanedShareAddress = shareAddress.trim();

//             // Validate the Ethereum address format
//             if (!/^0x[a-fA-F0-9]{40}$/.test(cleanedShareAddress)) {
//                 alert("Invalid Ethereum address format.");
//                 return;
//             }

//             await contract.methods.shareDocument(cleanedDocId, cleanedShareAddress).send({
//                 from: account,
//                 gas: 3000000,
//             });
//             alert('Document shared successfully!');
//         } catch (error) {
//             console.error("Failed to share document:", error);
//             alert('Failed to share document');
//         }
//     };

//     return (
//         <div>
//             <h2>Share Document</h2>
//             <input
//                 type="text"
//                 placeholder="Document ID"
//                 value={docId}
//                 onChange={(e) => setDocId(e.target.value)}
//             />
//             <input
//                 type="text"
//                 placeholder="Address to Share With"
//                 value={shareAddress}
//                 onChange={(e) => setShareAddress(e.target.value)}
//             />
//             <button onClick={handleShare}>Share Document</button>
//         </div>
//     );
// };

// export default ShareDocument;

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../Web3Context';
import "./Share.css"

const ShareDocument = () => {
    const { contract, account } = useWeb3();
    const [docId, setDocId] = useState(''); // For sharing document
    const [requestDocId, setRequestDocId] = useState(''); // For requesting access to document
    const [shareAddress, setShareAddress] = useState('');
    const [requests, setRequests] = useState([]);

    // Function to handle document sharing
    const handleShare = async () => {
        try {
            const cleanedDocId = docId.trim();
            const cleanedShareAddress = shareAddress.trim();

            if (!cleanedDocId || isNaN(cleanedDocId)) {
                alert('Please enter a valid document ID.');
                return;
            }

            if (!/^0x[a-fA-F0-9]{40}$/.test(cleanedShareAddress)) {
                alert("Invalid Ethereum address format.");
                return;
            }

            const docOwner = await contract.methods.getDocumentOwner(cleanedDocId).call();
            if (docOwner !== account) {
                alert("You are not the owner of this document.");
                return;
            }

            await contract.methods.shareDocument(cleanedDocId, cleanedShareAddress).send({
                from: account,
                gas: 3000000,
            });

            alert('Document shared successfully!');
        } catch (error) {
            console.error("Failed to share document:", error);

            if (error.message.includes('revert')) {
                alert('Transaction failed. Check if you are the document owner and the document ID is valid.');
            } else {
                alert('An error occurred. Please try again.');
            }
        }
    };

    // Function to handle document access request
    const requestDocumentAccess = async () => {
        const cleanedDocId = requestDocId.trim();
    
        // Validate that Document ID is not empty
        if (!cleanedDocId) {
            alert('Document ID cannot be empty.');
            return;
        }
    
        try {
            // Estimate gas for the transaction
            const gas = await contract.methods.requestDocumentAccess(cleanedDocId).estimateGas({ from: account });
    
            // Send the transaction
            await contract.methods.requestDocumentAccess(cleanedDocId).send({ from: account, gas });
    
            console.log('Document access requested successfully');
        } catch (error) {
            console.error('Failed to request document access:', error);
            alert('An error occurred while requesting access.');
        }
    };
    

    // Fetch pending requests for the current account if they are a document owner
    const fetchRequests = async () => {
        try {
            const ownerRequests = await contract.methods.getAccessRequests().call({ from: account });
            setRequests(ownerRequests);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            alert('An error occurred while fetching requests.');
        }
    };

    // Function to grant access to a specific request
    const grantAccess = async (requestDocId, requesterAddress) => {
        try {
            await contract.methods.grantAccess(requestDocId, requesterAddress).send({
                from: account,
                gas: 3000000,
            });
            alert('Access granted successfully!');
            fetchRequests(); // Refresh the requests list after granting access
        } catch (error) {
            console.error("Failed to grant access:", error);
            alert('An error occurred while granting access.');
        }
    };

    useEffect(() => {
        // Fetch requests on component mount if the user is the document owner
        if (account) {
            fetchRequests();
        }
    }, [account]);

    return (
        <>
        <div className='share-card'>
            <h2>Share Document</h2>
            <input
                type="text"
                placeholder="Document ID"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
            />
            <input
                type="text"
                placeholder="Address to Share With"
                value={shareAddress}
                onChange={(e) => setShareAddress(e.target.value)}
            />
            <button onClick={handleShare}>Share Document</button>
            </div>
            <div className="request-card">
            <h2>Request Document Access</h2>
            <input
                type="text"
                placeholder="Document ID"
                value={requestDocId}
                onChange={(e) => setRequestDocId(e.target.value)}
            />
            <button onClick={() => requestDocumentAccess(requestDocId)}>Request Access</button>

            <h2>Pending Document Access Requests</h2>
            {requests.length === 0 ? (
                <p>No pending requests</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Document ID</th>
                            <th>Requester Address</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={index}>
                                <td>{request.docId}</td>
                                <td>{request.requester}</td>
                                <td>
                                    <button onClick={() => grantAccess(request.docId, request.requester)}>
                                        Grant Access
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
       </div>
        </>
    );
};

export default ShareDocument;
