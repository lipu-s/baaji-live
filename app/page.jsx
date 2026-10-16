'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Hls from 'hls.js';

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [currentStream, setCurrentStream] = useState(null);
  const [multiServers, setMultiServers] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .order('serial_no', { ascending: true });
    if (data) setChannels(data);
  }

  const getYoutubeEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return null;
  };

  const playChannel = async (channel) => {
    setCurrentStream(channel);
    
    if (channel.group_id) {
      const servers = channels.filter(c => c.group_id === channel.group_id);
      setMultiServers(servers);
    } else {
      setMultiServers([]);
    }

    const url = channel.stream_url;

    // Clear Previous Streams
    if (videoRef.current) {
      videoRef.current.src = '';
    }

    const ytUrl = getYoutubeEmbedUrl(url);

    if (!ytUrl && videoRef.current) {
      // DASH Stream (.mpd)
      if (url.includes('.mpd')) {
        const dashjs = (await import('dashjs')).default;
        const player = dashjs.MediaPlayer().create();
        player.initialize(videoRef.current, url, true);
      } 
      // HLS Stream (.m3u8)
      else if (url.includes('.m3u8') && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } 
      // Direct Native Play
      else {
        videoRef.current.src = url;
      }
    }
  };

  const languages = ['All', ...new Set(channels.map(c => c.language))];
  const filteredChannels = selectedLanguage === 'All' 
    ? channels 
    : channels.filter(c => c.language === selectedLanguage);

  const highlighted = channels.filter(c => c.is_highlighted);
  const ytEmbedUrl = currentStream ? getYoutubeEmbedUrl(currentStream.stream_url) : null;

  return (
    <div className="p-4 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center py-4 border-b border-gray-800 mb-6">
        <h1 className="text-3xl font-extrabold text-red-500 tracking-wide">BAAJI LIVE</h1>
        <span className="bg-red-600 text-xs px-2 py-1 rounded text-white font-bold animate-pulse">LIVE TV</span>
      </div>

      {/* Video Player Section */}
      <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 border border-gray-800">
        {ytEmbedUrl ? (
          <iframe
            src={ytEmbedUrl}
            className="w-full aspect-video border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <video 
            ref={videoRef} 
            controls 
            autoPlay 
            className="w-full aspect-video object-contain bg-black"
          ></video>
        )}

        {currentStream && (
          <div className="p-4 bg-slate-900 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{currentStream.name}</h2>
              <p className="text-sm text-gray-400">CH #{currentStream.serial_no} • {currentStream.language}</p>
            </div>
            
            {/* Multi Server Option */}
            {multiServers.length > 1 && (
              <div className="flex gap-2">
                <span className="text-xs text-gray-400 block mb-1">Servers:</span>
                {multiServers.map((srv, idx) => (
                  <button
                    key={srv.id}
                    onClick={() => playChannel(srv)}
                    className={`px-3 py-1 text-xs rounded font-semibold ${currentStream.id === srv.id ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    Server {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlighted Events / Matches */}
      {highlighted.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-yellow-400 flex items-center gap-2">
            🔥 Highlighted Matches / Events
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlighted.map((item) => (
              <div 
                key={item.id} 
                onClick={() => playChannel(item)}
                className="bg-gradient-to-r from-red-900/50 to-slate-800 p-4 rounded-xl border border-red-500/30 cursor-pointer hover:scale-105 transition"
              >
                <span className="text-xs bg-red-600 px-2 py-0.5 rounded font-bold">HOT</span>
                <h4 className="font-bold text-md mt-2">{item.name}</h4>
                <p className="text-xs text-gray-300">Multi-Server Support</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Folders / Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Language Categories:</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                selectedLanguage === lang 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              📁 {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Channels List by Serial Number */}
      <h3 className="text-lg font-bold mb-4">Channels ({filteredChannels.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => playChannel(channel)}
            className="bg-slate-900 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-red-500 transition group flex flex-col items-center text-center"
          >
            <div className="w-full h-24 bg-slate-800 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
              <span className="absolute top-1 left-1 bg-black/70 text-[10px] px-1.5 py-0.5 rounded text-gray-300">
                #{channel.serial_no}
              </span>
              {channel.logo_url ? (
                <img src={channel.logo_url} alt={channel.name} className="h-16 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-gray-600">{channel.name[0]}</span>
              )}
            </div>
            <h4 className="text-sm font-semibold truncate w-full group-hover:text-red-400">{channel.name}</h4>
            <span className="text-[11px] text-gray-400">{channel.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
