import { useEffect, useState } from 'react';
import FormInput from '../../components/forms/FormInput';
import FormInputFile from '../../components/forms/FormInputFile';
import { formatEpochs } from '../../utils/composers/formatters';

import SubmitButton from '../../components/forms/SubmitButton';

import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';
import { logger } from '../../../logger';
import { createComposer } from '../../services/composers/composersService';

// --------------------------------------------------------
// Routes →       Page         →      Hook      →   Service
// Routes → ComposerCreatePage →                → createComposer → apiRequest → Backend
// --------------------------------------------------------

export default function ComposerCreatePage() {
  const [cName, setCName] = useState('');
  const [cEpoch, setCEpoch] = useState('');
  const [cExternalUrl, setCExternalUrl] = useState('');
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );

  const { user } = useAuth();

  const canCreate =
    user?.role === UserRole.User ||
    user?.role === UserRole.Moderator ||
    user?.role === UserRole.Admin;

  // Store the temporary preview URL for the newly selected local file
  const [previewPictureURL, setPreviewPictureURL] = useState<string | null>(
    null
  );

  // Submit
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Format comma-separated epochs cleanly when the user leaves the input field
  function handleEpochBlur() {
    if (!cEpoch) return;
    setCEpoch(formatEpochs(cEpoch));
  }

  // Create and clean up the object URL whenever selectedPictureFile changes
  useEffect(() => {
    // If no file is selected, ensure no stale preview URL remains
    if (!selectedPictureFile) {
      setPreviewPictureURL(null);
      return;
    }

    // Generate a temporary browser URL for the selected file
    const objectUrl = URL.createObjectURL(selectedPictureFile);
    logger.debug('composer', 'objectUrl from', objectUrl);
    setPreviewPictureURL(objectUrl);

    // Clean up the object URL when the file changes or the component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPictureFile]);

  // Handle form submission
  // The `await` keyword pauses the execution of the function
  // whilst waiting for a Promise (createComposer(...)) to resolve.
  // In JavaScript, `await` is only permitted within a function
  // declared as `async` (which itself implicitly returns a Promise).
  async function handleSubmit() {
    const formValues = {
      name: cName,
      epoch: cEpoch,
      external_url: cExternalUrl,
      selectedPictureFile: selectedPictureFile
        ? {
            name: selectedPictureFile.name,
            size: selectedPictureFile.size,
            type: selectedPictureFile.type,
          }
        : null,
    };

    logger.debug('composer', '(handleSubmit)', 'Form values:', formValues);

    // In case in process
    if (!canCreate || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    // As soon as an exception is thrown or a Promise is rejected
    // (e.g. network error, server returning a 400/500 error in `createComposer`),
    // JavaScript immediately terminates the `try` block and jumps straight to the
    // `catch` block.
    // catch (err) { ... }: catches the error thrown in the try block
    try {
      logger.debug('composer', 'New composer will save');
      const res = await createComposer(
        {
          name: cName,
          externalURL: cExternalUrl,
          epoch: cEpoch,
        },
        selectedPictureFile
      );
      setSaveSuccess(res.message);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update composer'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      {previewPictureURL ? (
        <img
          src={previewPictureURL}
          alt={cName}
          className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm">
          {cName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Form */}
      <form className="mt-6 space-y-6">
        {/* Composer Name */}
        <FormInput
          label="Name :"
          value={cName}
          onChange={setCName}
          disabled={!canCreate}
        />

        <FormInputFile
          label="Picture :"
          comment="(File : .jpg / .png)"
          fileName={selectedPictureFile?.name}
          onChange={setSelectedPictureFile}
        />

        {/* Composer Epoch */}
        <FormInput
          label="Epoch :"
          value={cEpoch}
          onChange={setCEpoch}
          onBlur={handleEpochBlur}
          comment="(Each epoch must be separated with a comma)"
          disabled={!canCreate}
        />

        {/* External Reference URL */}
        <FormInput
          label="External URL link :"
          value={cExternalUrl}
          onChange={setCExternalUrl}
          disabled={!canCreate}
        />

        {/* Feedback messages */}
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

        {/* Form Footer / Submit Action */}
        {canCreate && (
          <div className="flex justify-end border-t border-gray-100 pt-4">
            <div className="w-full sm:w-auto">
              <SubmitButton
                label={
                  !canCreate
                    ? 'Save Not Allowed'
                    : isSaving
                      ? 'Saving...'
                      : 'Save Changes'
                }
                disabled={!canCreate || isSaving}
                onClick={handleSubmit}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
