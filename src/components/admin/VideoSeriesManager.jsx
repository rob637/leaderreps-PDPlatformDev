// src/components/admin/VideoSeriesManager.jsx
// Admin component for creating and managing Video Series

import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowLeft,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Play,
  Clock,
  ExternalLink,
  Loader,
  Image,
  ListVideo,
  FolderOpen,
  Search,
  CheckCircle
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  getAllSeriesAdmin,
  createSeries,
  updateSeries,
  deleteSeries,
  formatDuration
} from '../../services/videoSeriesService';
import { getMediaAssets, MEDIA_TYPES } from '../../services/mediaService';

// Duration helpers - convert between MM:SS string and total seconds
const parseDurationString = (str) => {
  if (!str) return 0;
  const trimmed = String(str).trim();
  
  // Handle MM:SS format
  if (trimmed.includes(':')) {
    const [mins, secs] = trimmed.split(':').map(s => parseInt(s, 10) || 0);
    return (mins * 60) + Math.min(secs, 59);
  }
  
  // Handle plain number (assume seconds if > 10, otherwise minutes)
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return 0;
  
  // If a small number like 4, treat as minutes; otherwise treat as seconds
  return num < 10 ? num * 60 : num;
};

const formatDurationInput = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

// Category options
const CATEGORIES = [
  { value: 'prep', label: 'Foundation Prep' },
  { value: 'foundation', label: 'Foundation (Week 1-8)' },
  { value: 'ascent', label: 'Ascent' },
  { value: 'general', label: 'General' }
];

