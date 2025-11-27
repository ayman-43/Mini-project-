import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Sparkles, Copy, Check, X, RefreshCw, Mic, MicOff, Edit2, MessageSquare, Bot, User, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { streamAIResponse, cancelCurrentRequest } from '../lib/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Memoized Message Component for Performance
const MessageBubble = memo(({
  message,
  onCopy,
  onEdit,
  onSaveEdit
}: {
  message: Message;
  onCopy: (text: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onSaveEdit?: (messageId: string, newContent: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    await onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
    setTimeout(() => editTextareaRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (editedContent.trim() && onSaveEdit) {
      onSaveEdit(message.id, editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={`flex gap-4 animate-slide-up ${message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}
    >
      {message.role === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-float">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      <div
        className={`group relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${message.role === 'user'
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 rounded-2xl rounded-tr-sm'
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-100 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl rounded-tl-sm border border-white/20 dark:border-gray-700/30'
          } px-5 py-4 transition-all duration-300 hover:scale-[1.01]`}
      >
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={editTextareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/10 dark:bg-black/20 text-white placeholder-blue-100 border border-white/30 rounded-xl px-4 py-3 text-sm sm:text-[15px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
              rows={3}
              style={{ minHeight: '80px' }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs sm:text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-white/90 text-blue-600 rounded-lg transition-colors font-bold shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words m-0">
              {message.content}
              {message.isStreaming && (
                <span className="inline-flex ml-2 gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </span>
              )}
            </p>
          </div>
        )}

        <div className={`flex items-center gap-3 mt-3 pt-3 border-t ${message.role === 'user'
          ? 'border-white/20'
          : 'border-gray-200/50 dark:border-gray-700/50'
          }`}>
          <span className={`text-xs font-medium ${message.role === 'user'
            ? 'text-blue-100'
            : 'text-gray-500 dark:text-gray-400'
            }`}>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>

          {message.role === 'assistant' && !message.isStreaming && (
            <button
              onClick={handleCopy}
              className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}

          {message.role === 'user' && onEdit && !isEditing && (
            <button
              onClick={handleEdit}
              className="ml-auto p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Edit message"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-100" />
            </button>
          )}
        </div>
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg border border-white/50 dark:border-gray-600">
            <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const HealthcareChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 100);
    return () => clearTimeout(scrollTimeout);
  }, [messages]);

  useEffect(() => {
    if (!messages.length || !isLoading) {
      autoFocusOnTextArea()
    }
  }, [isLoading, messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  // Handle save edited message
  const handleSaveEditedMessage = useCallback(async (messageId: string, newContent: string) => {
    // Update the message content
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return prev;

      // Update the edited message and remove all messages after it
      const updatedMessages = prev.slice(0, messageIndex + 1);
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
        timestamp: new Date(),
      };

      return updatedMessages;
    });

    // Regenerate AI response for the edited message
    setIsLoading(true);

    // Create AI message placeholder for streaming
    const aiMessageId = Date.now().toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      // Get conversation history up to the edited message
      const conversationHistory = messages.filter(msg => msg.id !== messageId);

      let fullResponse = '';

      for await (const chunk of streamAIResponse(newContent, conversationHistory)) {
        fullResponse += chunk;

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: fullResponse, isStreaming: true }
              : msg
          )
        );
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (error: any) {
      console.error('AI Response Error:', error);

      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const autoFocusOnTextArea = () => {
    textareaRef.current?.focus()
  }
  // Handle submit with streaming
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);


    // Create AI message placeholder for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };


    setMessages(prev => [...prev, aiMessage]);

    try {
      // Stream the response
      let fullResponse = '';

      for await (const chunk of streamAIResponse(userMessage.content, messages)) {
        fullResponse += chunk;

        // Update message with accumulated content
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: fullResponse, isStreaming: true }
              : msg
          )
        );
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (error: any) {
      console.error('AI Response Error:', error);

      // Remove placeholder and show error
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false)
    }
  };

  // Cancel current request
  const handleCancel = () => {
    cancelCurrentRequest();
    setIsLoading(false);

    // Mark the streaming message as cancelled
    setMessages(prev =>
      prev.map(msg =>
        msg.isStreaming
          ? { ...msg, content: msg.content || '❌ Response cancelled', isStreaming: false }
          : msg
      )
    );
  };

  // Start new session
  const handleNewSession = () => {
    if (messages.length > 0) {
      const confirmed = window.confirm('Start a new session? This will clear all messages.');
      if (confirmed) {
        setMessages([])
        setInput('')
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Voice input functionality
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput(prev => prev + transcript + ' ');
          } else {
            interimTranscript += transcript;
          }
        }
        setInterimText(interimTranscript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* Animated Header - Centered with New Session Button */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-gradient-x"></div>
        <div className="relative px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center">
            {/* New Session Button - Left Side */}
            {messages.length > 0 && !isLoading && (
              <button
                onClick={handleNewSession}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                title="Start New Session"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            )}

            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-float">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-[2px] border-white dark:border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  HealthAI Assistant
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>AI is thinking...</span>
                    </span>
                  ) : (
                    'Always here to help'
                  )}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Messages Container - Responsive */}
      <div className={`flex-1 ${messages.length > 0 ? "overflow-y-auto" : ""} px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 scroll-smooth`}>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center space-y-6 max-w-lg animate-fade-in">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-float">
                <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome to HealthAI
                </h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  Your personal AI health assistant. Ask me anything about symptoms, medications, or wellness.
                </p>
              </div>

              {/* Quick Suggestions - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {[
                  { icon: '🥗', text: 'Healthy diet tips' },
                  { icon: '💪', text: 'Exercise advice' },
                  { icon: '🧘', text: 'Stress relief' },
                  { icon: '😴', text: 'Better sleep' }
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setInput(suggestion.text)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopy}
            onEdit={message.role === 'user' && !isLoading ? () => { } : undefined}
            onSaveEdit={message.role === 'user' && !isLoading ? handleSaveEditedMessage : undefined}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fully Responsive with Voice Input */}
      <div className="sticky bottom-0 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 sm:p-6 z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 p-2 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-all duration-300">

            {/* Voice Input Button with Pulse Animation */}
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={isLoading}
              className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <div className="relative">
                  <MicOff className="w-5 h-5" />
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                </div>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <textarea
              ref={textareaRef}
              value={input + interimText}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about symptoms, medications, or general health..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent border-none outline-none px-2 py-3 text-base text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 max-h-32 disabled:opacity-50"
              style={{ minHeight: '48px' }}
            />

            {isLoading ? (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-shrink-0 p-3 rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              AI-powered information. Always consult healthcare professionals for medical advice.
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default HealthcareChat;
