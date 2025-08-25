import React, { useState, useEffect } from 'react';
import { Folder, File, Download, Eye, Search, RefreshCw, Check, Upload, Cloud, ArrowLeft } from 'lucide-react';
import { oauthService } from '@/services/oauthService';
import { connectionStatusService } from '@/services/connectionStatusService';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

const GoogleDriveFileBrowser: React.FC = () => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // Force refresh the connection status to get the most current state
      const status = await connectionStatusService.forceRefresh('google_drive');
      setIsConnected(status.isConnected);
      if (status.isConnected) {
        // Auto-load files when connected
        fetchFiles();
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
    }
  };

  const fetchFiles = async (query?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filesData = await oauthService.getGoogleDriveFiles();
      console.log('Google Drive files data:', filesData);
      setFiles(filesData);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch files');
      console.error('Error fetching Google Drive files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(searchQuery);
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) {
      return <File className="w-5 h-5 text-gray-500" />;
    }
    if (mimeType.includes('folder')) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('image')) {
      return <File className="w-5 h-5 text-green-500" />;
    }
    if (mimeType.includes('video')) {
      return <File className="w-5 h-5 text-purple-500" />;
    }
    if (mimeType.includes('audio')) {
      return <File className="w-5 h-5 text-orange-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'Unknown size';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleFileSelect = (fileId: string) => {
    if (!fileId) return; // Don't process empty file IDs
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await oauthService.connectProvider('google-drive');
      // Note: The OAuth flow will redirect the page, so we don't need to handle the success case here
    } catch (error: any) {
      setError(error.message || 'Failed to connect to Google Drive');
      setIsConnecting(false);
    }
  };

  const handleImportSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    setImporting(true);
    setError(null);
    try {
      const fileIds = Array.from(selectedFiles);
      console.log('Attempting to import files:', fileIds);
      
      const result = await oauthService.importGoogleDriveFiles(fileIds);
      console.log('Import result:', result);
      
      setImportedCount(fileIds.length);
      setImportSuccess(true);
      setSelectedFiles(new Set());
      
      // Optionally refresh the file list to show updated status
      // fetchFiles();
    } catch (error: any) {
      console.error('Import error in component:', error);
      
      // Handle authentication expired error
      if (error.message && error.message.includes('authentication expired')) {
        setError('Google Drive authentication has expired. Please reconnect your account to continue.');
        // Optionally, you could automatically redirect to settings or show a reconnect button
        // window.location.href = '/settings';
      } else {
        setError(error.message || 'Failed to import files');
      }
    } finally {
      setImporting(false);
    }
  };

  if (importSuccess) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-12 max-w-lg mx-auto shadow-2xl">
          <div className="mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
              <Check className="relative w-16 h-16 text-green-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-4">
              Import Successful!
            </h3>
            <p className="text-green-700 text-lg mb-8">
              Successfully imported {importedCount} file{importedCount !== 1 ? 's' : ''} from Google Drive.
            </p>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => {
                setImportSuccess(false);
                setImportedCount(0);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Import More Files
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-yellow-200 rounded-3xl p-12 max-w-lg mx-auto shadow-2xl">
          <div className="mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
              <Cloud className="relative w-16 h-16 text-yellow-600 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-800 mb-4">
              Google Drive Not Connected
            </h3>
            <p className="text-yellow-700 text-lg mb-8">
              Please connect your Google Drive account to browse files.
            </p>
          </div>
          <button
            onClick={handleConnectGoogleDrive}
            disabled={isConnecting}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold mx-auto"
          >
            <Cloud className="w-5 h-5" />
            {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-white/60 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </button>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Google Drive Files</h2>
                <p className="text-gray-600 mt-2 text-lg">Browse and import your Google Drive files</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedFiles.size > 0 && (
                <button
                  onClick={handleImportSelected}
                  disabled={importing}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                >
                  <Upload className={`w-5 h-5 mr-2 ${importing ? 'animate-spin' : ''}`} />
                  Import {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
                </button>
              )}
              <button
                onClick={() => fetchFiles()}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow duration-200 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              Search
            </button>
          </form>
        </div>

                                   {/* Content */}
          <div className="p-8">
                       {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 mb-8 shadow-lg">
                <p className="text-red-800 mb-4 text-lg font-medium">{error}</p>
                {error.includes('authentication expired') && (
                  <button
                    onClick={handleConnectGoogleDrive}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                  >
                    <Cloud className="w-5 h-5" />
                    {isConnecting ? 'Reconnecting...' : 'Reconnect Google Drive'}
                  </button>
                )}
              </div>
            )}

                     {loading ? (
             <div className="text-center py-12">
               <div className="relative">
                 <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                 <RefreshCw className="relative w-12 h-12 animate-spin mx-auto text-blue-600 mb-6" />
               </div>
               <p className="text-gray-600 text-lg font-medium">Loading files...</p>
             </div>
                      ) : !files || files.length === 0 ? (
             <div className="text-center py-12">
               <div className="relative mb-6">
                 <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-xl"></div>
                 <File className="relative w-16 h-16 text-gray-400 mx-auto" />
               </div>
               <p className="text-gray-600 text-lg font-medium mb-6">No files found</p>
               <button
                 onClick={() => fetchFiles()}
                 className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
               >
                 Load Files
               </button>
             </div>
          ) : (
                                                   <div className="grid gap-6">
                {files && files.map((file) => (
                                  <div
                    key={file.id || `file-${Math.random()}`}
                    className={`flex items-center p-6 border rounded-2xl transition-all duration-200 shadow-sm hover:shadow-lg ${
                      selectedFiles.has(file.id || '') 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-blue-100' 
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                                                                           <div className="flex-shrink-0 mr-6">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id || '')}
                        onChange={() => handleFileSelect(file.id || '')}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                  
                                     <div className="flex-shrink-0 mr-6">
                     <div className="relative">
                       <div className="absolute inset-0 bg-gray-200 rounded-xl blur-sm"></div>
                       <div className="relative bg-white p-3 rounded-xl shadow-sm">
                         {getFileIcon(file.mimeType)}
                       </div>
                     </div>
                   </div>
                  
                                                                           <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                        {file.name || 'Unnamed File'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • Modified {formatDate(file.modifiedTime)}
                      </p>
                    </div>
                  
                                     <div className="flex items-center space-x-3">
                     {file.webViewLink && (
                       <button
                         onClick={() => window.open(file.webViewLink, '_blank')}
                         className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                         title="View file"
                       >
                         <Eye className="w-5 h-5" />
                       </button>
                     )}
                     {file.thumbnailLink && (
                       <div className="relative">
                         <div className="absolute inset-0 bg-gray-200 rounded-xl blur-sm"></div>
                         <img
                           src={file.thumbnailLink}
                           alt={file.name}
                           className="relative w-12 h-12 rounded-xl object-cover shadow-sm"
                         />
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveFileBrowser;
