import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Check, Loader2, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export default function ProfilePhotoUpload() {
  const { user, updateUserProfile } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Use a smaller size to keep the base64 string well within limits
    canvas.width = 150;
    canvas.height = 150;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      150,
      150
    );

    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const handleUpload = async () => {
    if (!user || !imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const photoURL = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!photoURL) throw new Error('Failed to crop image');

      // Update Firestore User Document ONLY (Auth photoURL rejects long base64 strings)
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { photoURL });
      } catch (err: any) {
        console.error("Failed to update Firestore doc:", err);
        if (err.message?.includes('Missing or insufficient permissions')) {
          setUploadError("Permission denied. Please update your Firestore Security Rules.");
        } else {
          setUploadError("Failed to save photo to database.");
        }
      }
      
      // We also need to update the local context so the UI reflects the change immediately
      updateUserProfile({ photoURL });
      
      setImageSrc(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError("An error occurred while processing the image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group flex flex-col items-center">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent-primary/50 transition-colors">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'Profile'} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-mystic-900 flex items-center justify-center">
            <User className="w-8 h-8 text-slate-500" />
          </div>
        )}
        
        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          <Camera className="w-6 h-6 text-white" />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </label>
      </div>
      
      {uploadError && (
        <div className="absolute top-full mt-2 w-max max-w-[250px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-start gap-2 z-10">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="leading-tight">{uploadError}</span>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {imageSrc && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-mystic-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            >
              <div className="bg-mystic-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Crop Profile Photo</h3>
                  <button 
                    onClick={() => setImageSrc(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="relative h-64 w-full bg-black touch-none">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Zoom</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-accent-primary"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImageSrc(null)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 py-3 rounded-xl accent-gradient text-white font-bold shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Save Photo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
