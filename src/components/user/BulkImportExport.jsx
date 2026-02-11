import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function BulkImportExport({ onClose, onImport }) {
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportResults(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      setImportResults(result);
      toast.success(`Imported ${result.successful} users successfully`);

      if (onImport) {
        onImport();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed: ' + error.message);
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'username,email,password,segmentation\njohn_doe,john@example.com,password123,regular\njane_smith,jane@example.com,password123,vip';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Bulk Import/Export Users</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Download all users as a CSV file for backup or analysis.
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400 mb-2">
                  Upload a CSV file to bulk import users. Download the template first to see the required format.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="mb-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div>
                <Label htmlFor="file-upload" className="text-white">Select CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>

              {importFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">{importFile.name}</span>
                  <span className="text-gray-400 text-sm">({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-gray-400">Importing users...</p>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResults && (
            <Alert className={importResults.failed > 0 ? "border-yellow-500" : "border-green-500"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Import completed!</p>
                  <p className="text-sm">
                    ✅ {importResults.successful} users imported successfully
                  </p>
                  {importResults.failed > 0 && (
                    <p className="text-sm text-yellow-600">
                      ⚠️ {importResults.failed} users failed to import
                    </p>
                  )}
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-xs list-disc list-inside space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li>...and {importResults.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* CSV Format Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">CSV Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>Required columns:</strong> username, email, password</p>
                <p><strong>Optional columns:</strong> segmentation (regular, vip, frequent, inactive)</p>
                <p><strong>Notes:</strong> Passwords will be hashed automatically. Segmentation defaults to 'regular'.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
