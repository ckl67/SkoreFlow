type Props = {
  label: string;
  comment?: string;
  currentPath?: string; // To display the current path if it already exists in the database
  accept?: string; //  to filter file types
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function FormInputFile({
  label,
  comment,
  currentPath,
  //accept = 'image/*',
  accept = '.png,.jpg',
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="mb-3">
      {/* Aligning the label and the comment on the same line */}
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {comment && (
          <span className="text-xs italic text-gray-400">{comment}</span>
        )}
      </div>

      {/* Displays the current path if the image has already been saved */}
      {currentPath && (
        <p className="text-xs text-gray-500 mb-1.5 truncate">
          Current : <span className="font-mono">{currentPath}</span>
        </p>
      )}

      {/* Native input element styled to match your Tailwind design system */}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onChange(file); // Passes the selected file to the parent component
        }}
        className="
          w-full
          text-sm
          text-gray-500
          file:mr-4
          file:py-2
          file:px-4
          file:rounded-md
          file:border
          file:border-gray-300
          file:text-sm
          file:font-medium
          file:bg-gray-50
          file:text-gray-700
          hover:file:bg-gray-100
          cursor-pointer
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      />
    </div>
  );
}
