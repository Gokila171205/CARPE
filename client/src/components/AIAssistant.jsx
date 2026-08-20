import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import {
  Bot,
  User as UserIcon,
  Send,
  X,
  Minus,
  Sparkles,
  RefreshCw,
  BarChart3,
  Truck,
  MapPin,
  TrendingUp,
  LineChart,
  ShieldCheck,
  ChevronUp,
  Copy,
  Check,
  CornerDownLeft,
  RotateCcw
} from 'lucide-react';

/**
 * Lightweight Markdown & Table Parser for Chatbot Assistant Messages
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Sanitize any stray svg tag text
  const cleanContent = content.replace(/\*\*svg\*\*/gi, '').replace(/<\/?svg[^>]*>/gi, '').trim();

  const lines = cleanContent.split('\n');
  const elements = [];
  let tableBuffer = [];
  let inTable = false;

  const flushTable = (keyPrefix) => {
    if (tableBuffer.length < 2) {
      tableBuffer.forEach((line, idx) => {
        elements.push(
          <p key={`${keyPrefix}-raw-${idx}`} className="my-1 text-slate-800 leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      });
      tableBuffer = [];
      inTable = false;
      return;
    }

    const headerLine = tableBuffer[0];
    const headerCols = headerLine
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const rowLines = tableBuffer.slice(2);
    const rows = rowLines.map((row) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 || c.length > 0)
    );

    elements.push(
      <div key={`${keyPrefix}-table`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-300 shadow-xs">
        <table className="w-full text-xs text-left border-collapse bg-white">
          <thead className="bg-[#002b4d] text-amber-300 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              {headerCols.map((col, idx) => (
                <th key={idx} className="py-2 px-3 border-b border-slate-700">
                  {formatInlineText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((rowCols, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 hover:bg-amber-50/40'}>
                {rowCols.map((col, cIdx) => (
                  <td key={cIdx} className="py-1.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                    {formatInlineText(col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    tableBuffer = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableBuffer.push(trimmed);
    } else {
      if (inTable) {
        flushTable(`table-${idx}`);
      }
      if (trimmed.length === 0) {
        elements.push(<div key={`blank-${idx}`} className="h-1.5" />);
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
        elements.push(
          <li key={`bullet-${idx}`} className="ml-4 list-disc text-slate-800 my-0.5 leading-relaxed">
            {formatInlineText(bulletText)}
          </li>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        const numText = trimmed.replace(/^\d+\.\s+/, '');
        elements.push(
          <div key={`num-${idx}`} className="flex items-start gap-2 my-1">
            <span className="font-bold text-[#003366] text-xs min-w-[16px]">
              {trimmed.match(/^\d+\./)[0]}
            </span>
            <span className="text-slate-800 leading-relaxed">{formatInlineText(numText)}</span>
          </div>
        );
      } else {
        elements.push(
          <p key={`p-${idx}`} className="my-1 text-slate-800 leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      }
    }
  });

  if (inTable) {
    flushTable('table-end');
  }

  return <div className="space-y-0.5 text-xs sm:text-[13px]">{elements}</div>;
}

/**
 * Parses bold (**bold**), italic (*italic*), and inline code (`code`)
 */
function formatInlineText(text) {
  if (!text) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#002244]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-600">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="bg-slate-100 text-amber-900 font-mono text-[11px] px-1 py-0.5 rounded border border-slate-200">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function AIAssistant() {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Suggested welcome cards
  const welcomeCards = [
    {
      id: 'analyze',
      icon: BarChart3,
      title: t('assistant.cardAnalyzeTitle'),
      query: t('assistant.cardAnalyzeQuery'),
      color: 'from-blue-600 to-indigo-700'
    },
    {
      id: 'vehicle',
      icon: Truck,
      title: t('assistant.cardVehicleTitle'),
      query: t('assistant.cardVehicleQuery'),
      color: 'from-amber-600 to-orange-700'
    },
    {
      id: 'location',
      icon: MapPin,
      title: t('assistant.cardLocationTitle'),
      query: t('assistant.cardLocationQuery'),
      color: 'from-emerald-600 to-teal-700'
    },
    {
      id: 'trends',
      icon: TrendingUp,
      title: t('assistant.cardTrendsTitle'),
      query: t('assistant.cardTrendsQuery'),
      color: 'from-purple-600 to-violet-700'
    },
    {
      id: 'forecast',
      icon: LineChart,
      title: t('assistant.cardForecastTitle'),
      query: t('assistant.cardForecastQuery'),
      color: 'from-rose-600 to-pink-700'
    }
  ];

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      sender: 'user',
      content: query,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Immediately append the user message to UI state
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      // Build conversation history for multi-turn context
      const conversationPayload = updatedMessages.map((m) => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
        content: m.content || m.text
      }));

      const response = await api.post('/assistant/chat', {
        message: query,
        conversation: conversationPayload,
        history: conversationPayload,
        language
      });

      const fullAnswer = response.data.answer || t('assistant.error');
      const followUps = response.data.followUps || [];
      const assistantMsgId = `assistant-${Date.now()}`;

      // Progressive typing reveal animation for real-time streaming feel
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        sender: 'assistant',
        content: '',
        text: '',
        fullText: fullAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUps,
        data: response.data.data
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      // Stream revealed text smoothly
      let currentLen = 0;
      const chunkSize = Math.max(3, Math.floor(fullAnswer.length / 30));
      const interval = setInterval(() => {
        currentLen += chunkSize;
        if (currentLen >= fullAnswer.length) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: fullAnswer, content: fullAnswer, isStreaming: false } : m
            )
          );
          clearInterval(interval);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, text: fullAnswer.substring(0, currentLen), content: fullAnswer.substring(0, currentLen), isStreaming: true }
                : m
            )
          );
        }
      }, 20);
    } catch (err) {
      console.error('Failed to query CARPE AI Assistant:', err);
      const errorMsg = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        sender: 'assistant',
        text: t('assistant.error'),
        content: t('assistant.error'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        failedQuery: query
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (failedQuery) => {
    handleSendMessage(failedQuery);
  };

  return (
    <>
      {/* 1. Floating Launch Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-3 bg-gradient-to-r from-[#001f3f] via-[#002d5a] to-[#003d7a] text-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-full shadow-2xl border-2 border-amber-400 hover:border-amber-300 hover:shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-amber-400/40"
          aria-label={t('assistant.title')}
          title={t('assistant.title')}
        >
          <div className="relative flex items-center justify-center">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:rotate-12 transition-transform">
              <Bot className="h-6 w-6 sm:h-6.5 sm:w-6.5 text-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#001f3f]"></span>
            </span>
          </div>

          <div className="text-left pr-1.5 hidden xs:block sm:block">
            <div className="text-xs sm:text-sm font-black text-amber-300 tracking-wide leading-tight flex items-center gap-1.5">
              <span>{t('assistant.title')}</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-300 block font-medium leading-tight mt-0.5">
              {t('assistant.subtitle')}
            </span>
          </div>
        </button>
      )}

      {/* 2. Minimized Floating Pill */}
      {isOpen && isMinimized && (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 bg-[#002244] text-white px-4 py-2.5 rounded-full shadow-xl border-2 border-amber-400 hover:bg-[#003366] transition-all duration-150 animate-fade-in"
          aria-label={t('assistant.maximize')}
        >
          <Bot className="h-5 w-5 text-amber-400" />
          <span className="text-xs font-bold text-slate-100">{t('assistant.title')}</span>
          <ChevronUp className="h-4 w-4 text-amber-400 ml-1" />
        </button>
      )}

      {/* 3. Full Conversational Chat Window */}
      {isOpen && !isMinimized && (
        <div
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-24px)] xs:w-[440px] sm:w-[460px] md:w-[480px] max-h-[92vh] h-[720px] flex flex-col bg-white rounded-2xl shadow-2xl border-2 border-[#003366] overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95"
          role="dialog"
          aria-modal="true"
          aria-label={t('assistant.title')}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#001833] via-[#00284d] to-[#003d73] text-white px-4 py-3 flex items-center justify-between border-b-2 border-amber-400 flex-shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <Bot className="h-5.5 w-5.5 text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-amber-300 truncate leading-tight tracking-wide">
                    {t('assistant.title')}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    {t('assistant.online')}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 truncate font-medium mt-0.5">
                  {t('assistant.subtitle')}
                </p>
              </div>
            </div>

            {/* Header Actions: + New Chat, Minimize, Close */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-[#001f3f] hover:bg-[#003366] border border-amber-400/40 transition-colors shadow-2xs cursor-pointer"
                title={t('assistant.newChat')}
              >
                <RefreshCw className="h-3 w-3" />
                <span className="text-[11px] hidden sm:inline">{t('assistant.newChat')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                title={t('assistant.minimize')}
                aria-label={t('assistant.minimize')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                title={t('assistant.close')}
                aria-label={t('assistant.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-Header Notice */}
          <div className="bg-[#f0f4f8] border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-[10px] text-slate-600 flex-shrink-0">
            <span className="flex items-center gap-1.5 font-semibold text-[#003366]">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              {t('common.officialGovtRecord')}
            </span>
            <span className="text-slate-500 font-mono text-[9px]">CARPE AI Intelligence v2.5</span>
          </div>

          {/* Scrollable Conversation / Welcome Workspace Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-slate-50/80">
            {/* Zero State: Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-2 space-y-4 animate-fade-in">
                {/* Greeting Card */}
                <div className="bg-gradient-to-br from-[#002244] to-[#003866] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-amber-400/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Bot className="h-28 w-28 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-2">
                      <Sparkles className="h-3 w-3" />
                      Decision Support AI
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                      {t('assistant.welcomeHeading')}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-200 mt-1 leading-relaxed">
                      {t('assistant.welcomeSubheading')}
                    </p>
                  </div>
                </div>

                {/* Categorized Interactive Inquiry Cards */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    {t('assistant.suggestedHeading')}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {welcomeCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleSendMessage(card.query)}
                          className="w-full text-left p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 transition-all duration-150 shadow-2xs group flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="truncate">
                              <span className="text-[11px] font-bold text-[#003366] block">
                                {card.title}
                              </span>
                              <span className="text-xs text-slate-600 truncate block font-medium">
                                "{card.query}"
                              </span>
                            </div>
                          </div>
                          <CornerDownLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 flex-shrink-0 transition-colors ml-2" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user' || msg.sender === 'user';
              const isLatestAssistant = !isUser && index === messages.length - 1;
              const displayText = msg.content || msg.text || '';

              return (
                <div key={msg.id || index} className="space-y-2">
                  {/* USER MESSAGE: Explicitly right-aligned with crystal-clear white text */}
                  {isUser ? (
                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-xs bg-[#003366] text-white px-4 py-2.5 shadow-md border border-[#002244]">
                        <p className="text-white text-xs sm:text-[13px] font-semibold leading-relaxed whitespace-pre-wrap break-words select-text">
                          {displayText}
                        </p>
                        <div className="text-[9px] mt-1 text-right text-blue-200 select-none font-medium">
                          {msg.timestamp}
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs mt-0.5">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    /* ASSISTANT MESSAGE: Left-aligned with Bot avatar and Markdown Renderer */
                    <div className="flex items-start gap-2.5 justify-start">
                      <div className="h-7 w-7 rounded-full bg-[#003366] text-amber-300 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs mt-0.5 border border-amber-400/50">
                        <Bot className="h-4 w-4" />
                      </div>

                      <div
                        className={`max-w-[88%] sm:max-w-[84%] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs text-xs sm:text-[13px] leading-relaxed transition-all ${
                          msg.isError
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : 'bg-white text-slate-800 border border-slate-200'
                        }`}
                      >
                        {/* Markdown Formatted Content */}
                        <MarkdownRenderer content={displayText} />

                        {/* Streaming cursor */}
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse ml-1 align-middle" />
                        )}

                        {/* Error State with Retry Button */}
                        {msg.isError && (
                          <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRetry(msg.failedQuery)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                              {t('assistant.retry')}
                            </button>
                          </div>
                        )}

                        {/* Footer Actions (Copy + Timestamp) */}
                        {!msg.isError && (
                          <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 select-none">
                            <span>{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, displayText)}
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-[#003366] p-0.5 rounded transition-colors cursor-pointer"
                              title={t('assistant.copy')}
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 text-[9px] font-bold">{t('assistant.copied')}</span>
                                </>
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Smart Follow-up Suggestion Chips for Latest Assistant Response (Only when relevant) */}
                  {isLatestAssistant && msg.followUps && msg.followUps.length > 0 && !loading && (
                    <div className="pl-9 pr-2 pt-1 space-y-1.5 animate-fade-in">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('assistant.followUpsHeading')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.followUps.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendMessage(chip)}
                            className="text-left text-xs bg-white hover:bg-amber-50 text-slate-700 hover:text-[#003366] border border-slate-300 hover:border-amber-400 rounded-full px-3 py-1 transition-all shadow-2xs font-medium flex items-center gap-1.5 group cursor-pointer"
                          >
                            <span>{chip}</span>
                            <CornerDownLeft className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Typing / Thinking Animation */}
            {loading && (
              <div className="flex items-start gap-2.5 justify-start animate-fade-in">
                <div className="h-7 w-7 rounded-full bg-[#003366] text-amber-300 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs mt-0.5 border border-amber-400/50">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs text-xs text-slate-700 flex items-center gap-2.5">
                  <span className="font-semibold text-[#003366]">{t('assistant.thinking')}</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Box Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 focus-within:border-[#003366] focus-within:ring-2 focus-within:ring-[#003366]/20 rounded-2xl p-1.5 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('assistant.inputPlaceholder')}
                disabled={loading}
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-[13px] px-2.5 py-1.5 focus:outline-hidden resize-none max-h-[120px] leading-relaxed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-amber-300 disabled:text-slate-500 p-2.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-xs flex-shrink-0 focus:outline-hidden focus:ring-2 focus:ring-amber-400 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                title={t('assistant.send')}
                aria-label={t('assistant.send')}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-1.5">
              <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-600">Enter ↵</kbd> to send, <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-600">Shift + Enter</kbd> for new line</span>
              <span className="font-medium text-[#003366]">CARPE AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
