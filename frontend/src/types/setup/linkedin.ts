import { FormatOption } from "./general";

export interface LinkedInSettings {
  enabled: boolean;
  formats: FormatOption[];
  connection: {
    isConnected: boolean;
    accountId?: string;
    accountName?: string;
    lastSync?: Date;
    syncInterval: number; // in minutes
    autoSync: boolean;
  };
  collection: {
    includeRecommendations: boolean;
    includeEndorsements: boolean;
    includePosts: boolean;
    includeComments: boolean;
    dateRange: {
      start: Date;
      end: Date;
    };
    keywords: string[];
    excludeKeywords: string[];
  };
  processing: {
    autoProcess: boolean;
    extractSentiment: boolean;
    generateSummaries: boolean;
    identifyKeyPhrases: boolean;
  };
  notifications: {
    onNewRecommendation: boolean;
    onNewEndorsement: boolean;
    onProcessingComplete: boolean;
    onError: boolean;
  };
} 