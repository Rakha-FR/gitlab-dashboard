import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';

const GitLabDashboard = () => {
  const [config, setConfig] = useState({
    gitlabUrl: '',
    token: '',
    projectPath: ''
  });
  
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [environments] = useState(['production', 'staging', 'development', 'pre-production']);

  // Test connection ke GitLab
  const testConnection = async () => {
    if (!config.token) {
      setError('Please enter your GitLab Personal Access Token');
      return false;
    }

    try {
      const projectId = config.projectPath
	  .split('/')
	  .map(part => encodeURIComponent(part))
	  .join('%2F');
      const response = await fetch(
        `${config.gitlabUrl}/api/v4/projects/${projectId}`,
        { 
          headers: { 
            'PRIVATE-TOKEN': config.token,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid token or token does not have required permissions (need: read_api)');
        } else if (response.status === 404) {
          throw new Error('Project not found. Check your project path format (e.g., "coc/tl-3/back-end")');
        } else {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const project = await response.json();
      return project;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('CORS Error: Cannot connect to GitLab API. This might be due to browser security restrictions. Try using a CORS proxy or GitLab API from a backend server.');
      }
      throw err;
    }
  };

  // Fetch data dari GitLab API
  const fetchAnalytics = async () => {
    if (!config.token) {
      setError('Please enter your GitLab Personal Access Token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test connection first
      const project = await testConnection();
      console.log('Connected to project:', project.name);

      const projectId = encodeURIComponent(config.projectPath);
      const headers = { 
        'PRIVATE-TOKEN': config.token,
        'Content-Type': 'application/json'
      };
      
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - dateRange);
      const dateFromStr = dateFrom.toISOString().split('T')[0];

      // Fetch all deployments
      const allResponse = await fetch(
        `${config.gitlabUrl}/api/v4/projects/${projectId}/deployments?environment=${selectedEnvironment}&per_page=250&updated_after=${dateFromStr}&order_by=updated_at&sort=desc`,
        { 
          headers,
          mode: 'cors'
        }
      );

      if (!allResponse.ok) {
        if (allResponse.status === 404) {
          throw new Error(`No deployments found for environment "${selectedEnvironment}". Make sure the environment exists in your project.`);
        }
        throw new Error(`API Error: ${allResponse.status} - ${allResponse.statusText}`);
      }

      const allDeployments = await allResponse.json();

      // Fetch running deployments
      const runningResponse = await fetch(
        `${config.gitlabUrl}/api/v4/projects/${projectId}/deployments?environment=${selectedEnvironment}&status=running&per_page=250&updated_after=${dateFromStr}&order_by=updated_at&sort=desc`,
        { headers, mode: 'cors' }
      );
      const runningDeployments = await runningResponse.json();

      // Fetch successful deployments
      const successResponse = await fetch(
        `${config.gitlabUrl}/api/v4/projects/${projectId}/deployments?environment=${selectedEnvironment}&status=success&per_page=250&updated_after=${dateFromStr}&order_by=updated_at&sort=desc`,
        { headers, mode: 'cors' }
      );
      const successDeployments = await successResponse.json();

      // Fetch failed deployments
      const failedResponse = await fetch(
        `${config.gitlabUrl}/api/v4/projects/${projectId}/deployments?environment=${selectedEnvironment}&status=failed&per_page=250&updated_after=${dateFromStr}&order_by=updated_at&sort=desc`,
        { headers, mode: 'cors' }
      );
      const failedDeployments = await failedResponse.json();

      // Hitung berdasarkan allDeployments untuk akurasi total
      const total = allDeployments.length;
      const running = allDeployments.filter(d => d.status === 'running').length;
      const success = allDeployments.filter(d => d.status === 'success').length;
      const failed = allDeployments.filter(d => d.status === 'failed').length;
      const created = allDeployments.filter(d => d.status === 'created').length;
      const blocked = allDeployments.filter(d => d.status === 'blocked').length;
      const skipped = allDeployments.filter(d => d.status === 'skipped').length;

      const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
      const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

      // Group by date untuk chart
      const dailyStats = {};
      allDeployments.forEach(deployment => {
        const date = deployment.created_at.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { date, success: 0, failed: 0, total: 0 };
        }
        dailyStats[date].total++;
        if (deployment.status === 'success') dailyStats[date].success++;
        if (deployment.status === 'failed') dailyStats[date].failed++;
      });

      const chartData = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      // Extract failed pipeline details
      const failedPipelines = allDeployments
        .filter(deployment => deployment.status === 'failed')
        .map(deployment => ({
          id: deployment.id,
          iid: deployment.iid,
          status: deployment.status,
          createdAt: deployment.created_at,
          updatedAt: deployment.updated_at,
          ref: deployment.ref,
          sha: deployment.sha?.substring(0, 8) || 'N/A',
          pipelineJobUrl: deployment.deployable ? `${config.gitlabUrl}/${config.projectPath}/-/jobs/${deployment.deployable.id}` : null
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setData({
        total,
        running,
        success,
        failed,
        created,
        blocked,
        skipped,
        successRate,
        failureRate,
        chartData,
        failedPipelines,
        lastUpdated: new Date().toLocaleString()
      });

    } catch (err) {
      console.error('Fetch error:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('CORS Error: Cannot connect to GitLab API directly from browser. Please see solutions below.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setiap 5 menit
  useEffect(() => {
    if (config.token) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvironment, dateRange, config.token]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
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

  const pieData = data ? [
    { name: 'Success', value: data.success, color: '#10b981' },
    { name: 'Failed', value: data.failed, color: '#ef4444' },
    { name: 'Running', value: data.running, color: '#3b82f6' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
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
                {environments.map(env => (
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
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
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

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <strong>Error:</strong>
              </div>
              <p className="text-red-700 mb-3">{error}</p>
              
              {error.includes('CORS') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <p className="font-semibold text-yellow-800 mb-2">Solusi untuk CORS Error:</p>
                  <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-2">
                    <li>
                      <strong>Gunakan Browser Extension:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Chrome: "Allow CORS: Access-Control-Allow-Origin"</li>
                        <li>Firefox: "CORS Everywhere"</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Akses GitLab dari Server Backend</strong> (Recommended)
                    </li>
                    <li>
                      <strong>Cek GitLab CORS Settings:</strong> Admin Area → Settings → Network → CORS
                    </li>
                    <li>
                      <strong>Test dengan curl:</strong>
                      <pre className="bg-gray-800 text-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`curl --header "PRIVATE-TOKEN: your-token" \\
"${config.gitlabUrl}/api/v4/projects/${encodeURIComponent(config.projectPath)}"`}
                      </pre>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Deployments"
                value={data.total}
                icon={Activity}
                color="#6366f1"
                subtitle={`Last ${dateRange} days`}
              />
              <StatCard
                title="Running Pipelines"
                value={data.running}
                icon={Clock}
                color="#3b82f6"
                subtitle="Currently executing"
              />
              <StatCard
                title="Success Rate"
                value={`${data.successRate}%`}
                icon={TrendingUp}
                color="#10b981"
                subtitle={`${data.success} successful`}
              />
              <StatCard
                title="Failed Pipelines"
                value={data.failed}
                icon={AlertCircle}
                color="#ef4444"
                subtitle={`${data.failureRate}% failure rate`}
              />
              <StatCard
                title="Created"
                value={data.created}
                icon={Activity}
                color="#f59e0b"
                subtitle="Awaiting execution"
              />
              <StatCard
                title="Blocked"
                value={data.blocked}
                icon={AlertCircle}
                color="#8b5cf6"
                subtitle="Manual approval needed"
              />
              <StatCard
                title="Skipped"
                value={data.skipped}
                icon={Clock}
                color="#6b7280"
                subtitle="Not executed"
              />
            </div>

            {/* Charts */}
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
                    <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" />
                    <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" />
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
                    <Bar dataKey="success" fill="#10b981" name="Success" />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Failed Pipelines List */}
              {data.failedPipelines && data.failedPipelines.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Failed Pipelines ({data.failedPipelines.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Ref</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Commit</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.failedPipelines.map((pipeline, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-700">{new Date(pipeline.createdAt).toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-700">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {pipeline.ref}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-700 font-mono text-xs">{pipeline.sha}</td>
                            <td className="py-3 px-4">
                              <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                {pipeline.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {pipeline.pipelineJobUrl && (
                                  <a
                                    href={pipeline.pipelineJobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    View Error
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Info Footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Cara Menggunakan:</strong>
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
            <li>Masukkan GitLab Personal Access Token Anda (dengan scope 'read_api')</li>
            <li>Masukkan project path (format: group/subgroup/project)</li>
            <li>Pilih environment yang ingin di-monitor</li>
            <li>Pilih rentang waktu dan klik "Refresh Data"</li>
          </ol>
          <p className="text-xs text-blue-600 mt-3">
            Token Anda disimpan hanya di browser dan tidak dikirim ke server manapun kecuali GitLab instance Anda.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GitLabDashboard;
