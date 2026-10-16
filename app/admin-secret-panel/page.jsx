'use client';
import { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [channels, setChannels] = useState([]);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    serial_no: '',
    name: '',
    language: 'Odia',
    category: 'Entertainment',
    stream_url: '',
    logo_url: '',
    is_highlighted: false,
    group_id: ''
  });

  const ADMIN_PASSWORD = "baajiliveadmin"; 
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (isAuthenticated) fetchChannels();
  }, [isAuthenticated]);

  async function fetchChannels() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/channels?select=*&order=serial_no.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setChannels(data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Wrong Secret Password!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      serial_no: parseInt(formData.serial_no),
      name: formData.name,
      language: formData.language,
      category: formData.category,
      stream_url: formData.stream_url,
      logo_url: formData.logo_url,
      is_highlighted: formData.is_highlighted,
      group_id: formData.group_id
    };

    try {
      let res;
      if (formData.id) {
        // Edit Channel
        res = await fetch(`${SUPABASE_URL}/rest/v1/channels?id=eq.${formData.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Add Channel
        res = await fetch(`${SUPABASE_URL}/rest/v1/channels`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        alert(formData.id ? "Channel Updated Successfully!" : "Channel Added Successfully!");
        setFormData({ id: null, serial_no: '', name: '', language: 'Odia', category: 'Entertainment', stream_url: '', logo_url: '', is_highlighted: false, group_id: '' });
        fetchChannels();
      } else {
        const errData = await res.json();
        alert("Error: " + (errData.message || "Failed to save channel. Check Supabase table limits."));
      }
    } catch (err) {
      alert("Network Error!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (channel) => {
    setFormData(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      await fetch(`${SUPABASE_URL}/rest/v1/channels?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      fetchChannels();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-center text-red-500">Baaji Live Admin Login</h2>
          <input 
            type="password" 
            placeholder="Enter Secret Passcode" 
            value={passcode} 
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-gray-700 mb-4 text-white focus:outline-none focus:border-red-500"
          />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white transition">Access Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-500">Admin Panel (Baaji Live)</h1>
        <button onClick={() => setIsAuthenticated(false)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">Logout</button>
      </div>

      {/* Form Add / Edit */}
      <form onSubmit={handleSubmit} className="bg-slate-900 p-4 rounded-2xl border border-gray-800 mb-8 space-y-3 shadow-xl">
        <h3 className="font-bold border-b border-gray-800 pb-2 text-yellow-400">{formData.id ? '✏️ Edit Channel' : '➕ Add New Channel'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Serial No (1, 2, 3...)" required value={formData.serial_no} onChange={(e) => setFormData({...formData, serial_no: e.target.value})} className="p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
          <input type="text" placeholder="Channel Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Language (Odia, Hindi...)" required value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
          <input type="text" placeholder="Category (Sports, News...)" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
        </div>
        <input type="text" placeholder="Stream URL (.m3u8)" required value={formData.stream_url} onChange={(e) => setFormData({...formData, stream_url: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
        <input type="text" placeholder="Logo Image URL" value={formData.logo_url} onChange={(e) => setFormData({...formData, logo_url: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
        <input type="text" placeholder="Group ID for Multi-Server Match (ex: ind-pak-2026)" value={formData.group_id} onChange={(e) => setFormData({...formData, group_id: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-gray-700 text-sm text-white"/>
        
        <label className="flex items-center gap-2 text-sm text-gray-300 py-1">
          <input type="checkbox" checked={formData.is_highlighted} onChange={(e) => setFormData({...formData, is_highlighted: e.target.checked})} className="w-4 h-4 accent-red-600"/>
          Highlight on Home Screen (Hot Event / Match)
        </label>

        <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white transition">
          {loading ? 'Saving...' : (formData.id ? 'Update Channel' : 'Add Channel')}
        </button>
      </form>

      {/* Channel List */}
      <h3 className="font-bold mb-3 text-lg">All Channels List ({channels.length})</h3>
      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="bg-slate-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-sm">
            <div className="pr-2 truncate">
              <span className="font-bold text-red-400">#{ch.serial_no}</span> - <span className="font-bold">{ch.name}</span> <span className="text-xs text-gray-400">({ch.language})</span>
              <div className="text-xs text-gray-500 truncate max-w-[200px]">{ch.stream_url}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(ch)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-xs font-semibold">Edit</button>
              <button onClick={() => handleDelete(ch.id)} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded-lg text-xs font-semibold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  }
    
