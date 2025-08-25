import { useState, useEffect, useRef } from "react";
import {
  Cloud,
  Upload,
  FileText,
  Video,
  Mic,
  Image,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
  Download,
  Star,
  
  Clock,
  Eye,
 
  RefreshCw,
  ExternalLink,
  FolderOpen,
  Search,
 
  Grid,
  List,
  ChevronDown,
  X,
  
  Zap,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { oauthService } from '@/services/oauthService';
import { connectionStatusService } from '@/services/connectionStatusService';

// Types
interface DriveFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'document' | 'image';
  size: string;
  modifiedTime: string;
  thumbnailUrl?: string;
  webViewLink: string;
  downloadUrl: string;
  selected: boolean;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const GoogleDriveTestimonialCollection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'document' | 'image'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (isConnected) {
      // Load files from Google Drive when connected
      loadGoogleDriveFiles();
    }
  }, [isConnected]);

  const loadGoogleDriveFiles = async () => {
    try {
      const driveFiles = await oauthService.getGoogleDriveFiles();
      setFiles(driveFiles);
    } catch (error) {
      console.error('Failed to load Google Drive files:', error);
      setError('Failed to load files from Google Drive');
    }
  };

  // Custom smooth scroll function with easing
  const smoothScrollTo = (element: HTMLElement, duration: number = 1500) => {
    const targetPosition = element.offsetTop - 20; // 20px offset from top
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    // Easing function for smooth animation
    const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    requestAnimationFrame(animation);
  };

  // Scroll to the Google Drive section when component mounts
  useEffect(() => {
    if (containerRef.current) {
      // Add a small delay to ensure the component is fully rendered
      setTimeout(() => {
        if (containerRef.current) {
          smoothScrollTo(containerRef.current, 2000); // 2 seconds duration
        }
      }, 200);
    }
  }, []);

  const handleGoogleDriveConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await oauthService.connectProvider('google-drive');
      if (result.success) {
        setIsConnected(true);
        
        // Update connection status
        connectionStatusService.updateConnectionStatus('google_drive', {
          isConnected: true,
          provider: 'google_drive',
          accountEmail: 'Connected',
          lastSync: new Date(),
        });
        
        // Redirect back to dashboard after successful connection
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Failed to connect to Google Drive:', error);
      setError('Failed to connect to Google Drive. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await oauthService.disconnectProvider('google-drive');
      setIsConnected(false);
      setFiles([]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to disconnect from Google Drive:', error);
    }
  };

  const handleFileSelect = (file: DriveFile) => {
    const updatedFiles = files.map(f => 
      f.id === file.id ? { ...f, selected: !f.selected } : f
    );
    setFiles(updatedFiles);
    
    if (file.selected) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, { ...file, selected: true }]);
    }
  };

  const handleSelectAll = () => {
    const filteredFiles = getFilteredFiles();
    const allSelected = filteredFiles.every(f => f.selected);
    
    const updatedFiles = files.map(f => {
      if (filteredFiles.find(ff => ff.id === f.id)) {
        return { ...f, selected: !allSelected };
      }
      return f;
    });
    
    setFiles(updatedFiles);
    setSelectedFiles(allSelected ? [] : filteredFiles.map(f => ({ ...f, selected: true })));
  };

  const handleUploadSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    setShowUploadModal(true);
    const progressItems: UploadProgress[] = selectedFiles.map(file => ({
      fileId: file.id,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(progressItems);

    try {
      // Import files using the service
      const fileIds = selectedFiles.map(file => file.id);
      const result = await oauthService.importGoogleDriveFiles(fileIds);
      
      if (result.success) {
        // Update progress to complete
        setUploadProgress(prev => prev.map(p => ({
          ...p,
          progress: 100,
          status: 'complete' as const
        })));
      }
    } catch (error) {
      console.error('Failed to import files:', error);
      // Update progress to error
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error' as const,
        error: 'Import failed'
      })));
    }
  };

  const getFilteredFiles = () => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || file.type === filterType;
      return matchesSearch && matchesFilter;
    });
  };

  const getFileIcon = (type: DriveFile['type']) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Mic;
      case 'document': return FileText;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getFileTypeColor = (type: DriveFile['type']) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-50';
      case 'audio': return 'text-purple-600 bg-purple-50';
      case 'document': return 'text-blue-600 bg-blue-50';
      case 'image': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isConnected) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 relative w-20 h-20"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Cloud className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-1 -top-1 bg-yellow-400 rounded-full p-1.5"
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Google Drive Integration
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect your Google Drive to import existing testimonials, reviews, and media files seamlessly.
            </p>
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Secure Connection</h3>
              <p className="text-gray-600">End-to-end encrypted access to your Google Drive files with OAuth 2.0 authentication.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Import</h3>
              <p className="text-gray-600">Automatically detect and organize testimonial content from your existing files.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Premium Processing</h3>
              <p className="text-gray-600">AI-powered content analysis and optimization for maximum impact.</p>
            </div>
          </motion.div>

          {/* Connect Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                if (isConnecting) {
                  return;
                }
                handleGoogleDriveConnect();
              }}
              disabled={isConnecting}
              className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center space-x-3">
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-6 h-6" />
                    <span>Connect Google Drive</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Secure OAuth</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Read-only Access</span>
              </div>
            </div> 
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Google Drive Files
              </span>
            </h1>
            <p className="text-gray-600">Select files to import as testimonials</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>Connected</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                >
                  <option value="all">All Files</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                  <option value="image">Images</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Select All */}
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {getFilteredFiles().every(f => f.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Selected Files Summary */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-2">
                    {selectedFiles.slice(0, 3).map((file) => {
                      const Icon = getFileIcon(file.type);
                      return (
                        <div key={file.id} className={`p-1 rounded ${getFileTypeColor(file.type)}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                    {selectedFiles.length > 3 && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        +{selectedFiles.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUploadSelected}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Import Selected
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Files Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {getFilteredFiles().length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No files found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getFilteredFiles().map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative bg-white rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                      file.selected 
                        ? 'border-blue-500 shadow-lg shadow-blue-100' 
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    {file.selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.div>
                    )}

                    {/* Thumbnail/Icon */}
                    <div className="aspect-video bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`p-4 rounded-xl ${getFileTypeColor(file.type)}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1 truncate" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span className="capitalize">{file.type}</span>
                        <span>{file.size}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{file.modifiedTime}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.webViewLink, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.downloadUrl, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.webViewLink, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-600 border-b">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Modified</div>
              </div>
              {getFilteredFiles().map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      file.selected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="col-span-6 flex items-center space-x-3">
                      {file.selected && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                      <div className={`p-2 rounded ${getFileTypeColor(file.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800 truncate">{file.name}</span>
                    </div>
                    <div className="col-span-2 flex items-center capitalize text-gray-600">
                      {file.type}
                    </div>
                    <div className="col-span-2 flex items-center text-gray-600">
                      {file.size}
                    </div>
                    <div className="col-span-2 flex items-center text-gray-500">
                      {file.modifiedTime}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Upload Progress Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Importing Files</h3>
                  <p className="text-gray-600">Processing your selected testimonials</p>
                </div>

                <div className="space-y-4">
                  {uploadProgress.map((item) => {
                    const file = selectedFiles.find(f => f.id === item.fileId);
                    return (
                      <div key={item.fileId} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 truncate">
                            {file?.name || 'Unknown file'}
                          </span>
                          <div className="flex items-center space-x-2">
                            {item.status === 'uploading' && (
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                            {item.status === 'processing' && (
                              <RefreshCw className="w-4 h-4 animate-spin text-yellow-600" />
                            )}
                            {item.status === 'complete' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {item.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-gray-600 capitalize">{item.status}</span>
                          <span className="text-gray-500">{item.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Done
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GoogleDriveTestimonialCollection;

