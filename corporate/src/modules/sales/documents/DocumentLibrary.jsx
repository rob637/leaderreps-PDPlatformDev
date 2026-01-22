import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Folder, Search, Download, Eye, Trash2,
  Star, StarOff, Clock, Users, Filter, Grid, List, Plus,
  FolderPlus, MoreVertical, Share2, Copy, Link, Image,
  File, FileSpreadsheet, FileCode, Archive, RefreshCw
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Document Library & Sales Collateral
 * 
 * Features:
 * - Centralized document storage
 * - Folder organization
 * - Upload and version control
 * - Starred/favorite documents
 * - Recent documents
 * - Search and filtering
 * - Share links
 */

const DOCUMENT_TYPES = {
  pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-100' },
  doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  docx: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  xls: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-100' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-100' },
  ppt: { icon: File, color: 'text-orange-500', bg: 'bg-orange-100' },
  pptx: { icon: File, color: 'text-orange-500', bg: 'bg-orange-100' },
  png: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-100' },
  jpg: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-100' },
  jpeg: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-100' },
  zip: { icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100' },
  default: { icon: File, color: 'text-slate-500', bg: 'bg-slate-100' }
};

const FOLDERS = [
  { id: 'case-studies', name: 'Case Studies', icon: Folder, count: 0 },
  { id: 'pitch-decks', name: 'Pitch Decks', icon: Folder, count: 0 },
  { id: 'proposals', name: 'Proposal Templates', icon: Folder, count: 0 },
  { id: 'contracts', name: 'Contracts', icon: Folder, count: 0 },
  { id: 'one-pagers', name: 'One-Pagers', icon: Folder, count: 0 },
  { id: 'pricing', name: 'Pricing Sheets', icon: Folder, count: 0 },
];

const DocumentLibrary = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState(FOLDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', folder: '', type: 'pdf', url: '' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docsSnap = await getDocs(query(collection(db, 'corporate_documents'), orderBy('createdAt', 'desc')));
      const docs = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(docs);

      // Update folder counts
      const updated = FOLDERS.map(folder => ({
        ...folder,
        count: docs.filter(d => d.folder === folder.id).length
      }));
      setFolders(updated);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.name) return;

    try {
      await addDoc(collection(db, 'corporate_documents'), {
        ...uploadData,
        starred: false,
        views: 0,
        shares: 0,
        uploadedBy: 'Admin',
        createdAt: serverTimestamp()
      });
      setShowUpload(false);
      setUploadData({ name: '', folder: '', type: 'pdf', url: '' });
      fetchDocuments();
    } catch (err) {
      console.error("Error uploading document:", err);
    }
  };

  const toggleStar = async (docId, currentStarred) => {
    try {
      await updateDoc(doc(db, 'corporate_documents', docId), {
        starred: !currentStarred
      });
      setDocuments(documents.map(d => 
        d.id === docId ? { ...d, starred: !currentStarred } : d
      ));
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDoc(doc(db, 'corporate_documents', docId));
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const getDocTypeInfo = (type) => {
    return DOCUMENT_TYPES[type?.toLowerCase()] || DOCUMENT_TYPES.default;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder ? doc.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const starredDocs = documents.filter(d => d.starred);
  const recentDocs = documents.slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Document Library</h1>
          <p className="text-slate-500 mt-1">Sales collateral, proposals, and templates</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Upload size={18} /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 space-y-6">
          {/* Quick Access */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Quick Access</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  !selectedFolder ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Folder size={16} />
                All Documents
                <span className="ml-auto text-xs text-slate-400">{documents.length}</span>
              </button>
              <button
                onClick={() => setSelectedFolder('starred')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  selectedFolder === 'starred' ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Star size={16} />
                Starred
                <span className="ml-auto text-xs text-slate-400">{starredDocs.length}</span>
              </button>
              <button
                onClick={() => setSelectedFolder('recent')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  selectedFolder === 'recent' ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Clock size={16} />
                Recent
                <span className="ml-auto text-xs text-slate-400">{recentDocs.length}</span>
              </button>
            </div>
          </div>

          {/* Folders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">Folders</h3>
              <button className="text-corporate-teal hover:text-teal-700">
                <FolderPlus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    selectedFolder === folder.id ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Folder size={16} className="text-amber-500" />
                  {folder.name}
                  <span className="ml-auto text-xs text-slate-400">{folder.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {/* Search & Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100' : ''}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Documents */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-600 mb-1">No documents found</h3>
              <p className="text-sm text-slate-400">Upload your first document to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredDocs.map(doc => {
                const typeInfo = getDocTypeInfo(doc.type);
                const Icon = typeInfo.icon;
                return (
                  <div 
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo.bg} flex items-center justify-center`}>
                        <Icon className={typeInfo.color} size={24} />
                      </div>
                      <button 
                        onClick={() => toggleStar(doc.id, doc.starred)}
                        className="text-slate-300 hover:text-amber-400"
                      >
                        {doc.starred ? (
                          <Star className="text-amber-400 fill-amber-400" size={18} />
                        ) : (
                          <StarOff size={18} />
                        )}
                      </button>
                    </div>
                    <h4 className="font-medium text-slate-800 mb-1 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-400 mb-4">{doc.type?.toUpperCase()} • {doc.views || 0} views</p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1">
                        <Eye size={12} /> View
                      </button>
                      <button className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1">
                        <Share2 size={12} /> Share
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const typeInfo = getDocTypeInfo(doc.type);
                const Icon = typeInfo.icon;
                return (
                  <div 
                    key={doc.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                      <Icon className={typeInfo.color} size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{doc.name}</h4>
                      <p className="text-xs text-slate-400">
                        {doc.type?.toUpperCase()} • Uploaded by {doc.uploadedBy || 'Admin'}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">{doc.views || 0} views</div>
                    <button 
                      onClick={() => toggleStar(doc.id, doc.starred)}
                      className="text-slate-300 hover:text-amber-400"
                    >
                      {doc.starred ? (
                        <Star className="text-amber-400 fill-amber-400" size={16} />
                      ) : (
                        <StarOff size={16} />
                      )}
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button className="p-2 hover:bg-slate-100 rounded-lg">
                        <Eye size={14} className="text-slate-500" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg">
                        <Share2 size={14} className="text-slate-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-corporate-navy mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Name</label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="Enterprise Case Study"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder</label>
                <select
                  value={uploadData.folder}
                  onChange={(e) => setUploadData({ ...uploadData, folder: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">None</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  {Object.keys(DOCUMENT_TYPES).filter(t => t !== 'default').map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL (optional)</label>
                <input
                  type="url"
                  value={uploadData.url}
                  onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
