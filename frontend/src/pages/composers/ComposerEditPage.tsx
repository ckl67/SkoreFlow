import { useParams, useNavigate } from 'react-router-dom';
import useGetComposer from '../../hooks/composers/useGetComposer';
import FormInput from '../../components/forms/FormInput';
import SubmitButton from '../../components/forms/SubmitButton';
import { useEffect, useState } from 'react';
import FormCheckbox from '../../components/forms/FormCheckbox';
import { useComposersPicture } from '../../hooks/composers/useComposersPicture';
import FormInputFile from '../../components/forms/FormInputFile';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserRole } from '../../../../shared/frontend/enums/userRoles';
import { ArrowLeft, User } from 'lucide-react';

// --------------------------------------------------------
// Routes →       Page       →      Hook      →   Service
// Routes → ComposerEditPage → useGetComposer → getComposer → apiRequest → Backend.
//                 X
// --------------------------------------------------------
export default function ComposerEditPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = params.id;
  const pComposerId = Number(id);

  if (!id || !Number.isInteger(pComposerId) || pComposerId <= 0) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 font-medium">
        Invalid composer ID
      </div>
    );
  }

  // Get Composer
  const { composer } = useGetComposer(pComposerId);
  // Picture
  const pictureURL = useComposersPicture(pComposerId);

  // Declare local state
  const [cName, SetCName] = useState('');
  const [cEpoch, SetCEpoch] = useState('');
  const [cExternalUrl, SetCExternalUrl] = useState('');
  const [cisVerified, SetCIsVerified] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );

  // Updates the local state as soon as the composer is loaded
  useEffect(() => {
    if (composer) {
      SetCName(composer.name);
      SetCEpoch(composer.epoch);
      SetCExternalUrl(composer.external_url);
      SetCIsVerified(composer.isVerified);
    }
  }, [composer]);

  if (!composer) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 font-medium">
        Loading composer...
      </div>
    );
  }

  // Handler
  function handleSubmit() {
    // Save logic here
  }
  function handleEpochBlur() {
    if (!cEpoch) return;

    // We clean up and format the text properly ONLY once the user has finished typing
    const formatted = cEpoch
      .split(',') // 1. Split ONLY by commas
      .map((item) => item.trim()) // 2. Remove any extra spaces at the start and end of each term
      .filter((item) => item !== '') // 3. We remove empty elements (e.g. if the user has entered an extra comma)
      .map(
        (item) =>
          item
            .split(/\s+/) // 4. Split the term into words (based on one or more spaces)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') // 5. Rewrite the term with a single space between each word
      )
      .join(', '); // 4. We neatly rejoin the elements with ", "

    SetCEpoch(formatted);
  }

  const { user } = useAuth();

  return (
    <div className="py-4 px-4">
      {/* Optional back button */}
      <div className="w-full max-w-xl mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
      </div>

      <div
        className="
        mx-auto
        w-full max-w-xl
       bg-bg-gray-100
       border border-gray-200 rounded-2xl shadow-xl
       p-8
       space-y-6
       flex flex-col items-center
       "
      >
        {/* Header: Photo and Title */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          {pictureURL ? (
            <img
              src={pictureURL}
              alt={composer.name}
              className="h-16 w-16 rounded-xl object-cover shadow-md shrink-0"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 text-2xl font-bold shadow-sm shrink-0">
              {composer.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
              ID #{composer.id}
            </span>
            <h1 className="text-xl font-bold text-gray-900">Edit Composer</h1>
            <p className="text-sm text-gray-500">
              Update the details for {composer.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
            <FormInput
              label="Name :"
              value={cName}
              onChange={SetCName}
            />

            {/* ---- Input File Picture --- */}
            <FormInputFile
              label="Picture :"
              comment="(.jpg/.png)"
              fileName={selectedPictureFile?.name || composer.picture}
              onChange={setSelectedPictureFile}
            />

            {/* ---- Epoch --- */}
            <FormInput
              label="Epoch :"
              value={cEpoch}
              //onChange={() => {}}
              onChange={SetCEpoch}
              onBlur={handleEpochBlur}
              comment=" (Each Epoch must be separated with comma)"
            />

            {/* ---- External URL --- */}
            <FormInput
              label="External URL link :"
              value={cExternalUrl}
              onChange={SetCExternalUrl}
            />

            {/* Verified status
            On click:
            When the user clicks the checkbox,
            the native onChange event retrieves e.target.checked
            (which represents the checkbox’s Boolean state)
            and triggers SetCIsVerified,
            which updates the local state in real time!
            */}
            {user?.role === UserRole.Moderator ||
            user?.role === UserRole.Admin ? (
              <div className="pt-2">
                <FormCheckbox
                  label="Is Verified"
                  checked={cisVerified}
                  onChange={SetCIsVerified}
                />
              </div>
            ) : (
              <div className="pt-2 ">
                <FormCheckbox
                  label="Is Verified"
                  checked={cisVerified}
                  onChange={SetCIsVerified}
                  disabled={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-gray-100 flex justify-center">
          {user?.role === UserRole.Moderator ||
          user?.role === UserRole.User ||
          user?.role === UserRole.Admin ? (
            <div className="w-full sm:w-auto">
              <SubmitButton
                label="Save Changes"
                disabled={false}
              />
            </div>
          ) : (
            <div className="w-full sm:w-auto">
              <SubmitButton
                label="Save Changes - Not Allowed"
                disabled={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
