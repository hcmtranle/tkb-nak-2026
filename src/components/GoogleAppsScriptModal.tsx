import React, { useState } from 'react';
import { generateGoogleAppsScript } from '../utils/googleAppsScriptGenerator';
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot, ScheduleConflict } from '../types';
import { Code2, Copy, Check, ExternalLink, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface GoogleAppsScriptModalProps {
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: ScheduleSlot[];
  conflicts?: ScheduleConflict[];
}

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  schoolInfo,
  classes,
  subjects,
  teachers,
  slots,
  conflicts = [],
}) => {
  const [copied, setCopied] = useState(false);

  const code = generateGoogleAppsScript(schoolInfo, classes, subjects, teachers, slots, conflicts);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-6 text-white space-y-3 shadow-md shadow-indigo-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Bộ Mã Google Apps Script Cho Google Sheets
              </h2>
              <p className="text-xs text-indigo-200">
                Tự động tạo Trang tính TKB 29 Lớp, Menu Tra Cứu Tương Tác và Cấu Hình Quyền Admin
              </p>
            </div>
          </div>

          <button
            onClick={copyToClipboard}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã Sao Chép Mã!' : 'Sao Chép Mã Code.gs'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Instructions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Hướng Dẫn Tạo Dashboard Trên Google Sheets (3 Bước):
        </h3>

        <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 leading-relaxed">
          <li className="pl-2">
            Mở file <strong>Google Sheets</strong> trống mới trên Google Drive của bạn.
          </li>
          <li className="pl-2">
            Trên thanh menu Google Sheets, chọn <strong>Tiện ích mở rộng (Extensions)</strong> &rarr; <strong>Apps Script</strong>.
          </li>
          <li className="pl-2">
            Dán toàn bộ đoạn mã bên dưới vào file <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-emerald-700 font-bold">Code.gs</code>, chọn hàm <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">setupTimetableSystem</code> và bấm nút <strong>Chạy (Run)</strong>.
          </li>
        </ol>

        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Sẽ tự tạo 4 tab: <strong>Dashboard</strong> (tổng quan, số liệu, cảnh báo trực quan), <strong>GV_ThongTin</strong> (Thầy Cô tự thêm/sửa tên giáo viên tại đây), <strong>TKB_Tong_The</strong> (lịch 29 lớp có tô màu theo môn) và <strong>Tra_Cuu_TKB</strong> (tra cứu nhanh theo lớp/giáo viên).
          </span>
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Quyền Admin:</strong> Tab TKB_Tong_The chỉ email Admin mới sửa được. Riêng tab <strong>GV_ThongTin</strong> luôn để mở — Thầy Cô tự thêm dòng/đổi tên giáo viên bất cứ lúc nào mà không cần quyền đặc biệt.
          </span>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Code.gs (Apps Script)</span>
          <button onClick={copyToClipboard} className="hover:text-white flex items-center gap-1 font-bold">
            <Copy className="w-3.5 h-3.5" /> Sao Chép
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px]">
          {code}
        </pre>
      </div>
    </div>
  );
};
