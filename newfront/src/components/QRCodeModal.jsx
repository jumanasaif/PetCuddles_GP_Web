// components/QRCodeModal.jsx
import React from 'react';

const QRCodeModal = ({ pet, onClose }) => {
  if (!pet || !pet.qrCodeUrl) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{pet.name}'s QR Code</h3>
        <img src={pet.qrCodeUrl} alt={`${pet.name}'s QR Code`} />
        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
