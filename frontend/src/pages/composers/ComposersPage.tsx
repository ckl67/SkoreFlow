import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useComposers } from '../../hooks/composers/useComposers';
import ComposerItem from '../../components/composers/ComposersItem';

export default function ComposersPage() {
  const [page, setPage] = useState<number>(1);
  const navigate = useNavigate();
  const { composers, totalPages } = useComposers(page);
  const isLoading = false;
  const previousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-center text-4xl font-bold">List of composers</h1>

      {/* List of Composers */}
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {composers.map((composer) => (
          <ComposerItem
            key={composer.id}
            composer={composer}
            onSelect={() =>
              navigate(`/scores?composer=${encodeURIComponent(composer.name)}`)
            }
          />
        ))}
      </ul>

      {/* Barre de pagination */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={previousPage}
          //onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || isLoading}
          className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm font-semibold">
          Page {page} sur {totalPages}
        </span>

        <button
          onClick={nextPage}
          //onClick={() => setPage((prev) => prev + 1)}
          disabled={page >= totalPages || isLoading}
          className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
