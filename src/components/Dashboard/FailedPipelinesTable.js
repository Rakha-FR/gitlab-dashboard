import { AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export const FailedPipelinesTable = ({ failedPipelines }) => {
  if (!failedPipelines || failedPipelines.length === 0) return null;

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
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Ref</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Commit</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {failedPipelines.map((pipeline, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
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
  );
};
