import { useRef } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onAnalysisComplete: (result: any) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

function FileUpload({ onAnalysisComplete, onError, onLoading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      onError('Please upload a PDF file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      onError('File size must be less than 50MB');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      onLoading(true);
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze PDF');
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error: any) {
      onError(error.message || 'An error occurred while analyzing the PDF');
    } finally {
      onLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

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

