type Props = {
  label: string;
  comment?: string;
  type?: string;
  value: string;
  title?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function FormInput({
  label,
  comment,
  type = 'text',
  value,
  title,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
}: Props) {
  return (
    <div className="mb-3">
      {/* Flex container to align the label and the comment on the same line */}
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>

        {/* The comment, if any, is displayed in grey and italics */}
        <span className="text-xs italic text-gray-400">{comment}</span>
      </div>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        title={title}
        className="
            w-full
            rounded-md
            border
            border-gray-300
            px-3
            py-2
            shadow-sm
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500
        "
      />
    </div>
  );
}
