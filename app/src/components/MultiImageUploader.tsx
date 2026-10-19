import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Plus, Star } from 'lucide-react';
import { supabase as supabaseClient } from '../supabase';

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  label?: string;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  value, onChange, bucket = 'yy-images', folder = 'uploads', label = 'Images'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    setUploading(true);
    setError('');

    try {
      const newUrls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
           setError('Please select image files only.');
           continue;
        }
        if (file.size > 5 * 1024 * 1024) {
           setError('Max file size is 5 MB.');
           continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
        if (!supabaseClient) throw new Error('Supabase not configured');
        const { error: uploadError } = await supabaseClient.storage.from(bucket).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
        if (publicUrl) newUrls.push(publicUrl);
      }
      onChange([...value, ...newUrls]);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newArr = [...value];
    newArr.splice(index, 1);
    onChange(newArr);
  };

  const setAsMain = (index: number) => {
    if (index <= 0 || index >= value.length) return;
    const newArr = [...value];
    const [selected] = newArr.splice(index, 1);
    newArr.unshift(selected); // Move to index 0 so it comes first in store browsing
    onChange(newArr);
  };

  return (
    <div className="mb-4">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-neutral-700">{label}</label>
          {value.length > 0 && (
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              1st photo = Main cover
            </span>
          )}
        </div>
      )}
      <p className="text-[11px] text-neutral-400 mb-2">
        The image marked with <span className="font-bold text-amber-600">★ Main</span> appears first when customers browse the store. Click &quot;Set as Main&quot; on any picture to make it the primary cover.
      </p>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => {
          const isMain = i === 0;
          return (
            <div 
              key={i} 
              className={`relative w-24 h-24 rounded-lg overflow-hidden shadow-sm group transition-all ${
                isMain 
                  ? 'border-2 border-amber-500 ring-2 ring-amber-400/30' 
                  : 'border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <img src={url} alt="upload preview" className="w-full h-full object-cover" />
              
              {/* Main Badge / URL Badge */}
              <div className="absolute top-1 left-1 flex items-center gap-1 z-10">
                {isMain ? (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-neutral-950 text-[9px] rounded font-black uppercase tracking-wider shadow flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" /> MAIN
                  </span>
                ) : (
                  <span className="px-1 py-0.5 bg-black/60 text-white text-[9px] rounded font-bold uppercase tracking-wider backdrop-blur-sm pointer-events-none">
                    {url.includes('supabase.co') ? 'Direct' : 'URL'}
                  </span>
                )}
              </div>

              {/* Remove button */}
              <button 
                type="button" 
                onClick={() => removeImage(i)} 
                title="Delete this image"
                className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20 shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Main Indicator or Set as Main Button */}
              {isMain ? (
                <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-neutral-950 text-[9px] font-bold py-0.5 text-center flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider z-10">
                  <Star className="w-2.5 h-2.5 fill-current" /> Cover Photo
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsMain(i)}
                  title="Make this the main picture (first in store)"
                  className="absolute bottom-0 inset-x-0 bg-black/80 hover:bg-amber-500 hover:text-neutral-950 text-white text-[9px] font-semibold py-1 text-center transition-colors cursor-pointer z-10 flex items-center justify-center gap-1"
                >
                  <Star className="w-2.5 h-2.5 text-amber-300" /> Set as Main
                </button>
              )}
            </div>
          );
        })}
        <div 
          onClick={() => !uploading && inputRef.current?.click()}
          className={`w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center p-2 text-center transition-colors ${uploading ? 'bg-neutral-100 cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-neutral-50 hover:border-gold border-neutral-300'}`}
        >
           {uploading ? (
             <div className="flex flex-col items-center gap-1"><Loader2 className="w-5 h-5 animate-spin text-gold" /><span className="text-[10px] text-neutral-500">Uploading</span></div>
           ) : (
             <div className="flex flex-col items-center gap-1 text-neutral-500"><Plus className="w-5 h-5 text-neutral-400" /><span className="text-[10px] leading-tight">Add<br />Images</span></div>
           )}
        </div>
      </div>
      
      {/* ADD BY URL FEATURE */}
      <div className="mt-3 flex gap-2 max-w-sm">
        <input 
          type="text" 
          placeholder="Paste Cloudinary / Imgur image URL here..." 
          className="text-xs p-2 border rounded flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const val = e.currentTarget.value.trim();
              if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
                onChange([...value, val]);
                e.currentTarget.value = '';
              } else if (val) {
                setError('Must be a valid http(s) URL');
              }
            }
          }}
        />
        <button 
          type="button"
          className="bg-black text-white px-3 text-xs rounded hover:bg-gold transition-colors"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            const val = input.value.trim();
            if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
              onChange([...value, val]);
              input.value = '';
              setError('');
            } else if (val) {
              setError('Must be a valid http(s) URL');
            }
          }}
        >
          Add
        </button>
      </div>

      <input type="file" multiple ref={inputRef} onChange={handleFile} accept="image/*" className="hidden" />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
