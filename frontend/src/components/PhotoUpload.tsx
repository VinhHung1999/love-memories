import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  photos: File[];
  onChange: (files: File[]) => void;
  existingUrls?: string[];
  onDeleteExisting?: (index: number) => void;
}

export default function PhotoUpload({ photos, onChange, existingUrls = [], onDeleteExisting }: PhotoUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onChange([...photos, ...accepted]);
    },
    [photos, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxSize: 10 * 1024 * 1024,
  });

  const removeNew = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-text-light" />
        <p className="text-sm text-text-light">
          {isDragActive ? 'Drop photos here...' : 'Drag & drop photos, or click to select'}
        </p>
      </div>

      {(existingUrls.length > 0 || photos.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {existingUrls.map((url, i) => (
            <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {onDeleteExisting && (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(i)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {photos.map((file, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
