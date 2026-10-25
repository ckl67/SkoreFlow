import { useParams } from 'react-router-dom';
import { useScoreFile } from '../../hooks/scores/useScoreFile';
import ScoreViewer from '../../components/scores/pdf/ScoreViewer';
import { useScore } from '../../hooks/scores/useScore';

/**
 * ScoreSinglePage handles the route parameter for a score, fetches its PDF file,
 * and manages loading and error states before rendering the score viewer.
 *
 * @returns The rendered ScoreSinglePage component or a loading/error state view.
 */
export default function ScoreSinglePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const scoreId = Number(id);

  // Recover the blob data
  const {
    fileURL,
    isLoading: isLoadingPDFData,
    error: errorPDFData,
  } = useScoreFile(scoreId);

  // Get Single score information
  const {
    score,
    isLoading: isLoadingScore,
    error: isErrorScore,
  } = useScore(scoreId);

  console.log(
    'score',
    '[ScoreSinglePage] scoreId :',
    scoreId,
    'fileURL :',
    fileURL
  );

  // Handling the loading status (if the PDF file OR the metadata is currently being loaded)
  if (!fileURL || isLoadingPDFData || !score || isLoadingScore) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading score...Info and data
      </div>
    );
  }

  // Error handling if the request failed
  if (errorPDFData) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {errorPDFData ?? 'Score pdf not found'}
      </div>
    );
  }

  if (isErrorScore) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {isErrorScore ?? 'Score info not found'}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScoreViewer
        score={score}
        fileURL={fileURL}
      />
    </div>
  );
}
