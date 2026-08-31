import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="font-body text-sm font-medium text-ink">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`border border-line bg-white px-4 py-2.5 font-body text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none ${className}`}
          {...props}
        />
        {error && <span className="font-body text-sm text-red-700">{error}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";
