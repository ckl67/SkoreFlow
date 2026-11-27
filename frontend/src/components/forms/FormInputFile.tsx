import { useId } from 'react';

type Props = {
  label: string;
  comment?: string;
  buttonLabel?: string;
  fileName?: string; // Name of the selected file
  accept?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function FormInputFile({
  label,
  comment,
  buttonLabel = 'Choose file',
  fileName,
  accept = 'image/png,image/jpeg',
  onChange,
  disabled = false,
}: Props) {
  const inputId = useId(); // Generates a unique ID for each instance

  return (
    <div className="mb-3">
      {/* Main label + comment on the same line */}
      <div className="mb-1 flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
        >
          {label}
        </label>
        {comment && (
          <span className="text-xs italic text-gray-400">{comment}</span>
        )}
      </div>

      {/* Button on the left + status text on the right (not clickable to open the window) */}
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className={`
            inline-block
            shrink-0
            rounded-md
            border
            border-gray-300
                 text-white
        bg-blue-600
        hover:bg-blue-700
            px-4
            py-2
            text-sm
            font-medium
            shadow-sm
            transition-colors
            ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:border-blue-600 hover:bg-blue-600 hover:text-white'
            }
          `}
        >
          {buttonLabel}
        </label>

        <span className="truncate text-sm italic text-gray-500">
          {fileName || 'No file selected '}
        </span>

        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onChange(file);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
