import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Music,
  ChevronLeft,
  ChevronRight,
  Library,
  Filter,
} from 'lucide-react';

import { useComposers } from '../../hooks/composers/useComposers';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';

import ComposerItem from '../../components/composers/ComposersItem';
import FormInput from '../../components/forms/FormInput';
import FormCheckbox from '../../components/forms/FormCheckbox';

import { useDebouncedValue } from '../../tools/tools';

// =====================================================================================
// Specifications
// useSearchParams
//  hook designed to manipulate the search parameters in the URL (the part after ‘?’).
//  const [searchParams, setSearchParams] = useSearchParams();
//  It returns an array containing two elements:
//    - searchParams: a URLSearchParams object used to read the parameters.
//    - setSearchParams: function to modify searchParams and update the URL.
//    For example, with:/composers?page=2&filter=Mozart
//      console.log(searchParams.get('page'));   // "2"
//      console.log(searchParams.get('filter')); // "Mozart"
//      console.log(searchParams.has('page'));   // true
//  setSearchParams
//    setSearchParams({ page: '5' });
//      React Router update the URL : /composers?page=5
// =====================================================================================

export default function ComposersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const filter = String(searchParams.get('filter') ?? ''); // ?? = nullish coalescing operator
  const debouncedFilter = useDebouncedValue(filter.trim(), 500);

  const isVerifiedParam = searchParams.get('verified');
  const isVerified = isVerifiedParam === null ? true : isVerifiedParam === '1';

  const mineParam = searchParams.get('mine');
  const isMine = mineParam === null ? true : mineParam === '1';

  const onlyMine = !user
    ? false
    : user.role === UserRole.Moderator
      ? isMine
      : true;

  /*************************************************
   * Complete the URL with `page` information
   * @param nextPage
   *  * number, or
   *  * function that calculates the new number from the old one
   *************************************************/
  function setPage(nextPage: number | ((current: number) => number)) {
    //  typeof allows us to determine number or function .
    const resolvedPage =
      typeof nextPage === 'function' ? nextPage(page) : nextPage;

    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);

        if (resolvedPage <= 1) {
          // On page 1 delete the page to keep only : /composers
          params.delete('page');
        } else {
          params.set('page', String(resolvedPage));
        }

        return params;
      },
      // to avoid navigation history !
      { replace: true }
    );
  }

  /**************************************************
   * Complete the URL with `filter` information
   * @param newFilter
   *  * String
   *************************************************/
  function setFilter(newFilter: string) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      if (newFilter) {
        params.set('filter', newFilter);
      } else {
        params.delete('filter');
      }

      params.delete('page');
      return params;
    });
  }

  function setIsVerified(checked: boolean) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      if (checked) {
        params.delete('verified');
      } else {
        params.set('verified', '0');
      }

      params.delete('page');
      return params;
    });
  }

  function setIsMine(checked: boolean) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      if (checked) {
        params.delete('mine');
      } else {
        params.set('mine', '0');
      }

      params.delete('page');
      return params;
    });
  }

  const { composers, totalPages } = useComposers(
    page,
    onlyMine,
    isVerified,
    debouncedFilter
  );

  const canCreateComposer =
    user?.role === UserRole.User ||
    user?.role === UserRole.Moderator ||
    user?.role === UserRole.Admin;

  const isLoading = false;

  function handleCreateClick() {
    navigate('/composers/create');
  }

  const previousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setPage((current) => Math.min(Math.max(1, totalPages), current + 1));
  };

  const pageTitle = !onlyMine
    ? 'Explore composers'
    : user?.username
      ? `${user.username}'s composers`
      : 'My composers';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
                <Library className="h-7 w-7" />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                  Composer library
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {pageTitle}
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Discover composers, explore their musical works and manage
                  your collection.
                </p>
              </div>
            </div>
            <div>
              <FormInput
                label="Filter :"
                value={filter}
                //onChange={() => {}}
                onChange={setFilter}
                //disabled={!canEdit}
              />
            </div>
            <div>
              <FormCheckbox
                label="Verified"
                checked={isVerified}
                onChange={setIsVerified}
              />

              {user?.role === UserRole.Moderator && (
                <FormCheckbox
                  label="Only Mine"
                  checked={isMine}
                  onChange={setIsMine}
                />
              )}
            </div>
            {canCreateComposer && (
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4 text-indigo-500" />
                New Composer
              </button>
            )}
          </div>
        </div>

        {/* Composers Grid */}
        {composers.length > 0 ? (
          <ul className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {composers.map((composer) => (
              <ComposerItem
                key={composer.id}
                composer={composer}
                onSelect={() =>
                  navigate(
                    `/scores?composer=${encodeURIComponent(composer.name)}`
                  )
                }
                //onEdit={() => navigate(`/composers/${composer.id}/edit`)}
                // /composers/123/edit?page=5
                onEdit={() => {
                  const query = searchParams.toString();
                  navigate(
                    query
                      ? `/composers/${composer.id}/edit?${query}`
                      : `/composers/${composer.id}/edit`
                  );
                }}
                userUsedComponent
              />
            ))}
          </ul>
        ) : (
          /* Empty State */
          <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white px-6 py-20 text-center shadow-sm">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-50" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-50" />

            <div className="relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Library className="h-9 w-9" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Your composer library is waiting
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                No composers found yet. Start building your collection by adding
                your composer.
              </p>

              {canCreateComposer && (
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Create your composer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={previousPage}
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
              <span className="text-sm font-bold text-indigo-600">{page}</span>
              <span className="text-sm text-slate-400">/ {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={page >= totalPages || isLoading}
              aria-label="Next page"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
