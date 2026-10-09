import { useParams } from 'react-router-dom';
import { useScoreFile } from '../../hooks/scores/useScoreFile';
import ScoreViewer from '../../components/scores/pdf/ScoreViewer';
import { useScore } from '../../hooks/scores/useScore';

export default function ScoreSinglePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const scoreId = Number(id);

  console.log('score', '[ScoreSinglePage] scoreId ', scoreId);

  // Recover the blob data
  // We will not return isLoading and error because if something not happen
  // then the possibility is foreseen with {fileURL ?
  const { fileURL, isLoading, error } = useScoreFile(scoreId);

  console.log('score', '[ScoreSinglePage] fileURL', fileURL);

  // Handling the loading status (if the PDF file OR the metadata is currently being loaded)
  if (!fileURL || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading score...
      </div>
    );
  }

  // Error handling if the request failed
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error ?? 'Score not found'}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScoreViewer fileURL={fileURL} />
    </div>
  );
}
