import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useComposers } from '../../hooks/composers/useComposers';
import ComposerItem from '../../components/composers/ComposersItem';

import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';

export default function ComposersPage() {
  const { user } = useAuth();

  const onlyMine = user ? user.role !== UserRole.Moderator : false;

  const [page, setPage] = useState<number>(1);
  const navigate = useNavigate();
  const { composers, totalPages } = useComposers(page, onlyMine);
  const isLoading = false;
  const previousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    // Size of items : max-w-7xl provides more space (around 1280px)
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-8 text-center text-4xl font-bold">
        {!onlyMine
          ? 'List of all composers'
          : user?.username
            ? `List of ${user.username}'s composers`
            : 'List of my composers'}
      </h1>

      {/* List of Composers */}
      {/*
        grid-cols-1: 1 column on mobile
        md:grid-cols-2: 2 columns on tablet
        xl:grid-cols-3: 3 columns on very large screens
      */}
      <ul
        className="
      grid
      grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      gap-4
      w-full"
      >
        {composers.map((composer) => (
          <ComposerItem
            key={composer.id}
            composer={composer}
            onSelect={() =>
              navigate(`/scores?composer=${encodeURIComponent(composer.name)}`)
            }
            onEdit={() => navigate(`/composers/${composer.id}/edit`)}
            userUsedComponent
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
