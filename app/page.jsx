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
    if (!url) return null;
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

    let url = channel.stream_url;

    const ytUrl = getYoutubeEmbedUrl(url);

    if (!ytUrl && videoRef.current) {
      // Clear Previous Stream
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();

      // Bypass CORS for Protected HLS Links
      if (url.includes('.m3u8') && !url.includes('corsproxy.io')) {
        url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      }

      // DASH Stream (.mpd)
      if (url.includes('.mpd')) {
        const dashjs = (await import('dashjs')).default;
        const player = dashjs.MediaPlayer().create();
        player.initialize(videoRef.current, url, true);
      } 
      // HLS Stream (.m3u8)
      else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          videoRef.current.play().catch(() => console.log('Autoplay blocked'));
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } 
      else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
        videoRef.current.play();
      }
      else {
        videoRef.current.src = url;
        videoRef.current.play();
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
    <div className="bg-[#0b0e14] text-white min-h-screen font-sans selection:bg-red-600">
      
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/90 backdrop-blur-md border-b border-gray-800/60 px-4 md:px-8 py-3.5 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/40 tracking-tighter">
            B
          </div>
          <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-red-500 via-orange-400 to-white bg-clip-text text-transparent">
            BAAJI LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="text-xs font-bold text-red-500 tracking-widest uppercase bg-red-950/60 border border-red-800/50 px-2.5 py-1 rounded-full">
            Live Stream
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24 space-y-8">

        {/* MAIN PLAYER SECTION */}
        <section className="bg-gradient-to-b from-gray-900 to-[#0f141d] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
            {currentStream ? (
              ytEmbedUrl ? (
                <iframe
                  src={ytEmbedUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video 
                  ref={videoRef} 
                  controls 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-contain"
                ></video>
              )
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                  📺
                </div>
                <h3 className="text-xl font-bold text-gray-200">Select any Channel to Play</h3>
                <p className="text-xs text-gray-500">Supports HLS (.m3u8), DASH (.mpd), & YouTube Streams</p>
              </div>
            )}
          </div>

          {/* Details Bar */}
          {currentStream && (
            <div className="p-4 md:p-5 bg-[#0f141d] border-t border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow">
                  #{currentStream.serial_no}
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">{currentStream.name}</h2>
                  <p className="text-xs text-gray-400 font-medium">Language: {currentStream.language} • Category: {currentStream.category}</p>
                </div>
              </div>

              {/* Multi-Server Selection */}
              {multiServers.length > 1 && (
                <div className="flex items-center gap-2 bg-gray-900/80 p-2 rounded-xl border border-gray-800 w-full md:w-auto overflow-x-auto">
                  <span className="text-xs text-gray-400 font-bold px-1 whitespace-nowrap">Servers:</span>
                  {multiServers.map((srv, idx) => (
                    <button
                      key={srv.id}
                      onClick={() => playChannel(srv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        currentStream.id === srv.id 
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Server {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* HIGHLIGHTED EVENTS */}
        {highlighted.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 tracking-wide">
              <span>🔥</span> Highlighted Programs & Live Matches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {highlighted.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => playChannel(item)}
                  className="group relative bg-gradient-to-br from-red-950/40 via-gray-900 to-[#0f141d] p-4 rounded-xl border border-red-500/30 hover:border-red-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-red-600/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded text-white tracking-widest shadow">
                      HOT EVENT
                    </span>
                    <span className="text-xs font-bold text-gray-400">#{item.serial_no}</span>
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-red-400 transition truncate">{item.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">Multi-Server Supported</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOLDERS */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Select Language / Category Folder:</h3>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedLanguage === lang 
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                📁 {lang}
              </button>
            ))}
          </div>
        </section>

        {/* CHANNELS GRID */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
            <h3 className="text-lg font-bold text-white tracking-wide">Live Channels ({filteredChannels.length})</h3>
            <span className="text-xs text-gray-400">Sorted by Serial No</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => playChannel(channel)}
                tabIndex={0}
                className="group relative bg-gradient-to-b from-gray-900 to-[#0e121a] border border-gray-800/90 rounded-2xl p-3 cursor-pointer transition-all duration-200 hover:border-red-500 focus:border-red-500 focus:outline-none hover:-translate-y-1 shadow-md hover:shadow-red-600/20 flex flex-col items-center text-center"
              >
                <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-red-400 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-gray-800 z-10">
                  #{channel.serial_no}
                </span>

                <div className="w-full h-28 bg-black/40 rounded-xl flex items-center justify-center p-2 mb-3 border border-gray-800/50 group-hover:border-red-500/40 transition">
                  {channel.logo_url ? (
                    <img 
                      src={channel.logo_url} 
                      alt={channel.name} 
                      className="max-h-20 max-w-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <span className="text-3xl font-black text-gray-700 group-hover:text-red-500 transition">
                      {channel.name[0]}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-gray-200 group-hover:text-red-400 transition truncate w-full">
                  {channel.name}
                </h4>
                <p className="text-[11px] text-gray-500 font-medium truncate w-full mt-0.5">
                  {channel.category} • {channel.language}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
          }
            
