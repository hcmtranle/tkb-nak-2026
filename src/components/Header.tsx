import React from 'react';
import { ActiveTab, SchoolInfo, ScheduleConflict } from '../types';
import { Calendar, Users, GraduationCap, AlertTriangle, Code2, Settings, Download, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  schoolInfo: SchoolInfo;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conflicts: ScheduleConflict[];
  onAutoSchedule: () => void;
  onExportExcel: () => void;
  onOpenAiAssist: () => void;
  totalClassesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  schoolInfo,
  activeTab,
  setActiveTab,
  conflicts,
  onAutoSchedule,
  onExportExcel,
  onOpenAiAssist,
  totalClassesCount,
}) => {
  const errorCount = conflicts.filter((c) => c.severity === 'error').length;

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                {schoolInfo.headerOrg}
              </span>
              <span className="text-[10px] font-mono text-slate-500">v2.4.0</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-indigo-950 tracking-tight leading-tight mt-0.5">
              {schoolInfo.name} - {schoolInfo.title} NĂM HỌC {schoolInfo.year}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Hệ thống xếp TKB tự động cho <strong className="text-indigo-900">{totalClassesCount} lớp tiểu học</strong> (Khối 1 - Khối 5)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAutoSchedule}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm shadow-indigo-200"
            title="Tự động xếp toàn bộ 29 lớp theo 6 nguyên tắc bắt buộc"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tự Động Xếp TKB</span>
          </button>

          <button
            onClick={onOpenAiAssist}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-medium text-xs rounded-xl transition-all shadow-sm shadow-indigo-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Trợ Lý AI Gemini</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 pb-3">
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center space-x-1 overflow-x-auto border border-slate-200/60">
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'master'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>TKB Tổng Thể (29 Lớp)</span>
          </button>

          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'class'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Theo Lớp</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'teacher'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Theo Giáo Viên</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kiểm Tra Xung Đột</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
                {errorCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('apps_script')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'apps_script'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Mã Google Apps Script</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Quản Lý Cấu Hình</span>
          </button>
        </div>
      </div>
    </header>
  );
};
