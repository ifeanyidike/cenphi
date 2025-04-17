import { ToastMessage } from "@/types/setup";

// Function to copy to clipboard
export const copyToClipboard = async (
  text: string,
  element: string,
  onSuccess?: (element: string) => void,
  onError?: () => void,
  showToast?: (toast: ToastMessage) => void
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);

    if (onSuccess) {
      onSuccess(element);
    }

    if (showToast) {
      showToast({
        title: "Copied to Clipboard",
        description: `${element} has been copied to your clipboard.`,
        variant: "default",
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to copy: ", err);

    if (onError) {
      onError();
    }

    if (showToast) {
      showToast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }

    return false;
  }
};

// Animation variants for Framer Motion
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};