const VideoSeriesManager = () => {
  const { db, navigate } = useAppServices();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSeries, setEditingSeries] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [selectingForVideoId, setSelectingForVideoId] = useState(null);

  // Form state for editing/creating series
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    category: 'prep',
    isActive: true,
    autoPlay: true,
    order: 0,
    videos: []
  });

  // Load all series
  const loadSeries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSeriesAdmin(db);
      setSeries(data);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  // Start creating new series
  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      category: 'prep',
      isActive: true,
      autoPlay: true,
      order: series.length,
      videos: []
    });
    setIsAddingNew(true);
    setEditingSeries(null);
  };

  // Start editing existing series
  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      thumbnail: item.thumbnail || '',
      category: item.category || 'prep',
      isActive: item.isActive ?? true,
      autoPlay: item.autoPlay ?? true,
      order: item.order || 0,
      videos: item.videos || []
    });
    setEditingSeries(item);
    setIsAddingNew(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingSeries(null);
    setIsAddingNew(false);
  };

  // Save series (create or update)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      setSaving(true);

      if (editingSeries) {
        await updateSeries(db, editingSeries.id, formData);
      } else {
        await createSeries(db, formData);
      }

      await loadSeries();
      handleCancel();
    } catch (error) {
      console.error('Error saving series:', error);
      alert('Failed to save series');
    } finally {
      setSaving(false);
    }
  };

  // Delete series
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video series? This cannot be undone.')) {
      return;
    }

    try {
      await deleteSeries(db, id);
      await loadSeries();
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series');
    }
  };

  // Toggle series active status
  const handleToggleActive = async (item) => {
    try {
      await updateSeries(db, item.id, { isActive: !item.isActive });
      await loadSeries();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Add video to series
  const handleAddVideo = () => {
    const newVideo = {
      id: `video-${Date.now()}`,
      title: '',
      description: '',
      videoUrl: '',
      thumbnail: '',
      duration: 0,
      order: formData.videos.length + 1,
      mediaAssetId: null // Reference to media_assets doc if selected from library
    };
    setFormData({
      ...formData,
      videos: [...formData.videos, newVideo]
    });
  };

  // Update video in series
  const handleUpdateVideo = (videoId, field, value) => {
    setFormData({
      ...formData,
      videos: formData.videos.map(v => {
        if (v.id === videoId) {
          return { ...v, [field]: value };
        }
        return v;
      })
    });
  };

  // Open media picker for a specific video slot
  const handleOpenMediaPicker = async (videoId) => {
    setSelectingForVideoId(videoId);
    setShowMediaPicker(true);
    setMediaSearch('');
    
    // Load video assets from media library
    if (!mediaAssets.length) {
      setMediaLoading(true);
      try {
        const assets = await getMediaAssets(db, MEDIA_TYPES.VIDEO);
        console.log('[VideoSeriesManager] Loaded media assets:', assets.length);
        setMediaAssets(assets);
      } catch (error) {
        console.error('Error loading media assets:', error);
        // Try without filter as fallback
        try {
          const allAssets = await getMediaAssets(db);
          const videoAssets = allAssets.filter(a => a.type === 'VIDEO' || a.mimeType?.startsWith('video/'));
          console.log('[VideoSeriesManager] Fallback loaded:', videoAssets.length);
          setMediaAssets(videoAssets);
        } catch (err2) {
          console.error('Fallback also failed:', err2);
          alert('Failed to load media library: ' + (err2.message || 'Unknown error'));
        }
      } finally {
        setMediaLoading(false);
      }
    }
  };

  // Select a media asset for the video
  const handleSelectMedia = (asset) => {
    if (!selectingForVideoId) return;
    
    setFormData({
      ...formData,
      videos: formData.videos.map(v => {
        if (v.id === selectingForVideoId) {
          return {
            ...v,
            title: v.title || asset.title || asset.fileName,
            videoUrl: asset.url,
            thumbnail: '', // Videos from storage don't have thumbnails
            mediaAssetId: asset.id
          };
        }
        return v;
      })
    });
    
    setShowMediaPicker(false);
    setSelectingForVideoId(null);
  };

  // Filter media assets by search term
  const filteredMediaAssets = mediaAssets.filter(asset => {
    if (!mediaSearch) return true;
    const search = mediaSearch.toLowerCase();
    return (
      asset.title?.toLowerCase().includes(search) ||
      asset.fileName?.toLowerCase().includes(search)
    );
  });

  // Remove video from series
  const handleRemoveVideo = (videoId) => {
    setFormData({
      ...formData,
      videos: formData.videos
        .filter(v => v.id !== videoId)
        .map((v, idx) => ({ ...v, order: idx + 1 }))
    });
  };

  // Move video up in order
  const handleMoveVideoUp = (index) => {
    if (index === 0) return;
    const videos = [...formData.videos];
    [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]];
    setFormData({
      ...formData,
      videos: videos.map((v, idx) => ({ ...v, order: idx + 1 }))
    });
  };

  // Move video down in order
  const handleMoveVideoDown = (index) => {
    if (index === formData.videos.length - 1) return;
    const videos = [...formData.videos];
    [videos[index], videos[index + 1]] = [videos[index + 1], videos[index]];
    setFormData({
      ...formData,
      videos: videos.map((v, idx) => ({ ...v, order: idx + 1 }))
    });
  };

  // Calculate total duration (stored in seconds)
  const totalDurationSeconds = formData.videos.reduce(
    (sum, v) => sum + (parseInt(v.duration, 10) || 0),
    0
  );
  const totalDurationMinutes = totalDurationSeconds / 60;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  // Editing/Creating form
  if (editingSeries || isAddingNew) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {editingSeries ? 'Edit Video Series' : 'Create Video Series'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formData.videos.length} videos • {formatDuration(totalDurationMinutes)} total
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Series Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Foundation Prep Series"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Watch these videos to prepare for your leadership journey..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoPlay}
                  onChange={(e) => setFormData({ ...formData, autoPlay: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-play next video</span>
              </label>
            </div>
          </div>

          {/* Videos List */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ListVideo className="w-5 h-5" />
                Videos in Series
              </h3>
              <button
                onClick={handleAddVideo}
                className="flex items-center gap-2 px-3 py-1.5 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Video
              </button>
            </div>

            {formData.videos.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No videos yet</p>
                <button
                  onClick={handleAddVideo}
                  className="mt-3 text-corporate-teal hover:underline text-sm"
                >
                  Add your first video
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Reorder controls */}
                      <div className="flex flex-col gap-1 pt-2">
                        <button
                          onClick={() => handleMoveVideoUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4 text-slate-500" />
                        </button>
                        <span className="text-xs text-slate-400 text-center font-mono">{index + 1}</span>
                        <button
                          onClick={() => handleMoveVideoDown(index)}
                          disabled={index === formData.videos.length - 1}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      {/* Thumbnail preview */}
                      <div className="w-24 h-16 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Video fields */}
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={video.title}
                            onChange={(e) => handleUpdateVideo(video.id, 'title', e.target.value)}
                            placeholder="Video Title"
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                          />
                          <div className="flex gap-2">
                            {video.videoUrl ? (
                              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 text-sm border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="truncate text-green-700 dark:text-green-400">Video selected</span>
                                <button
                                  onClick={() => handleOpenMediaPicker(video.id)}
                                  className="ml-auto text-xs text-corporate-teal hover:underline"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenMediaPicker(video.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border-2 border-dashed border-corporate-teal/50 text-corporate-teal rounded-lg hover:bg-corporate-teal/5 transition-colors"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Browse Media Library
                              </button>
                            )}
                            <input
                              type="text"
                              value={formatDurationInput(video.duration)}
                              onChange={(e) => handleUpdateVideo(video.id, 'duration', parseDurationString(e.target.value))}
                              onBlur={(e) => {
                                // Re-format on blur for consistent display
                                const seconds = parseDurationString(e.target.value);
                                handleUpdateVideo(video.id, 'duration', seconds);
                              }}
                              placeholder="M:SS"
                              className="w-16 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800 text-center"
                              title="Duration (e.g. 4:15 for 4 min 15 sec)"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={video.description || ''}
                          onChange={(e) => handleUpdateVideo(video.id, 'description', e.target.value)}
                          placeholder="Brief description (optional)"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveVideo(video.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingSeries ? 'Update Series' : 'Create Series'}
            </button>
          </div>
        </div>

        {/* Media Picker Modal (must be inside this return block) */}
        {showMediaPicker && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Select Video from Media Library
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose an uploaded video to add to this series
                  </p>
                </div>
                <button
                  onClick={() => { setShowMediaPicker(false); setSelectingForVideoId(null); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Search videos..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
                  </div>
                ) : filteredMediaAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {mediaSearch ? 'No videos match your search' : 'No videos uploaded yet'}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Upload videos in the Media Vault first
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMediaAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleSelectMedia(asset)}
                        className="group text-left bg-slate-50 dark:bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-corporate-teal transition-all"
                      >
                        <div className="aspect-video bg-slate-200 dark:bg-slate-600 flex items-center justify-center relative">
                          <Film className="w-8 h-8 text-slate-400" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                            {asset.title || asset.fileName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {(asset.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => { setShowMediaPicker(false); setSelectingForVideoId(null); }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Series list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate?.('admin-content')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ListVideo className="w-6 h-6 text-corporate-teal" />
              Video Series
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create playlists of videos for sequential viewing
            </p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Series
        </button>
      </div>

      {/* Series List */}
      {series.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <ListVideo className="w-16 h-16 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            No Video Series Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Create your first video series to help users learn sequentially.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Series
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Series</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Videos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {series.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                          <Film className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.videos?.length || 0} videos
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(item.totalDuration)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {item.isActive ? (
                        <><Eye className="w-3 h-3" /> Active</>
                      ) : (
                        <><EyeOff className="w-3 h-3" /> Hidden</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Select Video from Media Library
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose an uploaded video to add to this series
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMediaPicker(false);
                  setSelectingForVideoId(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Search videos..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
                </div>
              ) : filteredMediaAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {mediaSearch ? 'No videos match your search' : 'No videos uploaded yet'}
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Upload videos in the Media Vault first
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMediaAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectMedia(asset)}
                      className="group text-left bg-slate-50 dark:bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-corporate-teal transition-all"
                    >
                      <div className="aspect-video bg-slate-200 dark:bg-slate-600 flex items-center justify-center relative">
                        <Film className="w-8 h-8 text-slate-400" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                          {asset.title || asset.fileName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {(asset.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMediaPicker(false);
                  setSelectingForVideoId(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSeriesManager;
