import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from "../../components/ui/button";
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export function FileUploadHandler({ onExtractedText, language }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        if (onExtractedText) {
          onExtractedText(fullText);
        }
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        if (onExtractedText) {
          onExtractedText(text);
        }
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or text file.');
      }
    } catch (err) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
      // Clear the input value to allow uploading the same file again
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Upload File'}
        </Button>
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}