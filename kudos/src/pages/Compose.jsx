import ComposeForm from '../components/ComposeForm.jsx';

export default function Compose() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <section className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
          Send a kudos.{' '}
          <span className="text-teal">Make someone&apos;s day.</span>
        </h1>
        <p className="mt-3 text-navy/70">
          100% anonymous appreciation, gently checked by AI so it always lands
          kind.
        </p>
      </section>

      <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
        <ComposeForm />
      </div>
    </div>
  );
}
