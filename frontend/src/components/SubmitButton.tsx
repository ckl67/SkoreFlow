type Props = {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
};

export default function SubmitButton({ label, onClick, type = 'button', disabled = false }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4
        py-2
        rounded-md
        text-white
        bg-blue-600
        hover:bg-blue-700
        transition
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        disabled:opacity-50
        disabled:cursor-not-allowed
      `}
    >
      {label}
    </button>
  );
}
