import { useState, useEffect, useRef } from 'react';
import { 
  Linkedin, 
  Users, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Award,
  Search,
  Grid,
  List,
  ChevronDown,
  X,
  RefreshCw,
  Download,
  Eye,
  ExternalLink,
  FolderOpen,
  AlertCircle,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { oauthService } from '@/services/oauthService';

// Types
interface LinkedInTestimonial {
  id: string;
  name: string;
  title: string;
  company?: string;
  content: string;
  rating: number;
  avatar: string;
  relationship: string;
  date?: string;
  skills?: string[];
  selected: boolean;
}

interface UploadProgress {
  testimonialId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const LinkedInTestimonialCollection = () => {
  console.log('LinkedInTestimonialCollection component rendered');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testimonials, setTestimonials] = useState<LinkedInTestimonial[]>([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState<LinkedInTestimonial[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'colleague' | 'client' | 'manager'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('LinkedInTestimonialCollection useEffect - component mounted');
    if (isConnected) {
      // Testimonials will be loaded via the service when connected
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

  // Scroll to the LinkedIn section when component mounts
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

  const handleLinkedInConnect = async () => {
    console.log('LinkedIn connect button clicked!');
    console.log('Current state - isConnected:', isConnected, 'isConnecting:', isConnecting);
    setIsConnecting(true);
    setError(null);
    try {
      console.log('Calling oauthService.connectProvider...');
      const result = await oauthService.connectProvider('linkedin');
      console.log('Connection result:', result);
      if (result.success) {
        console.log('Setting isConnected to true');
        setIsConnected(true);
        // Fetch testimonials after successful connection
        console.log('Fetching testimonials...');
        const testimonialsData = await oauthService.getLinkedInTestimonials();
        console.log('Testimonials data:', testimonialsData);
        // Add selected property to each testimonial
        const testimonialsWithSelection = testimonialsData.map((testimonial: any) => ({
          ...testimonial,
          selected: false
        }));
        setTestimonials(testimonialsWithSelection);
      }
    } catch (error) {
      console.error('Failed to connect to LinkedIn:', error);
      setError('Failed to connect to LinkedIn. Please try again.');
    } finally {
      console.log('Setting isConnecting to false');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await oauthService.disconnectProvider('linkedin');
      setIsConnected(false);
      setTestimonials([]);
      setSelectedTestimonials([]);
    } catch (error) {
      console.error('Failed to disconnect from LinkedIn:', error);
    }
  };

  const handleTestimonialSelect = (testimonial: LinkedInTestimonial) => {
    const updatedTestimonials = testimonials.map(t => 
      t.id === testimonial.id ? { ...t, selected: !t.selected } : t
    );
    setTestimonials(updatedTestimonials);
    
    if (testimonial.selected) {
      setSelectedTestimonials(prev => prev.filter(t => t.id !== testimonial.id));
    } else {
      setSelectedTestimonials(prev => [...prev, { ...testimonial, selected: true }]);
    }
  };

  const handleSelectAll = () => {
    const filteredTestimonials = getFilteredTestimonials();
    const allSelected = filteredTestimonials.every(t => t.selected);
    
    const updatedTestimonials = testimonials.map(t => {
      if (filteredTestimonials.find(ft => ft.id === t.id)) {
        return { ...t, selected: !allSelected };
      }
      return t;
    });
    
    setTestimonials(updatedTestimonials);
    setSelectedTestimonials(allSelected ? [] : filteredTestimonials.map(t => ({ ...t, selected: true })));
  };

  const handleImportSelected = async () => {
    if (selectedTestimonials.length === 0) return;
    
    setShowUploadModal(true);
    const progressItems: UploadProgress[] = selectedTestimonials.map(testimonial => ({
      testimonialId: testimonial.id,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(progressItems);

    try {
      // Import testimonials using the service
      const testimonialIds = selectedTestimonials.map(testimonial => testimonial.id);
      const result = await oauthService.importLinkedInTestimonials(testimonialIds);
      
      if (result.success) {
        // Update progress to complete
        setUploadProgress(prev => prev.map(p => ({
          ...p,
          progress: 100,
          status: 'complete' as const
        })));
      }
    } catch (error) {
      console.error('Failed to import testimonials:', error);
      // Update progress to error
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error' as const,
        error: 'Import failed'
      })));
    }
  };

  const getFilteredTestimonials = () => {
    return testimonials.filter(testimonial => {
      const matchesSearch = testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (testimonial.company && testimonial.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'all' || testimonial.relationship.toLowerCase() === filterType;
      return matchesSearch && matchesFilter;
    });
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'colleague': return 'text-blue-600 bg-blue-50';
      case 'client': return 'text-green-600 bg-green-50';
      case 'manager': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isConnected) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
        {/* Test button for debugging */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => {
              console.log('LinkedIn test button clicked!');
              alert('LinkedIn test button works!');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Test Button
          </button>
        </div>
        
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
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                <Linkedin className="w-10 h-10 text-white" />
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                LinkedIn Integration
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect your LinkedIn to import existing testimonials, recommendations, and professional endorsements seamlessly.
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
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Professional Network</h3>
              <p className="text-gray-600">Access your entire professional network for testimonials and recommendations.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Import</h3>
              <p className="text-gray-600">Automatically detect and organize testimonial content from your connections.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Processing</h3>
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
                console.log('LinkedIn button clicked!', e);
                console.log('Event type:', e.type);
                console.log('Event target:', e.target);
                console.log('Event currentTarget:', e.currentTarget);
                console.log('Button disabled state:', e.currentTarget.disabled);
                console.log('Component state - isConnecting:', isConnecting);
                alert('LinkedIn button clicked! This confirms the button is working.');
                if (!isConnecting) {
                  handleLinkedInConnect();
                } else {
                  console.log('Button is disabled, not calling handleLinkedInConnect');
                }
              }}
              disabled={isConnecting}
              className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center space-x-3">
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Linkedin className="w-6 h-6" />
                    <span>Connect LinkedIn</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Secure OAuth</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
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
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                LinkedIn Testimonials
              </span>
            </h1>
            <p className="text-gray-600">Select testimonials to import</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-100 px-3 py-2 rounded-lg">
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
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                >
                  <option value="all">All Relationships</option>
                  <option value="colleague">Colleagues</option>
                  <option value="client">Clients</option>
                  <option value="manager">Managers</option>
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
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Select All */}
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {getFilteredTestimonials().every(t => t.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Selected Testimonials Summary */}
          {selectedTestimonials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedTestimonials.length} testimonial{selectedTestimonials.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-2">
                    {selectedTestimonials.slice(0, 3).map((testimonial) => (
                      <div key={testimonial.id} className="p-1 rounded bg-blue-100">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      </div>
                    ))}
                    {selectedTestimonials.length > 3 && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        +{selectedTestimonials.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImportSelected}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Import Selected
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Testimonials Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {getFilteredTestimonials().length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No testimonials found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getFilteredTestimonials().map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer shadow-lg ${
                    testimonial.selected 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/25' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  }`}
                  onClick={() => handleTestimonialSelect(testimonial)}
                >
                  {testimonial.selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.div>
                  )}

                  {/* Avatar */}
                  <div className="aspect-square bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {testimonial.avatar}
                    </div>
                  </div>

                  {/* Testimonial Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 truncate" title={testimonial.name}>
                      {testimonial.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="truncate">{testimonial.title}</span>
                      {testimonial.company && (
                        <span className="text-xs text-gray-500">{testimonial.company}</span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getRelationshipColor(testimonial.relationship)}`}>
                        {testimonial.relationship}
                      </span>
                      {testimonial.date && (
                        <span className="ml-2">{testimonial.date}</span>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    
                    {/* Content Preview */}
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
                      "{testimonial.content}"
                    </p>
                    
                    {/* Skills/Tags */}
                    {testimonial.skills && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {testimonial.skills.slice(0, 3).map((skill: string, i: number) => (
                          <span key={i} className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // View testimonial details
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Download testimonial
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Share testimonial
                      }}
                      className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Relationship</div>
                <div className="col-span-2">Rating</div>
                <div className="col-span-3">Content</div>
                <div className="col-span-2">Date</div>
              </div>
              {getFilteredTestimonials().map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    testimonial.selected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleTestimonialSelect(testimonial)}
                >
                  <div className="col-span-3 flex items-center space-x-3">
                    {testimonial.selected && (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 truncate block">{testimonial.name}</span>
                      <span className="text-xs text-gray-600 truncate block">{testimonial.title}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRelationshipColor(testimonial.relationship)}`}>
                      {testimonial.relationship}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center text-gray-700 text-sm">
                    <span className="truncate">"{testimonial.content}"</span>
                  </div>
                  <div className="col-span-2 flex items-center text-gray-500 text-sm">
                    {testimonial.date || 'N/A'}
                  </div>
                </motion.div>
              ))}
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
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Importing Testimonials</h3>
                  <p className="text-white/70">Processing your selected testimonials</p>
                </div>

                <div className="space-y-4">
                  {uploadProgress.map((item) => {
                    const testimonial = selectedTestimonials.find(t => t.id === item.testimonialId);
                    return (
                      <div key={item.testimonialId} className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white truncate">
                            {testimonial?.name || 'Unknown testimonial'}
                          </span>
                          <div className="flex items-center space-x-2">
                            {item.status === 'uploading' && (
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            )}
                            {item.status === 'processing' && (
                              <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                            )}
                            {item.status === 'complete' && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {item.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                        
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-white/60 capitalize">{item.status}</span>
                          <span className="text-white/50">{item.progress}%</span>
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
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

export default LinkedInTestimonialCollection;