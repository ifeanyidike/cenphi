import { UserCredential } from "firebase/auth";

export interface AuthFormProps extends React.ComponentProps<"div"> {
  onSubmit: (data: any) => Promise<UserCredential | undefined>;
  isLoading?: boolean;
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
