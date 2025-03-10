"use client";
import React, { useState } from 'react';
import PrescriptionUpload from './_components/PrescriptionUpload';
import MedicineList from './_components/MedicineList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

function PrescriptionPage() {
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [currentStep, setCurrentStep] = useState('upload');
  const [processing, setProcessing] = useState(false);
  const [cartUrl, setCartUrl] = useState(null);

  const handlePrescriptionProcessed = (medicines) => {
    setExtractedMedicines(medicines);
    setCurrentStep('medicines');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Digital Prescription Processing</h1>
      
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Prescription</TabsTrigger>
          <TabsTrigger value="medicines">Available Medicines</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <PrescriptionUpload onPrescriptionProcessed={handlePrescriptionProcessed} />
        </TabsContent>

        <TabsContent value="medicines">
          <MedicineList 
            medicines={extractedMedicines}
            processing={processing}
            setProcessing={setProcessing}
            cartUrl={cartUrl}
            setCartUrl={setCartUrl}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PrescriptionPage; 