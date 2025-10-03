import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from './api';

const AdvertiserDashboard = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchDashboardData();
                setData(result);
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
            {/* Render data here */}
        </div>
    );
};

export default AdvertiserDashboard;