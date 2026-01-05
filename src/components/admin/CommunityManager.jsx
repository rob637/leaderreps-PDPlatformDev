// src/components/admin/CommunityManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { TabButton } from '../ui';
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
  Loader,
  Calendar
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';
import CommunitySessionManager from './CommunitySessionManager';

const CommunityManager = () => {
  const { db, navigate, user } = useAppServices();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'posts'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, CONTENT_COLLECTIONS.COMMUNITY);
      setPosts(data);
      // ... rest of function
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (activeTab === 'feed') {
      loadContent();
    } else {
      setLoading(false);
    }
  }, [activeTab, loadContent]);

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
        const dataWithAuthor = {
          ...postData,
          authorId: user?.uid
        };
        await addContent(db, CONTENT_COLLECTIONS.COMMUNITY, dataWithAuthor);
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
      alert(`Error deleting post: ${error.message}`);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateContent(db, CONTENT_COLLECTIONS.COMMUNITY, item.id, { isActive: !item.isActive });
      await loadContent();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-corporate-teal" />
            <h1 className="text-3xl font-bold text-corporate-navy">
              Community Management
            </h1>
          </div>
          
          {activeTab === 'posts' && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all bg-corporate-teal hover:bg-corporate-teal-dark"
            >
              <Plus className="w-5 h-5" />
              Add Seed Post
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <TabButton 
            active={activeTab === 'sessions'} 
            onClick={() => setActiveTab('sessions')} 
            icon={Calendar} 
            label="Sessions & Events" 
          />
          <TabButton 
            active={activeTab === 'posts'} 
            onClick={() => setActiveTab('posts')} 
            icon={MessageSquare} 
            label="Forum Posts" 
            badge={posts.length > 0 ? posts.length : undefined}
          />
        </div>
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <CommunitySessionManager />
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <>
          {/* Edit Form */}
          {editingItem && (
            <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-corporate-teal">
              <h2 className="text-xl font-bold mb-4 text-corporate-navy">
                {isAddingNew ? 'Add New Seed Post' : 'Edit Post'}
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={editingItem.ownerName}
                      onChange={(e) => setEditingItem({ ...editingItem, ownerName: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g., Sarah Jenkins"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Rep Initials (Avatar)
                    </label>
                    <input
                      type="text"
                      value={editingItem.rep}
                      onChange={(e) => setEditingItem({ ...editingItem, rep: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g., SJ"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Tier Badge
                    </label>
                    <select
                      value={editingItem.tier}
                      onChange={(e) => setEditingItem({ ...editingItem, tier: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    >
                      <option value="Free">Free</option>
                      <option value="Premium">Premium</option>
                      <option value="Elite">Elite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Time Display
                    </label>
                    <input
                      type="text"
                      value={editingItem.time}
                      onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g., 2h ago"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                    Content *
                  </label>
                  <textarea
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    rows="4"
                    placeholder="Post content..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Likes
                    </label>
                    <input
                      type="number"
                      value={editingItem.likes}
                      onChange={(e) => setEditingItem({ ...editingItem, likes: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Comments
                    </label>
                    <input
                      type="number"
                      value={editingItem.comments}
                      onChange={(e) => setEditingItem({ ...editingItem, comments: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Shares
                    </label>
                    <input
                      type="number"
                      value={editingItem.shares}
                      onChange={(e) => setEditingItem({ ...editingItem, shares: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="w-4 h-4 text-corporate-teal focus:ring-corporate-teal"
                  />
                  <label className="text-sm font-semibold text-corporate-navy">
                    Active (visible in feed)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white bg-corporate-teal hover:bg-corporate-teal-dark"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddingNew(false);
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200"
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-slate-500">No community posts yet. Add some seed content.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 bg-white rounded-xl shadow-sm border flex items-start gap-4 ${post.isActive ? 'border-corporate-teal' : 'border-slate-300 opacity-60'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                    {post.rep}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-corporate-navy">
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
                            <Eye className="w-4 h-4 text-corporate-teal" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-corporate-navy" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-corporate-orange" />
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
        </>
      )}
    </div>
  );
};

export default CommunityManager;
