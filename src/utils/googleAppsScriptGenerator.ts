import { SchoolInfo, ScheduleSlot, ClassRoom, Subject, Teacher, ScheduleConflict } from '../types';
import { findQuotaShortfalls } from './manualEdit';

/**
 * Sinh mã Google Apps Script để dán vào 1 Google Sheet trống.
 * Chạy hàm setupTimetableSystem() sẽ tạo 4 trang tính dạng "dashboard":
 *   1. Dashboard        — tổng quan, số liệu, tình trạng xếp lịch (màu sắc trực quan)
 *   2. GV_ThongTin      — danh sách giáo viên, Thầy Cô TỰ THÊM/SỬA/ĐỔI tên trực tiếp tại đây
 *   3. TKB_Tong_The     — thời khoá biểu 29 lớp, tô màu theo môn học, đánh dấu ô còn thiếu
 *   4. Tra_Cuu_TKB      — tra cứu nhanh theo Lớp hoặc Giáo viên (dropdown)
 */
export function generateGoogleAppsScript(
  schoolInfo: SchoolInfo,
  classes: ClassRoom[],
  subjects: Subject[],
  teachers: Teacher[],
  slots: ScheduleSlot[],
  conflicts: ScheduleConflict[] = []
): string {
  const shortfalls = findQuotaShortfalls(slots, classes, subjects);
  const jsonSlots = JSON.stringify(slots);
  const jsonClasses = JSON.stringify(classes);
  const jsonSubjects = JSON.stringify(subjects);
  const jsonTeachers = JSON.stringify(teachers);
  const jsonShortfalls = JSON.stringify(shortfalls);
  const jsonConflictCount = JSON.stringify(conflicts.length);
  const totalPeriodsGenerated = slots.length;
  const totalPeriodsNeeded = slots.length + shortfalls.reduce((s, f) => s + (f.need - f.have), 0);

  return `/**
 * ==============================================================================
 * THỜI KHOÁ BIỂU TIỂU HỌC NĂM HỌC ${schoolInfo.year} (29 LỚP)
 * Trường: ${schoolInfo.name}
 * Dán vào 1 Google Sheet TRỐNG → Tiện ích mở rộng → Apps Script → dán mã này
 * → chọn hàm setupTimetableSystem → bấm Chạy (Run).
 * ==============================================================================
 */

const SCHOOL_INFO = ${JSON.stringify(schoolInfo)};
const CLASSES = ${jsonClasses};
const SUBJECTS = ${jsonSubjects};
const TEACHERS = ${jsonTeachers};
const SCHEDULE_SLOTS = ${jsonSlots};
const SHORTFALLS = ${jsonShortfalls};
const CONFLICT_COUNT = ${jsonConflictCount};
const TOTAL_PERIODS_GENERATED = ${totalPeriodsGenerated};
const TOTAL_PERIODS_NEEDED = ${totalPeriodsNeeded};

function setupTimetableSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  createDashboardSheet(ss);
  createTeacherInputSheet(ss);
  createMasterSheet(ss);
  createInteractiveViewerSheet(ss);
  setupAdminPermissions(ss);
  ss.setActiveSheet(ss.getSheetByName("Dashboard"));
  SpreadsheetApp.getUi().alert("Khởi tạo Dashboard Thời khoá biểu 29 Lớp thành công! Vui lòng kiểm tra tab Dashboard.");
}

/**
 * ============ TAB 1: DASHBOARD — tổng quan trực quan ============
 */
function createDashboardSheet(ss) {
  let sheet = ss.getSheetByName("Dashboard");
  if (sheet) { ss.deleteSheet(sheet); }
  sheet = ss.insertSheet("Dashboard", 0);

  sheet.setColumnWidth(1, 40);
  for (let c = 2; c <= 8; c++) sheet.setColumnWidth(c, 130);

  // Header
  sheet.getRange("B2:H2").merge().setValue(SCHOOL_INFO.headerOrg).setFontWeight("bold").setFontSize(10).setFontColor("#64748b");
  sheet.getRange("B3:H3").merge().setValue(SCHOOL_INFO.name).setFontWeight("bold").setFontSize(16).setFontColor("#0f172a");
  sheet.getRange("B4:H4").merge().setValue("DASHBOARD THỜI KHOÁ BIỂU — NĂM HỌC " + SCHOOL_INFO.year)
    .setFontWeight("bold").setFontSize(13).setFontColor("#ffffff").setBackground("#4338ca")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(4, 32);

  // ---- Hàng thẻ số liệu (cards) ----
  const cardRow = 6;
  const cards = [
    { label: "SỐ LỚP", value: CLASSES.length, color: "#3b82f6" },
    { label: "SỐ GIÁO VIÊN", value: TEACHERS.length, color: "#8b5cf6" },
    { label: "TỔNG SỐ TIẾT ĐÃ XẾP", value: TOTAL_PERIODS_GENERATED + " / " + TOTAL_PERIODS_NEEDED, color: "#10b981" },
    { label: "SỐ Ô CẦN BỔ SUNG TAY", value: SHORTFALLS.length, color: SHORTFALLS.length > 0 ? "#f59e0b" : "#10b981" },
    { label: "SỐ TRÙNG GIỜ (LỖI)", value: CONFLICT_COUNT, color: CONFLICT_COUNT > 0 ? "#ef4444" : "#10b981" },
  ];
  cards.forEach(function (card, i) {
    const col = 2 + i;
    sheet.getRange(cardRow, col).setValue(card.label).setFontWeight("bold").setFontSize(9)
      .setFontColor("#ffffff").setBackground(card.color).setHorizontalAlignment("center").setWrap(true);
    sheet.getRange(cardRow + 1, col).setValue(card.value).setFontWeight("bold").setFontSize(18)
      .setFontColor(card.color).setHorizontalAlignment("center").setBackground("#f8fafc")
      .setBorder(true, true, true, true, false, false, card.color, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setRowHeight(cardRow, 34);
    sheet.setRowHeight(cardRow + 1, 40);
  });

  // ---- Trạng thái tổng quát ----
  let statusRow = cardRow + 3;
  if (CONFLICT_COUNT === 0) {
    sheet.getRange(statusRow, 2, 1, 6).merge().setValue("✅ KHÔNG CÓ GIÁO VIÊN NÀO BỊ TRÙNG GIỜ — Thời khoá biểu hợp lệ theo tất cả quy tắc bắt buộc.")
      .setBackground("#dcfce7").setFontColor("#166534").setFontWeight("bold").setHorizontalAlignment("left");
  } else {
    sheet.getRange(statusRow, 2, 1, 6).merge().setValue("⚠️ CÓ " + CONFLICT_COUNT + " LỖI TRÙNG GIỜ — cần bấm \\"Tự Động Xếp TKB\\" lại trong app hoặc kiểm tra tab Kiểm Tra Xung Đột.")
      .setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold").setHorizontalAlignment("left");
  }
  sheet.setRowHeight(statusRow, 30);

  // ---- Bảng các ô còn thiếu (nếu có) — để Thầy Cô biết chỗ nào cần bổ sung tay ----
  let row = statusRow + 2;
  sheet.getRange(row, 2, 1, 4).merge().setValue("CÁC LỚP/MÔN CÒN THIẾU TIẾT (cần Thầy Cô tự bổ sung trong tab TKB_Tong_The)")
    .setFontWeight("bold").setFontSize(10).setFontColor("#92400e").setBackground("#fef3c7");
  row++;
  if (SHORTFALLS.length === 0) {
    sheet.getRange(row, 2).setValue("Không có — đã xếp đủ 100% số tiết cho tất cả các lớp.").setFontColor("#166534").setFontStyle("italic");
    row++;
  } else {
    const header = ["Lớp", "Môn", "Đã xếp", "Cần"];
    sheet.getRange(row, 2, 1, 4).setValues([header]).setFontWeight("bold").setBackground("#e2e8f0");
    row++;
    SHORTFALLS.forEach(function (f) {
      sheet.getRange(row, 2, 1, 4).setValues([[f.className, f.subjectName, f.have, f.need]]).setBackground("#fffbeb");
      row++;
    });
  }

  // ---- Hướng dẫn sử dụng ----
  row += 1;
  sheet.getRange(row, 2, 1, 6).merge().setValue("HƯỚNG DẪN SỬ DỤNG").setFontWeight("bold").setFontSize(10).setBackground("#e0e7ff").setFontColor("#3730a3");
  row++;
  const guide = [
    "1. Tab \\"GV_ThongTin\\": Thầy Cô có thể tự THÊM DÒNG MỚI hoặc SỬA TÊN giáo viên trực tiếp — không ảnh hưởng công thức.",
    "2. Tab \\"TKB_Tong_The\\": xem toàn bộ 29 lớp, mỗi môn học có 1 màu riêng để dễ nhìn.",
    "3. Tab \\"Tra_Cuu_TKB\\": chọn Lớp hoặc Giáo viên ở ô màu vàng để xem lịch riêng.",
    "4. Sau khi sửa dữ liệu giáo viên ở đây, mở lại app Thời khoá biểu và bấm \\"Tự Động Xếp TKB\\" để cập nhật lại toàn bộ lịch theo dữ liệu mới.",
    "5. Các ô đánh dấu vàng nhạt trong TKB_Tong_The là những chỗ thuật toán còn xếp thiếu — Thầy Cô bấm vào ô, gõ trực tiếp môn học cần bổ sung.",
  ];
  guide.forEach(function (line) {
    sheet.getRange(row, 2, 1, 6).merge().setValue(line).setFontSize(9).setFontColor("#334155").setWrap(true);
    row++;
  });

  sheet.setFrozenRows(4);
}

/**
 * ============ TAB 2: GV_ThongTin — Thầy Cô tự thêm/sửa giáo viên tại đây ============
 */
function createTeacherInputSheet(ss) {
  let sheet = ss.getSheetByName("GV_ThongTin");
  if (sheet) { ss.deleteSheet(sheet); }
  sheet = ss.insertSheet("GV_ThongTin", 1);

  sheet.getRange("A1:F1").merge().setValue("DANH SÁCH GIÁO VIÊN — Thầy Cô có thể sửa Tên hoặc thêm dòng mới ngay tại đây")
    .setFontWeight("bold").setFontSize(12).setFontColor("#ffffff").setBackground("#7c3aed");
  sheet.setRowHeight(1, 30);

  const headers = ["Mã GV (không sửa)", "Tên giáo viên", "Vai trò", "Môn phụ trách", "Lớp phụ trách (nếu có)", "Ghi chú"];
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#ede9fe").setFontColor("#5b21b6");

  const roleLabel = { homeroom: "GVCN", specialist: "GV bộ môn", total_leader: "Tổng phụ trách" };
  const subjectNameOf = function (id) { const s = SUBJECTS.find(function (x) { return x.id === id; }); return s ? s.shortName : id; };
  const classNameOf = function (id) { const c = CLASSES.find(function (x) { return x.id === id; }); return c ? c.name : id; };

  const rows = TEACHERS.map(function (t) {
    return [
      t.id,
      t.name,
      roleLabel[t.role] || t.role,
      (t.subjectIds || []).map(subjectNameOf).join(", "),
      (t.assignedClassIds || []).map(classNameOf).join(", "),
      "",
    ];
  });
  if (rows.length > 0) sheet.getRange(4, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(4, 1, Math.max(rows.length, 1), 1).setFontColor("#94a3b8").setFontStyle("italic");

  // Chừa thêm 15 dòng trống để Thầy Cô thêm giáo viên mới
  const extraRows = 15;
  sheet.getRange(4 + rows.length, 1, extraRows, headers.length).setBackground("#f8fafc");

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(3);
}

/**
 * ============ TAB 3: TKB_Tong_The — giống hệt giao diện Tra_Cuu_TKB (Tiết x Thứ), lặp lại cho từng lớp ============
 */
function createMasterSheet(ss) {
  let sheet = ss.getSheetByName("TKB_Tong_The");
  if (sheet) { ss.deleteSheet(sheet); }
  sheet = ss.insertSheet("TKB_Tong_The", 2);

  sheet.getRange("A1").setValue(SCHOOL_INFO.headerOrg).setFontWeight("bold");
  sheet.getRange("A2").setValue(SCHOOL_INFO.name).setFontWeight("bold").setFontSize(12);
  sheet.getRange("A3").setValue(SCHOOL_INFO.title + " NĂM HỌC " + SCHOOL_INFO.year).setFontWeight("bold").setFontSize(14);

  const SUBJECT_COLORS = {
    "TV": "#dbeafe", "Toán": "#fef3c7", "ĐĐ": "#ffedd5", "TNXH": "#ccfbf1", "NT(ÂN)": "#e0e7ff",
    "NT(MT)": "#ffe4e6", "GDTC": "#ecfccb", "CN": "#d1fae5", "TH": "#cffafe", "TA": "#f3e8ff",
    "KH": "#a7f3d0", "LSĐL": "#fef08a", "HĐTN(CC)": "#fecaca", "HĐTN(CĐ)": "#e7e5e4", "HĐTN(SHL)": "#d6d3d1",
    "CDS": "#fae8ff", "TOANTD": "#ede9fe", "KNS": "#fde68a", "TABN": "#fbcfe8", "TATK": "#e9d5ff",
    "STEM": "#e0f2fe", "IC3": "#a5f3fc", "CLB": "#e2e8f0", "TUHOC": "#f1f5f9"
  };
  const shortfallSet = {};
  SHORTFALLS.forEach(function (f) { shortfallSet[f.classId] = true; });

  const PERIOD_LABELS = [
    "Tiết 1 (7:45 - 8:20)", "Tiết 2 (8:25 - 9:00)", "Tiết 3 (9:35 - 10:10)", "Tiết 4 (10:15 - 10:50)",
    "Tiết 5 (13:30 - 14:05)", "Tiết 6 (14:10 - 14:45)", "Tiết 7 (15:15 - 15:50)", "Tiết 8 (15:55 - 16:30 — CLB/Tự học)"
  ];
  const DAY_COL = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // offset trong 5 cột ngày (0-based, cộng thêm 2 vì cột A là nhãn Tiết)
  const daysHeader = ["Tiết / Thời Gian", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"];

  let row = 5;
  CLASSES.forEach(function (cls) {
    // ---- Tiêu đề khối lớp ----
    sheet.getRange(row, 1, 1, 6).merge().setValue("LỚP " + cls.name + "  (Khối " + cls.grade + ")" + (shortfallSet[cls.id] ? "  ⚠ còn thiếu tiết — xem tab Dashboard" : ""))
      .setFontWeight("bold").setFontSize(12).setFontColor("#ffffff")
      .setBackground(shortfallSet[cls.id] ? "#f59e0b" : "#0369a1").setHorizontalAlignment("left");
    row++;

    // ---- Hàng tiêu đề Thứ ----
    sheet.getRange(row, 1, 1, 6).setValues([daysHeader]).setBackground("#0f766e").setFontColor("#ffffff").setFontWeight("bold");
    row++;

    // ---- 8 hàng Tiết ----
    const gridStartRow = row;
    const gridValues = PERIOD_LABELS.map(function (label) { return [label, "", "", "", "", ""]; });
    sheet.getRange(gridStartRow, 1, 8, 6).setValues(gridValues);
    sheet.getRange(gridStartRow, 1, 8, 1).setFontWeight("bold").setBackground("#f1f5f9");

    for (let p = 1; p <= 8; p++) {
      const isAllowed = !(cls.grade <= 2 && p === 8);
      const cellRow = gridStartRow + (p - 1);
      if (!isAllowed) {
        sheet.getRange(cellRow, 2, 1, 5).setBackground("#e2e8f0");
        continue;
      }
      [2, 3, 4, 5, 6].forEach(function (day) {
        const cCol = DAY_COL[day] + 1; // +1 vì cột 1 là nhãn Tiết
        const slot = SCHEDULE_SLOTS.find(function (s) { return s.classId === cls.id && s.day === day && s.period === p; });
        if (slot) {
          const sub = SUBJECTS.find(function (x) { return x.id === slot.subjectId; });
          const code = sub ? sub.code : "";
          sheet.getRange(cellRow, cCol).setValue(sub ? sub.shortName : slot.subjectId).setBackground(SUBJECT_COLORS[code] || "#ffffff").setHorizontalAlignment("center");
        } else {
          sheet.getRange(cellRow, cCol).setValue("").setBackground("#fffbeb");
        }
      });
    }
    row = gridStartRow + 8 + 1; // chừa 1 dòng trống giữa các lớp
  });

  sheet.setColumnWidth(1, 220);
  for (let c = 2; c <= 6; c++) sheet.setColumnWidth(c, 130);
}

/**
 * ============ TAB 4: Tra_Cuu_TKB ============
 */
function createInteractiveViewerSheet(ss) {
  let sheet = ss.getSheetByName("Tra_Cuu_TKB");
  if (sheet) { ss.deleteSheet(sheet); }
  sheet = ss.insertSheet("Tra_Cuu_TKB", 3);

  sheet.getRange("A1").setValue("TRA CỨU THỜI KHOÁ BIỂU").setFontWeight("bold").setFontSize(14).setFontColor("#0369a1");
  sheet.getRange("A3").setValue("Chọn Lớp:").setFontWeight("bold");
  sheet.getRange("A4").setValue("Hoặc Chọn Giáo Viên:").setFontWeight("bold");

  const classNames = CLASSES.map(function (c) { return c.name; });
  const classRule = SpreadsheetApp.newDataValidation().requireValueInList(classNames).build();
  sheet.getRange("B3").setDataValidation(classRule).setValue(classNames[0] || "1.1").setBackground("#fef9c3");

  const teacherNames = TEACHERS.map(function (t) { return t.name; });
  const teacherRule = SpreadsheetApp.newDataValidation().requireValueInList(teacherNames).build();
  sheet.getRange("B4").setDataValidation(teacherRule).setValue(teacherNames[0] || "").setBackground("#fef9c3");

  const daysHeader = ["Tiết / Thời Gian", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"];
  sheet.getRange(6, 1, 1, 6).setValues([daysHeader]).setBackground("#0f766e").setFontColor("#ffffff").setFontWeight("bold");

  const periodsInfo = [
    ["Tiết 1 (7:45 - 8:20)", "", "", "", "", ""],
    ["Tiết 2 (8:25 - 9:00)", "", "", "", "", ""],
    ["Tiết 3 (9:35 - 10:10)", "", "", "", "", ""],
    ["Tiết 4 (10:15 - 10:50)", "", "", "", "", ""],
    ["Tiết 5 (13:30 - 14:05)", "", "", "", "", ""],
    ["Tiết 6 (14:10 - 14:45)", "", "", "", "", ""],
    ["Tiết 7 (15:15 - 15:50)", "", "", "", "", ""],
    ["Tiết 8 (15:55 - 16:30 — CLB/Tự học)", "", "", "", "", ""]
  ];
  sheet.getRange(7, 1, 8, 6).setValues(periodsInfo);
  sheet.getRange(7, 1, 8, 1).setFontWeight("bold").setBackground("#f1f5f9");

  renderClassSchedule(sheet, classNames[0] || "1.1");
}

function onEdit(e) {
  if (!e) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() === "Tra_Cuu_TKB") {
    if (range.getA1Notation() === "B3") {
      renderClassSchedule(sheet, range.getValue());
    } else if (range.getA1Notation() === "B4") {
      renderTeacherSchedule(sheet, range.getValue());
    }
  }
}

function renderClassSchedule(sheet, className) {
  const cls = CLASSES.find(function (c) { return c.name === String(className); });
  if (!cls) return;
  sheet.getRange(7, 2, 8, 5).clearContent();
  SCHEDULE_SLOTS.filter(function (s) { return s.classId === cls.id; }).forEach(function (s) {
    const row = 6 + s.period;
    const col = s.day;
    const sub = SUBJECTS.find(function (x) { return x.id === s.subjectId; });
    sheet.getRange(row, col).setValue(sub ? sub.shortName : s.subjectId);
  });
}

function renderTeacherSchedule(sheet, teacherName) {
  const teacher = TEACHERS.find(function (t) { return t.name === String(teacherName); });
  if (!teacher) return;
  sheet.getRange(7, 2, 8, 5).clearContent();
  SCHEDULE_SLOTS.filter(function (s) { return s.teacherId === teacher.id; }).forEach(function (s) {
    const row = 6 + s.period;
    const col = s.day;
    const cls = CLASSES.find(function (c) { return c.id === s.classId; });
    const sub = SUBJECTS.find(function (x) { return x.id === s.subjectId; });
    sheet.getRange(row, col).setValue((cls ? cls.name : "") + " (" + (sub ? sub.shortName : "") + ")");
  });
}

function setupAdminPermissions(ss) {
  try {
    const masterSheet = ss.getSheetByName("TKB_Tong_The");
    if (masterSheet) {
      const protection = masterSheet.protect().setDescription("Chỉ Admin có quyền sửa Thời khóa biểu gốc");
      const adminEmails = ["hcmtranle@gmail.com", "taohuonghcm@gmail.com", "huongtranq12@gmail.com"];
      adminEmails.forEach(function (email) {
        try { protection.addEditor(email); } catch (e) { Logger.log("Không thể thêm " + email + ": " + e.message); }
      });
      if (protection.canDomainEdit()) protection.setDomainEdit(false);
    }
    // Tab GV_ThongTin KHÔNG khoá — Thầy Cô cần sửa được tự do
  } catch (err) {
    Logger.log("Lỗi cài đặt phân quyền protection: " + err.message);
  }
}
`;
}
