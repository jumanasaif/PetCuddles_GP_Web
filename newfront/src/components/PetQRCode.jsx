import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import BgImage from "../assets/bg.png";
import QR from "../assets/qr3.png";
import { FiDownload, FiSave, FiChevronDown } from 'react-icons/fi';

const PetQRGenerator = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:5000/api/pets/user-pets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPets(response.data.pets);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Fetch QR info when pet is selected
  const fetchQRInfo = async (petId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/pets/pet-qr-info/${petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QR info');
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (petId) => {
    const pet = pets.find(p => p._id === petId);
    setSelectedPet(pet);
    setQrInfo(null); // Reset QR info when selecting new pet
  };

  const generateQRCode = () => {
    if (!qrInfo) return null;
    const qrContent = `

      ${qrInfo.message}

     📢 Lost Pet Information :
            Name: ${qrInfo.petName}
            Species: ${qrInfo.species}
            Breed: ${qrInfo.breed || 'Unknown'}
      
     📞 Contact Information :
             Name: ${qrInfo.contactName}
             Phone: ${qrInfo.contactPhone}
    `;
  
    return (
      <QRCodeCanvas 
        id={`qr-code-${selectedPet._id}`}
        value={qrContent}
        size={256}
        level="H"
        includeMargin={true}
      />
    );
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById(`qr-code-${selectedPet._id}`);
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${selectedPet.name}-qr-code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const saveQRCode = async () => {
    try {
      setLoading(true);
      const canvas = document.getElementById(`qr-code-${selectedPet._id}`);
      if (!canvas) {
        throw new Error('QR code canvas not found');
      }
      
      // Convert canvas to data URL
      const qrCodeUrl = canvas.toDataURL("image/png");
      
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/pets/save-qr/${selectedPet._id}`, 
        { qrCodeUrl },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      // Update local state if needed
      const updatedPets = pets.map(pet => 
        pet._id === selectedPet._id ? { ...pet, qrCodeUrl } : pet
      );
      setPets(updatedPets);
      
      alert('QR code saved successfully!');
    } catch (err) {
      console.error('Error saving QR code:', err);
      setError(err.response?.data?.message || 'Failed to save QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center relative bg-[#F6F4E8]" style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      {/* Hero Section */}
      <div className="flex w-full h-[550px]">
        <div className="w-1/2 flex flex-col justify-center p-8 relative">
          <div className="bg-[#BACEC1] w-3/4 mb-6 rounded-lg shadow-lg h-[60px] ml-[170px] mt-[60px]"></div>
          <div className="bg-[#325747] text-white p-10 rounded-lg shadow-lg font-laila h-[300px]">
            <h1 className="text-5xl font-bold mb-4">Pet QR Code Generator</h1>
            <p className="text-xl leading-10">
              <strong className="text-2xl">Why create a QR code for your pet?</strong><br />
              A QR code tag can help reunite you with your pet if they get lost. 
              Anyone who finds your pet can scan the code to view your contact information.
            </p>
          </div>
        </div>

        {/* Right Section with Pet Image */}
        <div className="w-1/2 flex items-center justify-center mt-[125px] rounded-[25px]">
          <img src={QR} alt="QR Code" className="w-[80%] h-auto object-cover"/>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="w-full flex flex-col items-center py-12 bg-[#F6F4E8] mt-[50px] max-w-[1200px] px-5" style={{marginTop:"100px"}}>
        <h2 className="text-4xl font-bold font-laila text-[#325747]">How It Works</h2>
        <div className="flex items-center w-full max-w-6xl relative">
          <div className="absolute top-[18px] w-4/5 border-t-2 border-[#E59560] z-0 left-[10%] right-[10%]"></div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md mt-1.5"></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Select Your Pet</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              Choose the pet you want to generate a QR code for from your registered pets.
            </p>
          </div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md mt-1.5"></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Generate QR Code</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              Click the generate button to create a personalized QR code with your pet's information.
            </p>
          </div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md mt-1.5"></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Download & Use</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              Download the QR code and attach it to your pet's collar for safety.
            </p>
          </div>
        </div>
      </section>

      {/* QR Generator Container */}
      <div className="w-full max-w-[1200px] mx-auto py-8 px-6 bg-[#F6F4E8] rounded-2xl shadow-lg border border-[#E8E1D1] mt-8" >
        {/* Pet Selection */}
        <div className="mb-10 text-center">
          <h3 className="text-2xl font-bold font-laila text-[#325747] relative inline-block mb-6">
            Select a Pet
            <span className="absolute bottom-[-8px] left-1/4 w-1/2 h-1 bg-[#E59560] rounded-full"></span>
          </h3>
          
          {loading && pets.length === 0 ? (
            <p>Loading pets...</p>
          ) : error ? (
            <p className="text-red-500 mt-4 text-center bg-red-50 px-4 py-2 rounded border-l-4 border-red-500">
              {error}
            </p>
          ) : (
            <div className="relative w-full max-w-md mx-auto">
              <select 
                onChange={(e) => handlePetSelect(e.target.value)}
                disabled={loading}
                value={selectedPet?._id || ''}
                className="w-full px-5 py-4 text-lg text-[#325747] bg-white border-2 border-[#BACEC1] rounded-xl shadow-md appearance-none cursor-pointer pr-12 focus:border-[#E59560] focus:outline-none transition-all"
              >
                <option value="">-- Select your pet --</option>
                {pets.map(pet => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#325747] text-xl pointer-events-none" />
            </div>
          )}
        </div>

        {selectedPet && (
          <div className="mt-8">
            <button 
              onClick={() => fetchQRInfo(selectedPet._id)} 
              disabled={loading}
              className="w-full max-w-xs mx-auto px-8 py-4 bg-[#E59560] text-white font-semibold text-lg rounded-xl shadow-md hover:bg-[#D4834A] transition-all flex items-center justify-center"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>

            {qrInfo && (
              <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8">
                {/* QR Code */}
                <div className="bg-white p-5 rounded-xl shadow-md border border-[#E8E1D1]">
                  {generateQRCode()}
                </div>
                
                {/* Pet Info */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-[#E8E1D1] w-full max-w-md">
                  {qrInfo.petImage && (
                    <img 
                      src={qrInfo.petImage} 
                      alt={qrInfo.petName}
                      className="w-48 h-48 object-cover rounded-lg border-2 border-[#E8E1D1] mx-auto mb-4"
                    />
                  )}
                  <h3 className="text-2xl font-bold text-[#325747] border-b-2 border-[#E59560] pb-2 mb-4">
                    {qrInfo.petName}
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center text-[#5A5A5A]">
                      <span className="text-[#E59560] mr-2">🐾</span>
                      Species: {qrInfo.species}
                    </p>
                    <p className="flex items-center text-[#5A5A5A]">
                      <span className="text-[#E59560] mr-2">🧬</span>
                      Breed: {qrInfo.breed || 'Unknown'}
                    </p>
                    <p className="flex items-center text-[#5A5A5A]">
                      <span className="text-[#E59560] mr-2">👤</span>
                      Contact: {qrInfo.contactName}
                    </p>
                    <p className="flex items-center text-[#5A5A5A]">
                      <span className="text-[#E59560] mr-2">📞</span>
                      Phone: {qrInfo.contactPhone}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mt-6">
                  <button 
                    onClick={downloadQRCode} 
                    className="px-6 py-3 bg-[#325747] text-white font-medium rounded-xl shadow-md hover:bg-[#244235] transition-all flex items-center justify-center gap-2 font-laila"
                  >
                    <FiDownload className="text-xl" />
                    Download QR Code
                  </button>
                  <button 
                    onClick={saveQRCode} 
                    disabled={loading}
                    className="px-6 py-3 bg-[#BACEC1] text-[#325747] font-medium rounded-xl shadow-md hover:bg-[#A8BDB1] transition-all flex items-center justify-center gap-2 font-laila"
                  >
                    <FiSave className="text-xl" />
                    {loading ? 'Saving...' : 'Save QR Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-500 mt-6 text-center bg-red-50 px-4 py-2 rounded border-l-4 border-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PetQRGenerator;
