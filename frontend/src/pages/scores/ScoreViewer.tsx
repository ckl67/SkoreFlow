import { useParams } from 'react-router-dom';
import { useScoreFile } from '../../hooks/scores/useScoreFile';

export default function ScoreViewer() {
  const { id } = useParams<{ id: string }>();

  const scoreId = Number(id);

  console.log('score', 'ScoreViewer Request for  ', scoreId);
  const fileURL = useScoreFile(scoreId);

  if (!fileURL) {
    return <div className="flex h-screen items-center justify-center">Loading score...</div>;
  }

  return (
    <div className="h-screen">
      <iframe src={fileURL} title="Score" className="h-full w-full" />
    </div>
  );
}
