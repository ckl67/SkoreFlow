import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScores } from '../../hooks/scores/useScores';
import ScoreItem from '../../components/scores/ScoresItem';

export default function ScoresPage() {
  const [page, setPage] = useState<number>(1);
  const { scores, isLoading, error, totalPages } = useScores(page);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-center text-4xl font-bold">List of scores</h1>

      {/* Handling loading and error states */}
      {isLoading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* List of scores */}
      {!isLoading && !error && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scores.map((score) => (
            <ScoreItem key={score.id} score={score} onSelect={() => navigate(`/scores/${score.id}`)} />
          ))}
        </ul>
      )}

      {/* Barre de pagination */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || isLoading}
          className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm font-semibold">
          Page {page} sur {totalPages}
        </span>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page >= totalPages || isLoading}
          className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
