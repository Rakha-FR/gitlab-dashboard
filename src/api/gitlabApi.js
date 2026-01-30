import { getDateRangeStart } from '../utils/dateUtils';

export const testConnection = async (config) => {
  if (!config.token) {
    throw new Error('Please enter your GitLab Personal Access Token');
  }

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

  return await response.json();
};

export const fetchDeployments = async (config, environment, dateRange, status = null) => {
  const projectId = encodeURIComponent(config.projectPath);
  const headers = {
    'PRIVATE-TOKEN': config.token,
    'Content-Type': 'application/json'
  };

  const dateFromStr = getDateRangeStart(dateRange);
  
  let url = `${config.gitlabUrl}/api/v4/projects/${projectId}/deployments?environment=${environment}&per_page=250&updated_after=${dateFromStr}&order_by=updated_at&sort=desc`;
  
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url, { headers, mode: 'cors' });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No deployments found for environment "${environment}". Make sure the environment exists in your project.`);
    }
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return await response.json();
};
