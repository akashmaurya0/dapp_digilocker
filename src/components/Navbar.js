import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi"; // Import icons
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <h1 style={{textAlign:"center"}}>DigiLocker</h1>
      {/* Hamburger Menu Button (Left-Aligned) */}

      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX size={30} /> : <FiMenu size={30} />}
      </button>

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isOpen ? "open" : ""}`}>
        
        <ul>
          <li><Link to="/" onClick={() => setIsOpen(false)}>Upload Documents</Link></li>
          <li><Link to="/view" onClick={() => setIsOpen(false)}>My files</Link></li>
          <li><Link to="/share" onClick={() => setIsOpen(false)}>Share & request documents</Link></li>
          <li><Link to="/print" onClick={() => setIsOpen(false)}>global file history</Link></li>
          <li><Link to="/verify" onClick={() => setIsOpen(false)}>Verify documents</Link></li>
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
