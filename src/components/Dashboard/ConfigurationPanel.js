import { ENVIRONMENTS, DATE_RANGES } from '../../utils/constants';
import { RefreshCw } from 'lucide-react';

export const ConfigurationPanel = ({
  config,
  setConfig,
  selectedEnvironment,
  setSelectedEnvironment,
  dateRange,
  setDateRange,
  loading,
  fetchAnalytics,
  data
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            {/* Activity icon will be imported in parent */}
            GitLab CI/CD Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Monitor pipeline performance across environments</p>
        </div>
        {data && (
          <div className="text-right text-sm text-gray-500">
            Last updated: {data.lastUpdated}
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitLab URL</label>
          <input
            type="text"
            value={config.gitlabUrl}
            onChange={(e) => setConfig({...config, gitlabUrl: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://git.neuron.id"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig({...config, token: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your GitLab token"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Path</label>
          <input
            type="text"
            value={config.projectPath}
            onChange={(e) => setConfig({...config, projectPath: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="group/project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ENVIRONMENTS.map(env => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {DATE_RANGES.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};
