
import React, { useState, useRef } from 'react';
import { CameraIcon } from './icons';

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
  currentPhotoUrl?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoSelected, currentPhotoUrl }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-32 bg-slate-200 rounded-full mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={handleClick}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Patient Preview" className="w-full h-full object-cover" />
        ) : (
          <CameraIcon className="w-12 h-12 text-slate-500" />
        )}
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        {previewUrl ? 'Change Photo' : 'Upload Photo'}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};
