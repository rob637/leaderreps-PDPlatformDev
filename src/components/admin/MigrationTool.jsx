import React, { useState } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CONTENT_TYPES, CONTENT_STATUS, DIFFICULTY_LEVELS, UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import { Play, FileText, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

const MigrationTool = () => {
  const { db } = useAppServices();
  const [status, setStatus] = useState('idle'); // idle, running, complete, error
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const runMigration = async () => {
    setStatus('running');
    setLogs([]);
    addLog('Starting migration...');

    try {
      // 1. Migrate Readings
      addLog('Fetching content_readings...');
      const readingsSnap = await getDocs(collection(db, 'content_readings'));
      addLog(`Found ${readingsSnap.size} readings.`);
      
      let count = 0;
      for (const d of readingsSnap.docs) {
        const data = d.data();
        const newDoc = {
          type: CONTENT_TYPES.READ_REP,
          title: data.title || 'Untitled Reading',
          description: data.description || '',
          status: data.isActive ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.ARCHIVED,
          difficulty: DIFFICULTY_LEVELS.FOUNDATION,
          category: data.category || 'General',
          createdAt: data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          details: {
            pdfUrl: data.url || '',
            content: data.content || '',
            ...data.metadata
          }
        };
        
        await setDoc(doc(db, UNIFIED_COLLECTION, d.id), newDoc, { merge: true });
        count++;
      }
      addLog(`Migrated ${count} readings.`);

      // 2. Migrate Videos
      addLog('Fetching content_videos...');
      const videosSnap = await getDocs(collection(db, 'content_videos'));
      addLog(`Found ${videosSnap.size} videos.`);
      
      count = 0;
      for (const d of videosSnap.docs) {
        const data = d.data();
        const newDoc = {
          type: CONTENT_TYPES.REP,
          title: data.title || 'Untitled Video',
          description: data.description || '',
          status: data.isActive ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.ARCHIVED,
          difficulty: DIFFICULTY_LEVELS.FOUNDATION,
          category: data.category || 'General',
          createdAt: data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          details: {
            videoUrl: data.url || '',
            duration: data.duration || 0,
            ...data.metadata
          }
        };
        
        await setDoc(doc(db, UNIFIED_COLLECTION, d.id), newDoc, { merge: true });
        count++;
      }
      addLog(`Migrated ${count} videos.`);

      setStatus('complete');
      addLog('Migration finished successfully!');

    } catch (error) {
      console.error('Migration failed:', error);
      addLog(`ERROR: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Play className="text-blue-600" />
        Content Migration Tool
      </h2>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-800">Warning</h3>
            <p className="text-sm text-yellow-700">
              This tool will read from legacy collections (`content_readings`, `content_videos`) 
              and write to the new `content_library`. Existing items with the same ID will be updated.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={runMigration}
          disabled={status === 'running'}
          className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${
            status === 'running' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {status === 'running' ? (
            <>
              <Loader className="animate-spin" /> Migrating...
            </>
          ) : (
            'Start Migration'
          )}
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <span className="text-gray-500 dark:text-gray-400">Ready to start...</span>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  );
};

export default MigrationTool;
