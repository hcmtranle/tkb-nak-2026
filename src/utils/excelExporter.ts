import * as XLSX from 'xlsx';
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot } from '../types';

export function exportTimetableToExcel(
  schoolInfo: SchoolInfo,
  classes: ClassRoom[],
  subjects: Subject[],
  teachers: Teacher[],
  slots: ScheduleSlot[]
) {
  const wb = XLSX.utils.book_new();

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const teacherMap = new Map<string, Teacher>();
  teachers.forEach((t) => teacherMap.set(t.id, t));

  const classMap = new Map<string, ClassRoom>();
  classes.forEach((c) => classMap.set(c.id, c));

  // --- SHEET 1: Master Timetable (29 Classes) ---
  const masterData: any[][] = [
    [schoolInfo.headerOrg],
    [schoolInfo.name],
    [`${schoolInfo.title} - NĂM HỌC ${schoolInfo.year} (29 LỚP)`],
    [],
    ['STT', 'Lớp', 'Khối', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
  ];

  classes.forEach((cls, idx) => {
    const row: any[] = [idx + 1, cls.name, `Khối ${cls.grade}`];

    for (let day = 2; day <= 6; day++) {
      const daySlots = slots.filter((s) => s.classId === cls.id && s.day === day);
      daySlots.sort((a, b) => a.period - b.period);

      const cellText = daySlots
        .map((s) => {
          const sub = subjectMap.get(s.subjectId);
          return `T${s.period}: ${sub ? sub.shortName : s.subjectId}`;
        })
        .join(' | ');

      row.push(cellText);
    }

    masterData.push(row);
  });

  const masterWs = XLSX.utils.aoa_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, masterWs, 'TKB Tổng Thể 29 Lớp');

  // --- SHEET 2: Individual Class Timetables ---
  const classData: any[][] = [
    [`THỜI KHOÁ BIỂU TỪNG LỚP - ${schoolInfo.name}`],
    [],
  ];

  classes.forEach((cls) => {
    classData.push([`LỚP ${cls.name} (Khối ${cls.grade}) - Sĩ số: ${cls.studentCount || 35} HS`]);
    classData.push(['Tiết / Thời Gian', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']);

    const periodsLabel = [
      'Tiết 1 (7:45 - 8:20)',
      'Tiết 2 (8:25 - 9:00)',
      'Tiết 3 (9:35 - 10:10)',
      'Tiết 4 (10:15 - 10:50)',
      'Tiết 5 (13:30 - 14:05)',
      'Tiết 6 (14:10 - 14:45)',
      'Tiết 7 (15:15 - 15:50)',
      'Tiết 8 (15:50 - 16:25 - CLB)',
    ];

    for (let p = 1; p <= 8; p++) {
      const pRow: any[] = [periodsLabel[p - 1]];
      for (let d = 2; d <= 6; d++) {
        const slot = slots.find((s) => s.classId === cls.id && s.day === d && s.period === p);
        if (slot) {
          const sub = subjectMap.get(slot.subjectId);
          const tch = teacherMap.get(slot.teacherId || '');
          pRow.push(`${sub ? sub.name : ''} ${tch ? `(${tch.shortName})` : ''}`);
        } else {
          pRow.push('');
        }
      }
      classData.push(pRow);
    }
    classData.push([]); // Spacer
  });

  const classWs = XLSX.utils.aoa_to_sheet(classData);
  XLSX.utils.book_append_sheet(wb, classWs, 'TKB Chi Tiết Từng Lớp');

  // --- SHEET 3: Teacher Schedules ---
  const teacherData: any[][] = [
    [`THỜI KHOÁ BIỂU GIÁO VIÊN - ${schoolInfo.name}`],
    [],
  ];

  teachers.forEach((tch) => {
    teacherData.push([`GIÁO VIÊN: ${tch.name} (${tch.shortName}) - Vai trò: ${tch.role === 'homeroom' ? 'GVCN' : 'GV Bộ môn'}`]);
    teacherData.push(['Tiết / Thời Gian', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']);

    for (let p = 1; p <= 8; p++) {
      const pRow: any[] = [`Tiết ${p}`];
      for (let d = 2; d <= 6; d++) {
        const teacherSlots = slots.filter((s) => s.teacherId === tch.id && s.day === d && s.period === p);
        if (teacherSlots.length > 0) {
          const slotTexts = teacherSlots.map((s) => {
            const cls = classMap.get(s.classId);
            const sub = subjectMap.get(s.subjectId);
            return `Lớp ${cls?.name || s.classId} (${sub?.shortName || ''})`;
          });
          pRow.push(slotTexts.join(' / '));
        } else {
          pRow.push('-');
        }
      }
      teacherData.push(pRow);
    }
    teacherData.push([]);
  });

  const teacherWs = XLSX.utils.aoa_to_sheet(teacherData);
  XLSX.utils.book_append_sheet(wb, teacherWs, 'TKB Phân Công Giáo Viên');

  // Export file
  const fileName = `ThoiKhoaBieu_${schoolInfo.name.replace(/\s+/g, '_')}_2026_2027.xlsx`;
  XLSX.writeFile(wb, fileName);
}
