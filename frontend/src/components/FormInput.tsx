type Props = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function FormInput({ label, type = 'text', value, onChange, placeholder }: Props) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium">{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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
