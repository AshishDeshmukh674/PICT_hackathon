import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '../../components/ui/button';
import { Upload } from 'lucide-react';

export function FileUploadHandler({ onExtractedText, language }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Map UI language to Tesseract language codes
      const langMap = {
        en: 'eng',
        hi: 'hin',
        mr: 'mar',
        gu: 'guj'
      };

      const result = await Tesseract.recognize(
        file,
        langMap[language] || 'eng',
        {
          logger: m => console.log(m)
        }
      );

      if (onExtractedText && result.data.text) {
        onExtractedText(result.data.text.trim());
      }
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload">
        <Button 
          variant="outline" 
          disabled={isProcessing}
          className="cursor-pointer"
          asChild
        >
          <span>
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </span>
        </Button>
      </label>
    </div>
  );
} 