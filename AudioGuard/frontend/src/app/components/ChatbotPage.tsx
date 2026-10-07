import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Loader, Paperclip, Trash2, 
  Sparkles, FileText, CheckCircle2
} from 'lucide-react';
import { resolveBaseUrl } from '../api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  fileName?: string;
  isError?: boolean;
}

const SUGGESTED_PROMPTS = [
  "How does AudioGuard protect audio files?",
  "What is the AASIST3 model used for?",
  "Can you explain how to embed a watermark?",
  "What threats does the Aware & Sincere feed monitor?"
];

export function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('audioguard_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return [];
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: "Assalam-o-Alaikum! Welcome to the AudioGuard Support Center. I am your assistant, ready to help you with deepfake detection, audio watermarking, forensic dispatches, or platform configuration. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('audioguard_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText && !file) return;

    const userMsgId = `user_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText || `Uploaded file: ${file?.name}`,
      timestamp,
      fileName: file?.name
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', messageText);
      if (file) {
        formData.append('file', file);
      }

      setFile(null); // Clear attachment selection
      if (fileInputRef.current) fileInputRef.current.value = '';

      const baseUrl = resolveBaseUrl();
      const response = await fetch(`${baseUrl}/api/chatbot/message`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API server returned an error response');
      }

      const data = await response.json();
      
      const newBotMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: data.reply || data.response || "I didn't receive a reply from the model. Please check the backend setup.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (err) {
      const errorBotMessage: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: "Apologies, I encountered an error communicating with the server. Please ensure the backend is running and GEMINI_API_KEY is configured.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const initialWelcome: ChatMessage = {
        id: 'welcome',
        sender: 'bot',
        text: "Chat cleared. I'm ready to help you with anything else you need regarding AudioGuard!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialWelcome]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-20 blur-xl" />
        <div className="relative dark:bg-white/5 bg-purple-50/80 backdrop-blur-2xl border dark:border-white/10 border-purple-200/60 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Bot className="w-6 h-6 dark:text-white text-[#2d1b4e]" />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white text-[#2d1b4e]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                AudioGuard Interactive Support
              </h2>
              <p className="text-sm dark:text-purple-200/80 text-purple-800/80">
                Ask questions in English or Roman Urdu. Attach logs, documents, or screenshots to extract and analyze.
              </p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-300 dark:hover:text-white text-[#2d1b4e] rounded-xl text-sm transition-all cursor-pointer"
            style={{ fontFamily: 'Open Sans, sans-serif' }}
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      </motion.div>

      {/* Main Chat Box Container */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Left Chat Window */}
        <div className="dark:bg-[#1a0f2e]/80 bg-white/80 backdrop-blur-2xl border border-purple-900/30 rounded-2xl flex flex-col h-[580px] overflow-hidden shadow-2xl">
          {/* Conversation Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-purple-900/40">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <motion.div
                    key={msg.id}
                    className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow ${
                        isBot 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                          : 'dark:bg-white/10 bg-purple-100 dark:text-purple-200 text-purple-800'
                      }`}>
                        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      {/* Bubble content */}
                      <div className="space-y-1">
                        <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow border ${
                          isBot
                            ? msg.isError
                              ? 'bg-red-500/10 border-red-500/20 text-red-200'
                              : 'dark:bg-white/5 bg-purple-50/80 border-purple-900/30 dark:text-purple-100 text-purple-900'
                            : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 text-white'
                        }`}
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                        >
                          {msg.text}
                          {msg.fileName && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs dark:text-purple-300 text-purple-700 bg-black/25 px-2 py-1 rounded border border-white/5 w-fit">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Attached: {msg.fileName}</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-[10px] dark:text-purple-300 text-purple-700/40 ${!isBot && 'text-right'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%] flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 px-4 py-3 rounded-2xl flex items-center gap-2">
                    <Loader className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-xs dark:text-purple-300 text-purple-700/80">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Upload preview layer */}
          {file && (
            <div className="px-6 py-2 bg-purple-950/40 border-t border-purple-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs dark:text-purple-300 text-purple-700">
                <FileText className="w-4 h-4 text-pink-400" />
                <span className="font-medium">{file.name}</span>
                <span className="opacity-50">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-0.5 dark:hover:bg-white/5 bg-purple-50/80 rounded transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* User Input controls */}
          <div className="p-4 bg-[#140b25] border-t border-purple-900/30 flex items-center gap-3">
            <input 
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 border border-purple-900/30 flex items-center justify-center dark:text-purple-300 text-purple-700 dark:hover:text-white text-[#2d1b4e] transition-all cursor-pointer"
              title="Attach document/image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about AudioGuard..."
              className="flex-1 dark:bg-white/5 bg-purple-50/80 border border-purple-900/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50 resize-none h-10 leading-tight"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            />

            <button
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !file) || loading}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar Suggestions */}
        <div className="space-y-6">
          <div className="dark:bg-[#1e1435]/90 bg-white/90 border border-purple-900/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-sm font-semibold dark:text-white text-[#2d1b4e] uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Quick Prompts
              </h3>
            </div>
            <div className="space-y-2.5">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl dark:bg-white/5 bg-purple-50/80 dark:hover:bg-white/10 hover:bg-purple-100 border border-white/5 text-xs dark:text-purple-200 text-purple-800 dark:hover:text-white text-[#2d1b4e] hover:border-purple-500/35 transition-all text-ellipsis overflow-hidden line-clamp-2 cursor-pointer"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <div className="dark:bg-[#1e1435]/90 bg-white/90 border border-purple-900/30 rounded-2xl p-5 text-xs dark:text-purple-300 text-purple-700/80 space-y-3">
            <h4 className="font-semibold dark:text-white text-[#2d1b4e] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Capabilities
            </h4>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Detailed speech features analysis advice.</li>
              <li>AASIST classifier threshold tweaks.</li>
              <li>FIA dispatch system help.</li>
              <li>Reads attached text, md, json, pdfs, and images.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
