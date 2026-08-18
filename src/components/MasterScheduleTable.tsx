import React, { useState, useMemo } from 'react';
import { ClassRoom, Subject, Teacher, ScheduleSlot, ScheduleConflict } from '../types';
import { timeSlots } from '../data/initialData';
import { findQuotaShortfalls } from '../utils/manualEdit';
import { Search, Filter, Edit3, Lock, AlertCircle, Sparkles, AlertTriangle } from 'lucide-react';

interface MasterScheduleTableProps {
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: ScheduleSlot[];
  conflicts: ScheduleConflict[];
  onSlotUpdate: (updatedSlot: ScheduleSlot) => void;
}

export const MasterScheduleTable: React.FC<MasterScheduleTableProps> = ({
  classes,
  subjects,
  teachers,
  slots,
  conflicts,
  onSlotUpdate,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const teacherMap = new Map<string, Teacher>();
  teachers.forEach((t) => teacherMap.set(t.id, t));

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    if (selectedGrade !== 'all' && cls.grade !== selectedGrade) return false;
    if (searchTerm && !cls.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getSlot = (classId: string, day: number, period: number) => {
    return slots.find((s) => s.classId === classId && s.day === day && s.period === period);
  };

  const hasConflict = (classId: string, day: number, period: number) => {
    return conflicts.some((c) => c.classId === classId && c.day === day && c.period === period);
  };

  // Các lớp/môn còn thiếu tiết so với chuẩn — đánh dấu vàng để Thầy Cô biết chỗ cần tự bổ sung
  const shortfalls = useMemo(() => findQuotaShortfalls(slots, classes, subjects), [slots, classes, subjects]);
  const shortfallsByClass = useMemo(() => {
    const map = new Map<string, typeof shortfalls>();
    shortfalls.forEach((f) => { if (!map.has(f.classId)) map.set(f.classId, []); map.get(f.classId)!.push(f); });
    return map;
  }, [shortfalls]);

  const totalSlotsCount = slots.length;
  const conflictErrorsCount = conflicts.filter((c) => c.severity === 'error').length;
  const completionPercentage = Math.round(((totalSlotsCount - conflictErrorsCount) / (totalSlotsCount || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Bento Stats & Summary Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Main Bento Metric Card */}
        <div className="md:col-span-5 bg-indigo-900 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider block">
                Trạng Thái Hệ Thống
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">Thời Khóa Biểu 29 Lớp</h3>
            </div>
            <span className="bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-indigo-100">
              {completionPercentage}% Đạt Chuẩn
            </span>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{totalSlotsCount}</span>
              <span className="text-sm text-indigo-200 font-medium">tiết học / tuần</span>
            </div>
            <div className="w-full bg-indigo-950/60 h-2 rounded-full mt-2.5 overflow-hidden border border-indigo-700/50">
              <div
                className="bg-indigo-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-indigo-800/80 pt-3 text-xs">
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Khối Lớp</p>
              <p className="text-sm font-bold text-white">5 Khối (1 &rarr; 5)</p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Giáo Viên</p>
              <p className="text-sm font-bold text-white">35 GV Phụ Trách</p>
            </div>
          </div>
        </div>

        {/* Rules Compliance Status Bento Card */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-indigo-950 text-sm tracking-tight">
              Quy Định & Tuân Thủ Bộ GD&ĐT
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                conflictErrorsCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {conflictErrorsCount > 0 ? `${conflictErrorsCount} Vi Phạm` : '6/6 Quy Tắc Đạt'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800 text-[11px]">Môn liên kết chiều</p>
                <p className="text-slate-500 text-[10px]">CDS, STEM, KNS, IC3 học T5,6,7</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800 text-[11px]">Khối 1, 2 max 7 tiết</p>
                <p className="text-slate-500 text-[10px]">Tối đa 4 tiết sáng + 3 chiều</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800 text-[11px]">Tối đa 2 Tiếng Anh</p>
                <p className="text-slate-500 text-[10px]">Không quá 2 tiết TA/ngày/lớp</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-slate-800 text-[11px]">Tiết CLB Khối 3,4,5</p>
                <p className="text-slate-500 text-[10px]">Cố định tiết 8 chiều Thứ 4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Khối Lớp:
          </span>

          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === 'all'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả 29 Lớp
          </button>

          {[1, 2, 3, 4, 5].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Khối {grade} ({classes.filter((c) => c.grade === grade).length} lớp)
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên lớp (1.1, 2.3)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Master Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3 w-16 border-r border-slate-200">Lớp</th>
                <th className="p-3 w-28 border-r border-slate-200">Khối & GVCN</th>
                {[2, 3, 4, 5, 6].map((day) => (
                  <th key={day} className="p-3 border-r border-slate-200 text-center min-w-[200px]">
                    Thứ {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredClasses.map((cls) => {
                const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId || '');

                return (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Class Name */}
                    <td
                      className={`p-3 border-r border-slate-100 font-extrabold text-sm ${
                        shortfallsByClass.has(cls.id) ? 'bg-amber-50 text-amber-900' : 'text-indigo-900'
                      }`}
                      title={
                        shortfallsByClass.has(cls.id)
                          ? 'Còn thiếu: ' + shortfallsByClass.get(cls.id)!.map((f) => `${f.subjectName} (${f.have}/${f.need})`).join(', ')
                          : undefined
                      }
                    >
                      <span className="flex items-center gap-1">
                        {cls.name}
                        {shortfallsByClass.has(cls.id) && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      </span>
                    </td>

                    {/* Class Info */}
                    <td className="p-3 border-r border-slate-100 text-[11px]">
                      <div className="font-bold text-slate-900">Khối {cls.grade}</div>
                      <div className="text-slate-500 truncate max-w-[100px]" title={homeroomTeacher?.name}>
                        {homeroomTeacher?.shortName || 'Chưa phân công'}
                      </div>
                    </td>

                    {/* Days 2..6 */}
                    {[2, 3, 4, 5, 6].map((day) => (
                      <td key={day} className="p-2 border-r border-slate-100 align-top">
                        <div className="space-y-1">
                          {timeSlots.map((ts) => {
                            // Don't show slot 8 if grade 1,2
                            if ((cls.grade === 1 || cls.grade === 2) && ts.period === 8) return null;

                            const slot = getSlot(cls.id, day, ts.period);
                            const subject = slot ? subjectMap.get(slot.subjectId) : null;
                            const isConflict = hasConflict(cls.id, day, ts.period);

                            return (
                              <div
                                key={ts.period}
                                onClick={() => {
                                  if (slot) setEditingSlot(slot);
                                  else setEditingSlot({ classId: cls.id, day, period: ts.period, subjectId: subjects[0]?.id || '', teacherId: cls.homeroomTeacherId });
                                }}
                                className={`p-1.5 rounded-lg border text-[11px] leading-snug cursor-pointer transition-all hover:scale-[1.01] ${
                                  isConflict
                                    ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold ring-2 ring-rose-400'
                                    : subject
                                    ? subject.color
                                    : 'bg-amber-50/60 text-amber-500 border-dashed border-amber-300 hover:bg-amber-100'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-[9px] opacity-75">T{ts.period}</span>
                                  {subject?.isLinkedSubject && (
                                    <span className="px-1 text-[8px] bg-purple-600 text-white font-bold rounded">
                                      Liên kết
                                    </span>
                                  )}
                                  {isConflict && <AlertCircle className="w-3 h-3 text-rose-600" />}
                                  {slot?.isLocked && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                                </div>

                                <div className="font-semibold truncate" title={subject?.name || 'Bấm để thêm tiết'}>
                                  {subject ? subject.shortName : '+ Thêm'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" /> Sửa Tiết Học: Lớp {classes.find((c) => c.id === editingSlot.classId)?.name} (Thứ {editingSlot.day}, Tiết {editingSlot.period})
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Môn Học:</label>
                <select
                  value={editingSlot.subjectId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.shortName}) {sub.isLinkedSubject ? '[Môn liên kết]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Giáo Viên Phụ Trách:</label>
                <select
                  value={editingSlot.teacherId || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Mặc định (GVCN) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="lockSlot"
                  checked={!!editingSlot.isLocked}
                  onChange={(e) => setEditingSlot({ ...editingSlot, isLocked: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="lockSlot" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Khóa tiết học này (Không cho tự động xếp đè)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onSlotUpdate(editingSlot);
                  setEditingSlot(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
