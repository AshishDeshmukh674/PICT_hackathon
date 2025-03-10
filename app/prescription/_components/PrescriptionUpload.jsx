"use client";
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { createWorker } from 'tesseract.js';

function PrescriptionUpload({ onPrescriptionProcessed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/'))) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a valid PDF or image file');
    }
  };

  const processPrescription = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      // Initialize Tesseract.js worker
      const worker = await createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 100));
          }
        },
      });

      // If PDF, convert to image first (you'll need a PDF to image library)
      let imageToProcess = file;
      if (file.type === 'application/pdf') {
        // Convert PDF to image using appropriate library
        // imageToProcess = await convertPDFToImage(file);
      }

      // Perform OCR
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(imageToProcess);
      await worker.terminate();

      // Process the extracted text to identify medicines
      const medicines = extractMedicines(text);
      
      if (medicines.length === 0) {
        setError('No medicines found in the prescription');
      } else {
        onPrescriptionProcessed(medicines);
      }
    } catch (err) {
      setError('Failed to process prescription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractMedicines = (text) => {
    // Updated medicine patterns to include common prefixes and formats
    const medicinePatterns = [
      {
        prefix: ['tab', 'tablet', 'tablets'],
        regex: /tab(?:let)?\s*(?:\.|\s)\s*rantac\s*(\d+)\s*mg/i,
        brand: 'Rantac',
        generic: 'Ranitidine'
      },
      {
        prefix: ['cap', 'capsule', 'capsules'],
        regex: /cap(?:sule)?\s*(?:\.|\s)\s*sm\s*fibro/i,
        brand: 'SM FIBRO',
        generic: 'Muscle Relaxant'
      },
      // Add more medicine patterns as needed
    ];

    const dosagePatterns = [
      /(\d+[-]\d+[-]\d+)/i,  // Matches patterns like 1-1-1
      /(\d+[-]\d+)/i,        // Matches patterns like 1-0
      /(\d+)\s*(?:times?|daily|bd|tds)/i  // Matches other common dosage patterns
    ];

    const durationPattern = /(\d+)\s*(?:days?|weeks?|months?)/i;

    const foundMedicines = [];
    const lines = text.split('\n');

    // Find the Rx or Medicine section
    const medicineSection = lines.findIndex(line => 
      line.toLowerCase().includes('rx') || 
      line.toLowerCase().includes('medicine') ||
      line.toLowerCase().includes('prescribed')
    );

    if (medicineSection !== -1) {
      // Process lines after Rx/Medicine section
      for (let i = medicineSection + 1; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        medicinePatterns.forEach(pattern => {
          if (pattern.regex.test(line)) {
            // Extract medicine details
            const strengthMatch = line.match(/(\d+)\s*mg/i);
            const dosageMatch = line.match(dosagePatterns[0]) || 
                              line.match(dosagePatterns[1]) || 
                              line.match(dosagePatterns[2]);
            const durationMatch = line.match(durationPattern);
            
            const instructionMatch = line.match(/(?:after|before)\s+meal/i);

            foundMedicines.push({
              name: pattern.brand,
              genericName: pattern.generic,
              strength: strengthMatch ? `${strengthMatch[1]}mg` : 'Not specified',
              dosage: dosageMatch ? dosageMatch[0] : 'As directed',
              duration: durationMatch ? durationMatch[0] : 'As prescribed',
              quantity: calculateQuantity(dosageMatch?.[0], durationMatch?.[0]),
              instructions: instructionMatch ? instructionMatch[0] : 'As directed',
              available: true,
              price: calculatePrice(strengthMatch ? strengthMatch[1] : 100)
            });
          }
        });
      }
    }

    // If no medicines found using patterns, try fuzzy matching
    if (foundMedicines.length === 0) {
      console.log("Extracted text:", text);
      // Look for lines containing medicine-related keywords
      lines.forEach(line => {
        if (/tab|cap|mg|tablet|capsule/i.test(line)) {
          console.log("Potential medicine line:", line);
        }
      });
      setError('Processing prescription text. Please verify extracted information.');
    }

    return foundMedicines;
  };

  const calculateQuantity = (dosage, duration) => {
    if (!dosage || !duration) return '30 tablets';
    
    const dosagePerDay = dosage.split('-')
      .reduce((sum, num) => sum + parseInt(num || 0), 0);
    
    const days = parseInt(duration.match(/\d+/)[0]);
    return `${dosagePerDay * days} tablets`;
  };

  const calculatePrice = (strength) => {
    const basePrice = 100;
    const strengthNum = parseInt(strength) || 100;
    return ((basePrice + (strengthNum * 0.5)) * (1 + Math.random() * 0.2)).toFixed(2);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg p-6">
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="hidden"
        id="prescription-upload"
      />
      
      <label htmlFor="prescription-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <span className="text-lg font-medium">
            Drop your prescription here or click to upload
          </span>
          <span className="text-sm text-gray-500">
            Supports PDF and image files
          </span>
        </div>
      </label>

      {file && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>{file.name}</span>
          </div>
          <Button 
            onClick={processPrescription}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process Prescription'}
          </Button>
        </div>
      )}

      {loading && (
        <div className="w-full max-w-xs mt-4">
          <Progress value={progress} className="w-full" />
          <span className="text-sm text-gray-500 mt-2">
            Processing prescription... {progress}%
          </span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default PrescriptionUpload; 