export const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
      <Icon className="w-12 h-12 opacity-20" style={{ color }} />
    </div>
  </div>
);
