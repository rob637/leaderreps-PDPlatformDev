import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState('processing'); // processing, success, error, already_unsubscribed

  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    } else {
      setStatus('error');
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    try {
      // 1. Check if already unsubscribed
      const q = query(collection(db, 'unsubscribes'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setStatus('already_unsubscribed');
        return;
      }

      // 2. Add to blocklist
      await addDoc(collection(db, 'unsubscribes'), {
        email: email,
        unsubscribedAt: new Date().toISOString(),
        source: 'email_link'
      });
      
      setStatus('success');
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
             <div className="animate-pulse">
                <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto"></div>
             </div>
        )}

        {status === 'success' && (
            <>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Unsubscribed</h1>
                <p className="text-slate-600 mb-6">
                    <span className="font-semibold text-slate-800">{email}</span> has been removed from our mailing list. You will no longer receive updates from LeaderReps.
                </p>
                <div className="text-xs text-slate-400">
                    Mistake? You can close this window.
                </div>
            </>
        )}

        {status === 'already_unsubscribed' && (
            <>
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Already Done</h1>
                <p className="text-slate-600 mb-6">
                    <span className="font-semibold text-slate-800">{email}</span> is already in our unsubscribe list. No need to do anything else.
                </p>
            </>
        )}

        {status === 'error' && (
            <>
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                <p className="text-slate-600 mb-6">
                    We couldn't process your request. The link might be invalid or expired.
                </p>
                <p className="text-sm text-slate-500">
                    If this persists, please reply to the email directly to ask to be removed.
                </p>
            </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
