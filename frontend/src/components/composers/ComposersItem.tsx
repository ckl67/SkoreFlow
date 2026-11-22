import type { ComposerPublicResponse } from '../../../../shared/types/composer';
import { useComposersPicture } from '../../hooks/composers/useComposersPicture';

import { Check, Pencil, ExternalLink } from 'lucide-react';

type Props = {
  composer: ComposerPublicResponse;
  onSelect: () => void;
  onEdit: () => void;
  userUsedComponent: boolean;
};

export default function ComposerItem({ composer, onSelect, onEdit }: Props) {
  const pictureURL = useComposersPicture(composer.id);

  return (
    <li
      onClick={onSelect}
      className="
        group relative flex w-full cursor-pointer items-start gap-4
        rounded-2xl border border-slate-200/80 bg-gray-100 p-4
        shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-indigo-200
        hover:shadow-lg hover:shadow-slate-200/60
      "
    >
      {/* Composer picture */}
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-indigo-50 to-slate-100 sm:h-28 sm:w-28">
        {pictureURL ? (
          <img
            src={pictureURL}
            alt={composer.name}
            className="
              h-full w-full object-cover
              transition-transform duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-indigo-400">
            {composer.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Composer information */}
      <div className="min-w-0 flex-1 pt-1">
        <h2
          className="
          wrap-break-word pr-7 text-lg font-semibold tracking-tight
          text-slate-800 transition-colors
          group-hover:text-indigo-700
        "
        >
          {composer.name}
        </h2>

        {/* Musical period */}
        <div className="mt-2">
          <span
            className="
            inline-flex items-center rounded-full
            bg-indigo-50 px-2.5 py-1
            text-xs font-medium text-indigo-600
          "
          >
            {composer.epoch}
          </span>
        </div>

        {/* External information */}
        {composer.external_url && (
          <a
            href={composer.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="
              mt-3 inline-flex items-center gap-1.5
              text-xs font-medium text-slate-400
              transition-colors hover:text-indigo-600
            "
          >
            More information
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Verification status */}
        <div className="mt-3">
          {composer.isVerified ? (
            <span
              className="
              inline-flex items-center gap-1
              rounded-full bg-emerald-50 px-2 py-1
              text-xs font-medium text-emerald-700
            "
            >
              <Check className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span
              className="
              inline-flex items-center gap-1
              rounded-full bg-slate-100 px-2 py-1
              text-xs font-medium text-slate-500
            "
            >
              Not verified
            </span>
          )}
        </div>
      </div>

      {/* Edit action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        title="Edit this composer"
        aria-label={`Edit ${composer.name}`}
        className="
          absolute right-3 top-3
          flex h-8 w-8 items-center justify-center
          rounded-lg text-slate-400
          transition-colors
          hover:bg-indigo-50 hover:text-indigo-600
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-indigo-400
        "
      >
        <Pencil className="h-4 w-4" />
      </button>
    </li>
  );
}
