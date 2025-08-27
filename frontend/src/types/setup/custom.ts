export interface CustomFormField {
  name: string;
  label: string;
  type: "text" | "email" | "textarea" | "select" | "number" | "tel" | "url";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface CustomForm {
  mainQuestion: string;
  instructions?: string;
  submitButtonText: string;
  layout: "vertical" | "horizontal" | "grid";
  fields: CustomFormField[];
}

export interface CustomSettings {
  enabled: boolean;
  pageTitle: string;
  headline: string;
  formIntro: string;
  ctaButton: string;
  successTitle: string;
  successMessage: string;
  customDomain: string;
  customSlug: string;
  customForm?: CustomForm;
  formats: Array<{
    type: string;
    enabled: boolean;
  }>;
  settings: {
    showRating: boolean;
    requireRating: boolean;
    showCompany: boolean;
    requireCompany: boolean;
    showEmail: boolean;
    requireEmail: boolean;
  };
}
