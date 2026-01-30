import { useState, useEffect } from 'react';
import { testConnection, fetchDeployments } from '../api/gitlabApi';
import { DEPLOYMENT_STATUSES, AUTO_REFRESH_INTERVAL } from '../utils/constants';
import { getDateFromString } from '../utils/dateUtils';

const processDeploymentData = (allDeployments) => {
  const total = allDeployments.length;
  const running = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.RUNNING).length;
  const success = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.SUCCESS).length;
  const failed = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.FAILED).length;
  const created = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.CREATED).length;
  const blocked = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.BLOCKED).length;
  const skipped = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.SKIPPED).length;

  const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
  const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

  // Group by date untuk chart
  const dailyStats = {};
  allDeployments.forEach(deployment => {
    const date = getDateFromString(deployment.created_at);
    if (!dailyStats[date]) {
      dailyStats[date] = { date, success: 0, failed: 0, total: 0 };
    }
    dailyStats[date].total++;
    if (deployment.status === DEPLOYMENT_STATUSES.SUCCESS) dailyStats[date].success++;
    if (deployment.status === DEPLOYMENT_STATUSES.FAILED) dailyStats[date].failed++;
  });

  const chartData = Object.values(dailyStats).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Extract failed pipeline details
  const failedPipelines = allDeployments
    .filter(deployment => deployment.status === DEPLOYMENT_STATUSES.FAILED)
    .map(deployment => ({
      id: deployment.id,
      iid: deployment.iid,
      status: deployment.status,
      createdAt: deployment.created_at,
      updatedAt: deployment.updated_at,
      ref: deployment.ref,
      sha: deployment.sha?.substring(0, 8) || 'N/A',
      pipelineJobUrl: deployment.deployable ? `https://git.neuron.id/${encodeURIComponent('group/project')}/-/jobs/${deployment.deployable.id}` : null
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
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
  };
};

export const useGitLabAnalytics = (config, selectedEnvironment, dateRange) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    if (!config.token) {
      setError('Please enter your GitLab Personal Access Token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test connection first
      const project = await testConnection(config);
      console.log('Connected to project:', project.name);

      // Fetch all deployments
      const allDeployments = await fetchDeployments(config, selectedEnvironment, dateRange);

      const processedData = processDeploymentData(allDeployments);
      
      // Update pipelineJobUrl with correct config
      processedData.failedPipelines = processedData.failedPipelines.map(p => ({
        ...p,
        pipelineJobUrl: p.pipelineJobUrl ? `${config.gitlabUrl}/${config.projectPath}/-/jobs/${p.id}` : null
      }));

      setData(processedData);
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

  // Auto-refresh
  useEffect(() => {
    if (config.token) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, AUTO_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvironment, dateRange, config.token]);

  return {
    loading,
    error,
    data,
    fetchAnalytics
  };
};
