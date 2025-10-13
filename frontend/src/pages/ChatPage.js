import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MessageCircle, Send, User, LogOut, Shield, Menu, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ChatPage({ user, setUser }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    // Add welcome message
    setMessages([{
      type: 'bot',
      text: `Hi ${user.name}! I'm your campus assistant. Ask me anything about courses, departments, faculty, events, or campus locations!`
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history`, {
        withCredentials: true
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat/query`, {
        query: userMessage,
        session_id: sessionId
      }, {
        withCredentials: true
      });

      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { type: 'bot', text: response.data.response }]);
      fetchHistory();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50" data-testid="chat-page">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">CampusBot</span>
          </div>
          <div className="flex items-center gap-4">
            {user.is_admin && (
              <Button
                onClick={() => window.location.href = '/admin'}
                data-testid="admin-panel-button"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-medium transition-all duration-300"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              data-testid="logout-button"
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            <div className="flex h-full">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.type}-${index}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start" data-testid="loading-indicator">
                      <div className="bg-gray-100 rounded-2xl px-5 py-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask anything about campus..."
                      data-testid="chat-input"
                      className="flex-1 rounded-full px-6 py-6 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      data-testid="send-message-button"
                      disabled={loading || !query.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 py-6 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;