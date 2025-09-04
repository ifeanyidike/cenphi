import { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Save, 
  User, 
  Building2,  
  Award, 
  MessageSquare,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { oauthService } from '@/services/oauthService';

interface LinkedInConnection {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  relationship: string;
  profileUrl: string;
}

interface LinkedInSkill {
  id: string;
  name: string;
  category: string;
}

interface LinkedInCompany {
  id: string;
  name: string;
  type: string;
  followers?: number;
  description?: string;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TestimonialType = 'recommendation' | 'endorsement' | 'company_testimonial';
type VisibilityType = 'public' | 'connections' | 'private';

const LinkedInPublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [testimonialType, setTestimonialType] = useState<TestimonialType>('recommendation');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [content, setContent] = useState('');
  const [relationship, setRelationship] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [companies, setCompanies] = useState<LinkedInCompany[]>([]);
  const [skills, setSkills] = useState<LinkedInSkill[]>([]);
  const [showConnectionsDropdown, setShowConnectionsDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [connectionsData, companiesData, skillsData] = await Promise.all([
        oauthService.getLinkedInConnections(),
        oauthService.getLinkedInCompanies(),
        oauthService.getLinkedInSkills()
      ]);
      
      setConnections(connectionsData);
      setCompanies(companiesData);
      setSkills(skillsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load connections and skills data');
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const testimonialData = {
        type: testimonialType,
        recipientId: testimonialType === 'company_testimonial' ? selectedCompany : selectedConnection,
        content,
        relationship: testimonialType !== 'endorsement' ? relationship : undefined,
        skills: testimonialType === 'endorsement' ? selectedSkills : undefined,
        companyId: testimonialType === 'company_testimonial' ? selectedCompany : undefined,
        visibility
      };

      await oauthService.publishLinkedInTestimonial(testimonialData);
      
      setSuccess('Testimonial published successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to publish testimonial:', error);
      setError(error instanceof Error ? error.message : 'Failed to publish testimonial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const testimonialData = {
        type: testimonialType,
        recipientId: testimonialType === 'company_testimonial' ? selectedCompany : selectedConnection,
        content,
        relationship: testimonialType !== 'endorsement' ? relationship : undefined,
        skills: testimonialType === 'endorsement' ? selectedSkills : undefined,
        companyId: testimonialType === 'company_testimonial' ? selectedCompany : undefined,
        visibility
      };

      await oauthService.draftLinkedInTestimonial(testimonialData);
      
      setSuccess('Draft saved successfully!');
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = (): boolean => {
    if (!content.trim()) {
      setError('Please enter testimonial content');
      return false;
    }

    if (testimonialType === 'company_testimonial' && !selectedCompany) {
      setError('Please select a company');
      return false;
    }

    if (testimonialType !== 'company_testimonial' && !selectedConnection) {
      setError('Please select a connection');
      return false;
    }

    if (testimonialType === 'endorsement' && selectedSkills.length === 0) {
      setError('Please select at least one skill to endorse');
      return false;
    }

    if (testimonialType !== 'endorsement' && !relationship.trim()) {
      setError('Please specify your relationship');
      return false;
    }

    return true;
  };

  const getSelectedConnection = () => {
    return connections.find(conn => conn.id === selectedConnection);
  };

  const getSelectedCompany = () => {
    return companies.find(company => company.id === selectedCompany);
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillName) 
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  const getTestimonialTypeInfo = () => {
    switch (testimonialType) {
      case 'recommendation':
        return {
          title: 'Write a Recommendation',
          description: 'Recommend a connection for their work and skills',
          icon: <MessageSquare className="w-5 h-5" />
        };
      case 'endorsement':
        return {
          title: 'Endorse Skills',
          description: 'Endorse specific skills of a connection',
          icon: <Award className="w-5 h-5" />
        };
      case 'company_testimonial':
        return {
          title: 'Company Review',
          description: 'Write a review for a company you\'ve worked with',
          icon: <Building2 className="w-5 h-5" />
        };
    }
  };

  const typeInfo = getTestimonialTypeInfo();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {typeInfo.icon}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{typeInfo.title}</h2>
                  <p className="text-sm text-gray-600">{typeInfo.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Error/Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">{success}</span>
                  </div>
                </motion.div>
              )}

              {/* Testimonial Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['recommendation', 'endorsement', 'company_testimonial'] as TestimonialType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTestimonialType(type)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        testimonialType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        {type === 'recommendation' && <MessageSquare className="w-5 h-5 mx-auto mb-1" />}
                        {type === 'endorsement' && <Award className="w-5 h-5 mx-auto mb-1" />}
                        {type === 'company_testimonial' && <Building2 className="w-5 h-5 mx-auto mb-1" />}
                        <span className="text-xs font-medium capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {testimonialType === 'company_testimonial' ? 'Select Company' : 'Select Connection'}
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowConnectionsDropdown(!showConnectionsDropdown)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {testimonialType === 'company_testimonial' ? (
                        getSelectedCompany() ? (
                          <>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{getSelectedCompany()?.name}</div>
                              <div className="text-sm text-gray-500">{getSelectedCompany()?.description}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-gray-500">Select a company...</span>
                          </>
                        )
                      ) : (
                        getSelectedConnection() ? (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                              {getSelectedConnection()?.avatar}
                            </div>
                            <div>
                              <div className="font-medium">{getSelectedConnection()?.name}</div>
                              <div className="text-sm text-gray-500">{getSelectedConnection()?.title}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-gray-500">Select a connection...</span>
                          </>
                        )
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showConnectionsDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(testimonialType === 'company_testimonial' ? companies : connections).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (testimonialType === 'company_testimonial') {
                              setSelectedCompany(item.id);
                            } else {
                              setSelectedConnection(item.id);
                            }
                            setShowConnectionsDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          {testimonialType === 'company_testimonial' ? (
                            <>
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">{(item as LinkedInCompany).description}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                {(item as LinkedInConnection).avatar}
                              </div>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">{(item as LinkedInConnection).title}</div>
                              </div>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship (for recommendations and company testimonials) */}
              {testimonialType !== 'endorsement' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Relationship
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder={testimonialType === 'company_testimonial' ? 'e.g., Client, Partner, Employee' : 'e.g., Colleague, Manager, Client'}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              {/* Skills Selection (for endorsements) */}
              {testimonialType === 'endorsement' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills to Endorse
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors"
                    >
                      <span className={selectedSkills.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedSkills.length > 0 
                          ? `${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''} selected`
                          : 'Select skills to endorse...'
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {showSkillsDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {skills.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.name)}
                            className={`w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                              selectedSkills.includes(skill.name) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium">{skill.name}</div>
                              <div className="text-sm text-gray-500">{skill.category}</div>
                            </div>
                            {selectedSkills.includes(skill.name) && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {testimonialType === 'endorsement' ? 'Endorsement Message (Optional)' : 'Testimonial Content'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    testimonialType === 'recommendation' 
                      ? 'Write a detailed recommendation about their work, skills, and character...'
                      : testimonialType === 'endorsement'
                      ? 'Add a personal message about why you\'re endorsing these skills...'
                      : 'Share your experience working with this company...'
                  }
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {content.length} characters
                </div>
              </div>

              {/* Visibility */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['public', 'connections', 'private'] as VisibilityType[]).map((vis) => (
                    <button
                      key={vis}
                      onClick={() => setVisibility(vis)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        visibility === vis
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-xs font-medium capitalize">{vis}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {vis === 'public' && 'Everyone'}
                          {vis === 'connections' && 'Connections only'}
                          {vis === 'private' && 'Just you'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Draft</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isLoading || isSaving}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Publish</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LinkedInPublishModal;
