export const ENVIRONMENTS = ['production', 'staging', 'development', 'pre-production'];

export const DATE_RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' }
];

export const DEPLOYMENT_STATUSES = {
  SUCCESS: 'success',
  FAILED: 'failed',
  RUNNING: 'running',
  CREATED: 'created',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped'
};

export const STATUS_COLORS = {
  success: '#10b981',
  failed: '#ef4444',
  running: '#3b82f6',
  created: '#f59e0b',
  blocked: '#8b5cf6',
  skipped: '#6b7280',
  total: '#6366f1'
};

export const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes
