import React from 'react';
import { useParams } from 'react-router-dom';
import HealthRecords from '../components/PetHealthRecords';

const PetHealthRecordsPage = () => {
  const { petId } = useParams(); // react-router-dom hook

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6" style={{ marginTop: '80px' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#325747] mb-6">Pet Health Records</h1>
        {petId && <HealthRecords petId={petId} />}
      </div>
    </div>
  );
};

export default PetHealthRecordsPage;
