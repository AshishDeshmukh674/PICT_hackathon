import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as pdfjsLib from 'pdfjs-dist';

interface FileUploadHandlerProps {
  onExtractedText: (text: string) => void;
}

export function FileUploadHandler({ onExtractedText }: FileUploadHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize PDF.js worker
  useEffect(() => {
    const setupPdfWorker = async () => {
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
    };
    setupPdfWorker().catch(console.error);
  }, []);

  const processImage = async (file: File) => {
    const result = await Tesseract.recognize(
      file,
      'eng',
      {
        logger: m => console.log(m)
      }
    );
    return result.data.text;
  };

  const processPDF = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setIsProcessing(true);
      const file = acceptedFiles[0];
      let extractedText = '';

      if (file.type.startsWith('image/')) {
        extractedText = await processImage(file);
      } else if (file.type === 'application/pdf') {
        extractedText = await processPDF(file);
      }

      onExtractedText(extractedText);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    }
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-primary/50 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Processing file...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <p>{isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}</p>
            <p className="text-sm text-muted-foreground">Supports images and PDFs</p>
          </>
        )}
      </div>
    </div>
  );
}