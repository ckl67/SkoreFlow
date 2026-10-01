import { useParams } from 'react-router-dom';
import { useScoreFile } from '../../hooks/scores/useScoreFile';
import ScoreViewer from '../../components/scores/pdf/ScoreViewer';
import { useScore } from '../../hooks/scores/useScore';

export default function ScoreSinglePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const scoreId = Number(id);

  console.log('score', '[ScoreSinglePage] scoreId ', scoreId);

  const fileURL = useScoreFile(scoreId);
  const { score, isLoading, error } = useScore(scoreId);

  console.log('score', '[ScoreSinglePage] fileURL', fileURL);

  // Handling the loading status (if the PDF file OR the metadata is currently being loaded)
  if (!fileURL || isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading score...</div>;
  }

  // Error handling if the request failed
  if (error || !score) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error ?? 'Score not found'}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 w-full text-left text-sm font-semibold text-gray-400">{score.score.name}</h1>
      <ScoreViewer fileURL={fileURL} />
    </div>
  );
}
