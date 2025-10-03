import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const AdvertiserDashboard = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Example Supabase query: fetch all campaigns for the advertiser
                const { data: campaigns, error: supabaseError } = await supabase
                  .from('campaigns')
                  .select('*');
                if (supabaseError) throw supabaseError;
                setData(campaigns);
            } catch (err) {
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Advertiser Dashboard</h1>
            {/* Render campaigns or fallback */}
            {data && Array.isArray(data) ? (
                <ul>
                    {data.map((campaign) => (
                        <li key={campaign.id}>{campaign.name || "Unnamed Campaign"}</li>
                    ))}
                </ul>
            ) : (
                <div>No campaigns found.</div>
            )}
        </div>
    );
};

export default AdvertiserDashboard;
