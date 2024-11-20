import React from 'react';
import { Web3Provider } from './Web3Context';
import UploadDocument from './components/UploadDocuments';
import ViewDocuments from './components/ViewDocuments';
import ShareDocument from './components/ShareDocument';
import PrintDocument from './components/PrintDocument';
const App = () => {
    return (
        <Web3Provider>
            <div>
                <h1 style={{"textAlign":"center"}}>Decentralized DigiLocker</h1>
                <UploadDocument />
                <ViewDocuments />
                <ShareDocument />
                <PrintDocument/>
            </div>
        </Web3Provider>
    );
};

export default App;
