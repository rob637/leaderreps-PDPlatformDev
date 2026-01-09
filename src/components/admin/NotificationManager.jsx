import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card, Button, Input, Select, Badge } from '../ui';
import { Trash2, Edit2, Plus, Bell, Clock, AlertCircle, Send, Mail, MessageSquare } from 'lucide-react';

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
    enabled: true
  });

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
      // Dynamically determine function URL based on environment
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendTestEmailSms`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail || null,
          phone: testPhone || null,
          message: testMessage,
          type: 'both'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
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
      setTestResult({ success: false, message: error.message });
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
      enabled: true
    });
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
                value={formData.message} 
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Message to send to user..."
              />
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
                <p className="text-sm text-gray-600 mt-1">"{rule.message}"</p>
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
