import { AlertCircle } from 'lucide-react';

export const ErrorHandler = ({ error, config, gitlabUrl }) => {
  if (!error) return null;

  return (
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
"${gitlabUrl}/api/v4/projects/${encodeURIComponent(config.projectPath)}"`}
              </pre>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
