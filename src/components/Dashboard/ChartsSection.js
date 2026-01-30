import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { STATUS_COLORS } from '../../utils/constants';

export const ChartsSection = ({ data }) => {
  if (!data) return null;

  const pieData = [
    { name: 'Success', value: data.success, color: STATUS_COLORS.success },
    { name: 'Failed', value: data.failed, color: STATUS_COLORS.failed },
    { name: 'Running', value: data.running, color: STATUS_COLORS.running },
    { name: 'Created', value: data.created, color: STATUS_COLORS.created },
    { name: 'Blocked', value: data.blocked, color: STATUS_COLORS.blocked },
    { name: 'Skipped', value: data.skipped, color: STATUS_COLORS.skipped }
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Deployment Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="success" stroke={STATUS_COLORS.success} strokeWidth={2} name="Success" />
            <Line type="monotone" dataKey="failed" stroke={STATUS_COLORS.failed} strokeWidth={2} name="Failed" />
            <Line type="monotone" dataKey="running" stroke={STATUS_COLORS.running} strokeWidth={2} name="Running" />
            <Line type="monotone" dataKey="created" stroke={STATUS_COLORS.created} strokeWidth={2} name="Created" />
            <Line type="monotone" dataKey="blocked" stroke={STATUS_COLORS.blocked} strokeWidth={2} name="Blocked" />
            <Line type="monotone" dataKey="skipped" stroke={STATUS_COLORS.skipped} strokeWidth={2} name="Skipped" />
            <Line type="monotone" dataKey="total" stroke={STATUS_COLORS.total} strokeWidth={2} name="Total" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="success" fill={STATUS_COLORS.success} name="Success" />
            <Bar dataKey="failed" fill={STATUS_COLORS.failed} name="Failed" />
            <Bar dataKey="running" fill={STATUS_COLORS.running} name="Running" />
            <Bar dataKey="created" fill={STATUS_COLORS.created} name="Created" />
            <Bar dataKey="blocked" fill={STATUS_COLORS.blocked} name="Blocked" />
            <Bar dataKey="skipped" fill={STATUS_COLORS.skipped} name="Skipped" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
