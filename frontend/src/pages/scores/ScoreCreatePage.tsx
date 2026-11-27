import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import FormInput from '../../components/forms/FormInput';
import FormInputFile from '../../components/forms/FormInputFile';
import SubmitButton from '../../components/forms/SubmitButton';
import { formatCommaSeparate } from '../../utils/formatters';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';
import { logger } from '../../../logger';
import { ArrowLeft } from 'lucide-react';
import { createScore } from '../../services/scores/scoresService';
import useGetComposer from '../../hooks/composers/useGetComposer';

// --------------------------------------------------------
// Routes →         Page         →   Hook   →    Service
// Routes →    ScoreCreatePage   →          → createScore → apiRequest → Backend
// --------------------------------------------------------

export default function ScoreCreatePage() {
  const params = useParams<{ cid: string }>();
  const id = params.cid;
  const composerId = Number(id);

  // Fetch composer details and existing picture URL
  const { composer } = useGetComposer(composerId);

  const navigate = useNavigate();

  const { user } = useAuth();
  const canCreate =
    user?.role === UserRole.User ||
    user?.role === UserRole.Admin ||
    user?.role === UserRole.Moderator;

  // Form state
  const [name, setName] = useState('');
  const [categories, setCategories] = useState('');
  const [tags, setTags] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  function handleCategoryBlur() {
    if (!categories) return;
    setCategories(formatCommaSeparate(categories));
  }

  function handleTagsBlur() {
    if (!tags) return;
    setTags(formatCommaSeparate(tags));
  }

  async function handleSubmit() {
    if (!canCreate || isSaving) return;

    logger.debug('Score', '(handleSubmit)', 'Form values:', {
      name,
      categories,
      tags,
      external_url: releaseDate,
      selectedPdfFile: selectedPdfFile
        ? {
            name: selectedPdfFile.name,
            size: selectedPdfFile.size,
            type: selectedPdfFile.type,
          }
        : null,
    });

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      logger.debug('Score', 'New Score will save');
      const res = await createScore(
        {
          composerId,
          scoreName: name,
          releaseDate: releaseDate,
          categories,
          tags,
        },
        selectedPdfFile
      );
      setSaveSuccess(res.message);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to create Score'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const scoreNameInitial = name.trim().charAt(0).toUpperCase() || '?';

  // Back to the correct page
  function handleBackClick() {
    const target = `/Scores`;
    //console.log('Navigation target:', target);
    navigate(target);
  }

  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
        {/* Top navigation aligned with the form card */}
        <div className="mx-auto mb-4 w-full max-w-xl">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </button>
        </div>

        {/* Main card */}

        {/* Header */}
        <div className="flex w-full items-center gap-4 border-b border-gray-100 pb-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm">
            {scoreNameInitial}
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              Create Score for {composer?.name}
            </h1>
            <p className="truncate text-sm text-gray-500">
              {name.trim()
                ? `Add ${name.trim()} to the catalog`
                : 'Add a new Score to the catalog '}
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-6">
          <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            <FormInput
              label="Name :"
              value={name}
              onChange={setName}
              disabled={!canCreate}
            />

            <FormInputFile
              label="Score file :"
              comment="(File : .pdf)"
              accept=".pdf"
              fileName={selectedPdfFile?.name}
              onChange={setSelectedPdfFile}
            />

            <FormInput
              label="Category :"
              value={categories}
              onChange={setCategories}
              onBlur={handleCategoryBlur}
              comment="(Each categories must be separated with a comma)"
              disabled={!canCreate}
            />

            <FormInput
              label="Tags :"
              value={tags}
              onChange={setTags}
              onBlur={handleTagsBlur}
              comment="(Each tags must be separated with a comma)"
              disabled={!canCreate}
            />

            <FormInput
              label="Release Date :"
              value={releaseDate}
              onChange={setReleaseDate}
              disabled={!canCreate}
            />
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              {saveSuccess}
            </div>
          )}

          {canCreate && (
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <div className="w-full sm:w-auto">
                <SubmitButton
                  label={isSaving ? 'Saving...' : 'Create Score'}
                  disabled={isSaving}
                  onClick={handleSubmit}
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
