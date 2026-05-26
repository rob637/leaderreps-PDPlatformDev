import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-6xl mb-4">♥</p>
      <h1 className="text-2xl font-extrabold text-navy">
        We can&apos;t find that kudos.
      </h1>
      <p className="mt-2 text-navy/60">
        The link may have expired, or you may have mistyped the URL.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 rounded-xl bg-teal text-white font-bold px-6 py-3 hover:bg-teal/90"
      >
        Send a new kudos
      </Link>
    </div>
  );
}
