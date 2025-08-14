import React, { useState, useEffect, useRef } from "react";
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
  Link,
  Star,
  Award,
  Users,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  X,
  Info,
  Zap,
  Lock,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const GoogleDriveIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'document' | 'image'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock Google Drive files
  const mockFiles: DriveFile[] = [
    {
      id: '1',
      name: 'Customer Success Story - Q4.mp4',
      type: 'video',
      size: '45.2 MB',
      modifiedTime: '2 hours ago',
      webViewLink: '#',
      downloadUrl: '#',
      selected: false,
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjNmNGY2Ii8+Cjxwb2x5Z29uIHBvaW50cz0iNzUsNTAgMTI1LDUwIDEwMCw4NSIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4K'
    },
    {
      id: '2',
      name: 'Product Review Audio.m4a',
      type: 'audio',
      size: '12.8 MB',
      modifiedTime: '1 day ago',
      webViewLink: '#',
      downloadUrl: '#',
      selected: false
    },
    {
      id: '3',
      name: 'Testimonial Draft.docx',
      type: 'document',
      size: '2.1 MB',
      modifiedTime: '3 days ago',
      webViewLink: '#',
      downloadUrl: '#',
      selected: false
    },
    {
      id: '4',
      name: 'Before-After Screenshots.png',
      type: 'image',
      size: '8.5 MB',
      modifiedTime: '1 week ago',
      webViewLink: '#',
      downloadUrl: '#',
      selected: false,
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjNmNGY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc1IiByPSIzMCIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4K'
    }
  ];

  useEffect(() => {
    if (isConnected) {
      setFiles(mockFiles);
    }
  }, [isConnected]);

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
    if (showIntegration && containerRef.current) {
      // Add a small delay to ensure the component is fully rendered
      setTimeout(() => {
        if (containerRef.current) {
          smoothScrollTo(containerRef.current, 2000); // 2 seconds duration
        }
      }, 200);
    }
  }, [showIntegration]);

  const handleGoogleDriveConnect = async () => {
    setIsConnecting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setFiles([]);
    setSelectedFiles([]);
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

    // Simulate upload progress
    for (const item of progressItems) {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => prev.map(p => 
          p.fileId === item.fileId ? { ...p, progress } : p
        ));
      }
      
      setUploadProgress(prev => prev.map(p => 
        p.fileId === item.fileId ? { ...p, status: 'processing' } : p
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(prev => prev.map(p => 
        p.fileId === item.fileId ? { ...p, status: 'complete' } : p
      ));
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

  if (!showIntegration) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <span>Import from Google Drive</span>
          </CardTitle>
          <CardDescription>
            Connect your Google Drive to import existing testimonials, reviews, and media files seamlessly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure OAuth</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Premium Feature</span>
              </div>
            </div>
            <Button
              onClick={() => setShowIntegration(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Drive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 relative w-16 h-16"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-1 -top-1 bg-yellow-400 rounded-full p-1"
              >
                <Sparkles className="w-2 h-2 text-white" />
              </motion.div>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Google Drive Integration
              </span>
            </h2>
            <p className="text-gray-600">
              Connect your Google Drive to import existing testimonials, reviews, and media files seamlessly.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Secure Connection</h3>
              <p className="text-xs text-gray-600">End-to-end encrypted access with OAuth 2.0 authentication.</p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mb-3">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Smart Import</h3>
              <p className="text-xs text-gray-600">Automatically detect and organize testimonial content.</p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="p-2 bg-green-100 rounded-lg w-fit mb-3">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Premium Processing</h3>
              <p className="text-xs text-gray-600">AI-powered content analysis and optimization.</p>
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
              onClick={handleGoogleDriveConnect}
              disabled={isConnecting}
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center space-x-2">
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5" />
                    <span>Connect Google Drive</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>
            
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Secure OAuth</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Read-only Access</span>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIntegration(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Google Drive Files
              </span>
            </h2>
            <p className="text-gray-600 text-sm">Select files to import as testimonials</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-lg">
              <CheckCircle className="w-3 h-3" />
              <span>Connected</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm"
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

            <div className="flex items-center space-x-3">
              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded text-xs ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-3 h-3" />
                </button>
              </div>

              {/* Select All */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {getFilteredFiles().every(f => f.selected) ? 'Deselect All' : 'Select All'}
              </Button>
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
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-medium text-gray-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-1">
                    {selectedFiles.slice(0, 3).map((file) => {
                      const Icon = getFileIcon(file.type);
                      return (
                        <div key={file.id} className={`p-1 rounded ${getFileTypeColor(file.type)}`}>
                          <Icon className="w-2 h-2" />
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:shadow-lg transition-all duration-300"
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
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-600 mb-1">No files found</h3>
              <p className="text-xs text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredFiles().map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative bg-white rounded-xl p-3 border-2 transition-all duration-300 cursor-pointer ${
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
                        className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </motion.div>
                    )}

                    {/* Thumbnail/Icon */}
                    <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`p-3 rounded-lg ${getFileTypeColor(file.type)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1 truncate text-sm" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="capitalize">{file.type}</span>
                        <span>{file.size}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-2 h-2 mr-1" />
                        <span>{file.modifiedTime}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.webViewLink, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.downloadUrl, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.webViewLink, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 text-xs font-medium text-gray-600 border-b">
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
                    className={`grid grid-cols-12 gap-3 p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                      file.selected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="col-span-6 flex items-center space-x-2">
                      {file.selected && (
                        <CheckCircle className="w-3 h-3 text-blue-500" />
                      )}
                      <div className={`p-1 rounded ${getFileTypeColor(file.type)}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-gray-800 truncate text-sm">{file.name}</span>
                    </div>
                    <div className="col-span-2 flex items-center capitalize text-gray-600 text-xs">
                      {file.type}
                    </div>
                    <div className="col-span-2 flex items-center text-gray-600 text-xs">
                      {file.size}
                    </div>
                    <div className="col-span-2 flex items-center text-gray-500 text-xs">
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
                className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Importing Files</h3>
                  <p className="text-gray-600 text-sm">Processing your selected testimonials</p>
                </div>

                <div className="space-y-3">
                  {uploadProgress.map((item) => {
                    const file = selectedFiles.find(f => f.id === item.fileId);
                    return (
                      <div key={item.fileId} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 truncate text-sm">
                            {file?.name || 'Unknown file'}
                          </span>
                          <div className="flex items-center space-x-2">
                            {item.status === 'uploading' && (
                              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                            )}
                            {item.status === 'processing' && (
                              <RefreshCw className="w-3 h-3 animate-spin text-yellow-600" />
                            )}
                            {item.status === 'complete' && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                            {item.status === 'error' && (
                              <AlertCircle className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-gray-600 capitalize">{item.status}</span>
                          <span className="text-gray-500">{item.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300"
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

export default GoogleDriveIntegration; 