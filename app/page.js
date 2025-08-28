'use client'

// Paste the ENTIRE dashboard code here
// (Copy all the React component code from the artifact)
import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Image,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send,
  BarChart3,
  Settings,
  Facebook,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Target,
  Zap,
  Edit,
  Save,
  X
} from 'lucide-react';

// FacebookAutoPostDashboard.jsx
// - Saves webhook URL to localStorage
// - Tests & pings n8n webhook regularly to show reliable connection status
// - Uploads images to n8n via POST /upload-image (FormData)
// - Fetches posts from GET /get-posts
// - Approve/reject send POST to /approve-post and /reject-post
// - Graceful error handling and user feedback

export default function FacebookAutoPostDashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(() => {
    try {
      return localStorage.getItem('n8nWebhookUrl') || 'https://your-n8n-instance.com/webhook';
    } catch (e) {
      return 'https://your-n8n-instance.com/webhook';
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [connection, setConnection] = useState({ status: 'unknown', lastChecked: null, info: '' });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // helper: show small toast
  const showToast = (message, ms = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), ms);
  };

  // persist webhook URL to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('n8nWebhookUrl', n8nWebhookUrl);
    } catch (e) {
      console.error('Unable to save webhook URL to localStorage', e);
    }
  }, [n8nWebhookUrl]);

  // ping n8n periodically
  useEffect(() => {
    const ping = async () => {
      if (!n8nWebhookUrl) {
        setConnection({ status: 'disconnected', lastChecked: new Date(), info: 'No URL set' });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      try {
        // Many n8n setups won't expose a dedicated ping endpoint. We'll try GET /health first, then fallback to GET /get-posts
        const attempts = [`${n8nWebhookUrl.replace(/\/$/, '')}/health`, `${n8nWebhookUrl.replace(/\/$/, '')}/get-posts`];
        let ok = false;
        let info = '';

        for (const url of attempts) {
          try {
            const res = await fetch(url, { method: 'GET', signal: controller.signal });
            if (res.ok) {
              ok = true;
              info = `OK (${new URL(url).pathname})`;
              break;
            } else {
              info = `HTTP ${res.status} from ${new URL(url).pathname}`;
            }
          } catch (err) {
            // continue to next attempt
            info = err.name === 'AbortError' ? 'timeout' : String(err.message);
          }
        }

        clearTimeout(timeout);
        setConnection({ status: ok ? 'connected' : 'disconnected', lastChecked: new Date(), info });
      } catch (error) {
        clearTimeout(timeout);
        setConnection({ status: 'disconnected', lastChecked: new Date(), info: String(error.message) });
      }
    };

    // run immediately
    ping();
    // then every 10 seconds
    pingIntervalRef.current = setInterval(ping, 10000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [n8nWebhookUrl]);

  // initial load of posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsRefreshing(true);
    try {
      const url = `${n8nWebhookUrl.replace(/\/$/, '')}/get-posts`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Expect data to be an array. If not, keep sample fallback.
      if (Array.isArray(data)) setGeneratedPosts(data);
      else showToast('Unexpected response shape from /get-posts. Check n8n workflow.');
      showToast('Posts refreshed successfully!');
    } catch (error) {
      console.warn('fetchPosts failed', error);
      showToast('Unable to fetch posts from n8n. Running in demo mode.');
      // demo fallback (keep previous posts or show example)
      if (generatedPosts.length === 0) {
        setGeneratedPosts([
          {
            id: 1,
            product: 'Wireless Headphones',
            image: '/api/placeholder/300/300',
            content: '🎧 Demo: premium sound wireless headphones. Connect your n8n to see real posts.',
            competitorPrice: '$89.99',
            suggestedPrice: '$79.99',
            status: 'pending',
            engagement: { likes: 0, comments: 0, shares: 0 },
            createdAt: 'Demo'
          }
        ]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);

    // send to n8n
    await uploadImageToN8n(file);
  };

  const uploadImageToN8n = async (file) => {
    if (!n8nWebhookUrl) {
      showToast('Set your n8n webhook URL in Settings first');
      return;
    }

    setUploading(true);
    try {
      const endpoint = `${n8nWebhookUrl.replace(/\/$/, '')}/upload-image`;
      const form = new FormData();
      form.append('file', file);
      // you can append metadata if you want
      form.append('source', 'facebook-dashboard');

      const res = await fetch(endpoint, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);

      const body = await res.json();
      // Expect the webhook to respond with a post object or a status
      // If it returns new post(s), merge them
      if (body && Array.isArray(body)) {
        setGeneratedPosts(prev => [...body, ...prev]);
      } else if (body && body.id) {
        setGeneratedPosts(prev => [body, ...prev]);
      } else {
        showToast('Image uploaded — check your n8n workflow for results');
      }
    } catch (error) {
      console.error('uploadImageToN8n error', error);
      showToast('Failed to upload image to n8n. Check webhook URL and CORS.');
    } finally {
      setUploading(false);
    }
  };

  const refreshPosts = async () => {
    await fetchPosts();
  };

  const sendToN8n = async (endpointPath, data) => {
    try {
      const endpoint = `${n8nWebhookUrl.replace(/\/$/, '')}/${endpointPath}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('n8n webhook error:', error);
      showToast('Failed to contact n8n endpoint.');
      throw error;
    }
  };

  const handleApproval = async (postId, approved) => {
    setGeneratedPosts(prev => prev.map(post => post.id === postId ? { ...post, status: approved ? 'approved' : 'rejected' } : post));
    try {
      await sendToN8n(approved ? 'approve-post' : 'reject-post', { postId, action: approved ? 'approve' : 'reject' });
      showToast(approved ? 'Post approved and sent to n8n' : 'Post rejected and sent to n8n');
    } catch (e) {
      // keep local state but inform user
      showToast('Failed to notify n8n about approval');
    }
  };

  const startEditing = (post) => {
    setEditingPost(post.id);
    setEditedContent(post.content || '');
    setEditedPrice(post.suggestedPrice || '');
  };

  const saveEdits = (postId) => {
    setGeneratedPosts(prev => prev.map(post => post.id === postId ? { ...post, content: editedContent, suggestedPrice: editedPrice } : post));
    // Optionally notify n8n about edits
    sendToN8n('edit-post', { postId, content: editedContent, suggestedPrice: editedPrice }).catch(() => {});
    setEditingPost(null);
    setEditedContent('');
    setEditedPrice('');
    showToast('Edits saved locally (and sent to n8n if available)');
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditedContent('');
    setEditedPrice('');
  };

  const testConnectionNow = async () => {
    setConnection(prev => ({ ...prev, info: 'testing...' }));
    // ping effect already runs; but run an explicit quick fetch
    try {
      const res = await fetch(`${n8nWebhookUrl.replace(/\/$/, '')}/get-posts`);
      if (res.ok) {
        setConnection({ status: 'connected', lastChecked: new Date(), info: 'GET /get-posts OK' });
        showToast('Connection OK');
        fetchPosts();
      } else {
        setConnection({ status: 'disconnected', lastChecked: new Date(), info: `GET /get-posts ${res.status}` });
        showToast('Connection failed');
      }
    } catch (err) {
      setConnection({ status: 'disconnected', lastChecked: new Date(), info: String(err.message) });
      showToast('Connection error — check URL and CORS');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${connection.status === 'connected' ? 'bg-green-600' : 'bg-gray-400'}`}>
                <Facebook className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auto-Post Dashboard</h1>
                <p className="text-sm text-gray-500">Intelligent Social Media Automation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${connection.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {connection.status === 'connected' ? 'n8n Connected' : connection.status === 'disconnected' ? 'n8n Disconnected' : 'n8n Unknown'}
                </div>
                <div className="text-xs text-gray-500">{connection.lastChecked ? new Date(connection.lastChecked).toLocaleTimeString() : ''}</div>
              </div>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex space-x-8 mb-8">
          {[
            { id: 'upload', label: 'Upload & Create', icon: Upload },
            { id: 'posts', label: 'Post Review', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'services', label: 'Services', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Product Image</h2>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img src={uploadedImage} alt="Uploaded" className="mx-auto h-48 w-48 object-cover rounded-lg" />
                    <p className="text-green-600 font-medium">Image uploaded successfully!</p>
                    <p className="text-sm text-gray-500">Processing with n8n workflow...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <Image className="h-full w-full" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload product image</p>
                      <p className="text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg mr-2"
                >
                  Choose image
                </button>
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    fileInputRef.current.value = null;
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Clear
                </button>
                {uploading && <span className="ml-3 text-sm text-gray-500">Uploading...</span>}
              </div>
            </div>

            {/* Workflow Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: 'Image Analysis', status: 'completed', icon: Eye },
                { step: 'Web Search', status: 'completed', icon: Target },
                { step: 'Price Check', status: 'processing', icon: DollarSign },
                { step: 'Post Generation', status: 'pending', icon: Zap }
              ].map(({ step, status, icon: Icon }, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      status === 'completed' ? 'bg-green-100 text-green-600' :
                      status === 'processing' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{step}</p>
                      <p className="text-xs text-gray-500 capitalize">{status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Generated Posts</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshPosts}
                  disabled={isRefreshing}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isRefreshing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                <button
                  onClick={testConnectionNow}
                  className="px-3 py-2 bg-gray-100 rounded-lg border"
                >
                  Test Connection
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {generatedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex space-x-4">
                        <img src={post.image} alt={post.product} className="h-20 w-20 object-cover rounded-lg" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.product}</h3>
                          <p className="text-sm text-gray-500">{post.createdAt}</p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Competitor: <span className="text-red-600 font-medium">{post.competitorPrice}</span></p>
                        <p className="text-sm text-gray-500">Suggested: <span className="text-green-600 font-medium">{post.suggestedPrice}</span></p>
                      </div>
                    </div>

                    <div className="mb-4">
                      {editingPost === post.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Post Content:</label>
                            <textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows="4"
                              placeholder="Edit your post content..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Price:</label>
                            <input
                              type="text"
                              value={editedPrice}
                              onChange={(e) => setEditedPrice(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., $79.99"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdits(post.id)}
                              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{post.content}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.engagement?.likes ?? 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.engagement?.comments ?? 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share2 className="h-4 w-4" />
                          <span>{post.engagement?.shares ?? 0}</span>
                        </div>
                      </div>

                      {post.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproval(post.id, false)}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => startEditing(post)}
                            className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleApproval(post.id, true)}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve & Post</span>
                          </button>
                        </div>
                      )}

                      {post.status === 'approved' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Posted Successfully</span>
                        </div>
                      )}

                      {post.status === 'rejected' && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          <span className="font-medium">Post Rejected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Posts', value: generatedPosts.length || 0, icon: Send, color: 'blue' },
                { label: 'Approval Rate', value: `${Math.round((generatedPosts.filter(p => p.status === 'approved').length / Math.max(generatedPosts.length,1)) * 100) || 0}%`, icon: ThumbsUp, color: 'green' },
                { label: 'Avg Engagement', value: (generatedPosts.reduce((s,p)=>s + (p.engagement?.likes||0) + (p.engagement?.comments||0) + (p.engagement?.shares||0),0) / Math.max(generatedPosts.length,1)).toFixed(1), icon: TrendingUp, color: 'purple' },
                { label: 'Revenue Impact', value: `$${generatedPosts.reduce((s,p)=>s + (parseFloat(String(p.suggestedPrice||'').replace(/[^0-9.-]+/g,'')) || 0),0).toFixed(0)}`, icon: DollarSign, color: 'yellow' }
              ].map(({ label, value, icon: Icon, color }, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Engagement Trends</h3>
                <div className="h-64 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart will be implemented with real data</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Post Performance</h3>
                <div className="h-64 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart will be implemented with real data</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Service Management</h2>
            <div className="grid gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <Facebook className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Facebook Auto-Post</h3>
                      <p className="text-sm text-gray-500">AI-powered product post generation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Posts Generated Today:</span>
                    <span className="font-medium">{generatedPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">{Math.round((generatedPosts.filter(p => p.status === 'approved').length / Math.max(generatedPosts.length,1)) * 100) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Scheduled:</span>
                    <span className="font-medium">In 2 hours</span>
                  </div>
                </div>
              </div>

              {/* Coming Soon Services */}
              {[
                { name: 'Multi-Platform Posting', desc: 'Extend to Instagram, Twitter, LinkedIn', icon: Share2 },
                { name: 'Competitor Monitoring', desc: 'Track competitor posts and pricing', icon: Target },
                { name: 'Performance Analytics', desc: 'Advanced engagement tracking', icon: BarChart3 },
                { name: 'Lead Generation', desc: 'Capture and manage social leads', icon: Users }
              ].map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 opacity-75">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-200 text-gray-500 rounded-lg">
                        <service.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.desc}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Coming Soon</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">n8n Configuration</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">n8n Webhook URL</label>
                <input
                  type="url"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://your-n8n-instance.com/webhook"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your n8n webhook base URL (no trailing slash recommended)</p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Webhook Endpoints:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <code className="bg-gray-100 px-1 rounded">GET /get-posts</code> - Fetch posts</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /approve-post</code> - Approve post</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /reject-post</code> - Reject post</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /upload-image</code> - Upload image (multipart/form-data)</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    // save already persisted via useEffect; also test
                    testConnectionNow();
                    setShowSettings(false);
                    showToast('Settings saved');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save & Test
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">Note: Make sure your n8n instance allows CORS from your Vercel domain and that endpoints are reachable over HTTPS.</div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow">{toast}</div>
        </div>
      )}

      {/* connection debug small panel bottom-left */}
      <div className="fixed left-6 bottom-6 z-40">
        <div className={`p-3 rounded-lg shadow-lg ${connection.status === 'connected' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="text-xs font-medium">n8n: {connection.status}</div>
          <div className="text-xs text-gray-600">{connection.info}</div>
        </div>
      </div>
    </div>
  );
}
