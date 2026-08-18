import React, { useState } from 'react';
import { SchoolInfo, ClassRoom, Subject, Teacher } from '../types';
import { Settings, School, Users, BookOpen, Plus, Trash2, Edit } from 'lucide-react';

interface ManagementModalProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: (info: SchoolInfo) => void;
  classes: ClassRoom[];
  setClasses: (cls: ClassRoom[]) => void;
  teachers: Teacher[];
  setTeachers: (t: Teacher[]) => void;
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
}

export const ManagementModal: React.FC<ManagementModalProps> = ({
  schoolInfo,
  setSchoolInfo,
  classes,
  setClasses,
  teachers,
  setTeachers,
  subjects,
  setSubjects,
}) => {
  const [subTab, setSubTab] = useState<'school' | 'classes' | 'teachers' | 'subjects'>('school');

  return (
    <div className="space-y-6">
      {/* Navigation Sub-tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl flex space-x-1 text-xs border border-slate-200/80 overflow-x-auto">
        <button
          onClick={() => setSubTab('school')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            subTab === 'school' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Thông Tin Trường</span>
        </button>

        <button
          onClick={() => setSubTab('classes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            subTab === 'classes' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách 29 Lớp</span>
        </button>

        <button
          onClick={() => setSubTab('teachers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            subTab === 'teachers' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Đội Ngũ Giáo Viên</span>
        </button>

        <button
          onClick={() => setSubTab('subjects')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            subTab === 'subjects' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Môn Học & Khung Tiết</span>
        </button>
      </div>

      {/* Tab 1: School Info */}
      {subTab === 'school' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
            Cấu Hình Thông Tin Trường Học
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Cơ quan chủ quản:</label>
              <input
                type="text"
                value={schoolInfo.headerOrg}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, headerOrg: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-1">Tên Trường:</label>
              <input
                type="text"
                value={schoolInfo.name}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-indigo-950 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-1">Năm Học:</label>
              <input
                type="text"
                value={schoolInfo.year}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, year: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Classes List */}
      {subTab === 'classes' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
              Danh Sách Lớp Học ({classes.length} Lớp)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 hover:border-indigo-300 transition-all"
              >
                <div className="font-extrabold text-sm text-indigo-900">Lớp {cls.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">Khối {cls.grade} • {cls.studentCount || 35} HS</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Teachers */}
      {subTab === 'teachers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
            Đội Ngũ Giáo Viên ({teachers.length} Giáo Viên)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-3">Tên Giáo Viên</th>
                  <th className="p-3">Tên Tắt</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3">Môn Phụ Trách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3 text-slate-600 font-medium">{t.shortName}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg ${
                        t.role === 'homeroom' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {t.role === 'homeroom' ? 'GVCN' : t.role === 'total_leader' ? 'Tổng phụ trách' : 'GV Bộ môn'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {t.subjectIds.map((sid) => subjects.find((s) => s.id === sid)?.shortName).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Subjects */}
      {subTab === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
            Khung Phân Phối Số Tiết Các Môn Học Theo Khối Lớp
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <th className="p-3 text-left">Tên Môn Học</th>
                  <th className="p-3">Viết Tắt</th>
                  <th className="p-3">Loại Môn</th>
                  <th className="p-3">Khối 1</th>
                  <th className="p-3">Khối 2</th>
                  <th className="p-3">Khối 3</th>
                  <th className="p-3">Khối 4</th>
                  <th className="p-3">Khối 5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-3 text-left font-bold text-slate-900">{sub.name}</td>
                    <td className="p-3 font-extrabold text-indigo-600">{sub.shortName}</td>
                    <td className="p-3">
                      {sub.isLinkedSubject ? (
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100">
                          Môn Liên Kết
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-lg">
                          Bắt Buộc
                        </span>
                      )}
                    </td>
                    {[1, 2, 3, 4, 5].map((g) => (
                      <td key={g} className="p-3 font-mono font-bold text-slate-800">
                        {sub.defaultPeriodsByGrade[g as 1|2|3|4|5]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
