import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolInfo,
  Subject,
  Teacher,
  ClassRoom,
  ScheduleSlot,
  ActiveTab,
} from './types';
import {
  initialSchoolInfo,
  initialSubjects,
  initialTeachers,
  initialClasses,
} from './data/initialData';
import { validateSchedule, autoGenerateSchedule } from './utils/scheduler';
import { checkOverrideConflict } from './utils/manualEdit';
import { exportTimetableToExcel } from './utils/excelExporter';

import { Header } from './components/Header';
import { MasterScheduleTable } from './components/MasterScheduleTable';
import { ClassScheduleView } from './components/ClassScheduleView';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { ConflictPanel } from './components/ConflictPanel';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { ManagementModal } from './components/ManagementModal';
import { AiAssistModal } from './components/AiAssistModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('master');
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('tkb_school_info');
    return saved ? JSON.parse(saved) : initialSchoolInfo;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('tkb_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('tkb_teachers');
    return saved ? JSON.parse(saved) : initialTeachers;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('tkb_classes');
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [slots, setSlots] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem('tkb_slots');
    if (saved) return JSON.parse(saved);
    return autoGenerateSchedule(initialClasses, initialSubjects, initialTeachers);
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editWarning, setEditWarning] = useState<string[] | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('tkb_school_info', JSON.stringify(schoolInfo));
    localStorage.setItem('tkb_subjects', JSON.stringify(subjects));
    localStorage.setItem('tkb_teachers', JSON.stringify(teachers));
    localStorage.setItem('tkb_classes', JSON.stringify(classes));
    localStorage.setItem('tkb_slots', JSON.stringify(slots));
  }, [schoolInfo, subjects, teachers, classes, slots]);

  // Compute real-time conflicts
  const conflicts = useMemo(() => {
    return validateSchedule(slots, classes, subjects, teachers);
  }, [slots, classes, subjects, teachers]);

  // Auto-Scheduler Trigger
  const handleAutoSchedule = () => {
    const generated = autoGenerateSchedule(classes, subjects, teachers);
    setSlots(generated);
    setEditWarning(null); // xếp lại sạch từ đầu — không còn cảnh báo chỉnh tay cũ nào áp dụng nữa
  };

  // Update single slot — CHỈNH TAY: kiểm tra trùng giờ trước khi lưu, chỉ cảnh báo, vẫn cho phép lưu.
  // Việc này không ảnh hưởng tới thuật toán "Tự Động Xếp TKB" — bấm xếp lại vẫn tạo bản mới hoàn toàn sạch.
  const handleSlotUpdate = (updatedSlot: ScheduleSlot) => {
    setSlots((prev) => {
      const idx = prev.findIndex(
        (s) => s.classId === updatedSlot.classId && s.day === updatedSlot.day && s.period === updatedSlot.period
      );
      const next = idx >= 0 ? [...prev.slice(0, idx), updatedSlot, ...prev.slice(idx + 1)] : [...prev, updatedSlot];

      const result = checkOverrideConflict(
        { classId: updatedSlot.classId, day: updatedSlot.day, period: updatedSlot.period, teacherId: updatedSlot.teacherId },
        next,
        classes,
        teachers
      );
      setEditWarning(result.hasConflict ? result.warnings : null);

      return next;
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    exportTimetableToExcel(schoolInfo, classes, subjects, teachers, slots);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      <Header
        schoolInfo={schoolInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflicts={conflicts}
        onAutoSchedule={handleAutoSchedule}
        onExportExcel={handleExportExcel}
        onOpenAiAssist={() => setIsAiModalOpen(true)}
        totalClassesCount={classes.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {editWarning && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 text-sm flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold mb-1">⚠️ Thay đổi vừa lưu có thể gây trùng giờ — Thầy Cô kiểm tra lại giúp:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {editWarning.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
              <p className="mt-1 text-amber-700">Đây chỉ là cảnh báo — thay đổi vẫn đã được lưu theo đúng ý Thầy Cô. Không ảnh hưởng tới lần "Tự Động Xếp TKB" tiếp theo.</p>
            </div>
            <button onClick={() => setEditWarning(null)} className="text-amber-700 hover:text-amber-900 font-bold text-lg leading-none">×</button>
          </div>
        )}
        {activeTab === 'master' && (
          <MasterScheduleTable
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            slots={slots}
            conflicts={conflicts}
            onSlotUpdate={handleSlotUpdate}
          />
        )}

        {activeTab === 'class' && (
          <ClassScheduleView
            schoolInfo={schoolInfo}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            slots={slots}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherScheduleView
            schoolInfo={schoolInfo}
            teachers={teachers}
            subjects={subjects}
            classes={classes}
            slots={slots}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictPanel
            conflicts={conflicts}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            onAutoFix={handleAutoSchedule}
          />
        )}

        {activeTab === 'apps_script' && (
          <GoogleAppsScriptModal
            schoolInfo={schoolInfo}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            slots={slots}
            conflicts={conflicts}
          />
        )}

        {activeTab === 'manage' && (
          <ManagementModal
            schoolInfo={schoolInfo}
            setSchoolInfo={setSchoolInfo}
            classes={classes}
            setClasses={setClasses}
            teachers={teachers}
            setTeachers={setTeachers}
            subjects={subjects}
            setSubjects={setSubjects}
          />
        )}
      </main>

      <AiAssistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        schoolInfo={schoolInfo}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        slots={slots}
        conflicts={conflicts}
      />

      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 px-6 text-center text-xs font-medium mt-6">
        <p>
          © 2026-2027 {schoolInfo.name} — Hệ Thống Xếp Thời Khóa Biểu Tiểu Học Bento Grid (CT GDPT 2018)
        </p>
      </footer>
    </div>
  );
}
