import React, { useState, useEffect } from 'react';
import { 
  Share2, MessageSquare, ThumbsUp, Calendar, 
  BarChart2, Users, Plus, Image as ImageIcon,
  CheckCircle, Copy, ExternalLink, Linkedin
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';

const ContentAmplification = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'scheduled' | 'analytics'
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Live Data only
    const mockPosts = [];

    useEffect(() => {
        // In a real scenario, fetch from 'marketing_posts' collection
        setPosts(mockPosts);
    }, []);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // Show toast?
    };

    const PostCard = ({ post }) => (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <Linkedin className="w-5 h-5 text-[#0077b5]" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Suggested Post</span>
                        <p className="text-sm font-medium text-slate-800">{post.suggestedDate}</p>
                    </div>
                </div>
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                    Ready to Share
                </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 text-slate-700 text-sm whitespace-pre-line">
                {post.text}
                {post.image && (
                    <div className="mt-3 relative rounded-lg overflow-hidden h-40 bg-slate-200">
                        <img src={post.image} alt="Post preview" className="w-full h-full object-cover opacity-80" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                <button 
                    onClick={() => handleCopy(post.text)}
                    className="flex-1 bg-corporate-teal text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Copy className="w-4 h-4" /> Copy Text
                </button>
                <button className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Image /> Download Asset
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-corporate-navy">Content Amplifier</h1>
                    <p className="text-slate-500 mt-1">Boost brand reach by sharing approved team content.</p>
                </div>
                <button className="bg-corporate-navy text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Plus className="w-4 h-4" /> Suggest Post
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Stats Sidebar */}
                <div className="col-span-12 md:col-span-3">
                    <div className="bg-gradient-to-br from-corporate-navy to-slate-800 rounded-xl p-6 text-white mb-6">
                        <div className="flex items-center gap-2 opacity-80 mb-2">
                            <BarChart2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Your Impact</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">1,240</div>
                        <div className="text-sm opacity-60">Views generated</div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                            <div>
                                <div className="font-bold">12</div>
                                <div className="opacity-60">Shares</div>
                            </div>
                            <div>
                                <div className="font-bold">45</div>
                                <div className="opacity-60">Clicks</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="font-bold text-slate-800 mb-4">Top Sharers</h3>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                    User
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">Team Member {i}</div>
                                    <div className="text-xs text-slate-500">{10 * i} posts shared</div>
                                </div>
                                <div className="text-xs font-bold text-emerald-600">#{i}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Feed */}
                <div className="col-span-12 md:col-span-9">
                    <div className="flex gap-4 mb-6 border-b border-slate-200">
                        <button 
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'feed' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                            onClick={() => setActiveTab('feed')}
                        >
                            Available Content
                        </button>
                        <button 
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'scheduled' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                            onClick={() => setActiveTab('scheduled')}
                        >
                            Scheduled
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {posts.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                                <h3 className="text-lg font-bold text-slate-600">No Content Available</h3>
                                <p>There are no posts ready for amplification yet.</p>
                            </div>
                        ) : (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icon wrapper to fix 'Image' name collision
const Image = () => <ImageIcon className="w-4 h-4" />

export default ContentAmplification;
