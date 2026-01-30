import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useGitLabAnalytics } from '../../hooks/useGitLabAnalytics';
import { ConfigurationPanel } from './ConfigurationPanel';
import { StatsSection } from './StatsSection';
import { ChartsSection } from './ChartsSection';
import { FailedPipelinesTable } from './FailedPipelinesTable';
import { ErrorHandler } from '../ErrorHandler';
import { InfoFooter } from '../InfoFooter';

export const GitLabDashboard = () => {
  const [config, setConfig] = useState({
    gitlabUrl: '',
    token: '',
    projectPath: ''
  });

  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [dateRange, setDateRange] = useState(30);

  const { loading, error, data, fetchAnalytics } = useGitLabAnalytics(
    config,
    selectedEnvironment,
    dateRange
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ConfigurationPanel
          config={config}
          setConfig={setConfig}
          selectedEnvironment={selectedEnvironment}
          setSelectedEnvironment={setSelectedEnvironment}
          dateRange={dateRange}
          setDateRange={setDateRange}
          loading={loading}
          fetchAnalytics={fetchAnalytics}
          data={data}
        />

        {/* Error Handling */}
        <ErrorHandler error={error} config={config} gitlabUrl={config.gitlabUrl} />

        {/* Stats Cards */}
        <StatsSection data={data} dateRange={dateRange} />

        {/* Charts */}
        {data && (
          <div className="grid grid-cols-1 gap-6">
            <ChartsSection data={data} />
            <FailedPipelinesTable failedPipelines={data.failedPipelines} />
          </div>
        )}

        {/* Info Footer */}
        <InfoFooter />
      </div>
    </div>
  );
};
