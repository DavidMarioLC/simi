import icon from '../assets/simi-icon.svg?raw';

// Trusted, bundled SVG: the same master is used to export the browser icons.
const markup = { __html: icon };

export function BrandIcon({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block shrink-0 overflow-hidden ${className}`} dangerouslySetInnerHTML={markup} />;
}
