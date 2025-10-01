import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { Campaign } from '../../types';

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

const CreateCampaignForm: React.FC<CreateCampaignFormProps> = ({ onCampaignSubmit, onClose, company }) => {
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(30);
  const [campaignGoal, setCampaignGoal] = useState<Campaign['campaignGoal']>('Brand Awareness');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [type, setType] = useState<Campaign['type']>('Video');

  // Creative handling
  const [adCreative, setAdCreative] = useState<{ file: File | null; previewUrl: string | null; type: 'image' | 'video' | null }>({ file: null, previewUrl: null, type: null });
  const [thumbnail, setThumbnail] = useState<{ file: File | null; previewUrl: string | null }>({ file: null, previewUrl: null });
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [campaignCost, setCampaignCost] = useState(0);

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

      // If it's an image, we don't need a separate thumbnail. Clear any existing one.
      if (!isVideo) {
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
      budget: campaignCost,
      reward: 10, // Default reward
      adCreativeUrl: '', // This will be replaced by parent after upload
      campaignGoal,
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
          <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Ad Duration (seconds)</label>
          <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" required />
          <p className="text-xs text-gray-500 mt-1">Estimated Cost: <span className="font-semibold text-accent-500">{campaignCost.toLocaleString()} PTS</span></p>
        </div>
        
        <div>
          <label htmlFor="campaignGoal" className="block text-sm font-medium text-gray-300">Campaign Goal</label>
          <select id="campaignGoal" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value as Campaign['campaignGoal'])} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200" required>
            <option>Brand Awareness</option>
            <option>Lead Generation</option>
            <option>Sales</option>
          </select>
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
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300">Upload Ad Creative (Video or Image)</label>
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
          <label htmlFor="thumbnail-upload" className="block text-sm font-medium text-gray-300">Upload Thumbnail (Required)</label>
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
          Submit for Review
        </Button>
      </div>
    </form>
  );
};

export default CreateCampaignForm;
