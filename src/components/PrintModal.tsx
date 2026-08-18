import React, { useState } from 'react';
import { Printer, X, BookOpen, Users, GraduationCap, LayoutGrid } from 'lucide-react';
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot } from '../types';
import { printByTeacher, printByGrade, printByClass, printAll } from '../utils/pdfExporter';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: ScheduleSlot[];
}

type PrintMode = 'all' | 'grade' | 'class' | 'teacher';

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen, onClose, schoolInfo, classes, subjects, teachers, slots
}) => {
  const [mode, setMode] = useState<PrintMode>('all');
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || '');
  const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0]?.id || '');

  if (!isOpen) return null;

  const handlePrint = () => {
    switch (mode) {
      case 'all': printAll(schoolInfo, classes, subjects, teachers, slots); break;
      case 'grade': printByGrade(selectedGrade, schoolInfo, classes, subjects, teachers, slots); break;
      case 'class': printByClass(selectedClass, schoolInfo, classes, subjects, teachers, slots); break;
      case 'teacher': printByTeacher(selectedTeacher, schoolInfo, classes, subjects, teachers, slots); break;
    }
  };

  const grades = [1, 2, 3, 4, 5];
  const sortedTeachers = [...teachers].filter(t => t.role !== 'homeroom' || t.assignedClassIds?.length).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const modeOptions: { key: PrintMode; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: 'all', icon: <LayoutGrid className="w-5 h-5" />, label: 'Tất cả lớp', desc: '29 lớp, mỗi lớp 1 trang' },
    { key: 'grade', icon: <GraduationCap className="w-5 h-5" />, label: 'Theo khối', desc: 'Chọn khối 1-5' },
    { key: 'class', icon: <BookOpen className="w-5 h-5" />, label: 'Theo lớp', desc: 'Chọn 1 lớp cụ thể' },
    { key: 'teacher', icon: <Users className="w-5 h-5" />, label: 'Theo giáo viên', desc: 'Lịch dạy cá nhân' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">In Thời Khoá Biểu</h2>
              <p className="text-xs text-slate-500">Xuất file PDF — A4 ngang</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selection */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Chọn kiểu in</p>
          <div className="grid grid-cols-2 gap-2.5">
            {modeOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  mode === opt.key
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 hover:border-indigo-300 text-slate-700'
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${mode === opt.key ? 'text-indigo-600' : 'text-slate-400'}`}>{opt.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Sub-selector */}
          {mode === 'grade' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Chọn khối</label>
              <div className="flex gap-2">
                {grades.map(g => (
                  <button key={g} onClick={() => setSelectedGrade(g)}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all ${selectedGrade === g ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 text-slate-700 hover:border-indigo-300'}`}>
                    Khối {g}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mode === 'class' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Chọn lớp</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                {classes.map(cls => <option key={cls.id} value={cls.id}>Lớp {cls.name}</option>)}
              </select>
            </div>
          )}
          {mode === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Chọn giáo viên</label>
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                {sortedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
            Huỷ
          </button>
          <button onClick={handlePrint}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow">
            <Printer className="w-4 h-4" /> In PDF
          </button>
        </div>
      </div>
    </div>
  );
};
