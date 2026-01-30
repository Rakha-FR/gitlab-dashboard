import { useState, useEffect } from 'react';
import { testConnection, fetchDeployments, fetchPipelines } from '../api/gitlabApi';
import { DEPLOYMENT_STATUSES, AUTO_REFRESH_INTERVAL } from '../utils/constants';
import { getDateFromString } from '../utils/dateUtils';

const processDeploymentData = (allDeployments, deploymentPipelines = []) => {
  const total = allDeployments.length;
  const running = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.RUNNING).length;
  const success = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.SUCCESS).length;
  const failed = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.FAILED).length;
  const created = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.CREATED).length;
  const blocked = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.BLOCKED).length;
  const skipped = allDeployments.filter(d => d.status === DEPLOYMENT_STATUSES.SKIPPED).length;

  const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
  const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

  // Group by date untuk chart dengan semua statuses
  const dailyStats = {};
  allDeployments.forEach(deployment => {
    const date = getDateFromString(deployment.created_at);
    if (!dailyStats[date]) {
      dailyStats[date] = { 
        date, 
        success: 0, 
        failed: 0, 
        running: 0,
        created: 0,
        blocked: 0,
        skipped: 0,
        total: 0 
      };
    }
    dailyStats[date].total++;
    if (deployment.status === DEPLOYMENT_STATUSES.SUCCESS) dailyStats[date].success++;
    if (deployment.status === DEPLOYMENT_STATUSES.FAILED) dailyStats[date].failed++;
    if (deployment.status === DEPLOYMENT_STATUSES.RUNNING) dailyStats[date].running++;
    if (deployment.status === DEPLOYMENT_STATUSES.CREATED) dailyStats[date].created++;
    if (deployment.status === DEPLOYMENT_STATUSES.BLOCKED) dailyStats[date].blocked++;
    if (deployment.status === DEPLOYMENT_STATUSES.SKIPPED) dailyStats[date].skipped++;
  });

  const chartData = Object.values(dailyStats).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Extract failed pipeline details
  // Create a map of sha -> latest pipeline status to filter out restarted pipelines that now pass
  const latestPipelineByCommit = {};
  deploymentPipelines.forEach(pipeline => {
    if (!latestPipelineByCommit[pipeline.sha] || 
        new Date(pipeline.updated_at) > new Date(latestPipelineByCommit[pipeline.sha].updated_at)) {
      latestPipelineByCommit[pipeline.sha] = pipeline;
    }
  });

  const failedPipelines = allDeployments
    .filter(deployment => deployment.status === DEPLOYMENT_STATUSES.FAILED)
    .filter(deployment => {
      // Check if the pipeline for this commit has been restarted and now passes
      const latestPipeline = latestPipelineByCommit[deployment.sha];
      if (latestPipeline && latestPipeline.status === 'success') {
        // Pipeline was restarted and now passes, exclude from failed list
        return false;
      }
      return true;
    })
    .map(deployment => {
      // Try to get URL from different possible paths in the API response
      let pipelineUrl = null;
      if (deployment.deployable?.pipeline?.web_url) {
        pipelineUrl = deployment.deployable.pipeline.web_url;
      } else if (deployment.deployable?.web_url) {
        pipelineUrl = deployment.deployable.web_url;
      } else if (deployment.pipeline_url) {
        pipelineUrl = deployment.pipeline_url;
      }
      
      const failedPipeline = {
        id: deployment.id,
        iid: deployment.iid,
        status: deployment.status,
        createdAt: deployment.created_at,
        updatedAt: deployment.updated_at,
        ref: deployment.ref,
        sha: deployment.sha?.substring(0, 8) || 'N/A',
        pipelineJobUrl: pipelineUrl
      };
      
      return failedPipeline;
    })
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

const processPipelineData = (allPipelines) => {
  const total = allPipelines.length;
  const success = allPipelines.filter(p => p.status === 'success').length;
  const failed = allPipelines.filter(p => p.status === 'failed').length;
  const running = allPipelines.filter(p => p.status === 'running').length;
  const pending = allPipelines.filter(p => p.status === 'pending').length;
  const canceled = allPipelines.filter(p => p.status === 'canceled').length;
  const skipped = allPipelines.filter(p => p.status === 'skipped').length;

  const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
  const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

  // Group by date untuk chart dengan semua statuses
  const dailyStats = {};
  allPipelines.forEach(pipeline => {
    const date = getDateFromString(pipeline.created_at);
    if (!dailyStats[date]) {
      dailyStats[date] = { 
        date, 
        success: 0, 
        failed: 0, 
        running: 0,
        pending: 0,
        canceled: 0,
        skipped: 0,
        total: 0 
      };
    }
    dailyStats[date].total++;
    if (pipeline.status === 'success') dailyStats[date].success++;
    if (pipeline.status === 'failed') dailyStats[date].failed++;
    if (pipeline.status === 'running') dailyStats[date].running++;
    if (pipeline.status === 'pending') dailyStats[date].pending++;
    if (pipeline.status === 'canceled') dailyStats[date].canceled++;
    if (pipeline.status === 'skipped') dailyStats[date].skipped++;
  });

  const chartData = Object.values(dailyStats).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Extract failed pipeline details
  const failedPipelines = allPipelines
    .filter(pipeline => pipeline.status === 'failed')
    .map(pipeline => ({
      id: pipeline.id,
      iid: pipeline.iid,
      status: pipeline.status,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      ref: pipeline.ref,
      sha: pipeline.sha?.substring(0, 8) || 'N/A',
      pipelineJobUrl: pipeline.web_url || null // Direct link ke pipeline
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    total,
    running,
    success,
    failed,
    pending,
    canceled,
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

      // Fetch deployments filtered by selected environment
      const allDeployments = await fetchDeployments(config, selectedEnvironment, dateRange);
      
      // Fetch pipelines to check for restarted pipelines with new status
      const allPipelines = await fetchPipelines(config, config.projectPath, dateRange);

      const processedData = processDeploymentData(allDeployments, allPipelines);

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
