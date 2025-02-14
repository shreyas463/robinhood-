'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

export default function Discussion() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/discussions', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      // Refresh messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages([data, ...messages]);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Please login to participate in discussions</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-md bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Send
          </button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.username === user?.username
                ? 'bg-green-600 ml-8'
                : 'bg-gray-700 mr-8'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-white">{message.username}</span>
              <span className="text-xs text-gray-300">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-white">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 