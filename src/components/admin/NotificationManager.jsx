import React, { useState, useEffect, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../../lib/firebase';
import { Card, Button, Input, Select, Badge } from '../ui';
import { Trash2, Edit2, Plus, Bell, Clock, AlertCircle, Send, Mail, MessageSquare, Link2, ExternalLink } from 'lucide-react';

const CRITERIA_OPTIONS = [
  { value: 'am_bookend_incomplete', label: 'AM Bookend Not Done' },
  { value: 'daily_action_incomplete', label: 'Daily Action Not Done' },
  { value: 'pm_bookend_incomplete', label: 'PM Bookend Not Done' },
  { value: 'always', label: 'Always Send (Time Based)' }
];

const NotificationManager = () => {
  const { db } = useAppServices();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  // Test Form State
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test notification from LeaderReps!');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    time: '09:00',
    criteria: 'am_bookend_incomplete',
    message: '',
    linkText: '', // The text within the message to make a hyperlink
    linkUrl: '',  // The URL/path to link to (e.g., /dashboard, /bookends)
    enabled: true
  });
  
  // Ref for the message textarea to track selection
  const messageInputRef = useRef(null);

  useEffect(() => {
    fetchRules();
  }, [db]);

  const fetchRules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notification_rules'));
      const rulesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRules(rulesList);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (currentRule) {
        // Update
        await updateDoc(doc(db, 'notification_rules', currentRule.id), formData);
      } else {
        // Create
        await addDoc(collection(db, 'notification_rules'), formData);
      }
      setIsEditing(false);
      setCurrentRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteDoc(doc(db, 'notification_rules', id));
        fetchRules();
      } catch (error) {
        console.error("Error deleting rule:", error);
      }
    }
  };

  const handleEdit = (rule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name,
      time: rule.time,
      criteria: rule.criteria,
      message: rule.message,
      linkText: rule.linkText || '',
      linkUrl: rule.linkUrl || '',
      enabled: rule.enabled
    });
    setIsEditing(true);
  };

  const handleTestNotification = async () => {
    if (!testEmail && !testPhone) {
      setTestResult({ success: false, message: 'Please enter an email or phone number' });
      return;
    }
    
    setTestingNotification(true);
    setTestResult(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setTestResult({ success: false, message: 'You must be logged in to send test notifications.' });
        setTestingNotification(false);
        return;
      }

      const idToken = await user.getIdToken();
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendTestEmailSmsHttp`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: testEmail || null,
          phone: testPhone || null,
          message: testMessage,
          type: 'both'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const messages = [];
        if (data.results?.email?.success) messages.push(`Email sent to ${testEmail}`);
        if (data.results?.email?.success === false) messages.push(`Email failed: ${data.results.email.error}`);
        if (data.results?.sms?.success) messages.push(`SMS sent to ${testPhone}`);
        if (data.results?.sms?.success === false) messages.push(`SMS failed: ${data.results.sms.error}`);

        setTestResult({ success: true, message: messages.join(' | ') || 'Test completed' });
      } else {
        setTestResult({ success: false, message: data.error || 'Test failed' });
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      console.error('Test notification error:', error);
      setTestResult({ success: false, message: errorMessage });
    } finally {
      setTestingNotification(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      time: '09:00',
      criteria: 'am_bookend_incomplete',
      message: '',
      linkText: '',
      linkUrl: '',
      enabled: true
    });
  };
  
  // Handle text selection from message to set as link text
  const handleSetLinkText = () => {
    const input = messageInputRef.current;
    if (input && input.selectionStart !== input.selectionEnd) {
      const selectedText = formData.message.substring(input.selectionStart, input.selectionEnd);
      setFormData({ ...formData, linkText: selectedText });
    }
  };
  
  // Render message preview with hyperlink highlighted
  const renderMessagePreview = () => {
    if (!formData.message) return null;
    
    if (formData.linkText && formData.message.includes(formData.linkText)) {
      const parts = formData.message.split(formData.linkText);
      return (
        <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded">
          <span className="text-xs text-gray-400 block mb-1">Preview:</span>
          {parts[0]}
          <span className="text-blue-600 underline font-medium">{formData.linkText}</span>
          {parts.slice(1).join(formData.linkText)}
          {formData.linkUrl && (
            <span className="text-xs text-gray-400 ml-2">→ {formData.linkUrl}</span>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Manager</h1>
          <p className="text-gray-500">Manage system-wide scheduled notifications</p>
        </div>
        <Button onClick={() => { setIsEditing(true); setCurrentRule(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Test Notification Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Test Notifications
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Send a test email and/or SMS to verify the notification system is working properly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email Address
            </label>
            <Input 
              type="email"
              value={testEmail} 
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> Phone Number
            </label>
            <Input 
              type="tel"
              value={testPhone} 
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+15551234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Message</label>
            <Input 
              value={testMessage} 
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test notification message"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Button 
            onClick={handleTestNotification} 
            disabled={testingNotification || (!testEmail && !testPhone)}
          >
            {testingNotification ? 'Sending...' : 'Send Test Notification'}
          </Button>
          {testResult && (
            <div className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </div>
          )}
        </div>
      </Card>

      {isEditing && (
        <Card className="p-6 bg-gray-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">{currentRule ? 'Edit Rule' : 'New Notification Rule'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. AM Reminder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Time (Local User Time)</label>
              <Input 
                type="time"
                value={formData.time} 
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criteria</label>
              <Select 
                value={formData.criteria} 
                onChange={(e) => setFormData({...formData, criteria: e.target.value})}
              >
                {CRITERIA_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  checked={formData.enabled} 
                  onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-600">Enabled</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Message</label>
              <Input 
                ref={messageInputRef}
                value={formData.message} 
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Message to send to user..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Select text above, then click "Set as Link" to make it a hyperlink.
              </p>
            </div>
            
            {/* Hyperlink Configuration */}
            <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Hyperlink Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Text</label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.linkText} 
                      onChange={(e) => setFormData({...formData, linkText: e.target.value})}
                      placeholder="Text to hyperlink"
                      className="flex-1"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetLinkText}
                      title="Select text in message, then click this"
                    >
                      Set
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The exact text in the message to make clickable
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link Destination (URL or Path)</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={formData.linkUrl} 
                      onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                      placeholder="/dashboard, /bookends, or full URL"
                      className="flex-1"
                    />
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    App paths like /dashboard, /bookends, or full URLs like https://...
                  </p>
                </div>
              </div>
              {renderMessagePreview()}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Rule</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {[...rules].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')).map(rule => (
          <Card key={rule.id} className="p-4 flex justify-between items-center">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${rule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                  {!rule.enabled && <Badge variant="secondary">Disabled</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rule.time}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {CRITERIA_OPTIONS.find(c => c.value === rule.criteria)?.label || rule.criteria}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {/* Render message with hyperlink text highlighted */}
                  {rule.linkText && rule.message.includes(rule.linkText) ? (
                    <>
                      "{rule.message.split(rule.linkText)[0]}
                      <span className="text-blue-600 underline">{rule.linkText}</span>
                      {rule.message.split(rule.linkText).slice(1).join(rule.linkText)}"
                    </>
                  ) : (
                    `"${rule.message}"`
                  )}
                </p>
                {rule.linkText && rule.linkUrl && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Link2 className="w-3 h-3" />
                    <span>"{rule.linkText}" → {rule.linkUrl}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(rule.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {rules.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No notification rules defined. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
