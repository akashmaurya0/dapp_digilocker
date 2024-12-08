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
import "./Share.css";

const ShareDocument = () => {
    const { contract, account } = useWeb3();
    const [docId, setDocId] = useState(''); // For sharing document
    const [requestDocId, setRequestDocId] = useState(''); // For requesting access to document
    const [shareAddress, setShareAddress] = useState('');
    const [requests, setRequests] = useState([]);
    const [popupMessage, setPopupMessage] = useState('');
    const [isPopupVisible, setPopupVisible] = useState(false);

    // Function to show popup with a specific message
    const showPopup = (message) => {
        setPopupMessage(message);
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 3000); // Hide popup after 3 seconds
    };

    // Function to handle document sharing
    const handleShare = async () => {
        try {
            const cleanedDocId = docId.trim();
            const cleanedShareAddress = shareAddress.trim();

            if (!cleanedDocId || isNaN(cleanedDocId)) {
                showPopup('Please enter a valid document ID.');
                return;
            }

            if (!/^0x[a-fA-F0-9]{40}$/.test(cleanedShareAddress)) {
                showPopup("Invalid Ethereum address format.");
                return;
            }

            const docOwner = await contract.methods.getDocumentOwner(cleanedDocId).call();
            if (docOwner !== account) {
                showPopup("You are not the owner of this document.");
                return;
            }

            await contract.methods.shareDocument(cleanedDocId, cleanedShareAddress).send({
                from: account,
                gas: 3000000,
            });

            showPopup('Document shared successfully!');
        } catch (error) {
            console.error("Failed to share document:", error);

            if (error.message.includes('revert')) {
                showPopup('Transaction failed. Check if you are the document owner and the document ID is valid.');
            } else {
                showPopup('An error occurred. Please try again.');
            }
        }
    };

    // Function to handle document access request
    const requestDocumentAccess = async () => {
        const cleanedDocId = requestDocId.trim();

        // Validate that Document ID is not empty
        if (!cleanedDocId) {
            showPopup('Document ID cannot be empty.');
            return;
        }

        try {
            // Check if the user is the owner of the document
            const docOwner = await contract.methods.getDocumentOwner(cleanedDocId).call();
            if (docOwner === account) {
                showPopup('You are the owner of this document. No need to request access.');
                return;
            }

            // Estimate gas for the transaction
            const gas = await contract.methods.requestDocumentAccess(cleanedDocId).estimateGas({ from: account });

            // Send the transaction
            await contract.methods.requestDocumentAccess(cleanedDocId).send({ from: account, gas });

            showPopup('Document access requested successfully!');
        } catch (error) {
            console.error('Failed to request document access:', error);

            // Check if the error message indicates the document does not exist
            if (error.message.includes('revert')) {
                showPopup('The requested document does not exist. Please check the Document ID.');
            } else {
                showPopup('An unexpected error occurred while requesting access.');
            }
        }
    };

    // Fetch pending requests for the current account if they are a document owner
    const fetchRequests = async () => {
        try {
            const ownerRequests = await contract.methods.getAccessRequests().call({ from: account });
            setRequests(ownerRequests);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            showPopup('An error occurred while fetching requests.');
        }
    };

    // Function to grant access to a specific request
    const grantAccess = async (requestDocId, requesterAddress) => {
        try {
            await contract.methods.grantAccess(requestDocId, requesterAddress).send({
                from: account,
                gas: 3000000,
            });
            showPopup('Access granted successfully!');
            fetchRequests(); // Refresh the requests list after granting access
        } catch (error) {
            console.error("Failed to grant access:", error);
            showPopup('An error occurred while granting access.');
        }
    };

    // Function to reject access to a specific request
    const rejectAccess = async (requestDocId, requesterAddress) => {
        try {
            await contract.methods.rejectAccess(requestDocId, requesterAddress).send({
                from: account,
                gas: 3000000,
            });
            showPopup('Access request rejected.');
            fetchRequests(); // Refresh the requests list after rejecting access
        } catch (error) {
            console.error("Failed to reject access:", error);
            showPopup('An error occurred while rejecting the request.');
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
            {/* Popup Message */}
            {isPopupVisible && (
                <div className="popup">
                    <p>{popupMessage}</p>
                </div>
            )}

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
                <button onClick={requestDocumentAccess}>Request Access</button>
            </div>

            <div className="pending-requests">
                <h2>Pending Document Access Requests</h2>
                {requests.length === 0 ? (
                    <p>No pending requests</p>
                ) : (
                    <table  style={{ width: "70%", margin: "0 auto" }}>
                        <thead>
                            <tr>
                                <th>Document ID</th>
                                <th>Requester Address</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request, index) => (
                                <tr  style={{"positon":"relative","width":"70%"}} key={index}>
                                    <td>{request.docId.toString()}</td>
                                    <td>{request.requester}</td>
                                    <td>
                                        <button onClick={() => grantAccess(request.docId, request.requester)}>
                                            Grant Access
                                        </button>
                                        <button onClick={() => rejectAccess(request.docId, request.requester)}>
                                            Reject Access
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
