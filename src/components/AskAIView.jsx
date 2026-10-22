import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  RotateCcw, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Lightbulb, 
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function AskAIView({ 
  messages, 
  onSendMessage, 
  onClearChat, 
  onAddTaskFromAI,
  quickPromptSuggestions
}) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    setIsTyping(true);
    setInput('');
    try {
      await onSendMessage(query.trim(), selectedCourseFilter);
    } catch {
      // App adds the backend error as a chat message; keep the rejection handled here.
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVoiceMode = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError('Speech recognition is not supported in this browser. You can type your question instead.');
      return;
    }

    setVoiceError('Waiting for microphone permission…');
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceError('');
      };
      recognition.onresult = (event) => {
        const transcript = event.results?.[event.resultIndex]?.[0]?.transcript?.trim();
        if (!transcript) {
          setVoiceError('No speech was detected. Try again or type your question.');
          return;
        }
        setInput(transcript);
        setVoiceError('');
        void handleSend(transcript);
      };
      recognition.onerror = (event) => {
        setIsVoiceListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone access was denied. Allow it in your browser settings, or type your question.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech was detected. Try again or type your question.');
        } else if (event.error === 'audio-capture') {
          setVoiceError('No microphone was found. Connect a microphone or type your question.');
        } else if (event.error !== 'aborted') {
          setVoiceError('Speech recognition failed. Try again or type your question.');
        }
      };
      recognition.onend = () => {
        setIsVoiceListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsVoiceListening(true);
    } catch (error) {
      setIsVoiceListening(false);
      setVoiceError(error.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow it in your browser settings, or type your question.'
        : 'Could not start speech recognition. Try again or type your question.');
    }
  };

  const toggleSpeech = (messageId, text) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setVoiceError('Speech playback is not supported in this browser.');
      return;
    }
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text.replace(/[*_#`>]/g, ''));
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const courseFilters = ['All Courses', 'CS 301 (Algorithms)', 'MATH 240 (Calc III)', 'CS 340 (DB)', 'PHIL 210 (Ethics)'];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-7.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">CampusMate Academic Assistant</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                Simulated Alexa+ Experience
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Browser speech input and playback • No Alexa device connection
            </p>
          </div>
        </div>

        {/* Course Context Filter & Clear */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {courseFilters.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <button
            onClick={onClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Chat Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Body */}
              <div className="space-y-2 max-w-[85%] sm:max-w-[78%]">
                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-none'
                }`}>
                  {/* Formatted Message text */}
                  <div className="space-y-2 whitespace-pre-line font-normal">
                    {msg.content}
                  </div>

                  {/* Actions / Buttons from AI */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (act.toLowerCase().includes('add') || act.toLowerCase().includes('planner')) {
                              onAddTaskFromAI(act);
                            } else {
                              handleSend(act);
                            }
                          }}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition-colors flex items-center gap-1"
                        >
                          <span>{act}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer info: time & copy */}
                <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <>
                      <button
                        onClick={() => toggleSpeech(msg.id, msg.content)}
                        className="hover:text-slate-600 flex items-center gap-1"
                        aria-label={speakingMessageId === msg.id ? 'Stop speaking response' : 'Speak response'}
                        title={speakingMessageId === msg.id ? 'Stop speaking' : 'Speak response'}
                      >
                        {speakingMessageId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{speakingMessageId === msg.id ? 'Stop' : 'Speak'}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-600 flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/80 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-1 font-medium">CampusMate is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggestion Prompts Carousel */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Prompts:
        </span>
        {quickPromptSuggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSend(sug.prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs text-slate-600 transition-colors border border-slate-200/70"
          >
            {sug.title}
          </button>
        ))}
      </div>

      {/* 4. Input Box & Voice Button */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
        {voiceError && (
          <p role="status" className="mb-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs">
            {voiceError}
          </p>
        )}
        {isVoiceListening && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span className="font-semibold">Listening… Speak your question.</span>
            </div>
            <button 
              onClick={toggleVoiceMode}
              className="font-bold underline text-purple-800"
            >
              Cancel
            </button>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Mode Button */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`p-2.5 rounded-xl border transition-all ${
              isVoiceListening
                ? 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-200'
                : 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border-slate-200'
            }`}
            title={isVoiceListening ? 'Stop listening' : 'Start browser speech recognition'}
            aria-label={isVoiceListening ? 'Stop listening' : 'Start browser speech recognition'}
          >
            {isVoiceListening ? <MicOff className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${selectedCourseFilter}, syllabus, exam review, or homework help...`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
