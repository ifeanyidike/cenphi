export interface EmailSettings {
  enabled: boolean;
  triggers?: any[];
  [key: string]: any;
}

export interface EmailOption {
  id: string;
  name: string;
  [key: string]: any;
}