import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { fetchPipelineJobs } from '../../api/gitlabApi';

const JobDetails = ({ pipelineId, projectPath, config }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const jobsData = await fetchPipelineJobs(config, projectPath, pipelineId);
        setJobs(jobsData || []);
      } catch (err) {
        setError('Failed to load jobs');
        console.error('Error loading jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [pipelineId, projectPath, config]);

  if (loading) {
    return (
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const failedJobs = jobs.filter(job => job.status === 'failed');

  if (jobs.length === 0) {
    return (
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-600">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Jobs: {failedJobs.length} failed / {jobs.length} total
        </p>
        <div className="space-y-1">
          {failedJobs.map(job => (
            <div
              key={job.id}
              className="flex items-start justify-between bg-white p-2 rounded border border-red-200"
            >
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">{job.name}</p>
                <p className="text-xs text-gray-600">
                  Stage: <span className="font-mono bg-gray-100 px-1 rounded">{job.stage}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-block bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                  {job.status}
                </span>
                {job.web_url && (
                  <a
                    href={job.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs font-medium transition-colors"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FailedPipelinesTable = ({ failedPipelines, config, projectPath }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const itemsPerPage = 10;

  if (!failedPipelines || failedPipelines.length === 0) return null;

  const totalPages = Math.ceil(failedPipelines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPipelines = failedPipelines.slice(startIndex, endIndex);

  const toggleExpandRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    setExpandedRows(new Set());
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    setExpandedRows(new Set());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        Failed Pipelines ({failedPipelines.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-8"></th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Ref</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Commit</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPipelines.map((pipeline, index) => {
              const isExpanded = expandedRows.has(index);
              return (
                <tr key={index}>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleExpandRow(index)}
                      className="inline-flex items-center justify-center hover:bg-gray-200 rounded p-1 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand to see failed jobs'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{formatDate(pipeline.createdAt)}</td>
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
                      {pipeline.pipelineJobUrl ? (
                        <a
                          href={pipeline.pipelineJobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          View Error
                        </a>
                      ) : (
                        <span className="inline-block bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium">
                          No Link
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Expandable job details row */}
            {paginatedPipelines.map((pipeline, index) => {
              const isExpanded = expandedRows.has(index);
              if (!isExpanded) return null;
              return (
                <tr key={`${index}-jobs`}>
                  <td colSpan="6">
                    <JobDetails
                      pipelineId={pipeline.id}
                      projectPath={projectPath}
                      config={config}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
