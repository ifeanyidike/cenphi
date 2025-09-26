export interface CustomSettings {
  enabled: boolean;
  triggers?: any[];
  [key: string]: any;
}

export interface CustomOption {
  id: string;
  name: string;
  [key: string]: any;
}