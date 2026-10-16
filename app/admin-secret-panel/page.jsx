'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';


export default function AdminPanel() {
  const [channels, setChannels] = useState([]);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated) fetchChannels();
  }, [isAuthenticated]);

  async function fetchChannels() {
    const { data } = await supabase.from('channels').select('*').order('serial_no', { ascending: true });
    if (data) setChannels(data);
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
    if (formData.id) {
      await supabase.from('channels').update({
        serial_no: parseInt(formData.serial_no),
        name: formData.name,
        language: formData.language,
        category: formData.category,
        stream_url: formData.stream_url,
        logo_url: formData.logo_url,
        is_highlighted: formData.is_highlighted,
        group_id: formData.group_id
      }).eq('id', formData.id);
    } else {
      await supabase.from('channels').insert([{
        serial_no: parseInt(formData.serial_no),
        name: formData.name,
        language: formData.language,
        category: formData.category,
        stream_url: formData.stream_url,
        logo_url: formData.logo_url,
        is_highlighted: formData.is_highlighted,
        group_id: formData.group_id
      }]);
    }

    setFormData({ id: null, serial_no: '', name: '', language: 'Odia', category: 'Entertainment', stream_url: '', logo_url: '', is_highlighted: false, group_id: '' });
    fetchChannels();
  };

  const handleEdit = (channel) => {
    setFormData(channel);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      await supabase.from('channels').delete().eq('id', id);
      fetchChannels();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center text-red-500">Baaji Live Admin Login</h2>
          <input 
            type="password" 
            placeholder="Enter Secret Passcode" 
            value={passcode} 
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-gray-700 mb-4 text-white"
          />
          <button type="submit" className="w-full bg-red-600 py-3 rounded-xl font-bold">Access Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-500">Admin Panel (Baaji Live)</h1>
        <button onClick={() => setIsAuthenticated(false)} className="bg-gray-800 px-3 py-1 rounded text-xs">Logout</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-4 rounded-2xl border border-gray-800 mb-8 space-y-3">
        <h3 className="font-bold border-b border-gray-800 pb-2">{formData.id ? 'Edit Channel' : 'Add New Channel'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Serial No (1, 2, 3...)" required value={formData.serial_no} onChange={(e) => setFormData({...formData, serial_no: e.target.value})} className="p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
          <input type="text" placeholder="Channel Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Language (Odia, Hindi...)" required value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
          <input type="text" placeholder="Category (Sports, News...)" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
        </div>
        <input type="text" placeholder="Stream URL (.m3u8)" required value={formData.stream_url} onChange={(e) => setFormData({...formData, stream_url: e.target.value})} className="w-full p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
        <input type="text" placeholder="Logo Image URL" value={formData.logo_url} onChange={(e) => setFormData({...formData, logo_url: e.target.value})} className="w-full p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
        <input type="text" placeholder="Group ID for Multi-Server Match" value={formData.group_id} onChange={(e) => setFormData({...formData, group_id: e.target.value})} className="w-full p-2 bg-slate-800 rounded border border-gray-700 text-sm"/>
        
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.is_highlighted} onChange={(e) => setFormData({...formData, is_highlighted: e.target.checked})}/>
          Highlight on Home Screen (Multi-Server Match / Hot Event)
        </label>

        <button type="submit" className="w-full bg-red-600 py-2.5 rounded-xl font-bold">{formData.id ? 'Update Channel' : 'Add Channel'}</button>
      </form>

      <h3 className="font-bold mb-3">All Channels List ({channels.length})</h3>
      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="bg-slate-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-red-400">#{ch.serial_no}</span> - <span className="font-bold">{ch.name}</span> ({ch.language})
              <div className="text-xs text-gray-500 truncate max-w-[200px]">{ch.stream_url}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(ch)} className="bg-blue-600 px-2 py-1 rounded text-xs">Edit</button>
              <button onClick={() => handleDelete(ch.id)} className="bg-red-700 px-2 py-1 rounded text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
        }
        
