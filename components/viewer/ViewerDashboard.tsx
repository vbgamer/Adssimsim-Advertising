// src/components/viewer/ViewerDashboard.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Campaign, User } from "../../types";
import Button from "../ui/Button";
import RewardAnimation from "../ui/RewardAnimation";

interface ViewerDashboardProps {
  user: User;
  onLogout: () => void;
  onRewardClaimed?: () => void;
}

const ViewerDashboard: React.FC<ViewerDashboardProps> = ({
  user,
  onLogout,
  onRewardClaimed,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rewardAnimation, setRewardAnimation] = useState<null | number>(null);
  const [couponPopup, setCouponPopup] = useState<null | string>(null);
  const [wallet, setWallet] = useState(user.cashWallet || 0);

  // ----------------------------
  // Fetch ACTIVE campaigns
  // ----------------------------
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (!error && data) setCampaigns(data);
      setIsLoading(false);
    };

    fetchCampaigns();
  }, []);

  // ----------------------------
  // CLAIM REWARD via RPC
  // ----------------------------
  const handleWatchAd = async (campaign: Campaign) => {
    try {
      const { data, error } = await supabase.rpc("claim_reward", {
        user_id: user.id,
        campaign_id: campaign.id,
      });

      if (error) throw error;

      // Handle reward type
      if (data.reward_type === "cash") {
        setRewardAnimation(data.reward_amount); // triggers animation
        setWallet((prev) => prev + data.reward_amount);
      }

      if (data.reward_type === "coupon") {
        setCouponPopup(data.coupon_code); // show coupon modal
      }

      if (onRewardClaimed) onRewardClaimed();
    } catch (err: any) {
      alert(err.message || "Failed to claim reward.");
    }
  };

  // ----------------------------
  // WITHDRAW MONEY
  // ----------------------------
  const handleWithdraw = async () => {
    if (wallet < 15) {
      alert("Minimum ₹15 required to withdraw.");
      return;
    }

    const { data, error } = await supabase.rpc("request_withdrawal", {
      user_id: user.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Withdrawal request submitted.");
    setWallet((prev) => prev - 15);
  };

  return (
    <div className="bg-dark min-h-screen text-white">
      {/* Reward Animation */}
      {rewardAnimation !== null && (
        <RewardAnimation
          amount={rewardAnimation}
          onAnimationEnd={() => setRewardAnimation(null)}
        />
      )}

      {/* Coupon Popup */}
      {couponPopup && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-center items-center">
          <div className="bg-white text-black p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-3">🎉 You've Won a Coupon!</h2>
            <p className="text-xl font-mono bg-gray-200 px-4 py-2 rounded-lg">
              {couponPopup}
            </p>
            <Button onClick={() => setCouponPopup(null)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-charcoal/80 backdrop-blur-sm sticky top-0 z-40 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Viewer Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 px-4 py-2 rounded-lg font-bold">
            Wallet: ₹{wallet.toFixed(2)}
          </div>
          <Button onClick={handleWithdraw} variant="secondary">
            Withdraw
          </Button>
          <Button onClick={onLogout}>Logout</Button>
        </div>
      </header>

      {/* Campaigns */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Watch Ads & Earn Rewards</h2>

        {isLoading ? (
          <p>Loading ads...</p>
        ) : campaigns.length === 0 ? (
          <p>No active campaigns available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-charcoal border border-gray-800 rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
              >
                <div className="aspect-video bg-black">
                  <video
                    src={campaign.ad_creative_url}
                    controls
                    className="w-full h-full"
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold">{campaign.name}</h3>

                  <p className="text-accent-500 font-bold mt-2">
                    Earn: ₹{campaign.reward}
                  </p>

                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleWatchAd(campaign)}
                  >
                    Claim Reward
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerDashboard;
