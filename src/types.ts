/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolInfo {
  headerOrg: string; // "UỶ BAN NHÂN DÂN PHƯỜNG ĐÔNG HƯNG THUẬN"
  name: string;      // "TRƯỜNG TIỂU HỌC NGUYỄN AN KHƯƠNG"
  year: string;      // "2026-2027"
  title: string;     // "THỜI KHOÁ BIỂU"
}

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export interface Subject {
  id: string;
  name: string;             // e.g. "Tiếng Việt"
  shortName: string;        // e.g. "TV"
  code: string;             // e.g. "TV"
  color: string;            // Tailwind color classes
  badgeColor?: string;
  isLinkedSubject?: boolean;// Môn liên kết (CDS, Toán TD, KNS, TA BN, TA T-K, STEM, IC3)
  isSpecialRoom?: boolean;  // Phân bổ phòng học riêng (Tin học, Sân GDTC...)
  defaultPeriodsByGrade: Record<GradeLevel, number>; // Số tiết/tuần cho mỗi khối 1..5
}

export interface Teacher {
  id: string;
  name: string;             // e.g. "Nguyễn Thị Mai"
  shortName: string;        // e.g. "Cô Mai"
  role: 'homeroom' | 'specialist' | 'total_leader';
  subjectIds: string[];     // Các môn phụ trách
  assignedClassIds?: string[]; // Lớp phụ trách (nếu là GVCN)
  maxPeriodsPerDay?: number;
}

export interface ClassRoom {
  id: string;
  name: string;             // e.g. "1.1", "1.2"... "5.5"
  grade: GradeLevel;        // 1, 2, 3, 4, 5
  homeroomTeacherId?: string;
  studentCount?: number;
}

export interface ScheduleSlot {
  classId: string;
  day: number;              // 2: Thứ 2, 3: Thứ 3, 4: Thứ 4, 5: Thứ 5, 6: Thứ 6
  period: number;           // 1..4 (Sáng), 5..7 (Chiều), 8 (CLB/Tự học - chỉ Khối 3-5)
  subjectId: string;
  teacherId?: string;
  isLocked?: boolean;       // Khóa tiết không cho tự động thay đổi
  note?: string;
}

/**
 * Bản chỉnh tay của Thầy Cô — lưu TÁCH RIÊNG khỏi kết quả do thuật toán "Tự Động Xếp TKB" tạo ra.
 * Mỗi lần bấm "Tự Động Xếp TKB", hệ thống xếp lại sạch từ đầu và KHÔNG bị ảnh hưởng bởi các bản chỉnh tay cũ.
 * Khi hiển thị, hệ thống áp override lên trên kết quả gốc (generatedSlots) tại đúng ô classId+day+period.
 */
export interface ManualOverride {
  id: string;                // override_{classId}_{day}_{period}_{timestamp}
  classId: string;
  day: number;
  period: number;
  subjectId: string;
  teacherId?: string;
  note?: string;
  createdAt: string;         // ISO timestamp
  createdBy?: string;        // tên Thầy/Cô thực hiện (nếu có)
}

/** Kết quả kiểm tra khi áp 1 override — không chặn lưu, chỉ cảnh báo */
export interface OverrideCheckResult {
  hasConflict: boolean;
  warnings: string[];        // mô tả các trùng giờ phát sinh (nếu có)
}

export interface TimeSlotDef {
  period: number;           // 1 to 8
  session: 'morning' | 'afternoon';
  sessionPeriod: number;    // 1..4 sáng, 1..4 chiều
  label: string;            // "Tiết 1", "Tiết 2"
  time: string;             // "7:45 - 8:20"
}

export type ConflictType = 
  | 'linked_subject_morning'    // Môn liên kết bị xếp buổi sáng (Vi phạm nghiêm trọng)
  | 'too_many_english_per_day'  // Xếp 3 tiết Tiếng Anh trong 1 ngày
  | 'grade12_over_7_periods'    // Khối 1, 2 quá 7 tiết/ngày
  | 'grade1_tv_math_rule'       // Ngày xếp 3 tiết TV ở Khối 1 bị dính môn Toán
  | 'grade345_tv_over_2'        // Khối 3-5 quá 2 tiết TV/ngày
  | 'clb_wrong_grade'           // CLB bị xếp cho khối 1-2 (chỉ khối 3-5 mới có)
  | 'teacher_double_booked'     // Giáo viên bị trùng giờ dạy ở 2 lớp khác nhau
  | 'missing_subject_quota'     // Thiếu hoặc thừa số tiết theo phân phối chương trình
  | 'specialist_teacher_overload';

export interface ScheduleConflict {
  id: string;
  type: ConflictType;
  severity: 'error' | 'warning';
  message: string;
  classId?: string;
  day?: number;
  period?: number;
  teacherId?: string;
  subjectId?: string;
}

export type ActiveTab = 'master' | 'class' | 'teacher' | 'conflicts' | 'manage' | 'apps_script';
