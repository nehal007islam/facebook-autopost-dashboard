import React, { useState, useRef } from 'react';
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

export default function FacebookAutoPostDashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://your-n8n-instance.com/webhook');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([
    {
      id: 1,
      product: 'Wireless Headphones',
      image: '/api/placeholder/300/300',
      content: '🎧 Discover premium sound quality with our latest wireless headphones! ✨ Features noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and professionals alike. #TechDeals #Headphones #WirelessAudio',
      competitorPrice: '$89.99',
      suggestedPrice: '$79.99',
      status: 'pending',
      engagement: { likes: 0, comments: 0, shares: 0 },
      createdAt: '2 minutes ago'
    },
    {
      id: 2,
      product: 'Smart Watch',
      image: '/api/placeholder/300/300',
      content: '⌚ Stay connected and healthy with our advanced smartwatch! Track your fitness, receive notifications, and monitor your health 24/7. Water-resistant design with 7-day battery life. #SmartWatch #Fitness #Technology',
      competitorPrice: '$249.99',
      suggestedPrice: '$199.99',
      status: 'approved',
      engagement: { likes: 23, comments: 5, shares: 8 },
      createdAt: '1 hour ago'
    }
  ]);
  
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        // Here you would typically send to n8n webhook
        simulateProcessing();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProcessing = () => {
    // Simulate the n8n workflow processing
    setTimeout(() => {
      const newPost = {
        id: Date.now(),
        product: 'New Product',
        image: uploadedImage,
        content: 'AI-generated post content will appear here after processing...',
        competitorPrice: 'Analyzing...',
        suggestedPrice: 'Calculating...',
        status: 'processing',
        engagement: { likes: 0, comments: 0, shares: 0 },
        createdAt: 'Just now'
      };
      setGeneratedPosts(prev => [newPost, ...prev]);
    }, 1000);
  };

  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      // Replace this URL with your actual n8n webhook URL
      const response = await fetch(`${n8nWebhookUrl}/get-posts`);
      
      if (response.ok) {
        const newPosts = await response.json();
        setGeneratedPosts(newPosts);
        alert('Posts refreshed successfully!');
      } else {
        // For demo purpose, just simulate refresh
        alert('Posts refreshed! (Demo mode - connect your n8n webhook)');
      }
    } catch (error) {
      console.error('Failed to refresh posts:', error);
      alert('Posts refreshed! (Demo mode - connect your n8n webhook)');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApproval = (postId, approved) => {
    setGeneratedPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, status: approved ? 'approved' : 'rejected' }
          : post
      )
    );
    
    // Send to n8n webhook
    if (approved) {
      sendToN8n('approve-post', { postId, action: 'approve' });
    } else {
      sendToN8n('reject-post', { postId, action: 'reject' });
    }
  };

  const sendToN8n = async (endpoint, data) => {
    try {
      await fetch(`${n8nWebhookUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('n8n webhook error:', error);
    }
  };

  const startEditing = (post) => {
    setEditingPost(post.id);
    setEditedContent(post.content);
    setEditedPrice(post.suggestedPrice);
  };

  const saveEdits = (postId) => {
    setGeneratedPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, content: editedContent, suggestedPrice: editedPrice }
          : post
      )
    );
    setEditingPost(null);
    setEditedContent('');
    setEditedPrice('');
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditedContent('');
    setEditedPrice('');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const analyticsData = {
    totalPosts: 156,
    approvalRate: 89,
    avgEngagement: 12.4,
    revenue: 2450
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Facebook className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auto-Post Dashboard</h1>
                <p className="text-sm text-gray-500">Intelligent Social Media Automation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">n8n Connected</span>
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
                          <span>{post.engagement.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.engagement.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share2 className="h-4 w-4" />
                          <span>{post.engagement.shares}</span>
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
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Posts', value: analyticsData.totalPosts, icon: Send, color: 'blue' },
                { label: 'Approval Rate', value: `${analyticsData.approvalRate}%`, icon: ThumbsUp, color: 'green' },
                { label: 'Avg Engagement', value: analyticsData.avgEngagement, icon: TrendingUp, color: 'purple' },
                { label: 'Revenue Impact', value: `$${analyticsData.revenue}`, icon: DollarSign, color: 'yellow' }
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
                        alert('Service settings will open here! Configure your automation workflows.');
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
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">94%</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  n8n Webhook URL
                </label>
                <input
                  type="url"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://your-n8n-instance.com/webhook"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your n8n webhook base URL</p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Webhook Endpoints:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <code className="bg-gray-100 px-1 rounded">GET /get-posts</code> - Fetch posts</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /approve-post</code> - Approve post</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /reject-post</code> - Reject post</p>
                  <p>• <code className="bg-gray-100 px-1 rounded">POST /upload-image</code> - Upload image</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    alert('n8n configuration saved!');
                    setShowSettings(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
