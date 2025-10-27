

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Campaign } from '../../types';

interface AdjustDiscountCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSave: (campaignId: string, newDiscount: string | null) => Promise<void>;
}

const ToggleSwitch: React.FC<{ isEnabled: boolean; onChange: (enabled: boolean) => void }> = ({ isEnabled, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        onClick={() => onChange(!isEnabled)}
        className={`${
            isEnabled ? 'bg-primary-500' : 'bg-gray-700'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-charcoal`}
    >
        <span
            aria-hidden="true"
            className={`${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const AdjustDiscountCouponModal: React.FC<AdjustDiscountCouponModalProps> = ({ isOpen, onClose, campaign, onSave }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (campaign) {
            // A non-empty string is considered "on"
            setIsEnabled(!!campaign.discount);
            setDiscountCode(campaign.discount || '');
        } else {
            // Reset when no campaign is selected
            setIsEnabled(false);
            setDiscountCode('');
        }
        setError(null);
        setIsLoading(false);
    }, [campaign, isOpen]);

    const handleSave = async () => {
        if (!campaign) return;
        
        if (isEnabled && !discountCode.trim()) {
            setError('Please enter a discount code or disable the coupon.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const newDiscountValue = isEnabled ? discountCode.trim() : null;

        try {
            await onSave(campaign.id, newDiscountValue);
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const modalTitle = campaign ? `Adjust Discount for "${campaign.name}"` : 'Adjust Discount';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-charcoal/50 rounded-lg">
                    <div>
                        <h4 className="font-semibold text-white">Enable Discount Coupon</h4>
                        <p className="text-sm text-gray-400">If enabled, viewers will see this coupon code.</p>
                    </div>
                    <ToggleSwitch isEnabled={isEnabled} onChange={setIsEnabled} />
                </div>

                <div className={`transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                    <label htmlFor="discount-code" className="block text-sm font-medium text-gray-300">
                        Discount Code
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            id="discount-code"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="e.g., SAVE20, SUMMERDEAL"
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            disabled={!isEnabled || isLoading}
                        />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                
                <div className="flex justify-end pt-4 gap-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} isLoading={isLoading}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AdjustDiscountCouponModal;