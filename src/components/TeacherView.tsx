/**
 * Giao diện GIÁO VIÊN — chỉ xem & in, không có quyền chỉnh sửa hay xem mã.
 */
import React, { useState } from 'react';
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot } from '../types';
import { BookOpen, Printer, LogOut, Search } from 'lucide-react';
import { ClassScheduleView } from './ClassScheduleView';
import { TeacherScheduleView } from './TeacherScheduleView';
import { PrintModal } from './PrintModal';

interface TeacherViewProps {
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: ScheduleSlot[];
  onLogout: () => void;
}

type ViewMode = 'class' | 'teacher';

export const TeacherView: React.FC<TeacherViewProps> = ({
  schoolInfo, classes, subjects, teachers, slots, onLogout
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 leading-none truncate">{schoolInfo.headerOrg}</p>
              <h1 className="font-bold text-slate-800 text-sm leading-tight truncate">{schoolInfo.name}</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
            {([['class', 'Theo Lớp'], ['teacher', 'Theo Giáo Viên']] as [ViewMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === key ? 'bg-white text-indigo-700 shadow font-semibold' : 'text-slate-600 hover:text-slate-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setIsPrintOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow transition-all">
              <Printer className="w-4 h-4" /> In TKB
            </button>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
              <LogOut className="w-4 h-4" /> Thoát
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2 text-emerald-800 text-sm">
          <Search className="w-4 h-4 shrink-0" />
          <span>Chế độ <strong>Xem & In</strong> — Thầy Cô có thể xem thời khoá biểu và in PDF, không có quyền chỉnh sửa.</span>
        </div>

        {viewMode === 'class' ? (
          <ClassScheduleView schoolInfo={schoolInfo} classes={classes} subjects={subjects} teachers={teachers} slots={slots} readOnly />
        ) : (
          <TeacherScheduleView schoolInfo={schoolInfo} teachers={teachers} subjects={subjects} classes={classes} slots={slots} readOnly />
        )}
      </main>

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        schoolInfo={schoolInfo}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        slots={slots}
      />

      <footer className="bg-white border-t border-slate-200 text-slate-500 py-3 px-6 text-center text-xs mt-4">
        © 2026-2027 {schoolInfo.name} — Thời Khoá Biểu Năm Học 2026-2027
      </footer>
    </div>
  );
};
