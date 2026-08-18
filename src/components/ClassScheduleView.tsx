import React, { useState } from 'react';
import { ClassRoom, Subject, Teacher, ScheduleSlot, SchoolInfo } from '../types';
import { timeSlots } from '../data/initialData';
import { Printer, GraduationCap, Users, Clock, FileSpreadsheet } from 'lucide-react';

interface ClassScheduleViewProps {
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: ScheduleSlot[];
}

export const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({
  schoolInfo,
  classes,
  subjects,
  teachers,
  slots,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const teacherMap = new Map<string, Teacher>();
  teachers.forEach((t) => teacherMap.set(t.id, t));

  const homeroomTeacher = teacherMap.get(selectedClass?.homeroomTeacherId || '');

  const getSlot = (day: number, period: number) => {
    return slots.find((s) => s.classId === selectedClass?.id && s.day === day && s.period === period);
  };

  const printView = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Selector & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-900 shadow-sm">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn Lớp Cần Xem:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-indigo-950 font-bold text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Lớp {cls.name} (Khối {cls.grade})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={printView}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <Printer className="w-4 h-4" />
            <span>In TKB Lớp</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Printable Header */}
        <div className="text-center space-y-1 border-b border-slate-100 pb-4">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{schoolInfo.headerOrg}</p>
          <h2 className="text-lg font-extrabold text-indigo-950 uppercase">{schoolInfo.name}</h2>
          <h3 className="text-xl font-extrabold text-indigo-600 mt-2">
            THỜI KHOÁ BIỂU LỚP {selectedClass?.name}
          </h3>
          <p className="text-xs text-slate-500">
            NĂM HỌC {schoolInfo.year} • Giáo viên chủ nhiệm: <strong className="text-slate-800">{homeroomTeacher?.name || 'Chưa phân công'}</strong>
          </p>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <th className="p-3 border border-slate-200 w-32">Buổi</th>
                <th className="p-3 border border-slate-200 w-28">Tiết / Giờ</th>
                {[2, 3, 4, 5, 6].map((day) => (
                  <th key={day} className="p-3 border border-slate-200 min-w-[140px]">
                    Thứ {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Morning Session */}
              <tr className="bg-indigo-50/50 font-semibold text-indigo-900">
                <td rowSpan={5} className="p-3 border border-slate-200 font-bold uppercase">
                  BUỔI SÁNG<br />
                  <span className="text-[10px] font-medium text-slate-500">7:45 - 10:50</span>
                </td>
              </tr>

              {timeSlots.slice(0, 4).map((ts) => (
                <tr key={ts.period} className="hover:bg-slate-50">
                  <td className="p-2.5 border border-slate-200 font-medium text-slate-600">
                    <div className="font-bold">{ts.label}</div>
                    <div className="text-[10px] opacity-80">{ts.time}</div>
                  </td>

                  {[2, 3, 4, 5, 6].map((day) => {
                    const slot = getSlot(day, ts.period);
                    const subject = slot ? subjectMap.get(slot.subjectId) : null;
                    const teacher = slot ? teacherMap.get(slot.teacherId || '') : null;

                    return (
                      <td key={day} className="p-2.5 border border-slate-200">
                        {subject ? (
                          <div className={`p-2 rounded-xl text-center border transition-all ${subject.color}`}>
                            <div className="font-extrabold text-sm">{subject.shortName}</div>
                            <div className="text-[10px] opacity-90 mt-0.5 truncate">{subject.name}</div>
                            {teacher && (
                              <div className="text-[9px] font-semibold opacity-75 mt-1 border-t border-black/10 pt-0.5">
                                {teacher.shortName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">---</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Recess Divider */}
              <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                <td colSpan={7} className="p-1.5 border border-slate-200 text-center">
                  NGHỈ TRƯA (10:50 - 13:30)
                </td>
              </tr>

              {/* Afternoon Session */}
              <tr className="bg-purple-50/50 font-semibold text-purple-900">
                <td rowSpan={4} className="p-3 border border-slate-200 font-bold uppercase">
                  BUỔI CHIỀU<br />
                  <span className="text-[10px] font-medium text-slate-500">13:30 - 15:50</span>
                </td>
              </tr>

              {timeSlots.slice(4, 8).map((ts) => (
                <tr key={ts.period} className="hover:bg-slate-50">
                  <td className="p-2.5 border border-slate-200 font-medium text-slate-600">
                    <div className="font-bold">{ts.label}</div>
                    <div className="text-[10px] opacity-80">{ts.time}</div>
                  </td>

                  {[2, 3, 4, 5, 6].map((day) => {
                    const slot = getSlot(day, ts.period);
                    const subject = slot ? subjectMap.get(slot.subjectId) : null;

                    return (
                      <td key={day} className="p-2.5 border border-slate-200">
                        {subject ? (
                          <div className={`p-2 rounded-xl text-center border transition-all ${subject.color}`}>
                            <div className="font-extrabold text-sm">{subject.shortName}</div>
                            <div className="text-[10px] opacity-90 mt-0.5 truncate">{subject.name}</div>
                            {subject.isLinkedSubject && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] bg-purple-700 text-white font-bold rounded-md">
                                Môn liên kết
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">---</span>
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
