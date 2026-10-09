import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScores } from '../../hooks/scores/useScores';
import ScoreItem from '../../components/scores/ScoresItem';
import { useSearchParams } from 'react-router-dom';

export default function ScoresPage() {
  const [searchParams] = useSearchParams();
  const composerFilter = searchParams.get('composer'); // ex: "Beethoven" ou null
  const navigate = useNavigate();

  const [page, setPage] = useState<number>(1);

  // the hook being called during rendering.
  // If composerFilter changes, composerFilter is passed to the hook
  const { scores, isLoading, error, totalPages } = useScores(
    page,
    composerFilter
  );

  const previousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-center text-4xl font-bold">
        {composerFilter
          ? `Partitions of ${composerFilter}`
          : 'All the partitions'}
      </h1>

      {/* Handling loading and error states */}
      {isLoading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* List of scores */}
      {!isLoading && !error && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scores.map((score) => (
            <ScoreItem
              key={score.id}
              score={score}
              onSelect={() => navigate(`/scores/${score.id}`)}
            />
          ))}
        </ul>
      )}

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
