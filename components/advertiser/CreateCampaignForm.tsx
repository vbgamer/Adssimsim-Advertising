import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Campaign } from '../../types';
import { SparklesIcon } from '../icons/SparklesIcon';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { generateAdCreative } from '../../services/geminiService';


// --- AI Creative Generator Modal Component ---
interface AiCreativeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageDataUrl: string, prompt: string) => void;
  aspectRatio: '16:9' | '9:16';
}

const AiCreativeGenerator: React.FC<AiCreativeGeneratorProps> = ({ isOpen, onClose, onImageGenerated, aspectRatio }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageDataUrl = await generateAdCreative(prompt, aspectRatio);
      setGeneratedImage(imageDataUrl);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage, prompt);
      handleClose(); // Close and reset
    }
  };

  const handleClose = () => {
    // Reset state on close to ensure it's fresh for next open
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  // Reset internal state when modal is closed from parent
  useEffect(() => {
    if (!isOpen) {
        setPrompt('');
        setGeneratedImage(null);
        setError(null);
        setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Creative with AI" subtitle="Describe the image you want to create for your ad.">
      <div className="space-y-4">
        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
          <textarea
            id="ai-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="e.g., A vibrant, photorealistic image of a futuristic city at sunset, with flying cars and glowing neon signs."
            disabled={isLoading}
          />
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="flex justify-end">
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt.trim()}>
            <SparklesIcon className="h-5 w-5 mr-2" />
            Generate
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 bg-charcoal/50 rounded-lg">
            <Spinner className="h-12 w-12" />
            <p className="mt-4 text-gray-400">Generating your creative... this may take a moment.</p>
          </div>
        )}

        {generatedImage && (
          <div className="space-y-4 animate-fade-in-up">
            <h4 className="font-semibold text-white">Generated Image</h4>
            <div className="bg-dark rounded-lg p-2">
              <img src={generatedImage} alt="AI generated creative" className="w-full h-auto object-contain rounded-md" style={{ aspectRatio: aspectRatio.replace(':', ' / ') }} />
            </div>
            <div className="flex justify-end gap-4">
              <Button onClick={handleGenerate} variant="secondary" isLoading={isLoading} disabled={!prompt.trim()}>Try Again</Button>
              <Button onClick={handleUseImage} variant="success">Use this Image</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};


interface CreateCampaignFormProps {
  onCampaignSubmit: (
    campaignData: Omit<Campaign, 'id' | 'impressions' | 'clicks' | 'status' | 'advertiser_id' | 'thumbnailUrl'>, 
    creativeFile: File,
    thumbnailFile: File | null
  ) => void;
  onClose: () => void;
  company: Campaign['company'];
}

const COST_PER_MINUTE = 1000; // Rs. 1000 per minute

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const CreateCampaignForm: React.FC<CreateCampaignFormProps> = ({ onCampaignSubmit, onClose, company }) => {
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(0);
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [type, setType] = useState<Campaign['type']>('Video');

  // Creative handling
  const [adCreative, setAdCreative] = useState<{ file: File | null; previewUrl: string | null; type: 'image' | 'video' | null }>({ file: null, previewUrl: null, type: null });
  const [thumbnail, setThumbnail] = useState<{ file: File | null; previewUrl: string | null }>({ file: null, previewUrl: null });
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [campaignCost, setCampaignCost] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    const cost = (duration / 60) * COST_PER_MINUTE;
    setCampaignCost(cost);
  }, [duration]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (adCreative.previewUrl) {
        URL.revokeObjectURL(adCreative.previewUrl);
      }
      const isVideo = file.type.startsWith('video/');
      const previewUrl = URL.createObjectURL(file);
      setAdCreative({ file, previewUrl, type: isVideo ? 'video' : 'image' });
      setError(null);

      if (isVideo) {
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          videoEl.onloadedmetadata = () => {
              window.URL.revokeObjectURL(videoEl.src);
              setDuration(Math.round(videoEl.duration) || 30); // Use detected duration, fallback to 30s
          };
          videoEl.src = previewUrl;
      } else {
          setDuration(10); // Default duration for images
          if (thumbnail.previewUrl) URL.revokeObjectURL(thumbnail.previewUrl);
          setThumbnail({ file: null, previewUrl: null });
      }
    }
  };
  
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (thumbnail.previewUrl) {
        URL.revokeObjectURL(thumbnail.previewUrl);
      }
      setThumbnail({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleImageGenerated = (imageDataUrl: string, prompt: string) => {
    const filename = `${prompt.substring(0, 20).replace(/\s/g, '_')}_${Date.now()}.jpg`;
    const imageFile = dataURLtoFile(imageDataUrl, filename);

    // Revoke old blob URL if it exists to prevent memory leaks
    if (adCreative.previewUrl && adCreative.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(adCreative.previewUrl);
    }
    if (thumbnail.previewUrl && thumbnail.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnail.previewUrl);
    }

    setAdCreative({ file: imageFile, previewUrl: imageDataUrl, type: 'image' });
    
    // An image creative needs a thumbnail. We'll use the same image.
    setThumbnail({ file: imageFile, previewUrl: imageDataUrl });

    // Set a default duration for the image-based ad
    setDuration(10);
    
    setIsAiModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on new submission attempt
    
    if (!adCreative.file) {
      setError('Please provide an ad creative (image or video).');
      return;
    }
    
    if (adCreative.type === 'video' && !thumbnail.file) {
      setError('A thumbnail image is required for video campaigns.');
      return;
    }
    
    // Pass all data and the file to the parent component
    onCampaignSubmit({
      name,
      budget: Math.round(campaignCost),
      reward: 0.15, // Standard reward
      adCreativeUrl: '', // This will be replaced by parent after upload
      campaignGoal: 'Brand Awareness',
      ctaText: 'Learn More', // Default CTA
      landingPageUrl,
      type,
      category,
      company,
      duration,
    }, adCreative.file, thumbnail.file);
  };
  
  // Cleanup object URLs on unmount
  useEffect(() => {
    const adPreview = adCreative.previewUrl;
    const thumbPreview = thumbnail.previewUrl;
    return () => {
      if (adPreview && adPreview.startsWith('blob:')) {
        URL.revokeObjectURL(adPreview);
      }
      if (thumbPreview && thumbPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbPreview);
      }
    };
  }, [adCreative.previewUrl, thumbnail.previewUrl]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Campaign Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" required />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">Campaign Category</label>
          <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" placeholder="e.g., Technology, Fashion, Health" required />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300">Ad Duration & Cost</label>
            <div className="mt-1 p-3 bg-gray-800 border border-gray-700 rounded-md h-full">
                {duration > 0 ? (
                    <div>
                        <p className="text-sm text-white">
                            Duration: <span className="font-bold">{duration} seconds</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Estimated Cost: <span className="font-semibold text-accent-500">{Math.round(campaignCost).toLocaleString()} PTS</span>
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm h-full flex items-center">Upload creative to see details.</p>
                )}
            </div>
        </div>
        
         <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300">Campaign Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as Campaign['type'])} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" required>
            <option value="Video">Video (16:9)</option>
            <option value="Shortz">Shortz (9:16)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="landingPageUrl" className="block text-sm font-medium text-gray-300">Landing Page URL</label>
          <input type="url" id="landingPageUrl" value={landingPageUrl} onChange={(e) => setLandingPageUrl(e.target.value)} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" placeholder="https://example.com/product" required />
        </div>
      </div>
      
      <hr className="border-gray-700" />

      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300">Upload Ad Creative</label>
           <Button type="button" variant="secondary" size="sm" onClick={() => setIsAiModalOpen(true)}>
              <SparklesIcon className="h-4 w-4" />
              Generate with AI
          </Button>
        </div>
        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
          <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-dark rounded-md font-medium text-primary-500 hover:text-primary-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-dark focus-within:ring-primary-500 px-1">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, MP4, WEBM up to 50MB</p>
          </div>
        </div>
      </div>

      {/* Creative Preview */}
      {adCreative.previewUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-300">Creative Preview</label>
          <div className={`mt-2 p-2 bg-dark rounded-lg flex items-center justify-center ${type === 'Shortz' ? 'aspect-[9/16] w-48 mx-auto' : 'aspect-video'}`}>
            {adCreative.type === 'video' ? (
                <video src={adCreative.previewUrl} controls className="max-h-full w-full rounded-md" />
            ) : (
                <img src={adCreative.previewUrl} alt="Ad creative preview" className="max-h-full w-full object-contain rounded-md" />
            )}
          </div>
        </div>
      )}
      
      {/* Thumbnail Upload (only for videos) */}
      {adCreative.type === 'video' && (
        <div>
          <label htmlFor="thumbnail-upload" className="block text-sm font-medium text-gray-300">Upload Thumbnail </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-40 h-24 bg-gray-800 border border-gray-700 rounded-md flex-shrink-0 flex items-center justify-center">
              {thumbnail.previewUrl ? 
                <img src={thumbnail.previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover rounded-md" />
                : <span className="text-xs text-gray-400">Preview</span>}
            </div>
            <label htmlFor="thumbnail-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                <span>{thumbnail.file ? 'Change Image' : 'Select Image'}</span>
                <input id="thumbnail-upload" name="thumbnail-upload" type="file" className="sr-only" onChange={handleThumbnailChange} accept="image/*" />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: a high-quality image with the same aspect ratio as your video.</p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={!adCreative.file}>
          Submit
        </Button>
      </div>
      <AiCreativeGenerator
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImageGenerated={handleImageGenerated}
        aspectRatio={type === 'Shortz' ? '9:16' : '16:9'}
      />
    </form>
  );
};

export default CreateCampaignForm;
