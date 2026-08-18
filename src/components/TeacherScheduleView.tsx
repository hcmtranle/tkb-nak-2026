import React, { useState } from 'react';
import { Teacher, Subject, ClassRoom, ScheduleSlot, SchoolInfo } from '../types';
import { timeSlots } from '../data/initialData';
import { Users, Clock } from 'lucide-react';
import { linkedPoolTeacherIds } from '../data/initialData';

interface TeacherScheduleViewProps {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassRoom[];
  slots: ScheduleSlot[];
  readOnly?: boolean;
}

const DAYS = [2, 3, 4, 5, 6];
const DAY_LABELS: Record<number, string> = { 2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu' };

/** Lấy code môn của pool mà GV này thuộc về (nếu có) */
function getPoolCode(teacherId: string): string | null {
  for (const [code, ids] of Object.entries(linkedPoolTeacherIds)) {
    if (ids.includes(teacherId)) return code;
  }
  return null;
}

/** Màu header theo môn pool */
const POOL_COLORS: Record<string, string> = {
  TATK: 'bg-purple-600', TABN: 'bg-pink-600', IC3: 'bg-cyan-600',
  CDS: 'bg-fuchsia-600', KNS: 'bg-amber-600', TOANTD: 'bg-violet-600', STEM: 'bg-sky-600',
};
const POOL_CELL_COLORS: Record<string, string> = {
  TATK: 'bg-purple-50 text-purple-900 border-purple-200', TABN: 'bg-pink-50 text-pink-900 border-pink-200',
  IC3: 'bg-cyan-50 text-cyan-900 border-cyan-200', CDS: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200',
  KNS: 'bg-amber-50 text-amber-900 border-amber-200', TOANTD: 'bg-violet-50 text-violet-900 border-violet-200',
  STEM: 'bg-sky-50 text-sky-900 border-sky-200',
};

/** ===== BẢNG POOL: 3 GV cùng môn ===== */
const PoolScheduleTable: React.FC<{
  poolCode: string;
  poolTeachers: Teacher[];
  subjects: Subject[];
  classes: ClassRoom[];
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
}> = ({ poolCode, poolTeachers, subjects, classes, slots, schoolInfo }) => {
  const subjectName = subjects.find(s => s.code === poolCode)?.name || poolCode;
  const headerColor = POOL_COLORS[poolCode] || 'bg-indigo-600';
  const cellColor = POOL_CELL_COLORS[poolCode] || 'bg-indigo-50 text-indigo-900 border-indigo-200';
  const classMap = new Map<string, ClassRoom>(classes.map(c => [c.id, c]));

  // Tổng tiết mỗi GV
  const totalByTeacher = poolTeachers.map(t => slots.filter(s => s.teacherId === t.id).length);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className={`${headerColor} text-white rounded-xl px-4 py-3 mb-4`}>
        <h2 className="text-base font-extrabold">THỜI KHOÁ BIỂU GV POOL: {subjectName}</h2>
        <p className="text-xs opacity-80 mt-0.5">
          Năm học {schoolInfo.year} &nbsp;—&nbsp;
          {poolTeachers.map((t, i) => `GV ${poolCode}_${i + 1}: ${t.name}`).join(' | ')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-xs w-full">
          <thead>
            {/* Hàng 1: Buổi | Tiết | Thứ Hai (GV1,GV2,GV3) | ... */}
            <tr>
              <th rowSpan={2} className="border border-slate-300 bg-slate-700 text-white p-2 text-[11px] w-20">Buổi</th>
              <th rowSpan={2} className="border border-slate-300 bg-slate-700 text-white p-2 text-[11px] w-24">Tiết / Giờ</th>
              {DAYS.map(day => (
                <th key={day} colSpan={poolTeachers.length}
                  className="border border-slate-300 bg-slate-600 text-white p-2 text-[11px] font-bold text-center">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
            {/* Hàng 2: tên GV con */}
            <tr>
              {DAYS.map(day =>
                poolTeachers.map((t, i) => (
                  <th key={`${day}-${t.id}`}
                    className={`border border-slate-200 p-1 text-[10px] font-bold text-center ${headerColor} text-white opacity-90`}>
                    GV_{poolCode}_{i + 1}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((ts, tsIdx) => {
              const isMorningEnd = ts.session === 'morning' && timeSlots[tsIdx + 1]?.session === 'afternoon';
              return (
                <React.Fragment key={ts.period}>
                  <tr className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-1.5 text-center font-bold text-[10px] text-slate-500 bg-slate-50">
                      {ts.session === 'morning' ? 'SÁNG' : 'CHIỀU'}
                    </td>
                    <td className="border border-slate-200 p-1.5 text-center font-bold text-[10px] text-slate-700 bg-slate-50 whitespace-nowrap">
                      Tiết {ts.period}<br />
                      <span className="font-normal text-slate-400">{ts.time}</span>
                    </td>
                    {DAYS.map(day =>
                      poolTeachers.map((t) => {
                        const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.period === ts.period);
                        const cls = slot ? classMap.get(slot.classId) : null;
                        return (
                          <td key={`${day}-${t.id}`} className="border border-slate-200 p-1 text-center" style={{ minWidth: 56 }}>
                            {cls ? (
                              <div className={`px-1.5 py-1 rounded-lg border font-bold text-[11px] ${cellColor}`}>
                                {cls.name}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                  {isMorningEnd && (
                    <tr>
                      <td colSpan={2 + DAYS.length * poolTeachers.length}
                        className="border border-slate-200 bg-amber-50 text-amber-700 text-center text-[11px] font-bold py-1.5 tracking-wider">
                        NGHỈ TRƯA (10:50 – 13:30)
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Hàng tổng tiết */}
            <tr className="border-t-2 border-slate-400 bg-slate-50">
              <td colSpan={2} className="border border-slate-200 p-2 text-center font-bold text-[11px] text-slate-700">
                Tổng tiết / tuần
              </td>
              {DAYS.map(day =>
                poolTeachers.map((t, i) => (
                  <td key={`total-${day}-${t.id}`} className="border border-slate-200 p-1 text-center font-bold text-[11px]">
                    {day === DAYS[DAYS.length - 1] ? (
                      <span className={`${headerColor} text-white px-2 py-0.5 rounded-lg text-[11px]`}>{totalByTeacher[i]}</span>
                    ) : ''}
                  </td>
                ))
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ghi chú */}
      <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
        <strong>Ghi chú:</strong>&nbsp;
        {poolTeachers.map((t, i) => `GV_${poolCode}_${i + 1} (${t.name})`).join(' | ')}
      </div>
    </div>
  );
};

/** ===== BẢNG GV ĐƠN (GVCN hoặc GV bộ môn cố định) ===== */
const SingleTeacherTable: React.FC<{
  teacher: Teacher;
  subjects: Subject[];
  classes: ClassRoom[];
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
}> = ({ teacher, subjects, classes, slots, schoolInfo }) => {
  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));
  const classMap = new Map<string, ClassRoom>(classes.map(c => [c.id, c]));
  const teacherSlots = slots.filter(s => s.teacherId === teacher.id);
  const totalPeriods = teacherSlots.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="bg-indigo-700 text-white rounded-xl px-4 py-3 mb-4">
        <h2 className="text-base font-extrabold">THỜI KHOÁ BIỂU GIÁO VIÊN: {teacher.name}</h2>
        <p className="text-xs opacity-80 mt-0.5">
          Năm học {schoolInfo.year} &nbsp;—&nbsp;
          Môn dạy chính: {teacher.subjectIds.map(id => subjectMap.get(id)?.shortName || id).join(', ')} &nbsp;—&nbsp;
          Tổng: <strong>{totalPeriods} tiết/tuần</strong>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-slate-700 text-white text-[11px]">
              <th className="p-2.5 border border-slate-600 w-20">Buổi</th>
              <th className="p-2.5 border border-slate-600 w-28">Tiết / Giờ</th>
              {DAYS.map(day => (
                <th key={day} className="p-2.5 border border-slate-600 min-w-[120px]">{DAY_LABELS[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((ts, tsIdx) => {
              const isMorningEnd = ts.session === 'morning' && timeSlots[tsIdx + 1]?.session === 'afternoon';
              return (
                <React.Fragment key={ts.period}>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-200 font-bold text-[10px] text-slate-500 bg-slate-50">
                      {ts.session === 'morning' ? 'SÁNG' : 'CHIỀU'}
                    </td>
                    <td className="p-2 border border-slate-200 font-bold text-slate-700 whitespace-nowrap">
                      Tiết {ts.period}<br />
                      <span className="text-[10px] text-slate-400 font-normal">{ts.time}</span>
                    </td>
                    {DAYS.map(day => {
                      const daySlots = teacherSlots.filter(s => s.day === day && s.period === ts.period);
                      const isDouble = daySlots.length > 1;
                      return (
                        <td key={day} className="p-1.5 border border-slate-200">
                          {daySlots.length > 0 ? (
                            <div className={`p-1.5 rounded-xl border font-bold ${isDouble ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-indigo-50 text-indigo-900 border-indigo-200'}`}>
                              {daySlots.map((s, idx) => (
                                <div key={idx} className="text-[11px]">
                                  Lớp <span className="font-extrabold text-indigo-600">{classMap.get(s.classId)?.name}</span>
                                  {' '}({subjectMap.get(s.subjectId)?.shortName})
                                </div>
                              ))}
                              {isDouble && <div className="text-[9px] text-rose-600 font-extrabold mt-0.5">TRÙNG GIỜ!</div>}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[10px]">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {isMorningEnd && (
                    <tr>
                      <td colSpan={7} className="border border-slate-200 bg-amber-50 text-amber-700 text-center text-[11px] font-bold py-1.5 tracking-wider">
                        NGHỈ TRƯA (10:50 – 13:30)
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** ===== COMPONENT CHÍNH ===== */
export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  schoolInfo, teachers, subjects, classes, slots, readOnly = false,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const poolCode = selectedTeacher ? getPoolCode(selectedTeacher.id) : null;

  // Nếu là GV pool → lấy danh sách toàn bộ GV cùng pool
  const poolTeachers = poolCode
    ? (linkedPoolTeacherIds[poolCode] || []).map(id => teachers.find(t => t.id === id)!).filter(Boolean)
    : [];

  // Nhóm GV cho dropdown — phân nhóm rõ ràng
  const gvcnList = teachers.filter(t => t.role === 'homeroom').sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const specialistList = teachers.filter(t => t.role === 'specialist' && !getPoolCode(t.id)).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  // Pool: chỉ lấy đại diện 1 người mỗi pool (GV index 0)
  const poolRepresentatives = Object.entries(linkedPoolTeacherIds).map(([code, ids]) => {
    const t = teachers.find(tt => tt.id === ids[0]);
    return t ? { teacher: t, code } : null;
  }).filter(Boolean) as { teacher: Teacher; code: string }[];

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn Giáo Viên:</span>
        </div>
        <select
          value={selectedTeacherId}
          onChange={e => setSelectedTeacherId(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-indigo-950 font-bold text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 min-w-[260px]"
        >
          <optgroup label="── Giáo Viên Chủ Nhiệm (29 lớp) ──">
            {gvcnList.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.assignedClassIds?.map(id => classes.find(c => c.id === id)?.name).join(', ')}</option>
            ))}
          </optgroup>
          <optgroup label="── GV Bộ Môn Cố Định ──">
            {specialistList.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.subjectIds.map(id => subjects.find(s => s.id === id)?.shortName).join(', ')}</option>
            ))}
          </optgroup>
          <optgroup label="── GV Pool / Liên Kết (xem theo nhóm) ──">
            {poolRepresentatives.map(({ teacher: t, code }) => (
              <option key={t.id} value={t.id}>
                📋 Nhóm GV {code} ({subjects.find(s => s.code === code)?.name || code}) — Xem bảng tổng hợp
              </option>
            ))}
          </optgroup>
        </select>

        {!poolCode && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-slate-700 font-semibold">
              Tổng tiết: <strong className="text-indigo-900">{slots.filter(s => s.teacherId === selectedTeacherId).length} tiết/tuần</strong>
            </span>
          </div>
        )}
        {poolCode && (
          <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 font-semibold">
            📋 Chế độ xem tổng hợp pool — hiển thị cả {poolTeachers.length} GV cùng môn
          </div>
        )}
      </div>

      {/* Bảng */}
      {poolCode && poolTeachers.length > 0 ? (
        <PoolScheduleTable
          poolCode={poolCode}
          poolTeachers={poolTeachers}
          subjects={subjects}
          classes={classes}
          slots={slots}
          schoolInfo={schoolInfo}
        />
      ) : selectedTeacher ? (
        <SingleTeacherTable
          teacher={selectedTeacher}
          subjects={subjects}
          classes={classes}
          slots={slots}
          schoolInfo={schoolInfo}
        />
      ) : null}
    </div>
  );
};
