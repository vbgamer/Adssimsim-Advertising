

export type View = 'landing' | 'advertiser' | 'viewer';
export type Role = 'advertiser' | 'viewer';
export type Gender = 'All' | 'Male' | 'Female' | 'Other';
export type UserGender = 'Male' | 'Female' | 'Other';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  gender?: UserGender;
  city?: string;
  state?: string;
  country?: string;
  // Fields for advertiser profile page
  subscribers?: number;
  bannerUrl?: string;
  logoUrl?: string;
  creditBalance?: number;
  // Fields for viewer
  rewardPoints?: number;
}

export interface Campaign {
  id:string;
  advertiser_id: string; // from DB
  name: string;
  budget: number;
  impressions: number;
  clicks: number;
  status: 'Active' | 'Paused' | 'Finished' | 'Pending' | 'Rejected' | 'Uploading' | 'Upload Failed';
  adCreativeUrl: string;
  thumbnailUrl?: string;
  reward: number;
  rewardedPoints?: number;
  campaignGoal: 'Brand Awareness' | 'Lead Generation' | 'Sales';
  ctaText: string;
  landingPageUrl: string;
  category: string;
  // Fix: Added optional 'discount' property to support discount coupon functionality
  // and resolve type errors in AdjustDiscountCouponModal.tsx.
  discount?: string;
  uploadError?: string;
  
  // New fields from mockups
  type: 'Video' | 'Shortz';
  company: {
      name: string;
      logoUrl: string;
      subscriberCount: number;
  };
  duration: number; // in seconds
}

export type WatchedAd = Campaign & { watchedOn: Date };