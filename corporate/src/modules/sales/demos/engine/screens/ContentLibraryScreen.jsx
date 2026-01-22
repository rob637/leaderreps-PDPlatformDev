import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  FileText, 
  BookOpen, 
  Search,
  Filter,
  Play,
  Clock,
  ChevronRight,
  Star,
  Users,
  Award,
  Heart
} from 'lucide-react';
import { Card, Button, Badge, Avatar } from '../components/ui';
import { demoContent } from '../data/demoContent';

const ContentLibraryScreen = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'videos', label: 'Videos', icon: Video, count: demoContent.videos.length },
    { id: 'programs', label: 'Programs', icon: BookOpen, count: demoContent.programs.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: demoContent.documents.length },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
        <p className="text-gray-600">Explore videos, programs, and resources</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg">
            <Filter className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <Badge variant={activeTab === tab.id ? 'primary' : 'secondary'} size="sm">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content Grid */}
      <AnimatePresence mode="wait">
        {activeTab === 'videos' && (
          <motion.div
            key="videos"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-2 gap-4"
          >
            {demoContent.videos.map((video, index) => (
              <motion.div key={video.id} variants={itemVariants}>
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative">
                    <div 
                      className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                      style={{ 
                        backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary-600 ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {video.duration}
                    </div>
                    {video.isNew && (
                      <Badge variant="accent" className="absolute top-2 left-2">New</Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" size="sm">{video.skill}</Badge>
                      {video.favorite && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'programs' && (
          <motion.div
            key="programs"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {demoContent.programs.map((program, index) => (
              <motion.div key={program.id} variants={itemVariants}>
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: program.color }}
                    >
                      <program.icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{program.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {program.videoCount} videos
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {program.duration}
                        </span>
                        {program.progress > 0 && (
                          <Badge variant="primary" size="sm">{program.progress}% done</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-3"
          >
            {demoContent.documents.map((doc, index) => (
              <motion.div key={doc.id} variants={itemVariants}>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.downloaded && (
                        <Badge variant="success" size="sm">Downloaded</Badge>
                      )}
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <Play className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">{selectedVideo.title}</p>
                  <p className="text-primary-200 text-sm">Click to play video</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{selectedVideo.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="primary">{selectedVideo.skill}</Badge>
                  <Badge variant="secondary">{selectedVideo.duration}</Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="primary" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Play Video
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedVideo(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContentLibraryScreen;
