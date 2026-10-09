import { logger } from '../../../logger/logger';
import { config } from '../../config/config';

export default function MainPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome to <span className="text-indigo-600">SkoreFlow</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          The natural lifecycle of a musical score
        </p>
      </div>

      {/* Separator */}
      <hr className="my-6 border-gray-200" />

      {/* Acronym S-K-O-R-E */}
      <dl className="space-y-4">
        <div className="flex items-start gap-3">
          <dt className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            S
          </dt>
          <dd>
            <strong className="text-sm font-semibold text-gray-900">
              Score —{' '}
            </strong>
            <span className="text-xs text-gray-600">
              The musical score is the central object of the application.
            </span>
          </dd>
        </div>

        <div className="flex items-start gap-3">
          <dt className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            K
          </dt>
          <dd>
            <strong className="text-sm font-semibold text-gray-900">
              Keep —{' '}
            </strong>
            <span className="text-xs text-gray-600">
              scores safely in a personal library, either locally or through the
              web.
            </span>
          </dd>
        </div>

        <div className="flex items-start gap-3">
          <dt className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            O
          </dt>
          <dd>
            <strong className="text-sm font-semibold text-gray-900">
              Organize —{' '}
            </strong>
            <span className="text-xs text-gray-600">
              scores by composer, title, category, tags, and other relevant
              information.
            </span>
          </dd>
        </div>

        <div className="flex items-start gap-3">
          <dt className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            R
          </dt>
          <dd>
            <strong className="text-sm font-semibold text-gray-900">
              Remark —{' '}
            </strong>
            <span className="text-xs text-gray-600">
              Annotate scores with personal or shared remarks, instructions,
              highlights, and other visual annotations.
            </span>
          </dd>
        </div>

        <div className="flex items-start gap-3">
          <dt className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            E
          </dt>
          <dd>
            <strong className="text-sm font-semibold text-gray-900">
              Exchange —{' '}
            </strong>
            <span className="text-xs text-gray-600">
              and distribute scores between users, groups, and directors, with
              global or user-specific annotations.
            </span>
          </dd>
        </div>
      </dl>

      {/* Summary feed */}
      <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center border border-gray-200">
        <p className="text-xs font-medium text-gray-500">The natural flow:</p>
        <p className="mt-1 text-sm font-semibold text-indigo-900">
          Score <span className="text-indigo-400">→</span> Keep{' '}
          <span className="text-indigo-400">→</span> Organize{' '}
          <span className="text-indigo-400">→</span> Remark{' '}
          <span className="text-indigo-400">→</span> Exchange
        </p>
      </div>
    </div>
  );
}
