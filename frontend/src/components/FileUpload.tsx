import { useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzeWriting } from '../utils/analyzeWriting';
import './FileUpload.css';

// Use unpkg CDN for worker - avoids .mjs MIME type issues with nginx in production
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface FileUploadProps {
  onAnalysisComplete: (result: any) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

function FileUpload({ onAnalysisComplete, onError, onLoading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError('Please upload a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      onError('File size must be less than 50MB');
      return;
    }

    try {
      onLoading(true);

      // Parse PDF in the browser (pdfjs-dist works here - DOMMatrix exists)
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdfDocument = await loadingTask.promise;

      let text = '';
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        let pageText = '';
        let lastY: number | null = null;

        for (const item of textContent.items) {
          const txItem = item as { str: string; transform?: number[] };
          if (lastY !== null && txItem.transform?.[5]) {
            const yGap = Math.abs(lastY - txItem.transform[5]);
            if (yGap > 15) pageText += '\n\n';
            else if (yGap > 5) pageText += '\n';
            else pageText += ' ';
          }
          pageText += txItem.str;
          if (txItem.transform?.[5]) lastY = txItem.transform[5];
        }
        text += pageText + '\n\n';
      }

      const stats = analyzeWriting(text);

      // Send stats to backend for storage and comparison
      const baseUrl = API_URL || window.location.origin;
      const response = await fetch(`${baseUrl}/api/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save stats');
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'An error occurred while analyzing the PDF');
    } finally {
      onLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div className="upload-area" onClick={handleClick}>
        <div className="upload-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h3>Upload PDF Document</h3>
        <p>Click or drag and drop your PDF file here</p>
        <p className="file-hint">Maximum file size: 50MB</p>
      </div>
    </div>
  );
}

export default FileUpload;
