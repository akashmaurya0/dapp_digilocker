import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./Web3Context";
import Navbar from "./components/Navbar";
import UploadDocuments from "./components/UploadDocuments";
import ViewDocuments from "./components/ViewDocuments";
import ShareDocument from "./components/ShareDocument";
import PrintDocument from "./components/PrintDocument";
import VerifyDocument from "./components/VerifyDocument";
import "./App.css"; // Import styles

const App = () => {
  return (
    <Web3Provider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <div className="animated-background">
            {/* Floating Files */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="floating-file"></div>
            ))}
          </div>
          <div className="main-content">
            <Routes>
              <Route path="/" element={<UploadDocuments />} />
              <Route path="/view" element={<ViewDocuments />} />
              <Route path="/share" element={<ShareDocument />} />
              <Route path="/print" element={<PrintDocument />} />
              <Route path="/verify" element={<VerifyDocument />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Web3Provider>
  );
};

export default App;
