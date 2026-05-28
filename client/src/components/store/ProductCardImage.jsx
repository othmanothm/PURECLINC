import PropTypes from 'prop-types';

const VARIANT_RADIUS = {
  patient: 'rounded-lg',
  public: 'rounded-xl',
};

const SIZE_STYLES = {
  card: 'mb-3 h-[240px]',
  detail: 'mb-0 h-[380px]',
};

const IMAGE_PADDING = {
  card: 'px-2.5 py-1',
  detail: 'p-3',
};

const IMAGE_CLASS = {
  card: 'block h-auto w-auto max-h-[220px] max-w-full object-contain object-center',
  detail: 'block h-auto w-auto max-h-full max-w-full object-contain object-center',
};

function PlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-12 w-12 shrink-0 text-slate-300"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0021.75 5.25h-16.5A1.5 1.5 0 003.75 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

export default function ProductCardImage({
  src,
  alt = '',
  variant = 'patient',
  size = 'card',
  dimmed = false,
  className = '',
}) {
  const radius = VARIANT_RADIUS[variant] || VARIANT_RADIUS.patient;
  const sizeKey = SIZE_STYLES[size] ? size : 'card';

  return (
    <div
      className={[
        'box-border flex w-full items-center justify-center',
        'border border-slate-200/80 bg-white dark:border-slate-600',
        IMAGE_PADDING[sizeKey],
        radius,
        SIZE_STYLES[sizeKey],
        dimmed ? 'opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={IMAGE_CLASS[sizeKey]}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <PlaceholderIcon />
      )}
    </div>
  );
}

ProductCardImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  variant: PropTypes.oneOf(['patient', 'public']),
  size: PropTypes.oneOf(['card', 'detail']),
  dimmed: PropTypes.bool,
  className: PropTypes.string,
};
