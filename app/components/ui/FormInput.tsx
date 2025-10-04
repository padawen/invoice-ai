interface FormInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  isDirty?: boolean;
  maxLength?: number;
  required?: boolean;
  label?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isNumeric?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  isDirty = false,
  maxLength,
  required = false,
  label,
  onFocus,
  onBlur,
  isNumeric = false
}) => {
  const handleChange = (inputValue: string) => {
    if (isNumeric) {
      let cleanValue = inputValue.replace(/,/g, '.');
      cleanValue = cleanValue.replace(/[^0-9.-]/g, '');

      const dotCount = (cleanValue.match(/\./g) || []).length;
      if (dotCount > 1) {
        const firstDotIndex = cleanValue.indexOf('.');
        cleanValue = cleanValue.substring(0, firstDotIndex + 1) +
                    cleanValue.substring(firstDotIndex + 1).replace(/\./g, '');
      }

      if (cleanValue.includes('-')) {
        const withoutMinus = cleanValue.replace(/-/g, '');
        cleanValue = inputValue.startsWith('-') ? '-' + withoutMinus : withoutMinus;
      }
      
      onChange(cleanValue);
    } else {
      onChange(inputValue);
    }
  };

  const isSmallInput = className.includes('text-xs') || className.includes('px-1') || className.includes('px-2');
  
  const baseClasses = "border rounded-lg text-white focus:outline-none transition-colors";
  const focusClasses = isSmallInput 
    ? "focus:ring-1 focus:border-green-400/50"
    : "focus:ring-2";
    
  const backgroundClasses = isSmallInput
    ? (isDirty 
        ? "bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50"
        : "bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50")
    : (isDirty 
        ? "bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50"
        : "bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50");

  const paddingClasses = className.includes('px-') ? '' : 'px-3 py-2 sm:px-4 sm:py-3';
  
  const inputElement = (
    <input
      type={type}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={`${baseClasses} ${focusClasses} ${backgroundClasses} ${paddingClasses} ${className}`}
      maxLength={maxLength}
      required={required}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );

  if (label) {
    return (
      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
};

export default FormInput; 