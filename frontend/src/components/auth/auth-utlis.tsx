import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FormInputProps } from "./types";

export const FormInput = ({
  label,
  id,
  type = "text",
  error,
  icon,
  required,
  value,
  onChange,
  ...props
}: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="grid gap-2" {...props}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          className={cn(
            "pr-10",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          value={value}
          onChange={onChange}
          required={required}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
