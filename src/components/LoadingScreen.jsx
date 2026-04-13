import React from 'react';
import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-container">
      <div className="stack">
        <div className="stack__card"></div>
        <div className="stack__card"></div>
        <div className="stack__card">
          <div className="stack__logo-wrap">
            <img src="/logo1.png" alt="SHESHA" className="stack__logo" />
          </div>
        </div>
      </div>
      
      <div className="loader-footer">
        <h1 className="loading-text">SHESHA</h1>
        <div className="energy-bar-container">
          <div className="energy-line"></div>
        </div>
      </div>
    </div>
  );
}