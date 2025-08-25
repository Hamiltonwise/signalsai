import React, { useState } from 'react';
import { 
  Mail, 
  Sparkles, 
  Calendar, 
  Users, 
  TrendingUp, 
  FileText, 
  Send, 
  Eye,
  BarChart3,
  Brain,
  Lightbulb,
  Target,
  Settings,
  CreditCard,
  Phone,
  CheckCircle,
  Clock,
  Edit3
} from 'lucide-react';

interface NewsletterTemplate {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  openRate?: number;
  clickRate?: number;
  aiGenerated: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  publishDate: string;
  engagement: number;
}

export default function Newsletter() {
  const [teamManaged, setTeamManaged] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false);

  const newsletters: NewsletterTemplate[] = [
    {
      id: '1',
      title: 'Weekly Practice Insights - January 15, 2025',
      date: '2025-01-15',
      status: 'sent',
      recipients: 47,
      openRate: 68,
      clickRate: 12,
      aiGenerated: true
    },
    {
      id: '2',
      title: 'Referral Partner Update - January 8, 2025',
      date: '2025-01-08',
      status: 'sent',
      recipients: 47,
      openRate: 72,
      clickRate: 15,
      aiGenerated: true
    },
    {
      id: '3',
      title: 'Practice Growth Report - January 1, 2025',
      date: '2025-01-01',
      status: 'draft',
      recipients: 47,
      aiGenerated: false
    }
  ];

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Advanced Implant Techniques: What GPs Should Know',
      excerpt: 'Latest developments in dental implant procedures and when to refer patients...',
      publishDate: '2025-01-10',
      engagement: 89
    },
    {
      id: '2',
      title: 'Managing Complex Periodontal Cases',
      excerpt: 'Early identification and treatment strategies for periodontal disease...',
      publishDate: '2025-01-05',
      engagement: 76
    },
    {
      id: '3',
      title: 'Pediatric Dental Emergencies: Quick Reference Guide',
      excerpt: 'Essential protocols for handling dental emergencies in children...',
      publishDate: '2024-12-28',
      engagement: 92
    }
  ];

  const aiInsights = [
    {
      type: 'trend',
      title: 'Increased Implant Referrals',
      description: 'Your implant referrals increased 23% this month. GPs would benefit from understanding your new same-day implant protocol.',
      impact: 'High'
    },
    {
      type: 'opportunity',
      title: 'Emergency Case Success',
      description: 'You\'ve successfully handled 15 emergency referrals this week. Share your emergency protocols with referring GPs.',
      impact: 'Medium'
    },
    {
      type: 'education',
      title: 'New Technology Adoption',
      description: 'Your 3D imaging capabilities are underutilized. Educate GPs on when to recommend 3D scans for better treatment planning.',
      impact: 'High'
    }
  ];

  const handleGenerateNewsletter = () => {
    setGeneratingNewsletter(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratingNewsletter(false);
    }, 3000);
  };

  const handleTeamManagedToggle = () => {
    if (!teamManaged) {
      setShowPaymentModal(true);
    } else {
      setTeamManaged(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Edit3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">GP Newsletter</h1>
          <p className="text-gray-500 text-lg font-medium">AI-powered newsletters for your referring GP network</p>
        </div>
        <div className="flex items-center space-x-6">
          {/* Team Managed Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Team Managed</span>
            <button
              onClick={handleTeamManagedToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                teamManaged ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  teamManaged ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="text-xs text-gray-500">
              {teamManaged ? 'HW Team manages newsletters' : 'Self-managed'}
            </div>
          </div>
          
          <button 
            onClick={handleGenerateNewsletter}
            disabled={generatingNewsletter}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generatingNewsletter ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Newsletter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Newsletter Generator */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-purple-200/60 p-8 shadow-lg">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">AI Newsletter Generator</h2>
            <p className="text-gray-600">Automatically create engaging content for your referring GPs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Insights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI-Detected Insights</h3>
            </div>
            
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Blog Content */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Blog Posts</h3>
            </div>
            
            <div className="space-y-3">
              {blogPosts.map((post) => (
                <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{post.title}</h4>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">{post.engagement}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{post.excerpt}</p>
                  <div className="text-xs text-gray-500">{new Date(post.publishDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-white to-gray-50/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Next Newsletter Preview</h4>
                <p className="text-sm text-gray-700">
                  AI will combine your practice insights with recent blog content to create a personalized newsletter 
                  highlighting your implant success rates and new emergency protocols for referring GPs.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Scheduled for</div>
              <div className="text-lg font-bold text-purple-600">Next Monday</div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter History & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 mb-1">47</div>
                <div className="text-sm text-blue-700">GP Subscribers</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900 mb-1">70%</div>
                <div className="text-sm text-green-700">Avg Open Rate</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 mb-1">13.5%</div>
                <div className="text-sm text-purple-700">Avg Click Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter History */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Newsletter History</h3>
              </div>
              <div className="text-sm text-gray-500">Last 30 days</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(newsletter.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{newsletter.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(newsletter.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{newsletter.recipients} recipients</span>
                        </div>
                        {newsletter.aiGenerated && (
                          <div className="flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="text-purple-600">AI Generated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(newsletter.status)}`}>
                      {newsletter.status}
                    </span>
                    {newsletter.status === 'sent' && (
                      <div className="text-right text-sm">
                        <div className="text-gray-900 font-medium">{newsletter.openRate}% opened</div>
                        <div className="text-gray-500">{newsletter.clickRate}% clicked</div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {newsletter.status === 'draft' && (
                        <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Team-Managed Newsletters</h3>
              <p className="text-gray-600">
                Let our expert team handle your GP newsletters with professional design, 
                content creation, and performance tracking.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
                <h4 className="font-semibold text-blue-900 mb-2">What's Included:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Weekly AI-powered content generation</li>
                  <li>• Professional design and formatting</li>
                  <li>• Performance tracking and optimization</li>
                  <li>• GP engagement analytics</li>
                  <li>• Custom branding and messaging</li>
                </ul>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">$297/month</div>
                <div className="text-sm text-gray-600">Includes up to 100 GP contacts</div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTeamManaged(true);
                  setShowPaymentModal(false);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Subscribe</span>
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 mx-auto">
                <Phone className="w-3 h-3" />
                <span>Schedule a call instead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Newsletter }