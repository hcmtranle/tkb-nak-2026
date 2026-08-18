import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolInfo, Subject, Teacher, ClassRoom, ScheduleSlot, ActiveTab,
} from './types';
import { initialSchoolInfo, initialSubjects, initialTeachers, initialClasses } from './data/initialData';
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
import { LoginScreen } from './components/LoginScreen';
import { TeacherView } from './components/TeacherView';
import { PrintModal } from './components/PrintModal';

// Loại người dùng — lưu trong sessionStorage (mất khi đóng tab)
type UserRole = 'admin' | 'teacher' | null;

export default function App() {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('tkb_role');
    return (saved as UserRole) || null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('master');
  const [isPrintOpen, setIsPrintOpen] = useState(false);

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
  const [editWarning, setEditWarning] = useState<string[] | null>(null);

  // Persist data
  useEffect(() => {
    localStorage.setItem('tkb_school_info', JSON.stringify(schoolInfo));
    localStorage.setItem('tkb_subjects', JSON.stringify(subjects));
    localStorage.setItem('tkb_teachers', JSON.stringify(teachers));
    localStorage.setItem('tkb_classes', JSON.stringify(classes));
    localStorage.setItem('tkb_slots', JSON.stringify(slots));
  }, [schoolInfo, subjects, teachers, classes, slots]);

  const conflicts = useMemo(() => validateSchedule(slots, classes, subjects, teachers), [slots, classes, subjects, teachers]);

  const handleAutoSchedule = () => {
    setSlots(autoGenerateSchedule(classes, subjects, teachers));
    setEditWarning(null);
  };

  const handleSlotUpdate = (updatedSlot: ScheduleSlot) => {
    setSlots((prev) => {
      const idx = prev.findIndex(s => s.classId === updatedSlot.classId && s.day === updatedSlot.day && s.period === updatedSlot.period);
      const next = idx >= 0 ? [...prev.slice(0, idx), updatedSlot, ...prev.slice(idx + 1)] : [...prev, updatedSlot];
      const result = checkOverrideConflict({ classId: updatedSlot.classId, day: updatedSlot.day, period: updatedSlot.period, teacherId: updatedSlot.teacherId }, next, classes, teachers);
      setEditWarning(result.hasConflict ? result.warnings : null);
      return next;
    });
  };

  const handleExportExcel = () => exportTimetableToExcel(schoolInfo, classes, subjects, teachers, slots);

  const handleLogin = (r: 'admin' | 'teacher') => {
    setRole(r);
    sessionStorage.setItem('tkb_role', r);
  };
  const handleLogout = () => {
    setRole(null);
    sessionStorage.removeItem('tkb_role');
  };

  // ===== MÀNG HÌNH ĐĂNG NHẬP =====
  if (!role) {
    return (
      <LoginScreen
        onAdminLogin={() => handleLogin('admin')}
        onTeacherLogin={() => handleLogin('teacher')}
      />
    );
  }

  // ===== GIAO DIỆN GIÁO VIÊN (chỉ xem & in) =====
  if (role === 'teacher') {
    return (
      <TeacherView
        schoolInfo={schoolInfo}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        slots={slots}
        onLogout={handleLogout}
      />
    );
  }

  // ===== GIAO DIỆN QUẢN TRỊ (đầy đủ) =====
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      <Header
        schoolInfo={schoolInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflicts={conflicts}
        onAutoSchedule={handleAutoSchedule}
        onExportExcel={handleExportExcel}
        onOpenAiAssist={() => {}}
        totalClassesCount={classes.length}
        onLogout={handleLogout}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {editWarning && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 text-sm flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold mb-1">⚠️ Thay đổi vừa lưu có thể gây trùng giờ:</p>
              <ul className="list-disc list-inside space-y-0.5">{editWarning.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
            <button onClick={() => setEditWarning(null)} className="text-amber-700 hover:text-amber-900 font-bold text-lg leading-none">×</button>
          </div>
        )}

        {activeTab === 'master' && <MasterScheduleTable classes={classes} subjects={subjects} teachers={teachers} slots={slots} conflicts={conflicts} onSlotUpdate={handleSlotUpdate} />}
        {activeTab === 'class' && <ClassScheduleView schoolInfo={schoolInfo} classes={classes} subjects={subjects} teachers={teachers} slots={slots} />}
        {activeTab === 'teacher' && <TeacherScheduleView schoolInfo={schoolInfo} teachers={teachers} subjects={subjects} classes={classes} slots={slots} />}
        {activeTab === 'conflicts' && <ConflictPanel conflicts={conflicts} classes={classes} subjects={subjects} teachers={teachers} onAutoFix={handleAutoSchedule} />}
        {activeTab === 'apps_script' && <GoogleAppsScriptModal schoolInfo={schoolInfo} classes={classes} subjects={subjects} teachers={teachers} slots={slots} conflicts={conflicts} />}
        {activeTab === 'manage' && <ManagementModal schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} classes={classes} setClasses={setClasses} teachers={teachers} setTeachers={setTeachers} subjects={subjects} setSubjects={setSubjects} />}
      </main>

      <PrintModal isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} schoolInfo={schoolInfo} classes={classes} subjects={subjects} teachers={teachers} slots={slots} />

      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 px-6 text-center text-xs font-medium mt-6">
        © 2026-2027 {schoolInfo.name} — Hệ Thống Xếp Thời Khóa Biểu Tiểu Học (CT GDPT 2018)
      </footer>
    </div>
  );
}
