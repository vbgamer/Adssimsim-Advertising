import React, { useState } from "react";
import Button from "../ui/Button";

interface Props {
  onCampaignSubmit: (
    data: any,
    creativeFile: File,
    thumbnailFile: File | null
  ) => void;
  onClose: () => void;
  company: { name: string; logoUrl: string };
}

const CreateCampaignForm: React.FC<Props> = ({
  onCampaignSubmit,
  onClose,
  company,
}) => {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [reward, setReward] = useState("");
  const [duration, setDuration] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [type, setType] = useState("Video");

  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creativeFile) {
      alert("Please upload an ad video/image file.");
      return;
    }

    onCampaignSubmit(
      {
        name,
        budget: Number(budget),
        reward: Number(reward),
        duration: Number(duration),
        ctaText,
        landingPageUrl,
        category,
        type,
        company,
      },
      creativeFile,
      thumbnailFile
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Campaign Name */}
      <div>
        <label className="block text-sm text-gray-300">Campaign Name</label>
        <input
          type="text"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm text-gray-300">Budget (₹)</label>
        <input
          type="number"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
        />
      </div>

      {/* Reward */}
      <div>
        <label className="block text-sm text-gray-300">
          Reward per View (₹)
        </label>
        <input
          type="number"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          required
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm text-gray-300">Duration (seconds)</label>
        <input
          type="number"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        />
      </div>

      {/* CTA Text */}
      <div>
        <label className="block text-sm text-gray-300">CTA Text</label>
        <input
          type="text"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
        />
      </div>

      {/* Landing Page URL */}
      <div>
        <label className="block text-sm text-gray-300">Landing Page URL</label>
        <input
          type="url"
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={landingPageUrl}
          onChange={(e) => setLandingPageUrl(e.target.value)}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-gray-300">Category</label>
        <select
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>General</option>
          <option>Technology</option>
          <option>Fashion</option>
          <option>Food</option>
          <option>Travel</option>
          <option>Finance</option>
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm text-gray-300">Ad Type</label>
        <select
          className="w-full bg-gray-800 text-white p-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="Video">Video</option>
          <option value="Image">Image</option>
        </select>
      </div>

      {/* Upload Creative File */}
      <div>
        <label className="block text-sm text-gray-300">
          Upload Ad Creative
        </label>
        <input
          type="file"
          accept="video/*,image/*"
          className="w-full text-gray-300"
          onChange={(e) => {
            if (e.target.files) setCreativeFile(e.target.files[0]);
          }}
          required
        />
      </div>

      {/* Upload Thumbnail (Optional) */}
      <div>
        <label className="block text-sm text-gray-300">
          Thumbnail (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-gray-300"
          onChange={(e) => {
            if (e.target.files) setThumbnailFile(e.target.files[0]);
          }}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button onClick={onClose} variant="secondary" type="button">
          Cancel
        </Button>
        <Button type="submit">Create Campaign</Button>
      </div>
    </form>
  );
};

export default CreateCampaignForm;
