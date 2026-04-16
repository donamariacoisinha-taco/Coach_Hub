
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressChartProps {
  data: any[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Formata a data para exibição curta se necessário
      displayDate: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded-2xl">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sem dados suficientes</p>
      </div>
    );
  }

  return (
    <div className="w-full h-40 -ml-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis 
            dataKey="displayDate" 
            hide 
          />
          <YAxis 
            hide 
            domain={['dataMin - 5', 'dataMax + 5']} 
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
            labelStyle={{ display: 'none' }}
          />
          <Line
            type="monotone"
            dataKey="max_weight"
            stroke="#000"
            strokeWidth={3}
            dot={{ r: 4, fill: '#000', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#000', strokeWidth: 0 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
