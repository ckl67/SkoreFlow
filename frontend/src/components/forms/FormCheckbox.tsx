type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function FormCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="
          h-4 w-4
          rounded
          border-gray-300
          text-blue-600
          focus:ring-2
          focus:ring-blue-500
          cursor-pointer
        "
      />
      <label className="text-sm font-medium text-gray-700 cursor-pointer">
        {label}
      </label>
    </div>
  );
}
