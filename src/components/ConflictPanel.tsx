import React from 'react';
import { ScheduleConflict, ClassRoom, Subject, Teacher } from '../types';
import { AlertTriangle, CheckCircle2, ShieldCheck, Zap, RefreshCw, Info } from 'lucide-react';

interface ConflictPanelProps {
  conflicts: ScheduleConflict[];
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  onAutoFix: () => void;
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({
  conflicts,
  classes,
  subjects,
  teachers,
  onAutoFix,
}) => {
  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md shadow-indigo-100">
        <div className="flex items-center space-x-4">
          <div
            className={`p-3.5 rounded-2xl border ${
              errors.length > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {errors.length > 0 ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <ShieldCheck className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {errors.length > 0
                ? `Phát hiện ${errors.length} vi phạm quy định xếp TKB!`
                : 'Thời khóa biểu hợp lệ! Tất cả 6 quy tắc bắt buộc đều đạt.'}
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Kiểm tra tự động theo quy định Bộ GD&ĐT & Yêu cầu Tiểu học Nguyễn An Khương (2026-2027)
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <button
            onClick={onAutoFix}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-900"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Tự Động Sửa Lỗi TKB</span>
          </button>
        )}
      </div>

      {/* Strict Rules Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" /> Các Nguyên Tắc Bắt Buộc Đang Được Kiểm Tra:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">1. Không xếp môn liên kết buổi sáng</span>
            <p className="text-slate-500 text-[11px]">CDS, STEM, KNS, Toán TD, IC3 tuyệt đối dạy vào buổi chiều (Tiết 5,6,7).</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">2. Không xếp 3 tiết Tiếng Anh/ngày</span>
            <p className="text-slate-500 text-[11px]">Mỗi lớp chỉ học tối đa 2 tiết Tiếng Anh (bao gồm TA, TA BN, TA T-K) trong 1 ngày.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">3. Khối 1, 2 tối đa 7 tiết/ngày</span>
            <p className="text-slate-500 text-[11px]">Khối 1 & 2 chỉ học tối đa 7 tiết (4 sáng + 3 chiều). Khối 3, 4, 5 có thêm tiết 8 dành cho CLB.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900">4. Quy tắc 3 Tiếng Việt Lớp 1</span>
            <p className="text-slate-500 text-[11px]">Ngày nào lớp 1 học 3 tiết Tiếng Việt thì KHÔNG xếp môn Toán.</p>
          </div>
        </div>
      </div>

      {/* Conflict Items List */}
      {errors.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-rose-600 uppercase tracking-wider">
            Danh Sách Xung Đột Cần Xử Lý ({errors.length})
          </h3>

          <div className="space-y-2">
            {errors.map((conflict) => (
              <div
                key={conflict.id}
                className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs flex items-start space-x-3"
              >
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-900 block">
                    {conflict.message}
                  </span>
                  {conflict.classId && (
                    <span className="text-[11px] text-rose-700 font-medium">
                      Vị trí: Lớp {conflict.classId.replace('cls_', '').replace('_', '.')} • Thứ {conflict.day} {conflict.period ? `• Tiết ${conflict.period}` : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
