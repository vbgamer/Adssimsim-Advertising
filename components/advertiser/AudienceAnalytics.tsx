import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import BarGraph from '../ui/BarGraph';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface DemographicData {
  gender: { label: string; value: number }[];
  country: { label: string; value: number }[];
}

const AudienceAnalytics: React.FC = () => {
  const [data, setData] = useState<DemographicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemographics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_audience_demographics');

        if (rpcError) throw rpcError;

        if (rpcData) {
          const genderCounts = rpcData.gender || {};
          const countryCounts = rpcData.country || {};

          const formatData = (counts: { [key: string]: number }, limit?: number) => {
            let sorted = Object.entries(counts)
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value);

            if (limit) {
                sorted = sorted.slice(0, limit);
            }
            return sorted;
          };

          setData({
            gender: formatData(genderCounts),
            country: formatData(countryCounts, 5), // Show top 5 for countries
          });
        }
      } catch (err: any) {
        // This block makes error handling more robust to prevent showing '[object Object]'.
        let coreMessage: string;
        if (typeof err === 'string') {
          coreMessage = err;
        } else if (err && typeof err.message === 'string') {
          coreMessage = err.message;
        } else {
          // Fallback for non-standard errors or errors where '.message' is not a string.
          try {
            coreMessage = JSON.stringify(err);
          } catch {
            coreMessage = 'An un-serializable error object was caught.';
          }
        }

        let detailedError: string;

        if (coreMessage.includes('column "gender" does not exist') || coreMessage.includes('column "country" does not exist')) {
            detailedError = "Database Schema Mismatch:\nYour 'profiles' table is missing required columns for analytics.\n\nTo fix this, please run the following SQL command in your Supabase project's SQL Editor:\n\nALTER TABLE public.profiles\nADD COLUMN IF NOT EXISTS gender TEXT,\nADD COLUMN IF NOT EXISTS city TEXT,\nADD COLUMN IF NOT EXISTS state TEXT,\nADD COLUMN IF NOT EXISTS country TEXT;";
        } else if (coreMessage.includes('function get_audience_demographics does not exist')) {
            detailedError = "An error occurred while loading analytics.\n\nThe required database function is missing. Please run the setup script provided in the instructions in your Supabase SQL Editor to fix this.";
        } else {
            detailedError = `An error occurred while loading analytics.\n\nDetails: ${coreMessage}\n\nPlease check your Supabase project's logs for more information.`;
        }
        
        setError(detailedError);
        console.error("Audience Analytics Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemographics();
  }, []);

  if (isLoading) {
    return (
      <Card className="flex justify-center items-center p-8 h-64">
        <Spinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-900/20">
        <h4 className="font-semibold text-red-400">Error Loading Analytics</h4>
        <p className="text-red-300/80 text-sm mt-2 whitespace-pre-wrap">{error}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {data?.gender && data.gender.length > 0 && <BarGraph title="Gender Distribution" data={data.gender} />}
      {data?.country && data.country.length > 0 && <BarGraph title="Top 5 Countries" data={data.country} />}
      {(!data?.gender || data.gender.length === 0) && (!data?.country || data.country.length === 0) && (
        <div className="lg:col-span-2">
           <Card className="p-6">
             <p className="text-center text-slate-400">No audience demographic data available yet.</p>
           </Card>
        </div>
      )}
    </div>
  );
};

export default AudienceAnalytics;