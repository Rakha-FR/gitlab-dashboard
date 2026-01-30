import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../StatCard';
import { STATUS_COLORS } from '../../utils/constants';

export const StatsSection = ({ data, dateRange }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="Total Deployments"
        value={data.total}
        icon={Activity}
        color={STATUS_COLORS.total}
        subtitle={`Last ${dateRange} days`}
      />
      <StatCard
        title="Running Pipelines"
        value={data.running}
        icon={Clock}
        color={STATUS_COLORS.running}
        subtitle="Currently executing"
      />
      <StatCard
        title="Success Rate"
        value={`${data.successRate}%`}
        icon={TrendingUp}
        color={STATUS_COLORS.success}
        subtitle={`${data.success} successful`}
      />
      <StatCard
        title="Failed Pipelines"
        value={data.failed}
        icon={AlertCircle}
        color={STATUS_COLORS.failed}
        subtitle={`${data.failureRate}% failure rate`}
      />
      <StatCard
        title="Created"
        value={data.created}
        icon={Activity}
        color={STATUS_COLORS.created}
        subtitle="Awaiting execution"
      />
      <StatCard
        title="Blocked"
        value={data.blocked}
        icon={AlertCircle}
        color={STATUS_COLORS.blocked}
        subtitle="Manual approval needed"
      />
      <StatCard
        title="Skipped"
        value={data.skipped}
        icon={Clock}
        color={STATUS_COLORS.skipped}
        subtitle="Not executed"
      />
    </div>
  );
};
