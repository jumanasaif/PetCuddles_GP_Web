import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const VetTemporaryCareRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clinicId } = useParams(); // For direct requests from vet profile
  
  const [step, setStep] = useState(1); // 1: Select pet, 2: Request form
  const [pet, setPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  const [reason, setReason] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [ownerNotes, setOwnerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyRate, setDailyRate] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(location.search);
        const petId = queryParams.get('petId');

        // If petId is provided (from notification), skip to step 2
        if (petId) {
          const petResponse = await axios.get(`http://localhost:5000/api/pets/id/${petId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPet(petResponse.data);
          setStep(2);
        }

        // Always fetch the owner's pets
        const petsResponse = await axios.get('http://localhost:5000/api/pets/user-pets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPets(petsResponse.data.pets);

        // If clinicId is provided (from vet profile), pre-select that vet
        if (clinicId) {
          const vetResponse = await axios.get(`http://localhost:5000/api/vet/public-profile/${clinicId}`);
          setSelectedVet(vetResponse.data);
          setVets([vetResponse.data]); // Only show this vet in selection
        } else {
          // Otherwise fetch all available vets
          const vetsResponse = await axios.get('http://localhost:5000/api/vet-temporary-care/available-vets', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setVets(vetsResponse.data);
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search, clinicId]);

  useEffect(() => {
    if (selectedVet && pet) {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const rate = selectedVet.temporaryCareSettings.dailyRatePerPet;
      setDailyRate(rate);
      setTotalCost(days * rate);
    }
  }, [selectedVet, startDate, endDate, pet]);

  const handlePetSelect = (selectedPet) => {
    setPet(selectedPet);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/vet-temporary-care/request', {
        petId: pet._id,
        vetId: selectedVet._id,
        startDate,
        endDate,
        reason,
        specialRequirements: specialRequirements.split(',').map(s => s.trim()),
        ownerNotes,
        dailyRate,
        totalCost
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/home', { state: { message: 'Temporary care request submitted successfully' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 font-laila overflow-y-auto">
      {step === 1 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-6 text-[#E59560] text-center">
            Select a Pet for Temporary Care
          </h2>
          
          {pets.length === 0 ? (
            <div className="text-center py-4">
              <p>You don't have any pets registered.</p>
              <button 
                onClick={() => navigate('/add-pet')}
                className="mt-4 bg-[#325747] text-white px-4 py-2 rounded"
              >
                Add a Pet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map(p => (
                <div 
                  key={p._id}
                  onClick={() => handlePetSelect(p)}
                  className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <img 
                    src={p.img_url || '/default-pet.png'} 
                    alt={p.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-sm text-gray-600">
                      {p.breed} • {p.age} years • {p.weight} kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form 
          onSubmit={handleSubmit} 
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-xl font-bold mb-6 text-[#E59560] text-center">
            Request Temporary Vet Care for {pet.name}
          </h2>
          
          {!clinicId && (
            <div className="mb-6">
              <label className="block mb-2 font-medium">Select Veterinary Clinic:</label>
              <select
                value={selectedVet?._id || ''}
                onChange={(e) => {
                  const vet = vets.find(v => v._id === e.target.value);
                  setSelectedVet(vet);
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">-- Select a clinic --</option>
                {vets.map(vet => (
                  <option key={vet._id} value={vet._id}>
                    {vet.clinicName} - {vet.city} (${vet.temporaryCareSettings.dailyRatePerPet}/day)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedVet && (
            <>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">{selectedVet.clinicName}</h3>
                <p className="text-gray-600 mb-2">{selectedVet.temporaryCareSettings.description}</p>
                
                <div className="mb-2">
                  <span className="font-medium">Facilities:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedVet.temporaryCareSettings.facilities.map(facility => (
                      <span key={facility} className="bg-gray-200 px-2 py-1 rounded text-sm">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="font-medium">Daily Rate: ${selectedVet.temporaryCareSettings.dailyRatePerPet}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 font-medium">Start Date:</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    minDate={new Date()}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">End Date:</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    minDate={startDate}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Cost Summary</h3>
                <p>Daily Rate: ${dailyRate}</p>
                <p>Days: {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))}</p>
                <p className="font-bold mt-2">Total Estimated Cost: ${totalCost}</p>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Reason for Temporary Care:</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Special Requirements (comma separated):</label>
                <input
                  type="text"
                  value={specialRequirements}
                  onChange={e => setSpecialRequirements(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., special diet, medication, exercise needs"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">Additional Notes:</label>
                <textarea
                  value={ownerNotes}
                  onChange={e => setOwnerNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#325747] text-white rounded"
                >
                  Submit Request
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default VetTemporaryCareRequest;