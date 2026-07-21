import { ComposerPublicResponse } from '../../../../shared/types/composer';
import { useComposersPicture } from '../../hooks/composers/useComposerPicture';

type Props = {
  composer: ComposerPublicResponse;
};

export default function ComposerItem({ composer }: Props) {
  const pictureURL = useComposersPicture(composer.id);

  return (
    <li
      className="
                flex
                items-center
                gap-4
                rounded-xl
                bg-white
                p-4
                shadow-md
                transition
                duration-200
                hover:shadow-xl
            "
    >
      {pictureURL ? (
        <img
          src={pictureURL}
          alt={composer.name}
          className="
                        h-40
                        w-40
                        rounded-lg
                        object-cover
                    "
        />
      ) : (
        <div
          className="
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-lg
                        bg-gray-200
                        text-2xl
                        font-bold
                    "
        >
          {composer.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">{composer.name}</h2>

        <p className="text-sm text-gray-500">{composer.epoch}</p>

        <p className="text-sm text-gray-500">
          <a
            href={composer.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            📖 More information
          </a>
        </p>
        {composer.isVerified && <span className="text-xs text-green-600">Verified</span>}
      </div>
    </li>
  );
}
