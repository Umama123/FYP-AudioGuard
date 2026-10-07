import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Paperclip, FileText } from 'lucide-react';
import { resolveBaseUrl } from '../api';

interface WidgetMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  fileName?: string;
  isError?: boolean;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! How can I assist you with AudioGuard deepfake analytics, forensic report dispatches, or watermarking today?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll body when new message arrives
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text && !file) return;

    const userMsgId = `user_${Date.now()}`;
    const newUserMessage: WidgetMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || `Attached file: ${file?.name}`,
      fileName: file?.name
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputVal('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
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
      const botReply = data.reply || data.response || "I didn't receive a reply. Please verify connection.";

      setMessages(prev => [...prev, {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botReply
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: "Error connecting to backend. Please ensure the server is running.",
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'Open Sans, sans-serif' }}>
      
      {/* EXPANDED CHAT WINDOW PANEL */}
      {isOpen && (
        <div style={{ 
          marginBottom: '16px', 
          width: '360px', 
          height: '460px', 
          backgroundColor: '#1a0f2e', 
          borderRadius: '16px', 
          boxShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.2), 0 10px 10px -5px rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          backdropFilter: 'blur(16px)'
        }}>
          
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(to right, #a855f7, #ec4899)', 
            padding: '16px', 
            color: '#ffffff', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontWeight: 600 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} />
              <span>AudioGuard Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>✕</button>
          </div>
          
          {/* Messages Body */}
          <div ref={bodyRef} style={{ 
            flex: 1, 
            padding: '16px', 
            backgroundColor: 'rgba(0, 0, 0, 0.2)', 
            overflowY: 'auto', 
            fontSize: '13px', 
            color: '#e9d5ff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} style={{
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  backgroundColor: isBot 
                    ? (msg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.1)') 
                    : 'rgba(236, 72, 153, 0.15)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                  border: isBot 
                    ? (msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(168, 85, 247, 0.2)') 
                    : '1px solid rgba(236, 72, 153, 0.3)',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: msg.isError ? '#fca5a5' : '#e9d5ff'
                }}>
                  {msg.text}
                  {msg.fileName && (
                    <div style={{
                      marginTop: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <FileText size={10} />
                      <span>{msg.fileName}</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(168, 85, 247, 0.05)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#d8b4fe'
              }}>
                <Loader2 size={14} className="animate-spin" />
                <span style={{ fontSize: '11px' }}>Thinking...</span>
              </div>
            )}
          </div>

          {/* File Attachment preview */}
          {file && (
            <div style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              borderTop: '1px solid rgba(139, 92, 246, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#d8b4fe'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                📎 {file.name}
              </span>
              <button 
                onClick={() => setFile(null)} 
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderTop: '1px solid rgba(139, 92, 246, 0.2)', 
            display: 'flex', 
            gap: '8px',
            alignItems: 'center'
          }}>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.pdf,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d8b4fe',
                cursor: 'pointer',
              }}
              title="Attach log/document"
            >
              <Paperclip size={16} />
            </button>

            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..." 
              style={{ 
                flex: 1, 
                border: '1px solid rgba(139, 92, 246, 0.3)', 
                borderRadius: '8px', 
                padding: '8px 12px', 
                fontSize: '13px', 
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
                height: '36px'
              }} 
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
            />
            
            <button 
              onClick={handleSend}
              disabled={(!inputVal.trim() && !file) || loading}
              style={{ 
                background: 'linear-gradient(to right, #a855f7, #ec4899)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(168, 85, 247, 0.3)',
                opacity: ((!inputVal.trim() && !file) || loading) ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </div>

        </div>
      )}

      {/* FLOATING CIRCULAR TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
          color: '#ffffff',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.4), 0 4px 6px -2px rgba(168, 85, 247, 0.2)',
          cursor: 'pointer',
          fontSize: '24px',
          outline: 'none',
          transition: 'transform 0.2s, background 0.2s',
          backdropFilter: 'blur(8px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(to bottom right, #9333ea, #db2777)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(168, 85, 247, 0.6), 0 4px 6px -2px rgba(168, 85, 247, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(to bottom right, #a855f7, #ec4899)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(168, 85, 247, 0.4), 0 4px 6px -2px rgba(168, 85, 247, 0.2)';
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

    </div>
  );
}