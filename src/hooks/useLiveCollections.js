import { useState, useEffect } from 'react';
import { getCachedUserCollections, normalizeCollections, hasCollectionCache } from '../utils/collectionsCache.js';
import { loadRatingsTable } from '../utils/ratingsCache.js';
import { loadUserCollections } from '../utils/collectionsApi.js';
import { apiFetch, getToken } from '../api/client.js';

async function loadCollectionsWithProfileFallback() {
  const loadedCollections = await loadUserCollections();
  if (loadedCollections.length) return loadedCollections;

  // Some deployed sessions currently expose the complete collection snapshot
  // through the authenticated profile response even when the dedicated list
  // response is empty. Keep the sidebar and selected detail pane in sync.
  const profile = await apiFetch('/api/user/profile');
  const profileUser = profile?.user || profile;
  return Array.isArray(profileUser?.collections) ? profileUser.collections : [];
}

export function useLiveCollections() {
  const [collections, setCollections] = useState(() => normalizeCollections(getCachedUserCollections()));
  const [loading, setLoading] = useState(() => !hasCollectionCache() && !!getToken());

  useEffect(() => {
    function applyCollections(nextCollections) {
      setCollections(normalizeCollections(nextCollections));
      setLoading(false);
    }

    // Always sync from cache immediately — zero flicker on navigation
    const cached = getCachedUserCollections();
    if (cached?.length) applyCollections(cached);

    if (getToken()) {
      loadRatingsTable().catch(() => {});

      if (!hasCollectionCache()) {
        // Truly no cache at all (first load / logged-out) — must fetch
        setLoading(true);
        loadCollectionsWithProfileFallback()
          .then(applyCollections)
          .catch(() => setLoading(false));
      }
      // If cache exists, loadUserCollections already de-duped and session-flagged —
      // no extra call needed. The event listener below handles any mutations.
    }

    const updateEventName = window.CollectionStore?.COLLECTIONS_UPDATED_EVENT || 'soulstash:collections-updated';

    function handleCollectionsUpdated(event) {
      applyCollections(event.detail?.collections || getCachedUserCollections());
    }

    function handleStorage(event) {
      if (!event.key || !event.key.startsWith('ss_collections_')) return;
      applyCollections(getCachedUserCollections());
    }

    function handleAuthChanged() {
      if (getToken()) {
        setLoading(true);
        loadCollectionsWithProfileFallback()
          .then(applyCollections)
          .catch(() => setLoading(false));
      } else {
        applyCollections([]);
      }
    }

    window.addEventListener(updateEventName, handleCollectionsUpdated);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('soulstash:auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener(updateEventName, handleCollectionsUpdated);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('soulstash:auth-changed', handleAuthChanged);
    };
  }, []);

  return { collections, loading };
}
