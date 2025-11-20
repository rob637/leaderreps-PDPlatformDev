// src/components/admin/CommunityManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  ArrowLeft,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Loader
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';

const COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B',
  TEAL: '#47A88D',
  LIGHT_GRAY: '#FCFCFA',
  MUTED: '#6B7280'
};

const CommunityManager = () => {
  const { db, navigate } = useAppServices();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, CONTENT_COLLECTIONS.COMMUNITY);
      setPosts(data);
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem({
      ownerName: '',
      rep: '',
      tier: 'Free',
      time: 'Just now',
      content: '',
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isActive: true,
      order: 999
    });
    setIsAddingNew(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setIsAddingNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    try {
      // Ensure numeric values
      const postData = {
        ...editingItem,
        likes: parseInt(editingItem.likes) || 0,
        comments: parseInt(editingItem.comments) || 0,
        shares: parseInt(editingItem.shares) || 0
      };

      if (isAddingNew) {
        await addContent(db, CONTENT_COLLECTIONS.COMMUNITY, postData);
      } else {
        const { id, ...updates } = postData;
        try {
          await updateContent(db, CONTENT_COLLECTIONS.COMMUNITY, id, updates);
        } catch (updateError) {
          if (updateError.message && updateError.message.includes('No document to update')) {
            const shouldCreate = window.confirm(
              'This post could not be found in the database (it may have been deleted). \n\nDo you want to save it as a NEW post?'
            );
            if (shouldCreate) {
              await addContent(db, CONTENT_COLLECTIONS.COMMUNITY, updates);
            } else {
              return;
            }
          } else {
            throw updateError;
          }
        }
      }
      setEditingItem(null);
      setIsAddingNew(false);
      await loadContent();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete this post by "${item.ownerName}"?`)) return;
    
    try {
      await deleteContent(db, CONTENT_COLLECTIONS.COMMUNITY, item.id);
      await loadContent();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateContent(db, CONTENT_COLLECTIONS.COMMUNITY, item.id, { isActive: !item.isActive });
      await loadContent();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" style={{ color: COLORS.TEAL }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ backgroundColor: COLORS.LIGHT_GRAY, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70"
          style={{ color: COLORS.MUTED }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: COLORS.TEAL }} />
            <h1 className="text-3xl font-bold" style={{ color: COLORS.NAVY }}>
              Community Management
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all"
            style={{ backgroundColor: COLORS.TEAL }}
          >
            <Plus className="w-5 h-5" />
            Add Seed Post
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2" style={{ borderColor: COLORS.TEAL }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
            {isAddingNew ? 'Add New Seed Post' : 'Edit Post'}
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={editingItem.ownerName}
                  onChange={(e) => setEditingItem({ ...editingItem, ownerName: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Sarah Jenkins"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Rep Initials (Avatar)
                </label>
                <input
                  type="text"
                  value={editingItem.rep}
                  onChange={(e) => setEditingItem({ ...editingItem, rep: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., SJ"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Tier Badge
                </label>
                <select
                  value={editingItem.tier}
                  onChange={(e) => setEditingItem({ ...editingItem, tier: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Free">Free</option>
                  <option value="Premium">Premium</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Time Display
                </label>
                <input
                  type="text"
                  value={editingItem.time}
                  onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., 2h ago"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                Content *
              </label>
              <textarea
                value={editingItem.content}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="4"
                placeholder="Post content..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Likes
                </label>
                <input
                  type="number"
                  value={editingItem.likes}
                  onChange={(e) => setEditingItem({ ...editingItem, likes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Comments
                </label>
                <input
                  type="number"
                  value={editingItem.comments}
                  onChange={(e) => setEditingItem({ ...editingItem, comments: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Shares
                </label>
                <input
                  type="number"
                  value={editingItem.shares}
                  onChange={(e) => setEditingItem({ ...editingItem, shares: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingItem.isActive}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>
                Active (visible in feed)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: COLORS.TEAL }}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: COLORS.LIGHT_GRAY, color: COLORS.MUTED }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p style={{ color: COLORS.MUTED }}>No community posts yet. Add some seed content.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-white rounded-xl shadow-sm border flex items-start gap-4"
              style={{ 
                borderColor: post.isActive ? COLORS.TEAL : COLORS.MUTED,
                opacity: post.isActive ? 1 : 0.6
              }}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                {post.rep}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: COLORS.NAVY }}>
                      {post.ownerName} 
                      <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {post.tier}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">{post.time}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(post)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title={post.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {post.isActive ? (
                        <Eye className="w-4 h-4" style={{ color: COLORS.TEAL }} />
                      ) : (
                        <EyeOff className="w-4 h-4" style={{ color: COLORS.MUTED }} />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" style={{ color: COLORS.NAVY }} />
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: COLORS.ORANGE }} />
                    </button>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityManager;
