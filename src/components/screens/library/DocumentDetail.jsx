import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, FileText } from 'lucide-react';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const DocumentDetail = (props) => {
  const { db, navigate } = useAppServices();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const docId = props.id || props.navParams?.id;
  const fromProgram = props.fromProgram || props.navParams?.fromProgram;

  useEffect(() => {
    const fetchDoc = async () => {
      if (!docId) return;
      try {
        const docRef = doc(db, UNIFIED_COLLECTION, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDocument({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [db, docId]);

  if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin" /></div>;
  if (!document) return <div className="p-12 text-center">Document not found.</div>;

  const breadcrumbs = [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    ...(fromProgram ? [{ label: fromProgram.title, path: 'program-detail', params: { id: fromProgram.id } }] : [{ label: 'Documents', path: 'documents-index' }]),
    { label: document.title, path: null }
  ];

  return (
    <PageLayout 
      title={document.title} 
      subtitle="Document Library"
      breadcrumbs={breadcrumbs}
      backTo={fromProgram ? 'program-detail' : 'documents-index'}
      backParams={fromProgram ? { id: fromProgram.id } : undefined}
      navigate={navigate}
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <UniversalResourceViewer resource={document} inline={true} />
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">{document.title}</h2>
              <p className="text-slate-600">{document.description}</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DocumentDetail;
