import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { 
  Share2, 
  Star, 
  Calendar,
  Search,
  AlertCircle,
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { workspaceHub } from '@/repo/workspace_hub';
import { connectionStatusService } from '@/services/connectionStatusService';

const LinkedInReadyPage: React.FC = observer(() => {
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  

  // Get testimonials from the workspace hub
  const { testimonialManager } = workspaceHub;
  const testimonials = testimonialManager.testimonials || [];
  
  console.log('LinkedInReadyPage: Raw testimonials from manager:', testimonialManager.testimonials);
  console.log('LinkedInReadyPage: Processed testimonials:', testimonials);
  console.log('LinkedInReadyPage: Testimonials length:', testimonials.length);

  // Load testimonials and check LinkedIn connection
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load testimonials from the database
        await testimonialManager.getTestimonials();
        
        // Check LinkedIn connection status
        const linkedInStatus = await connectionStatusService.getConnectionStatus('linkedin');
        setLinkedInConnected(linkedInStatus.isConnected);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [testimonialManager]);

  const handleTestimonialSelect = (testimonialId: string) => {
    setSelectedTestimonials(prev => 
      prev.includes(testimonialId) 
        ? prev.filter(id => id !== testimonialId)
        : [...prev, testimonialId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTestimonials.length === testimonials.length) {
      setSelectedTestimonials([]);
    } else {
      setSelectedTestimonials(testimonials.map(t => t.id));
    }
  };

  const handleShareSelected = () => {
    console.log('Sharing testimonials:', selectedTestimonials);
    // TODO: Implement sharing logic
  };

  const filteredTestimonials = testimonials.filter(testimonial =>
    ((testimonial as any).author_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((testimonial as any).content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((testimonial as any).author_company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Ready Testimonials</h1>
          <p className="text-gray-600 mt-1">Select and share testimonials on LinkedIn</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            linkedInConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              linkedInConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{linkedInConnected ? 'LinkedIn Connected' : 'LinkedIn Disconnected'}</span>
          </div>
          
          {selectedTestimonials.length > 0 && (
            <Button 
              onClick={handleShareSelected}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share {selectedTestimonials.length} Testimonial{selectedTestimonials.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" onClick={handleSelectAll}>
          {selectedTestimonials.length === testimonials.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Testimonials Grid */}
      <div className="grid gap-4">
        {filteredTestimonials.map((testimonial) => (
          <Card key={testimonial.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedTestimonials.includes(testimonial.id)}
                  onCheckedChange={() => handleTestimonialSelect(testimonial.id)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {(testimonial as any).author_name || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {(testimonial as any).author_title || 'Customer'} at {(testimonial as any).author_company || 'Company'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(testimonial as any).rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{(testimonial as any).rating}</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {(testimonial as any).type || testimonial.testimonial_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {testimonial.content || testimonial.summary || 'No content available'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {(testimonial as any).tags?.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date((testimonial as any).created_at || testimonial.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
});

export default LinkedInReadyPage;
