import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import FormInput from '../../components/forms/FormInput';
import FormInputFile from '../../components/forms/FormInputFile';
import SubmitButton from '../../components/forms/SubmitButton';
import { formatCommaSeparate } from '../../utils/formatters';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';
import { createComposer } from '../../services/composers/composersService';
import { logger } from '../../../logger';
import { ArrowLeft } from 'lucide-react';

// --------------------------------------------------------
// Routes →         Page         →   Hook   →    Service
// Routes → ComposerCreatePage →          → createComposer → apiRequest → Backend
// --------------------------------------------------------

export default function ComposerCreatePage() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const canCreate =
    user?.role === UserRole.User ||
    user?.role === UserRole.Admin ||
    user?.role === UserRole.Moderator;

  // Form state
  const [name, setName] = useState('');
  const [epoch, setEpoch] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );
  const [previewPictureURL, setPreviewPictureURL] = useState<string | null>(
    null
  );

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Manage temporary object URL for local image preview
  useEffect(() => {
    if (!selectedPictureFile) {
      setPreviewPictureURL(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedPictureFile);
    logger.debug('composer', 'objectUrl from', objectUrl);
    setPreviewPictureURL(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPictureFile]);

  function handleEpochBlur() {
    if (!epoch) return;
    setEpoch(formatCommaSeparate(epoch));
  }

  async function handleSubmit() {
    if (!canCreate || isSaving) return;

    logger.debug('composer', '(handleSubmit)', 'Form values:', {
      name,
      epoch,
      external_url: externalUrl,
      selectedPictureFile: selectedPictureFile
        ? {
            name: selectedPictureFile.name,
            size: selectedPictureFile.size,
            type: selectedPictureFile.type,
          }
        : null,
    });

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      logger.debug('composer', 'New composer will save');
      const res = await createComposer(
        {
          name,
          externalURL: externalUrl,
          epoch,
        },
        selectedPictureFile
      );
      setSaveSuccess(res.message);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to create composer'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const avatarInitial = name.trim().charAt(0).toUpperCase() || '?';

  // Back to the correct page
  function handleBackClick() {
    const target = `/composers`;
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
          {previewPictureURL ? (
            <img
              src={previewPictureURL}
              alt={name || 'Composer preview'}
              className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm">
              {avatarInitial}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Create Composer</h1>
            <p className="truncate text-sm text-gray-500">
              {name.trim()
                ? `Add ${name.trim()} to the catalog`
                : 'Add a new composer to the catalog'}
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
              label="Picture :"
              comment="(File : .jpg / .png)"
              fileName={selectedPictureFile?.name}
              onChange={setSelectedPictureFile}
            />

            <FormInput
              label="Epoch :"
              value={epoch}
              onChange={setEpoch}
              onBlur={handleEpochBlur}
              comment="(Each epoch must be separated with a comma)"
              disabled={!canCreate}
            />

            <FormInput
              label="External URL link :"
              value={externalUrl}
              onChange={setExternalUrl}
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
                  label={isSaving ? 'Saving...' : 'Create Composer'}
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
