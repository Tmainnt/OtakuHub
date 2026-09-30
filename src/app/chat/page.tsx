'use client';

import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    // Fetch rooms
    const fetchRooms = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/chat/rooms');
        const data = await res.json();
        setRooms(data || []);
        if (data && data.length > 0) setActiveRoom(data[0]);
      } catch (err) {
        setRooms([
          { id: 1, name: 'General Anime Discussion', is_private: false },
          { id: 2, name: 'Manga Spoiler Room', is_private: true },
        ]);
        setActiveRoom({ id: 1, name: 'General Anime Discussion', is_private: false });
      }
    };
    fetchRooms();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !file) return;

    if (file && file.size > 50 * 1024 * 1024) {
      setUploadStatus('File size exceeds 50MB limit');
      return;
    }

    const newMsg = {
      id: Date.now(),
      sender: 'OtakuExplorer',
      content: inputMessage,
      file: file ? file.name : null,
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMsg]);
    setInputMessage('');
    setFile(null);
    setUploadStatus('');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Rooms Sidebar */}
      <div className="w-1/4 bg-white border-r p-4 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Chat Rooms</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                activeRoom?.id === room.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              # {room.name} {room.is_private ? '(Private)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Active Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            {activeRoom ? `# ${activeRoom.name}` : 'Select a room'}
          </h1>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white p-4 rounded-lg shadow-sm max-w-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-indigo-600 text-sm">{msg.sender}</span>
                <span className="text-xs text-gray-400">{msg.time}</span>
              </div>
              <p className="text-gray-800">{msg.content}</p>
              {msg.file && <p className="text-xs text-indigo-500 mt-1">Attachment: {msg.file}</p>}
            </div>
          ))}
        </div>

        {uploadStatus && <div className="px-6 py-2 bg-red-100 text-red-700 text-sm">{uploadStatus}</div>}

        <form onSubmit={handleSendMessage} className="bg-white border-t p-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="text-sm text-gray-500"
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-6 py-2 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
