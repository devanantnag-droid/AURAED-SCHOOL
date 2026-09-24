import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TrendPoint } from '@/services/analytics.service';

interface Props {
  title: string;
  data: TrendPoint[];
  type?: 'line' | 'bar';
  valueSuffix?: string;
  valuePrefix?: string;
}

export function TrendChartCard({ title, data, type = 'line', valueSuffix = '', valuePrefix = '' }: Props) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-primary-900 dark:text-gray-50">{title}</h3>
      {!hasData ? (
        <p className="py-8 text-center text-xs text-gray-400">Not enough data yet to show a trend.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8A8578' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#8A8578' }} />
              <Tooltip
                formatter={(value: number) => [`${valuePrefix}${value}${valueSuffix}`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E0D6' }}
              />
              <Line type="monotone" dataKey="value" stroke="#B8863E" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8A8578' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8A8578' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E0D6' }} />
              <Bar dataKey="value" fill="#24344D" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
