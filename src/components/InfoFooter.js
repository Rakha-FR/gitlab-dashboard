export const InfoFooter = () => (
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
);
