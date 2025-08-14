import { FormatOption } from "./general";

export interface GoogleDriveSettings {
  enabled: boolean;
  formats: FormatOption[];
  connection: {
    isConnected: boolean;
    accountEmail?: string;
    lastSync?: Date;
    syncInterval: number; // in minutes
    autoSync: boolean;
  };
  folders: {
    selectedFolders: string[];
    includeSubfolders: boolean;
    fileTypes: string[];
    maxFileSize: number; // in MB
  };
  processing: {
    autoProcess: boolean;
    extractMetadata: boolean;
    generateTranscripts: boolean;
    createThumbnails: boolean;
  };
  notifications: {
    onNewFile: boolean;
    onProcessingComplete: boolean;
    onError: boolean;
  };
} 