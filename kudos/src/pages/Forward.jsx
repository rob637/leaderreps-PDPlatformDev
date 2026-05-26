import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getKudos } from '../api.js';
import ComposeForm from '../components/ComposeForm.jsx';

/**
 * Pay-it-forward compose form. Loads the parent kudos for chain context,
 * then renders a fresh compose form that submits with parentKudosId set.
 */
export default function Forward() {
  const { parentId } = useParams();
  const [parent, setParent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getKudos(parentId)
      .then((res) => {
        if (!cancelled) setParent(res.kudos);
      })
      .catch(() => {
        /* non-fatal — still allow forwarding */
      });
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <section className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
          Pass it on.
        </h1>
        <p className="mt-3 text-navy/70">
          Send a kudos to someone in <em>your</em> life.
        </p>
      </section>

      <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
        <ComposeForm
          parentKudosId={parentId}
          chainPosition={parent?.chainPosition ?? null}
        />
      </div>
    </div>
  );
}
