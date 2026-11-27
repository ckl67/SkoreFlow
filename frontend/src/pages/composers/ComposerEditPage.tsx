import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCommaSeparate } from '../../utils/formatters';
import useGetComposer from '../../hooks/composers/useGetComposer';
import { useComposersPicture } from '../../hooks/composers/useComposersPicture';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';

import FormInput from '../../components/forms/FormInput';
import FormInputFile from '../../components/forms/FormInputFile';
import FormCheckbox from '../../components/forms/FormCheckbox';
import SubmitButton from '../../components/forms/SubmitButton';
import { updateComposer } from '../../services/composers/composersService';
import { logger } from '../../../logger';

// --------------------------------------------------------
// Routes →       Page       →      Hook      →   Service
// Routes → ComposerEditPage → useGetComposer → getComposer → apiRequest → Backend
// --------------------------------------------------------
export default function ComposerEditPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEditBasic =
    user?.role === UserRole.User ||
    user?.role === UserRole.Moderator ||
    user?.role === UserRole.Admin;

  const canEditNameVerified =
    user?.role === UserRole.Moderator || user?.role === UserRole.Admin;

  const params = useParams<{ id: string }>();
  const id = params.id;
  const pComposerId = Number(id);
  const isValidId = Boolean(
    id && Number.isInteger(pComposerId) && pComposerId > 0
  );

  // Fetch composer details and existing picture URL
  const { composer } = useGetComposer(isValidId ? pComposerId : 0);

  const pictureURL = useComposersPicture(isValidId ? pComposerId : 0, true);

  // Local form state
  const [cName, setCName] = useState('');
  const [cEpoch, setCEpoch] = useState('');
  const [cExternalUrl, setCExternalUrl] = useState('');
  const [cIsVerified, setCIsVerified] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );
  // Store the temporary preview URL for the newly selected local file
  const [previewPictureURL, setPreviewPictureURL] = useState<string | null>(
    null
  );

  // Submit
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Navigation
  const location = useLocation();
  //console.log('Edit location:', location);
  //console.log('Edit search:', location.search);

  // --------------------------------------------------------
  // Create and clean up the object URL whenever
  // selectedPictureFile changes
  // --------------------------------------------------------
  useEffect(() => {
    // If no file is selected, ensure no stale preview URL remains
    if (!selectedPictureFile) {
      setPreviewPictureURL(null);
      return;
    }

    // Generate a temporary browser URL for the selected file
    const objectUrl = URL.createObjectURL(selectedPictureFile);
    setPreviewPictureURL(objectUrl);

    // Clean up the object URL when the file changes or the component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPictureFile]);

  // --------------------------------------------------------
  // Populate local form state once the composer data is loaded
  // --------------------------------------------------------
  useEffect(() => {
    if (composer) {
      setCName(composer.name);
      setCEpoch(composer.epoch);
      setCExternalUrl(composer.external_url);
      setCIsVerified(composer.isVerified);
    }
  }, [composer]);

  // --------------------------------------------------------
  // Guard: Invalid route parameter
  // --------------------------------------------------------
  if (!isValidId) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-red-600">
        Invalid composer ID
      </div>
    );
  }

  // --------------------------------------------------------
  // Guard: Loading state while fetching composer data
  // --------------------------------------------------------
  if (!composer) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-gray-500">
        Loading composer...
      </div>
    );
  }

  // --------------------------------------------------------
  // Recompute `isVerified` based on whether the tracked fields
  // match the original `composer` values
  // --------------------------------------------------------
  function syncIsVerified(nextState: {
    epoch: string;
    externalUrl: string;
    pictureFile: File | null;
  }) {
    if (!composer) return;

    const hasChanges =
      nextState.pictureFile !== null ||
      nextState.epoch !== composer.epoch ||
      nextState.externalUrl !== composer.external_url;

    // Restore original verification status when no tracked change remains
    setCIsVerified(hasChanges ? false : composer.isVerified);
  }
  // --------------------------------------------------------
  // Format comma-separated epochs cleanly when the user leaves
  // the input field
  // --------------------------------------------------------
  function handleEpochBlur() {
    if (!cEpoch) return;
    const formatted = formatCommaSeparate(cEpoch);
    setCEpoch(formatted);

    syncIsVerified({
      epoch: formatted,
      externalUrl: cExternalUrl,
      pictureFile: selectedPictureFile,
    });
  }
  // --------------------------------------------------------
  // Handlers to address the setting of isVerified
  // --------------------------------------------------------
  function handlePictureChange(file: File | null) {
    setSelectedPictureFile(file);
    syncIsVerified({
      epoch: cEpoch,
      externalUrl: cExternalUrl,
      pictureFile: file,
    });
  }

  function handleExternalUrlChange(value: string) {
    setCExternalUrl(value);
    syncIsVerified({
      epoch: cEpoch,
      externalUrl: value,
      pictureFile: selectedPictureFile,
    });
  }

  // --------------------------------------------------------
  // Handle form submission
  // The `await` keyword pauses the execution of the function
  // whilst waiting for a Promise (updateComposer(...)) to resolve.
  // In JavaScript, `await` is only permitted within a function
  // declared as `async` (which itself implicitly returns a Promise).
  // --------------------------------------------------------
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

    if (!canEditBasic || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      console.log('Will run Update');
      const res = await updateComposer(
        pComposerId,
        {
          externalURL: cExternalUrl,
          epoch: cEpoch,
          isVerified: cIsVerified,
        },
        selectedPictureFile
      );

      if (!res) {
        setSaveError('Authentication token missing');
        return;
      }

      // Mandatory to remove the preview picture.
      //setSelectedPictureFile(null);

      setSaveSuccess(res.message || 'Composer updated successfully');
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update composer'
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Prioritize the newly selected picture preview over the existing backend picture
  const displayedPicture = previewPictureURL || pictureURL;

  // Back to the correct page
  function handleBackClick() {
    const target = `/composers${location.search}`;
    //console.log('Navigation target:', target);
    navigate(target);
  }

  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-8">
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
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
        {/* Card Header: Avatar/Picture and Title */}
        <div className="flex w-full items-center gap-4 border-b border-gray-100 pb-6">
          {displayedPicture ? (
            <img
              src={displayedPicture}
              alt={composer.name}
              className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm">
              {composer.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <span className="mb-1 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              ID #{composer.id}
            </span>
            <h1 className="text-xl font-bold text-gray-900">
              {canEditBasic ? 'Edit Composer' : 'View Composer'}
            </h1>
            {canEditBasic && (
              <p className="truncate text-sm text-gray-500">
                Update the details for {composer.name}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-6">
          <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            {/* Composer Name */}
            <FormInput
              label="Name :"
              value={cName}
              onChange={setCName}
              disabled={!canEditNameVerified}
            />

            {/* Composer Picture Upload */}
            {canEditBasic && (
              <FormInputFile
                label="Picture :"
                comment="(File .jpg / .png)"
                fileName={selectedPictureFile?.name || composer.picture}
                onChange={handlePictureChange}
              />
            )}

            {/* Composer Epoch */}
            <FormInput
              label="Epoch :"
              value={cEpoch}
              onChange={setCEpoch}
              onBlur={handleEpochBlur}
              comment="(Each epoch must be separated with a comma)"
              disabled={!canEditBasic}
            />

            {/* External Reference URL */}
            <FormInput
              label="External URL link :"
              value={cExternalUrl}
              onChange={handleExternalUrlChange}
              disabled={!canEditBasic}
            />

            {/* Verified Status (editable only by Moderators and Admins) */}
            <div className="pt-2">
              <FormCheckbox
                label="Is Verified"
                checked={cIsVerified}
                onChange={setCIsVerified}
                disabled={!canEditNameVerified}
              />
            </div>
          </div>

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
          {canEditBasic && (
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <div className="w-full sm:w-auto">
                <SubmitButton
                  label={
                    !canEditBasic
                      ? 'Save Not Allowed'
                      : isSaving
                        ? 'Saving...'
                        : 'Save Changes'
                  }
                  disabled={!canEditBasic || isSaving}
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
