import { ComposerPublicResponse } from '../../../../shared/types/composer';
import { useComposersPicture } from '../../hooks/composers/useComposersPicture';
import { Check, Pencil, X } from 'lucide-react';

type Props = {
  composer: ComposerPublicResponse;
  onSelect: () => void;
  onEdit: () => void;
  userUsedComponent: boolean;
};

export default function ComposerItem({
  composer,
  onSelect,
  onEdit,
  userUsedComponent,
}: Props) {
  const pictureURL = useComposersPicture(composer.id);

  return (
    <li
      className="
        rounded-xl bg-gray-400 shadow-md
        transition duration-200 hover:shadow-xl
        flex items-start justify-between
        w-full
        p-4
        cursor-pointer
      "
      onClick={onSelect}
    >
      {/* 1. Left-hand block: Image/Avatar + Details (both using flex) */}
      <div className="flex items-start gap-4 flex-1">
        {pictureURL ? (
          <img
            src={pictureURL}
            alt={composer.name}
            className="h-32 w-32 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 text-2xl font-bold shrink-0">
            {composer.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">{composer.name}</h2>
          <p className="text-sm text-gray-500">{composer.epoch}</p>

          <p>
            <a
              href={composer.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              📖 More information
            </a>
          </p>

          {composer.isVerified ? (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <Check className="w-4 h-4" /> Verified
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
              <X className="w-4 h-4" /> Not verified
            </span>
          )}
        </div>
      </div>

      {/* 2. Right-hand block: The edit button (positioned at the very top right, naturally) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevents the map from opening when clicked
          // Your editing function here
          onEdit();
        }}
        className="p-1.5 text-gray-700 hover:text-indigo-900 hover:bg-white/50 rounded-md transition-colors shrink-0"
        title="Edit this composer"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </li>
  );
}
