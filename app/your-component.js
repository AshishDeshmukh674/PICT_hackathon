import { pdfjs } from 'pdfjs-dist';

useEffect(() => {
  const setupPdfWorker = async () => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  };
  
  setupPdfWorker();
}, []); 