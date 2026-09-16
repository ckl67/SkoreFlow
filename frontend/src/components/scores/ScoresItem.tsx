import { ScorePublicResponse } from '../../../../shared/types/score';
import { useScoresThumbnail } from '../../hooks/scores/useScoreFile';

type Props = {
  score: ScorePublicResponse;
  onSelect: () => void;
};

// 'key' is never passed in the 'props' object
// For
//   <ScoreItem key={score.id} score={score} onSelect={() => navigate(`/scores/${score.id}`)} />
// There are only 2 parameters
export default function ScoreItem({ score, onSelect }: Props) {
  const fileURL = useScoresThumbnail(score.id);

  return (
    <li
      onClick={onSelect}
      className="group flex cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="h-44 w-36 shrink-0 bg-gray-100">
        {fileURL ? (
          <img src={fileURL} alt={score.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
            {score.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Score information */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div>
          <h2 className="truncate text-lg font-extrabold text-gray-900">{score.name}</h2>

          <p className="mt-1 text-sm font-medium text-gray-600">{score.composer.name}</p>
        </div>

        <div className="mt-3 space-y-1.5">
          {score.categories && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Category:</span> {score.categories}
            </p>
          )}

          {score.tags && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Tags:</span> {score.tags}
            </p>
          )}
        </div>

        <div className="mt-auto pt-3 text-xs text-gray-400">{score.createdAt}</div>
      </div>
    </li>
  );
}
