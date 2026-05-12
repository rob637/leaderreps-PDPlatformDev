// src/hooks/useResourceOpener.jsx
//
// useResourceOpener — Shared "click → open content + auto-complete" behavior
// ==========================================================================
// Encapsulates the legacy Foundation Kickoff pattern:
//   • Click a content item → fetches the underlying content_library doc and
//     opens it in UniversalResourceViewer (or VideoSeriesPlayer).
//   • Documents / tools / read-reps auto-mark complete when opened.
//   • Videos auto-mark complete when the player fires onVideoComplete (which
//     UniversalResourceViewer triggers when playback reaches the last 5
//     seconds of a native video, or via the "Mark Watched" button).
//
// Returns:
//   { openResource(item), ResourceViewer (JSX), loadingResource (id|null) }
//
// The hook is widget-agnostic — caller passes a `completeItem(id, meta)`
// function (typically from useActionProgress) and an `idResolver(item)` so
// the hook stays decoupled from any particular item shape.

import React, { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import UniversalResourceViewer from '../components/ui/UniversalResourceViewer';
import { VideoSeriesPlayer } from '../components/video';
import { useAppServices } from '../services/useAppServices';

const AUTO_COMPLETE_TYPES = new Set([
  'DOCUMENT', 'TOOL', 'READ_REP', 'PDF', 'GUIDE', 'ARTICLE',
]);

const useResourceOpener = ({ completeItem, idResolver, phaseKey } = {}) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [viewingSeriesId, setViewingSeriesId] = useState(null);
  const [loadingResource, setLoadingResource] = useState(null);

  const markComplete = useCallback((item, extras = {}) => {
    if (typeof completeItem !== 'function') return;
    const id = idResolver ? idResolver(item) : (item?.id || item?.resourceId);
    if (!id) return;
    completeItem(id, {
      source: 'kickoff-todo',
      phase: phaseKey,
      label: item?.label || item?.contentItemLabel || item?.title,
      category: item?.category || 'content',
      ...extras,
    });
  }, [completeItem, idResolver, phaseKey]);

  const openResource = useCallback(async (item) => {
    if (!item) return;
    // eslint-disable-next-line no-console
    console.debug('[useResourceOpener] openResource', item);

    // Direct external URL — open inline viewer w/o Firestore lookup.
    if (item.url) {
      setViewingResource({ ...item, type: item.resourceType || 'link' });
      const t = (item.resourceType || item.type || '').toUpperCase();
      if (AUTO_COMPLETE_TYPES.has(t)) markComplete(item);
      return;
    }

    // Only treat real content identifiers as a resourceId. Callers (e.g.
    // KickoffToDoWidget) sometimes synthesize an `item.id` like
    // `contentItems::QS2 Video::2` for React keys; that must NOT be used as
    // a Firestore document id. Empty strings are also treated as missing.
    const cleanId = (v) => (typeof v === 'string' ? v.trim() : v) || null;
    const resourceId = cleanId(item.resourceId) || cleanId(item.contentItemId);

    if (item.resourceType === 'video_series' && resourceId) {
      setViewingSeriesId(resourceId);
      return;
    }

    if (!resourceId) {
      // eslint-disable-next-line no-alert
      window.alert(`"${item.label || item.contentItemLabel || 'This item'}" isn't linked to any content yet. Ask an admin to attach it in Phase Content.`);
      return;
    }

    setLoadingResource(item.id || resourceId);
    let snap = null;
    try {
      const ref = doc(db, 'content_library', resourceId);
      snap = await getDoc(ref);

      if (!snap || !snap.exists()) {
        // eslint-disable-next-line no-alert
        window.alert(`"${item.label || item.contentItemLabel || 'This item'}" points to content that no longer exists. Ask an admin to re-link it.`);
        return;
      }

      const data = snap.data();
      const type = (data.type || '').toUpperCase();
      let resourceData = {
        id: snap.id,
        actionItemId: item.id,
        resourceId,
        ...data,
        resourceType: data.type,
        label: item.label || item.contentItemLabel || data.title,
        category: item.category || data.category,
      };
      if (type === 'REP' && data.details?.videoUrl) {
        resourceData.url = data.details.videoUrl;
        resourceData.resourceType = 'video';
      } else if (type === 'VIDEO') {
        resourceData.url = data.url || data.videoUrl
          || data.details?.externalUrl || data.metadata?.externalUrl
          || data.details?.videoUrl;
        resourceData.resourceType = 'video';
      } else if (type === 'READ_REP') {
        resourceData.resourceType = 'read_rep';
        if (data.details) {
          resourceData.synopsis = data.details.synopsis;
          resourceData.author = data.details.author;
          if (data.details.pdfUrl) resourceData.url = data.details.pdfUrl;
        }
      } else if (type === 'DOCUMENT' || type === 'TOOL') {
        resourceData.url = data.url || data.details?.url
          || data.details?.pdfUrl || data.metadata?.url;
        resourceData.resourceType = 'document';
      }

      setViewingResource(resourceData);

      if (AUTO_COMPLETE_TYPES.has(type)) markComplete(item);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useResourceOpener] failed to load resource', err);
      // eslint-disable-next-line no-alert
      window.alert('Sorry — something went wrong opening that resource. Please try again.');
    } finally {
      setLoadingResource(null);
    }
  }, [db, markComplete]);

  const handleVideoComplete = useCallback((resource) => {
    // resource here is the data we passed to UniversalResourceViewer; our
    // own item identity lives in actionItemId.
    if (!resource) return;
    markComplete({
      id: resource.actionItemId || resource.resourceId || resource.id,
      label: resource.label || resource.title,
      category: resource.category,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
    });
  }, [markComplete]);

  const ResourceViewer = (
    <>
      {viewingResource && (
        <UniversalResourceViewer
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
          onVideoComplete={handleVideoComplete}
        />
      )}
      {viewingSeriesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <VideoSeriesPlayer
              seriesId={viewingSeriesId}
              onClose={() => setViewingSeriesId(null)}
              showHeader={true}
            />
          </div>
        </div>
      )}
    </>
  );

  return { openResource, ResourceViewer, loadingResource };
};

export default useResourceOpener;
