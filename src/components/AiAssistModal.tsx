import React, { useState } from 'react';
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot, ScheduleConflict } from '../types';
import { Sparkles, Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';

interface AiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  teachers: Teacher[];
  subjects: Subject[];
  slots: ScheduleSlot[];
  conflicts: ScheduleConflict[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistModal: React.FC<AiAssistModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  classes,
  teachers,
  subjects,
  slots,
  conflicts,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là Trợ lý AI Cố vấn Thời khóa biểu Nguyễn An Khương. Tôi có thể giúp bạn kiểm tra xung đột, gợi ý hoán đổi tiết học hoặc giải thích các quy định xếp thời khóa biểu 2026-2027.',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-schedule-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          schoolInfo,
          classes,
          teachers,
          subjects,
          scheduleSlots: slots,
          conflicts,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Lỗi: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.text || 'Không nhận được câu trả lời.' },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Lỗi kết nối máy chủ: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full h-[600px] flex flex-col text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Trợ Lý AI Gemini - Cố Vấn TKB</h3>
              <p className="text-[11px] text-slate-400">Trí tuệ nhân tạo tư vấn tối ưu thời khóa biểu 29 lớp</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="p-1.5 bg-purple-600/30 text-purple-300 rounded-lg shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="p-1.5 bg-sky-600 text-white rounded-lg shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic p-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Gemini đang suy nghĩ và phân tích TKB...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Gợi ý:
          </span>
          <button
            onClick={() => setPrompt('Kiểm tra giúp tôi nguyên tắc xếp môn liên kết (CDS, STEM, KNS)')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0"
          >
            Môn liên kết
          </button>
          <button
            onClick={() => setPrompt('Làm sao để sửa xung đột trùng lịch dạy của giáo viên?')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0"
          >
            Trùng lịch GV
          </button>
          <button
            onClick={() => setPrompt('Giải thích quy tắc xếp 3 tiết Tiếng Việt lớp 1')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0"
          >
            Quy tắc lớp 1
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi AI về lịch học, quy tắc hoặc xung đột TKB..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
