import { AuthError } from "@/services/error";

export interface AuthFormProps extends React.ComponentProps<"div"> {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError;
}

// Reusable styled input component
export interface FormInputProps extends React.ComponentProps<"div"> {
  label: string;
  id: string;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
