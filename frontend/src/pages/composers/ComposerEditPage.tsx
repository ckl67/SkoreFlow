import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import useGetComposer from '../../hooks/composers/useGetComposer';
import { useComposersPicture } from '../../hooks/composers/useComposersPicture';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';

import FormInput from '../../components/forms/FormInput';
import FormInputFile from '../../components/forms/FormInputFile';
import FormCheckbox from '../../components/forms/FormCheckbox';
import SubmitButton from '../../components/forms/SubmitButton';
import { updateComposer } from '../../services/composers/composersService';

// --------------------------------------------------------
// Routes →       Page       →      Hook      →   Service
// Routes → ComposerEditPage → useGetComposer → getComposer → apiRequest → Backend
// --------------------------------------------------------
export default function ComposerEditPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Permission checks based on the authenticated user's role
  const canVerify =
    user?.role === UserRole.Moderator || user?.role === UserRole.Admin;

  const canEdit =
    //user?.role === UserRole.User ||
    user?.role === UserRole.Moderator || user?.role === UserRole.Admin;

  const params = useParams<{ id: string }>();
  const id = params.id;
  const pComposerId = Number(id);
  const isValidId = Boolean(
    id && Number.isInteger(pComposerId) && pComposerId > 0
  );

  // Fetch composer details and existing picture URL
  const { composer } = useGetComposer(isValidId ? pComposerId : 0);

  const pictureURL = useComposersPicture(isValidId ? pComposerId : 0);

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

  // Create and clean up the object URL whenever selectedPictureFile changes
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

  // Populate local form state once the composer data is loaded
  useEffect(() => {
    if (composer) {
      setCName(composer.name);
      setCEpoch(composer.epoch);
      setCExternalUrl(composer.external_url);
      setCIsVerified(composer.isVerified);
    }
  }, [composer]);

  // Guard: Invalid route parameter
  if (!isValidId) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-red-600">
        Invalid composer ID
      </div>
    );
  }

  // Guard: Loading state while fetching composer data
  if (!composer) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-gray-500">
        Loading composer...
      </div>
    );
  }

  // Format comma-separated epochs cleanly when the user leaves the input field
  function handleEpochBlur() {
    if (!cEpoch) return;

    const formatted = cEpoch
      .split(',') // 1. Split ONLY by commas
      .map((item) => item.trim()) // 2. Trim leading and trailing spaces for each entry
      .filter((item) => item !== '') // 3. Remove empty entries (e.g., extra commas)
      .map(
        (item) =>
          item
            .split(/\s+/) // 4. Split each multi-word epoch by whitespace
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // 5. Capitalize every word
            .join(' ') // 6. Rejoin words with a single space
      )
      .join(', '); // 7. Rejoin epochs with ", "

    setCEpoch(formatted);
  }

  // Handle form submission
  // The `await` keyword pauses the execution of the function
  // whilst waiting for a Promise (updateComposer(...)) to resolve.
  // In JavaScript, `await` is only permitted within a function
  // declared as `async` (which itself implicitly returns a Promise).
  async function handleSubmit() {
    // Log current form state values (not the setter functions)
    console.log({
      name: cName,
      epoch: cEpoch,
      external_url: cExternalUrl,
      isVerified: cIsVerified,
      selectedPictureFile,
    });

    if (!canEdit || isSaving) return;

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

  // React Router stores a numerical index (idx) in `window.history.state`: 0
  // means that the current page is the first entry in the tab’s browsing history.
  // Navigate back if internal history exists, otherwise fallback to the root route
  function handleBackClick() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
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
              {canEdit ? 'Edit Composer' : 'View Composer'}
            </h1>
            {canEdit && (
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
              disabled={!canEdit}
            />

            {/* Composer Picture Upload */}
            {canEdit && (
              <FormInputFile
                label="Picture :"
                comment="(.jpg / .png)"
                fileName={selectedPictureFile?.name || composer.picture}
                onChange={setSelectedPictureFile}
              />
            )}

            {/* Composer Epoch */}
            <FormInput
              label="Epoch :"
              value={cEpoch}
              onChange={setCEpoch}
              onBlur={handleEpochBlur}
              comment="(Each epoch must be separated with a comma)"
              disabled={!canEdit}
            />

            {/* External Reference URL */}
            <FormInput
              label="External URL link :"
              value={cExternalUrl}
              onChange={setCExternalUrl}
              disabled={!canEdit}
            />

            {/* Verified Status (editable only by Moderators and Admins) */}
            <div className="pt-2">
              <FormCheckbox
                label="Is Verified"
                checked={cIsVerified}
                onChange={setCIsVerified}
                disabled={!canVerify}
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
          {canEdit && (
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <div className="w-full sm:w-auto">
                <SubmitButton
                  label={
                    !canEdit
                      ? 'Save Not Allowed'
                      : isSaving
                        ? 'Saving...'
                        : 'Save Changes'
                  }
                  disabled={!canEdit || isSaving}
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
