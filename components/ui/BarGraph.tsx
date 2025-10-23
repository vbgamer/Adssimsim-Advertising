
import React from 'react';

interface BarGraphProps {
  title: string;
  data: { label: string; value: number }[];
}

const BarGraph: React.FC<BarGraphProps> = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-charcoal/50 p-4 rounded-lg">
      <h4 className="text-md font-semibold text-white mb-4">{title}</h4>
      <div className="space-y-3">
        {data.length > 0 ? data.map(({ label, value }) => {
          const percentage = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={label} className="flex items-center gap-4 text-sm">
              <span className="w-24 truncate text-gray-300 capitalize">{label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-primary-500 h-4 rounded-full"
                  style={{ width: `${percentage}%` }}
                >
                </div>
              </div>
              <span className="w-24 text-right font-semibold text-white">{value.toLocaleString()} ({Math.round(percentage)}%)</span>
            </div>
          );
        }) : <p className="text-gray-500 text-sm">No data available.</p>}
      </div>
    </div>
  );
};

export default BarGraph;