import React, { useState } from 'react';
import { useProspectsStore, PIPELINE_STAGES } from '../../stores/prospectsStore';
import { useAuthStore } from '../../stores/authStore';
import { TEAM_MEMBERS } from '../../config/team';
import { LINKEDIN_STATUSES, DEFAULT_TAGS } from '../../config/prospectMeta';
import toast from 'react-hot-toast';
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Linkedin,
  DollarSign,
  ChevronDown,
  Tag,
  CheckCircle
} from 'lucide-react';

const AddProspectModal = ({ onClose }) => {
  const { user } = useAuthStore();
  const { addProspect } = useProspectsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    linkedin: '',
    linkedinStatus: 'none',
    stage: 'new',
    owner: user?.email || '',
    ownerEmail: user?.email || '',
    value: '',
    notes: '',
    tags: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addProspect({
        ...formData,
        value: formData.value ? Number(formData.value) : null,
      });
      toast.success('Prospect added');
      onClose();
    } catch (error) {
      toast.error('Failed to add prospect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedOwner = TEAM_MEMBERS.find(m => m.email === formData.owner);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-elevated animate-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add New Prospect</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name & Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                  placeholder="VP of Sales"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="john@acme.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* LinkedIn URL & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="linkedin.com/in/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Status</label>
                <select
                  value={formData.linkedinStatus}
                  onChange={(e) => handleChange('linkedinStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none bg-white"
                >
                  {LINKEDIN_STATUSES.map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(tagId => {
                  const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tagId}
                      onClick={() => handleChange('tags', formData.tags.filter(t => t !== tagId))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.label}
                      <X className="w-3 h-3" />
                    </span>
                  );
                })}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  >
                    <Tag className="w-3 h-3" />
                    Add Tag
                  </button>
                  {showTagDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTagDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-elevated z-20 py-1 w-40 max-h-48 overflow-y-auto">
                        {DEFAULT_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (!formData.tags.includes(tag.id)) {
                                handleChange('tags', [...formData.tags, tag.id]);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 ${
                              formData.tags.includes(tag.id) ? 'bg-slate-100' : ''
                            }`}
                          >
                            <div 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.label}</span>
                            {formData.tags.includes(tag.id) && (
                              <CheckCircle className="w-3 h-3 text-brand-teal ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stage & Owner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none bg-white"
                >
                  {PIPELINE_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                <button
                  type="button"
                  onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition bg-white"
                >
                  <div className="flex items-center gap-2">
                    {selectedOwner ? (
                      <>
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: selectedOwner.color }}
                        >
                          {selectedOwner.initials}
                        </div>
                        <span>{selectedOwner.name}</span>
                      </>
                    ) : (
                      <span className="text-slate-500">Select owner</span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                
                {showOwnerDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowOwnerDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-elevated z-20 py-1">
                      {TEAM_MEMBERS.map(member => (
                        <button
                          key={member.email}
                          type="button"
                          onClick={() => {
                            handleChange('owner', member.email);
                            handleChange('ownerEmail', member.email);
                            setShowOwnerDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${
                            formData.owner === member.email ? 'bg-slate-100' : ''
                          }`}
                        >
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.initials}
                          </div>
                          <span>{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deal Value */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deal Value (optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none min-h-20 resize-none"
                placeholder="Add any notes about this prospect..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Prospect'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProspectModal;
