import { useComposers } from '../../hooks/composers/useComposers';
import ComposerItem from '../../components/composers/ComposersItem';

export default function ComposersPage() {
  const { composers } = useComposers();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-center text-4xl font-bold">List of composers</h1>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {composers.map((composer) => (
          <ComposerItem key={composer.id} composer={composer} />
        ))}
      </ul>
    </div>
  );
}
