export interface ChatSettings {
  enabled: boolean;
  triggers?: any[];
  [key: string]: any;
}

export interface ChatOption {
  id: string;
  name: string;
  [key: string]: any;
}