import { useParams } from 'react-router-dom';
import useGetComposer from '../../hooks/composers/useGetComposer';
import FormInput from '../../components/forms/FormInput';
import SubmitButton from '../../components/forms/SubmitButton';
import { useEffect, useState } from 'react';
import FormCheckbox from '../../components/forms/FormCheckbox';

// --------------------------------------------------------
// Routes →       Page       →      Hook      →   Service
// Routes → ComposerEditPage → useGetComposer → getComposer → apiRequest → Backend.
//                 X
// --------------------------------------------------------
export default function ComposerEditPage() {
  // Local
  const params = useParams<{ id: string }>();
  const id = params.id;
  const pComposerId = Number(id);

  if (!id || !Number.isInteger(pComposerId) || pComposerId <= 0) {
    return <div>Invalid composer ID</div>;
  }

  // Get Composer
  const { composer } = useGetComposer(pComposerId);

  // 1. Declare local state
  const [cName, SetCName] = useState('');

  // 2. Updates the local state as soon as the composer is loaded
  useEffect(() => {
    if (composer) {
      SetCName(composer.name);
    }
  }, [composer]);

  if (!composer) {
    return <div>Loading composer...</div>;
  }

  // Handler
  function handleSubmit() {}

  return (
    <div>
      <div className="text-sm text-gray-500 mb-4">
        ID of the composer currently being edited: {composer.id}
      </div>

      <FormInput
        label="Name :"
        value={cName}
        onChange={SetCName}
      />

      <FormInput
        label="Picture :"
        value={String(composer.picture)}
        onChange={() => {}} // Function is empty because the field is not editable
        disabled={true}
      />

      <FormInput
        label="External url link : "
        value={String(composer.external_url)}
        onChange={() => {}} // Function is empty because the field is not editable
        disabled={true}
      />

      <FormInput
        label="Epoch :"
        value={String(composer.epoch)}
        onChange={() => {}} // Function is empty because the field is not editable
        disabled={true}
      />

      <FormCheckbox
        label="isVerified"
        checked={composer.isVerified}
        onChange={() => {}} // Function is empty because the field is not editable
        disabled={false}
      />

      {/* ACTION */}
      <SubmitButton
        label="Save"
        disabled={true}
      />
    </div>
  );
}
