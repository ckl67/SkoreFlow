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
      {/* Thumbnail with fixed dimensions and sharp cropping */}
      <div className="h-32 w-24 shrink-0 bg-gray-100 border-r border-gray-100 flex items-center justify-center overflow-hidden">
        {fileURL ? (
          <img src={fileURL} alt={score.name} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
            {score.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Score information */}
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div>
          {/* Display over a maximum of two lines instead of simply truncating */}
          <h2 className="line-clamp-2 text-base font-bold text-gray-900 leading-tight" title={score.name}>
            {score.name}
          </h2>

          <p className="mt-1 text-xs font-semibold text-gray-600">{score.composer.name}</p>
        </div>

        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
          {score.categories && (
            <p className="truncate">
              <span className="font-medium text-gray-700">Cat:</span> {score.categories}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2 text-[10px] text-gray-400">{score.createdAt}</div>
      </div>
    </li>
  );
}
