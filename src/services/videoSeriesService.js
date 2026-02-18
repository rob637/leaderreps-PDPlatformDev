// src/services/videoSeriesService.js
// Service for managing Video Series - ordered collections of videos for sequential viewing

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Collection names
export const VIDEO_SERIES_COLLECTION = 'video_series';
export const VIDEO_PROGRESS_COLLECTION = 'video_progress';

/**
 * VIDEO SERIES DATA MODEL
 * 
 * video_series/{seriesId}:
 * {
 *   id: string (auto-generated)
 *   title: string "Foundation Prep Series"
 *   description: string "Watch these videos to prepare for your leadership journey"
 *   thumbnail: string (URL to series thumbnail)
 *   category: string "prep" | "foundation" | "ascent"
 *   isActive: boolean
 *   autoPlay: boolean (auto-play next video when one finishes)
 *   order: number (for ordering series in lists)
 *   totalDuration: number (calculated total minutes)
 *   videos: [
 *     {
 *       id: string (unique within series)
 *       title: string "Welcome to LeaderReps"
 *       description: string "Introduction to the platform"
 *       videoUrl: string (Firebase Storage URL or external URL)
 *       thumbnail: string (optional thumbnail URL)
 *       duration: number (minutes)
 *       order: number (1, 2, 3...)
 *       mediaAssetId: string (optional - reference to media_assets doc)
 *     }
 *   ]
 *   createdAt: timestamp
 *   updatedAt: timestamp
 * }
 * 
 * users/{userId}/videoProgress/{seriesId}:
 * {
 *   seriesId: string
 *   startedAt: timestamp
 *   lastWatchedAt: timestamp
 *   completedAt: timestamp | null
 *   videosWatched: [videoId, videoId, ...] (array of completed video IDs)
 *   currentVideoId: string (last video being watched)
 *   percentComplete: number (0-100)
 * }
 */

// ======================
// CRUD OPERATIONS
// ======================

/**
 * Get all video series (optionally filtered by category or active status)
 */
