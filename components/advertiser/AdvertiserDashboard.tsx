import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Campaign, User } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import CreateCampaignForm from "./CreateCampaignForm";
import EditProfileModal from "./EditProfileModal";
import Spinner from "../ui/Spinner";
import ErrorDisplay from "../ui/ErrorDisplay";
import ActivityFeed from "./ActivityFeed";

interface AdvertiserDashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdated: (updatedData: Partial<User>) => void;
}

const AdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({
  user,
  onLogout,
  onUserUpdated,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------
  // FETCH advertiser’s campaigns
  // ---------------------------------------------------------
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("advertiser_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setCampaigns(data || []);
    setIsLoading(false);
  };

  // ---------------------------------------------------------
  // FETCH Live viewer activity (reward claims)
  // ---------------------------------------------------------
  const fetchActivity = async () => {
    const { data, error } = await supabase
      .from("ad_views")
      .select("*, profiles(username)")
      .in(
        "campaign_id",
        campaigns.map((c) => c.id)
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const formatted = data.map((row) => ({
        id: row.id,
        username: row.profiles?.username || "Viewer",
        timestamp: row.created_at,
        campaignId: row.campaign_id,
      }));

      setActivities(formatted);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user.id]);

  useEffect(() => {
    if (campaigns.length > 0) fetchActivity();
  }, [campaigns]);

  // ---------------------------------------------------------
  // CREATE NEW CAMPAIGN (files + metadata)
  // ---------------------------------------------------------
  const handleCreateCampaign = async (
    data: any,
    creativeFile: File,
    thumbFile: File | null
  ) => {
    setIsCreating(false);

    try {
      // upload creative file
      const creativePath = `${user.id}/${Date.now()}-${creativeFile.name}`;
      const { error: creativeError } = await supabase.storage
        .from("ads")
        .upload(creativePath, creativeFile);

      if (creativeError) throw creativeError;

      const creativeUrl = supabase.storage
        .from("ads")
        .getPublicUrl(creativePath).data.publicUrl;

      let thumbnailUrl = null;
      if (thumbFile) {
        const thumbPath = `${user.id}/thumb-${Date.now()}-${thumbFile.name}`;
        const { error: thumbErr } = await supabase.storage
          .from("ads")
          .upload(thumbPath, thumbFile);

        if (thumbErr) throw thumbErr;

        thumbnailUrl = supabase.storage
          .from("ads")
          .getPublicUrl(thumbPath).data.publicUrl;
      }

      // create campaign row
      const { error: createError } = await supabase.from("campaigns").insert({
        advertiser_id: user.id,
        name: data.name,
        budget: data.budget,
        reward: data.reward,
        campaign_goal: data.campaignGoal,
        cta_text: data.ctaText,
        landing_page_url: data.landingPageUrl,
        category: data.category,
        type: data.type,
        ad_creative_url: creativeUrl,
        thumbnail_url: thumbnailUrl,
        duration: data.duration,
        status: "Active",
      });

      if (createError) throw createError;

      alert("Campaign created successfully!");
      fetchCampaigns();
    } catch (err: any) {
      alert("Failed to create campaign: " + err.message);
    }
  };

  // ---------------------------------------------------------
  // UPDATE PROFILE
  // ---------------------------------------------------------
  const handleProfileUpdate = async ({
    username,
    logoFile,
    bannerFile,
  }: {
    username: string;
    logoFile?: File;
    bannerFile?: File;
  }) => {
    try {
      let logoUrl = user.logoUrl;
      let bannerUrl = user.bannerUrl;

      if (logoFile) {
        const path = `logos/${user.id}-${Date.now()}-${logoFile.name}`;
        await supabase.storage.from("profiles").upload(path, logoFile);
        logoUrl = supabase.storage.from("profiles").getPublicUrl(path).data.publicUrl;
      }

      if (bannerFile) {
        const path = `banners/${user.id}-${Date.now()}-${bannerFile.name}`;
        await supabase.storage.from("profiles").upload(path, bannerFile);
        bannerUrl = supabase.storage.from("profiles").getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          username,
          logo_url: logoUrl,
          banner_url: bannerUrl,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      onUserUpdated({
        username,
        logoUrl: logoUrl || undefined,
        bannerUrl: bannerUrl || undefined,
      });

      alert("Profile updated.");
      setEditProfile(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-dark min-h-screen text-white">
      {/* Header */}
      <header className="bg-charcoal/80 backdrop-blur-sm sticky top-0 z-40 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Advertiser Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setEditProfile(true)} variant="secondary">
            Edit Profile
          </Button>
          <Button onClick={() => setIsCreating(true)}>New Campaign</Button>
          <Button onClick={onLogout}>Logout</Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Campaigns</h2>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-12 w-12" />
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to load campaigns"
            message={error}
            onRetry={fetchCampaigns}
          />
        ) : campaigns.length === 0 ? (
          <p>No campaigns created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="bg-charcoal border border-gray-800 rounded-xl overflow-hidden shadow"
              >
                <div className="aspect-video bg-black">
                  <video
                    src={c.ad_creative_url}
                    controls
                    className="w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold">{c.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Budget: ₹{c.budget}
                  </p>
                  <p className="text-emerald-400 font-bold mt-2">
                    Reward per View: ₹{c.reward}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Live Viewer Activity</h2>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create a New Campaign"
      >
        <CreateCampaignForm
          onCampaignSubmit={handleCreateCampaign}
          onClose={() => setIsCreating(false)}
          company={{ name: user.username, logoUrl: user.logoUrl || "" }}
        />
      </Modal>

      <EditProfileModal
        isOpen={editProfile}
        onClose={() => setEditProfile(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default AdvertiserDashboard;
