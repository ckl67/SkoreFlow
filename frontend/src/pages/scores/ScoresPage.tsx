import { useScores } from '../../hooks/scores/useScores';
import ScoreItem from '../../components/scores/ScoresItem';

export default function ScoresPage() {
  const { scores } = useScores();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-center text-4xl font-bold">List of scores</h1>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scores.map((score) => (
          <ScoreItem key={score.id} score={score} />
        ))}
      </ul>
    </div>
  );
}
