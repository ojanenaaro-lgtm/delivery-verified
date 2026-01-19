import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, FileText, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReceiptUploaderProps {
  onFileSelect: (file: File, base64: string) => void;
  disabled?: boolean;
}

export function ReceiptUploader({ onFileSelect, disabled }: ReceiptUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const processFile = useCallback((file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Convert to base64 and call callback
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onFileSelect(file, base64);
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled, processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Main upload area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl transition-all duration-300',
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          preview && 'border-success bg-success-muted',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          /* Preview state */
          <div className="p-6">
            <div className="relative aspect-[4/3] max-h-[400px] rounded-xl overflow-hidden bg-background-secondary">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full h-full object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 rounded-full shadow-lg"
                onClick={handleClear}
                disabled={disabled}
              >
                <X size={18} />
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <FileText size={16} className="text-success" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="text-muted-foreground">
                ({((fileSize || 0) / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        ) : fileName && !preview ? (
          /* PDF or non-previewable file */
          <div className="p-12 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-success" />
            </div>
            <p className="font-medium text-foreground text-lg">{fileName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {((fileSize || 0) / 1024).toFixed(1)} KB
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
              disabled={disabled}
            >
              <X size={16} />
              Remove
            </Button>
          </div>
        ) : (
          /* Empty upload state */
          <div className="p-12 md:p-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Upload your receipt
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Drag and drop your receipt image or PDF here, or use the buttons below
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={openFileDialog}
                  disabled={disabled}
                  className="min-w-[160px]"
                >
                  <ImageIcon size={18} />
                  Browse Files
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={openCamera}
                  disabled={disabled}
                  className="min-w-[160px] sm:flex hidden md:flex"
                >
                  <Camera size={18} />
                  Take Photo
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Supports: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Mobile camera button (shown on small screens) */}
      {!preview && !fileName && (
        <div className="mt-4 sm:hidden">
          <Button
            variant="outline"
            size="lg"
            onClick={openCamera}
            disabled={disabled}
            className="w-full"
          >
            <Camera size={18} />
            Take Photo
          </Button>
        </div>
      )}
    </div>
  );
}