export const getAllSeries = async (db, options = {}) => {
  const { category = null, activeOnly = true } = options;
  
  try {
    let q = collection(db, VIDEO_SERIES_COLLECTION);
    
    if (activeOnly) {
      q = query(q, where('isActive', '==', true));
    }
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    q = query(q, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching video series:', error);
    return [];
  }
};

/**
 * Get active series filtered by category
 * Convenience wrapper for getAllSeries with category filter
 */
export const getActiveSeriesByCategory = async (db, category) => {
  return getAllSeries(db, { category, activeOnly: true });
};

/**
 * Get all series for admin (includes inactive)
 */
export const getAllSeriesAdmin = async (db) => {
  try {
    const q = query(
      collection(db, VIDEO_SERIES_COLLECTION),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching all video series:', error);
    return [];
  }
};

/**
 * Get a single series by ID
 */
export const getSeriesById = async (db, seriesId) => {
  try {
    const docRef = doc(db, VIDEO_SERIES_COLLECTION, seriesId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching series:', error);
    return null;
  }
};

/**
 * Create a new video series
 */
export const createSeries = async (db, seriesData) => {
  try {
    // Calculate total duration from videos
    const totalDuration = (seriesData.videos || []).reduce(
      (sum, v) => sum + (parseFloat(v.duration) || 0), 
      0
    );
    
    const docRef = await addDoc(collection(db, VIDEO_SERIES_COLLECTION), {
      ...seriesData,
      totalDuration,
      videos: seriesData.videos || [],
      isActive: seriesData.isActive ?? true,
      autoPlay: seriesData.autoPlay ?? true,
      order: seriesData.order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...seriesData };
  } catch (error) {
    console.error('Error creating series:', error);
    throw error;
  }
};

/**
 * Update an existing video series
 */
export const updateSeries = async (db, seriesId, updates) => {
  try {
    const docRef = doc(db, VIDEO_SERIES_COLLECTION, seriesId);
    
    // Recalculate total duration if videos changed
    if (updates.videos) {
      updates.totalDuration = updates.videos.reduce(
        (sum, v) => sum + (parseFloat(v.duration) || 0), 
        0
      );
    }
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { id: seriesId, ...updates };
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
};

/**
 * Delete a video series
 */
export const deleteSeries = async (db, seriesId) => {
  try {
    await deleteDoc(doc(db, VIDEO_SERIES_COLLECTION, seriesId));
    return true;
  } catch (error) {
    console.error('Error deleting series:', error);
    throw error;
  }
};

// ======================
// PROGRESS TRACKING
// ======================

/**
 * Get user's progress for a specific series
 */
export const getSeriesProgress = async (db, userId, seriesId) => {
  try {
    const docRef = doc(db, 'users', userId, 'videoProgress', seriesId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching series progress:', error);
    return null;
  }
};

/**
 * Get user's progress for all series they've started
 */
export const getAllSeriesProgress = async (db, userId) => {
  try {
    const progressRef = collection(db, 'users', userId, 'videoProgress');
    const snapshot = await getDocs(progressRef);
    
    const progressMap = {};
    snapshot.docs.forEach(d => {
      progressMap[d.id] = d.data();
    });
    
    return progressMap;
  } catch (error) {
    console.error('Error fetching all progress:', error);
    return {};
  }
};

/**
 * Mark a video as watched
 */
export const markVideoWatched = async (db, userId, seriesId, videoId, series) => {
  try {
    const docRef = doc(db, 'users', userId, 'videoProgress', seriesId);
    const existing = await getDoc(docRef);
    
    const videos = series?.videos || [];
    const totalVideos = videos.length;
    
    let progressData;
    
    if (existing.exists()) {
      const data = existing.data();
      const videosWatched = data.videosWatched || [];
      
      // Add video if not already watched
      if (!videosWatched.includes(videoId)) {
        videosWatched.push(videoId);
      }
      
      const percentComplete = totalVideos > 0 
        ? Math.round((videosWatched.length / totalVideos) * 100) 
        : 0;
      
      progressData = {
        videosWatched,
        currentVideoId: videoId,
        lastWatchedAt: serverTimestamp(),
        percentComplete,
        completedAt: percentComplete === 100 ? serverTimestamp() : null
      };
      
      await updateDoc(docRef, progressData);
    } else {
      // First video in series
      const percentComplete = totalVideos > 0 
        ? Math.round((1 / totalVideos) * 100) 
        : 0;
      
      progressData = {
        seriesId,
        startedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp(),
        completedAt: percentComplete === 100 ? serverTimestamp() : null,
        videosWatched: [videoId],
        currentVideoId: videoId,
        percentComplete
      };
      
      await updateDoc(docRef, progressData, { merge: true }).catch(() => {
        // If doc doesn't exist, set it
        const { setDoc } = require('firebase/firestore');
        return setDoc(docRef, progressData);
      });
    }
    
    return progressData;
  } catch (error) {
    console.error('Error marking video watched:', error);
    throw error;
  }
};

/**
 * Mark video as currently watching (for resumption)
 */
export const setCurrentVideo = async (db, userId, seriesId, videoId) => {
  try {
    const docRef = doc(db, 'users', userId, 'videoProgress', seriesId);
    const existing = await getDoc(docRef);
    
    if (existing.exists()) {
      await updateDoc(docRef, {
        currentVideoId: videoId,
        lastWatchedAt: serverTimestamp()
      });
    } else {
      const { setDoc } = require('firebase/firestore');
      await setDoc(docRef, {
        seriesId,
        startedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp(),
        completedAt: null,
        videosWatched: [],
        currentVideoId: videoId,
        percentComplete: 0
      });
    }
  } catch (error) {
    console.error('Error setting current video:', error);
  }
};

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Extract YouTube video ID from URL
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Get YouTube thumbnail URL from video ID
 */
export const getYouTubeThumbnail = (url) => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Generate embed URL for video (YouTube, Vimeo, etc.)
 */
export const getEmbedUrl = (url) => {
  if (!url) return null;
  
  // YouTube
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Direct video URL (mp4, etc.)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }
  
  // Return original if unknown format
  return url;
};

export default {
  // CRUD
  getAllSeries,
  getAllSeriesAdmin,
  getActiveSeriesByCategory,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  
  // Progress
  getSeriesProgress,
  getAllSeriesProgress,
  markVideoWatched,
  setCurrentVideo,
  
  // Utilities
  extractYouTubeId,
  getYouTubeThumbnail,
  formatDuration,
  getEmbedUrl,
  
  // Constants
  VIDEO_SERIES_COLLECTION,
  VIDEO_PROGRESS_COLLECTION
};
