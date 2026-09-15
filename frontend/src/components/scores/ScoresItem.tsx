import { ScorePublicResponse } from '../../../../shared/types/score';
import { useScoresThumbnail } from '../../hooks/scores/useScoresFile';

type Props = {
  score: ScorePublicResponse;
};

export default function ScoreItem({ score }: Props) {
  const fileURL = useScoresThumbnail(score.id);

  return (
    <div>
      <h2 className="flex items-center font-extrabold">{score.name}</h2>
      <li className=" flex items-center gap-4 rounded-xl bg-gray-400 p-4 shadow-md transition duration-200 hover:shadow-xl ">
        {fileURL ? (
          <img src={fileURL} alt={score.name} className="h-40 w-40 rounded-lg object-cover " />
        ) : (
          <div className=" flex h-20 w-20  items-center justify-center rounded-lg bg-gray-200 text-2xl font-bold ">
            {score.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">{score.composer.name}</p>
          <p className="text-sm text-gray-500">{score.createdAt}</p>
          <p className="text-sm text-gray-500">{score.categories}</p>
          <p className="text-sm text-gray-500">{score.tags}</p>
        </div>
      </li>
    </div>
  );
}
