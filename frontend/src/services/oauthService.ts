// import { auth } from "@/config/firebase";

export interface OAuthProvider {
  name: string;
  connected: boolean;
  expiresAt?: Date;
  displayName: string;
  icon: string;
  color: string;
}

export interface ConnectionStatus {
  success: boolean;
  message: string;
  provider: string;
  expiresAt?: Date;
}

class OAuthService {
  // private server = import.meta.env.VITE_API_URL;

  // Mock data for demonstration
  private mockProviders: OAuthProvider[] = [
    {
      name: "linkedin",
      connected: false,
      displayName: "LinkedIn",
      icon: "linkedin",
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "google",
      connected: false,
      displayName: "Google Drive",
      icon: "cloud",
      color: "from-green-600 to-green-700"
    }
  ];

  /**
   * Get authentication URL for a provider
   */
  async getAuthURL(provider: string): Promise<string> {
    // Mock implementation - in real app, this would call the backend
    const baseURL = window.location.origin;
    return `${baseURL}/oauth/auth/${provider}`;
  }

  /**
   * Connect to a provider (mock implementation)
   */
  async connectProvider(provider: string): Promise<ConnectionStatus> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful connection
    const mockResponse: ConnectionStatus = {
      success: true,
      message: `Successfully connected to ${provider}`,
      provider,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    // Update mock data
    const providerIndex = this.mockProviders.findIndex(p => p.name === provider);
    if (providerIndex !== -1) {
      this.mockProviders[providerIndex].connected = true;
      this.mockProviders[providerIndex].expiresAt = mockResponse.expiresAt;
    }

    return mockResponse;
  }

  /**
   * Get connected platforms
   */
  async getConnectedPlatforms(): Promise<OAuthProvider[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockProviders;
  }

  /**
   * Disconnect from a provider
   */
  async disconnectProvider(provider: string): Promise<ConnectionStatus> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update mock data
    const providerIndex = this.mockProviders.findIndex(p => p.name === provider);
    if (providerIndex !== -1) {
      this.mockProviders[providerIndex].connected = false;
      this.mockProviders[providerIndex].expiresAt = undefined;
    }

    return {
      success: true,
      message: `Successfully disconnected from ${provider}`,
      provider
    };
  }

  /**
   * Get LinkedIn testimonials (mock data)
   */
  async getLinkedInTestimonials(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 1,
        name: "Sarah Chen",
        title: "Product Manager at Google",
        content: "Exceptional work quality and innovative solutions. Highly recommend!",
        rating: 5,
        avatar: "SC",
        relationship: "Colleague",
        company: "Google",
        date: "2 weeks ago",
        skills: ["Product Strategy", "Leadership", "Innovation"]
      },
      {
        id: 2,
        name: "Michael Rodriguez",
        title: "CTO at TechStart",
        content: "Outstanding technical expertise and project leadership.",
        rating: 5,
        avatar: "MR",
        relationship: "Client",
        company: "TechStart",
        date: "1 month ago",
        skills: ["Technical Leadership", "Project Management", "Architecture"]
      },
      {
        id: 3,
        name: "Emily Watson",
        title: "Design Director at Creative Co",
        content: "Brilliant collaboration and creative problem-solving skills.",
        rating: 5,
        avatar: "EW",
        relationship: "Colleague",
        company: "Creative Co",
        date: "3 weeks ago",
        skills: ["Design Thinking", "Collaboration", "Problem Solving"]
      }
    ];
  }

  /**
   * Get Google Drive files (mock data)
   */
  async getGoogleDriveFiles(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
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
  }

  /**
   * Import files from Google Drive
   */
  async importGoogleDriveFiles(fileIds: string[]): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      message: `Successfully imported ${fileIds.length} files`,
      importedFiles: fileIds.length
    };
  }

  /**
   * Import testimonials from LinkedIn
   */
  async importLinkedInTestimonials(testimonialIds: string[]): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      message: `Successfully imported ${testimonialIds.length} testimonials`,
      importedTestimonials: testimonialIds.length
    };
  }
}

export const oauthService = new OAuthService(); 