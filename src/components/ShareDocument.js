import React, { useState } from 'react';
import { useWeb3 } from '../Web3Context';

const ShareDocument = () => {
    const { contract, account } = useWeb3();
    const [docId, setDocId] = useState('');
    const [shareAddress, setShareAddress] = useState('');

    const handleShare = async () => {
        try {
            // Trim and validate the document ID and address before sending the transaction
            const cleanedDocId = docId.trim();
            const cleanedShareAddress = shareAddress.trim();

            // Validate document ID
            if (!cleanedDocId || isNaN(cleanedDocId)) {
                alert('Please enter a valid document ID.');
                return;
            }

            // Validate the Ethereum address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(cleanedShareAddress)) {
                alert("Invalid Ethereum address format.");
                return;
            }

            // Check if the document exists and the user is the owner
            const docOwner = await contract.methods.getDocumentOwner(cleanedDocId).call();
            if (docOwner !== account) {
                alert("You are not the owner of this document.");
                return;
            }

            // Proceed with sharing the document
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

    return (
        <div>
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
    );
};

export default ShareDocument;
