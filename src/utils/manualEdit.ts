/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TÍNH NĂNG CHỈNH TAY AN TOÀN
 * ----------------------------------------------------------
 * Nguyên tắc: bản chỉnh tay của Thầy Cô KHÔNG BAO GIỜ ghi đè lên kết quả gốc do
 * "Tự Động Xếp TKB" tạo ra (generatedSlots). Mọi thay đổi tay được lưu ở một mảng
 * riêng (ManualOverride[]), và chỉ được ÁP LÊN TRÊN (merge) tại thời điểm hiển thị.
 *
 * => Bấm "Tự Động Xếp TKB" bất kỳ lúc nào cũng xếp lại HOÀN TOÀN SẠCH, không bị
 *    lẫn/hỏng bởi các lần chỉnh tay trước đó.
 * => Muốn quay lại đúng bản do máy xếp, chỉ cần xoá override tương ứng — dữ liệu
 *    gốc vẫn còn nguyên vẹn phía dưới.
 */
import { ScheduleSlot, ManualOverride, OverrideCheckResult, Subject, Teacher, ClassRoom } from '../types';

/** Áp danh sách override lên trên bộ lịch gốc để HIỂN THỊ. Không thay đổi generatedSlots gốc. */
export function applyOverrides(generatedSlots: ScheduleSlot[], overrides: ManualOverride[]): ScheduleSlot[] {
  const result = [...generatedSlots];
  overrides.forEach((ov) => {
    const idx = result.findIndex((s) => s.classId === ov.classId && s.day === ov.day && s.period === ov.period);
    const newSlot: ScheduleSlot = { classId: ov.classId, day: ov.day, period: ov.period, subjectId: ov.subjectId, teacherId: ov.teacherId, note: ov.note, isLocked: true };
    if (idx >= 0) result[idx] = newSlot;
    else result.push(newSlot);
  });
  return result;
}

/**
 * Kiểm tra 1 override CÓ SẮP đặt có làm trùng giờ giáo viên ở ô khác không.
 * Chỉ trả về cảnh báo — KHÔNG chặn lưu, vì đây là quyết định thủ công của Thầy Cô.
 */
export function checkOverrideConflict(
  candidate: Pick<ManualOverride, 'classId' | 'day' | 'period' | 'teacherId'>,
  allSlotsAfterEdit: ScheduleSlot[],
  classes: ClassRoom[],
  teachers: Teacher[]
): OverrideCheckResult {
  const warnings: string[] = [];
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const cls = classMap.get(candidate.classId);

  // 1) Giáo viên (nếu có) có đang dạy lớp khác cùng giờ không?
  if (candidate.teacherId) {
    const clashes = allSlotsAfterEdit.filter(
      (s) => s.teacherId === candidate.teacherId && s.day === candidate.day && s.period === candidate.period && s.classId !== candidate.classId
    );
    if (clashes.length > 0) {
      const teacher = teachers.find((t) => t.id === candidate.teacherId);
      const otherClassNames = clashes.map((s) => classMap.get(s.classId)?.name || s.classId).join(', ');
      warnings.push(`Giáo viên ${teacher?.name || candidate.teacherId} đang được xếp dạy lớp ${otherClassNames} cùng giờ này (Thứ ${candidate.day}, Tiết ${candidate.period}).`);
    }
  }

  // 2) Khối 1-2 có Tiết 8 không (không được phép)
  if (cls && cls.grade <= 2 && candidate.period === 8) {
    warnings.push(`Lớp ${cls.name} (Khối ${cls.grade}) không được có Tiết 8.`);
  }

  // 3) Lớp có bị xếp quá số tiết/ngày cho phép không (7 tiết Khối 1-2, 8 tiết Khối 3-5)
  if (cls) {
    const dayCount = allSlotsAfterEdit.filter((s) => s.classId === candidate.classId && s.day === candidate.day).length;
    const max = cls.grade <= 2 ? 7 : 8;
    if (dayCount > max) {
      warnings.push(`Lớp ${cls.name}: Thứ ${candidate.day} sẽ có ${dayCount} tiết (vượt quá tối đa ${max} tiết/ngày).`);
    }
  }

  return { hasConflict: warnings.length > 0, warnings };
}

/** Tạo 1 override mới kèm timestamp, dùng khi Thầy Cô lưu thay đổi từ UI */
export function createOverride(params: {
  classId: string; day: number; period: number; subjectId: string; teacherId?: string; note?: string; createdBy?: string;
}): ManualOverride {
  return {
    id: `override_${params.classId}_${params.day}_${params.period}_${Date.now()}`,
    ...params,
    createdAt: new Date().toISOString(),
  };
}

/** Xoá 1 override — trả về đúng dữ liệu do thuật toán tạo tại ô đó */
export function removeOverride(overrides: ManualOverride[], overrideId: string): ManualOverride[] {
  return overrides.filter((o) => o.id !== overrideId);
}

/**
 * Tìm các ô mà thuật toán còn xếp thiếu so với số tiết chuẩn của môn (để đánh dấu màu cảnh báo
 * cho Thầy Cô biết chỗ nào cần tự bổ sung — KHÔNG phải lỗi hệ thống, chỉ là 1-2 ô hiếm khi hụt
 * do khối 1-2 gần như dùng hết 100% chỗ trống).
 */
export function findQuotaShortfalls(
  slots: ScheduleSlot[],
  classes: ClassRoom[],
  subjects: Subject[]
): { classId: string; className: string; subjectId: string; subjectName: string; have: number; need: number }[] {
  const result: { classId: string; className: string; subjectId: string; subjectName: string; have: number; need: number }[] = [];
  const skipCodes = ['CLB', 'TUHOC']; // 2 môn này vốn không cố định số tiết per class (CLB rải ngày khác nhau, Tự học là chỗ trống hợp lệ)
  classes.forEach((cls) => {
    subjects.forEach((sub) => {
      if (skipCodes.includes(sub.code)) return;
      const need = sub.defaultPeriodsByGrade[cls.grade];
      if (!need || need <= 0) return;
      const have = slots.filter((s) => s.classId === cls.id && s.subjectId === sub.id).length;
      if (have < need) {
        result.push({ classId: cls.id, className: cls.name, subjectId: sub.id, subjectName: sub.name, have, need });
      }
    });
  });
  return result;
}
