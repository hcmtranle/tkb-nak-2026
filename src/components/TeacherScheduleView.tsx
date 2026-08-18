import React, { useState } from 'react';
import { Teacher, Subject, ClassRoom, ScheduleSlot, SchoolInfo } from '../types';
import { timeSlots } from '../data/initialData';
import { Users, Clock, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface TeacherScheduleViewProps {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassRoom[];
  slots: ScheduleSlot[];
}

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  schoolInfo,
  teachers,
  subjects,
  classes,
  slots,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const classMap = new Map<string, ClassRoom>();
  classes.forEach((c) => classMap.set(c.id, c));

  // Find all slots for this teacher
  const teacherSlots = slots.filter((s) => s.teacherId === selectedTeacher?.id);
  const totalPeriods = teacherSlots.length;

  const getSlot = (day: number, period: number) => {
    return teacherSlots.filter((s) => s.day === day && s.period === period);
  };

  return (
    <div className="space-y-4">
      {/* Teacher Selector & Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-900 shadow-sm">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn Giáo Viên:</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-indigo-950 font-bold text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName}) - {t.role === 'homeroom' ? 'GVCN' : 'GV Bộ Môn'}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-slate-700 font-semibold">
              Tổng số tiết dạy: <strong className="text-indigo-900 text-sm">{totalPeriods} tiết/tuần</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-indigo-950">
            THỜI KHOÁ BIỂU GIẢO VIÊN: {selectedTeacher?.name} ({selectedTeacher?.shortName})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Môn dạy chính:{' '}
            <span className="font-bold text-slate-800">
              {selectedTeacher?.subjectIds.map((id) => subjectMap.get(id)?.name).join(', ') || 'Nhiều môn'}
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <th className="p-3 border border-slate-200 w-32">Buổi</th>
                <th className="p-3 border border-slate-200 w-28">Tiết</th>
                {[2, 3, 4, 5, 6].map((day) => (
                  <th key={day} className="p-3 border border-slate-200 min-w-[140px]">
                    Thứ {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeSlots.map((ts) => (
                <tr key={ts.period} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold text-slate-500">
                    {ts.session === 'morning' ? 'SÁNG' : 'CHIỀU'}
                  </td>
                  <td className="p-2 border border-slate-200 font-bold text-slate-700">
                    {ts.label} <span className="text-[10px] text-slate-400 block font-normal">{ts.time}</span>
                  </td>

                  {[2, 3, 4, 5, 6].map((day) => {
                    const matchingSlots = getSlot(day, ts.period);
                    const isDoubleBooked = matchingSlots.length > 1;

                    return (
                      <td key={day} className="p-2 border border-slate-200">
                        {matchingSlots.length > 0 ? (
                          <div
                            className={`p-2 rounded-xl text-center border font-bold ${
                              isDoubleBooked
                                ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                                : 'bg-indigo-50 text-indigo-950 border-indigo-200'
                            }`}
                          >
                            {matchingSlots.map((s, idx) => {
                              const cls = classMap.get(s.classId);
                              const sub = subjectMap.get(s.subjectId);
                              return (
                                <div key={idx} className="text-xs">
                                  Lớp <span className="text-indigo-600 font-extrabold">{cls?.name}</span> ({sub?.shortName})
                                </div>
                              );
                            })}
                            {isDoubleBooked && (
                              <div className="text-[9px] text-rose-600 font-extrabold mt-1">TRÙNG GIỜ DẠY!</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Trống</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
