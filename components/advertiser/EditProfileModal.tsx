

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdate: (updatedData: { username: string; logoFile?: File; bannerFile?: File }) => Promise<void>;
}

const ImageUploadField: React.FC<{
    label: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    children: React.ReactNode;
    className?: string;
}> = ({ label, onFileChange, children, className = '' }) => {
    const id = `upload-${label.toLowerCase().replace(/\s/g, '-')}`;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className={`relative group bg-gray-800 ${className}`}>
                {children}
                <label htmlFor={id} className="absolute inset-0 bg-dark/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                    <span className="text-sm font-semibold">Change</span>
                </label>
                <input id={id} type="file" className="sr-only" onChange={onFileChange} accept="image/*" />
            </div>
        </div>
    );
};


const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onProfileUpdate }) => {
    const [username, setUsername] = useState(user.username);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens or user changes
    useEffect(() => {
        if (isOpen) {
            setUsername(user.username);
            setLogoFile(null);
            setBannerFile(null);
            setLogoPreview(null);
            setBannerPreview(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen, user]);

    // Cleanup object URLs on unmount or when new previews are created
    useEffect(() => {
        const prevLogo = logoPreview;
        const prevBanner = bannerPreview;
        return () => {
            if (prevLogo) URL.revokeObjectURL(prevLogo);
            if (prevBanner) URL.revokeObjectURL(prevBanner);
        };
    }, [logoPreview, bannerPreview]);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: React.Dispatch<React.SetStateAction<File | null>>,
        setPreview: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, setLogoFile, setLogoPreview);
    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, setBannerFile, setBannerPreview);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onProfileUpdate({
                username,
                logoFile: logoFile || undefined,
                bannerFile: bannerFile || undefined,
            });
            // Parent will close modal on success
        } catch (err: any) {
            if (err.message && err.message.includes('violates row-level security policy')) {
                setError(
`Database Security Error: Your action was blocked by the database's security rules.

This means the necessary permissions (Row Level Security policies) are missing for your user. Please check your Supabase dashboard and ensure policies exist to allow authenticated users to UPDATE their own 'profiles' and INSERT/UPDATE objects in the 'campaign_creatives' storage bucket.`
                );
            } else {
                setError(err.message || 'Failed to update profile.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email (Login)</label>
                    <input
                        type="email"
                        id="email"
                        value={user.email}
                        readOnly
                        className="mt-1 block w-full bg-dark/50 border border-gray-800 rounded-md shadow-sm py-2 px-3 text-gray-400 cursor-not-allowed"
                        aria-describedby="email-description"
                    />
                    <p id="email-description" className="mt-2 text-xs text-gray-500">Your email is used for logging in and cannot be changed.</p>
                </div>

                <div className="flex items-center gap-6">
                     <ImageUploadField label="Logo" onFileChange={handleLogoChange} className="h-24 w-24 rounded-full flex-shrink-0">
                         <img src={logoPreview || user.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=2E7D32&color=fff&size=128`} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
                    </ImageUploadField>
                    <div className="flex-grow">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300">Company Name</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                    <div className="relative group bg-gray-800 h-40 rounded-lg">
                        {bannerPreview || user.bannerUrl ? (
                            <img src={bannerPreview || user.bannerUrl!} alt="Company Banner" className="h-full w-full object-cover rounded-lg" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                               <span>No banner image. Click to upload.</span>
                            </div>
                        )}
                         <label htmlFor="banner-upload" className="absolute inset-0 bg-dark/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-lg">
                            <span className="text-sm font-semibold">Change Banner</span>
                        </label>
                        <input id="banner-upload" type="file" className="sr-only" onChange={handleBannerChange} accept="image/*" />
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm text-left bg-red-900/20 p-3 rounded-md whitespace-pre-wrap">{error}</p>}

                <div className="flex justify-end pt-4 gap-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;