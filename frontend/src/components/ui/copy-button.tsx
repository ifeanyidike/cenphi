// src/components/ui/copy-button.tsx
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  src?: string;
  onCopy?: () => void;
  onCopyError?: (error: Error) => void;
  timeout?: number;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function CopyButton({
  value,
  src,
  onCopy,
  onCopyError,
  timeout = 2000,
  variant = "ghost",
  size = "icon",
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = async () => {
    try {
      if (src) {
        const text = document.querySelector(src)?.textContent || "";
        await navigator.clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText(value);
      }

      setHasCopied(true);
      setIsAnimating(true);

      onCopy?.();

      setTimeout(() => {
        setHasCopied(false);
      }, timeout);

      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    } catch (error) {
      if (error instanceof Error) {
        onCopyError?.(error);
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("relative", className)}
      onClick={handleCopy}
      {...props}
    >
      <span
        className={cn(
          "transition-opacity",
          hasCopied ? "opacity-0" : "opacity-100"
        )}
      >
        {children || <Copy className="h-4 w-4" />}
      </span>

      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          hasCopied ? "opacity-100" : "opacity-0"
        )}
      >
        <Check className="h-4 w-4" />
      </span>

      {isAnimating && (
        <span className="absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2 -translate-y-full animate-ping rounded-full bg-current opacity-20" />
      )}
    </Button>
  );
}
