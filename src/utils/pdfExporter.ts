/**
 * PDF Export — dùng window.print() với CSS @media print riêng biệt.
 * Hỗ trợ: theo giáo viên, theo khối, theo bộ môn, in tất cả.
 */
import { SchoolInfo, ClassRoom, Subject, Teacher, ScheduleSlot } from '../types';
import { timeSlots } from '../data/initialData';

const DAY_NAMES: Record<number, string> = { 2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu' };
const DAYS = [2, 3, 4, 5, 6];

function buildHtml(
  schoolInfo: SchoolInfo,
  items: { title: string; subtitle: string; rows: string[][] }[],
  periods: typeof timeSlots
): string {
  const pStyle = `font-family:'Times New Roman',serif;font-size:11pt;margin:0;padding:0;`;
  const tableStyle = `border-collapse:collapse;width:100%;font-size:9pt;`;
  const thStyle = `border:1px solid #333;padding:4px 3px;background:#1a365d;color:#fff;text-align:center;font-weight:bold;`;
  const tdStyle = `border:1px solid #999;padding:3px;text-align:center;vertical-align:top;font-size:8.5pt;`;
  const periodTdStyle = `border:1px solid #999;padding:3px;text-align:center;background:#f0f4ff;font-size:8pt;font-weight:bold;white-space:nowrap;`;
  const sessionTdStyle = `border:1px solid #999;padding:3px;background:#e8f0fe;font-weight:bold;font-size:8pt;writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);`;

  const tables = items.map((item, idx) => {
    const pageBreak = idx > 0 ? 'page-break-before:always;' : '';
    const header = `
      <div style="${pageBreak}padding:8px 0;">
        <p style="text-align:center;font-size:10pt;font-weight:normal;margin:0;">${schoolInfo.headerOrg}</p>
        <p style="text-align:center;font-size:13pt;font-weight:bold;margin:2px 0;">${schoolInfo.name}</p>
        <p style="text-align:center;font-size:15pt;font-weight:bold;margin:4px 0;color:#1a365d;">${item.title}</p>
        <p style="text-align:center;font-size:10pt;margin:0;color:#555;">Năm học ${schoolInfo.year} — ${item.subtitle}</p>
        <hr style="margin:6px 0;border-color:#1a365d;"/>
      </div>`;

    const thead = `<thead><tr>
      <th style="${thStyle};width:42px;">Buổi</th>
      <th style="${thStyle};width:90px;">Tiết / Giờ</th>
      ${DAYS.map(d => `<th style="${thStyle};">${DAY_NAMES[d]}</th>`).join('')}
    </tr></thead>`;

    let lastSession = '';
    const bodyRows = periods.map(ts => {
      const sessionLabel = ts.session === 'morning' ? 'BUỔI SÁNG' : 'BUỔI CHIỀU';
      const sessionCell = ts.session !== lastSession
        ? `<td style="${sessionTdStyle}" rowspan="${periods.filter(p => p.session === ts.session).length}">${sessionLabel}</td>`
        : '';
      lastSession = ts.session;
      const dayTds = DAYS.map(day => {
        const cell = item.rows[ts.period - 1]?.[DAYS.indexOf(day)] ?? '';
        const bg = ts.period === 8 ? '#f8f8f0' : '';
        return `<td style="${tdStyle}${bg ? `background:${bg};` : ''}">${cell}</td>`;
      }).join('');
      return `<tr>${sessionCell}<td style="${periodTdStyle}">Tiết ${ts.period}<br/><span style="font-weight:normal;font-size:7.5pt;">${ts.time}</span></td>${dayTds}</tr>`;
    }).join('');

    return `${header}<table style="${tableStyle}">${thead}<tbody>${bodyRows}</tbody></table>`;
  });

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>
    <title>Thời khoá biểu</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{${pStyle}}
      @media print{@page{size:A4 landscape;margin:10mm;}button{display:none!important;}.no-print{display:none!important;}}
    </style></head><body>
    <div class="no-print" style="padding:12px;background:#1a365d;color:#fff;text-align:center;font-size:13pt;font-weight:bold;">
      <span>🖨️ Nhấn Ctrl+P (hoặc Cmd+P) để in PDF &nbsp;&nbsp;</span>
      <button onclick="window.print()" style="background:#fff;color:#1a365d;border:none;padding:6px 18px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12pt;">In ngay</button>
    </div>
    ${tables.join('')}
    </body></html>`;
}

// ========== Helper: lấy tên hiển thị trong ô ==========
function getSlotLabel(
  slot: ScheduleSlot | undefined,
  subjects: Subject[],
  teachers: Teacher[],
  classes: ClassRoom[]
): string {
  if (!slot) return '';
  const sub = subjects.find(s => s.id === slot.subjectId);
  const tch = teachers.find(t => t.id === slot.teacherId);
  const cls = classes.find(c => c.id === slot.classId);
  const subName = sub ? sub.shortName : '';
  const tchName = tch ? tch.shortName || tch.name.split(' ').pop()! : '';
  const clsName = cls ? `Lớp ${cls.name}` : '';
  return [subName, tchName || clsName].filter(Boolean).join('\n');
}

// ========== Xuất theo Giáo viên ==========
export function printByTeacher(
  teacherId: string,
  schoolInfo: SchoolInfo, classes: ClassRoom[], subjects: Subject[],
  teachers: Teacher[], slots: ScheduleSlot[]
) {
  const teacher = teachers.find(t => t.id === teacherId);
  if (!teacher) return;
  const rows = timeSlots.map(ts =>
    DAYS.map(day => {
      const slot = slots.find(s => s.teacherId === teacherId && s.day === day && s.period === ts.period && s.subjectId !== 'sub_hdtn_cc');
      if (!slot) return '';
      const sub = subjects.find(s => s.id === slot.subjectId);
      const cls = classes.find(c => c.id === slot.classId);
      return `<b>${sub?.shortName || ''}</b><br/>${cls ? `Lớp ${cls.name}` : ''}`;
    })
  );
  const html = buildHtml(schoolInfo, [{ title: `THỜI KHOÁ BIỂU GIÁO VIÊN: ${teacher.name}`, subtitle: `Môn: ${(teacher.subjectIds || []).map(id => subjects.find(s => s.id === id)?.shortName || id).join(', ')}`, rows }], timeSlots);
  openPrintWindow(html);
}

// ========== Xuất theo Khối ==========
export function printByGrade(
  grade: number,
  schoolInfo: SchoolInfo, classes: ClassRoom[], subjects: Subject[],
  teachers: Teacher[], slots: ScheduleSlot[]
) {
  const gradeClasses = classes.filter(c => c.grade === grade);
  const items = gradeClasses.map(cls => ({
    title: `THỜI KHOÁ BIỂU LỚP ${cls.name}`,
    subtitle: `Giáo viên chủ nhiệm: ${teachers.find(t => t.id === cls.homeroomTeacherId)?.name || 'Chưa phân công'}`,
    rows: timeSlots.map(ts =>
      DAYS.map(day => {
        const slot = slots.find(s => s.classId === cls.id && s.day === day && s.period === ts.period);
        if (!slot) return '';
        const sub = subjects.find(s => s.id === slot.subjectId);
        const tch = teachers.find(t => t.id === slot.teacherId);
        return `<b>${sub?.shortName || ''}</b>${tch ? `<br/><span style="font-size:7.5pt;">${tch.name.split(' ').pop()}</span>` : ''}`;
      })
    ),
  }));
  openPrintWindow(buildHtml(schoolInfo, items, timeSlots));
}

// ========== Xuất theo Lớp ==========
export function printByClass(
  classId: string,
  schoolInfo: SchoolInfo, classes: ClassRoom[], subjects: Subject[],
  teachers: Teacher[], slots: ScheduleSlot[]
) {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return;
  const rows = timeSlots.map(ts =>
    DAYS.map(day => {
      const slot = slots.find(s => s.classId === classId && s.day === day && s.period === ts.period);
      if (!slot) return '';
      const sub = subjects.find(s => s.id === slot.subjectId);
      const tch = teachers.find(t => t.id === slot.teacherId);
      return `<b>${sub?.shortName || ''}</b>${tch ? `<br/><span style="font-size:7.5pt;">${tch.name.split(' ').pop()}</span>` : ''}`;
    })
  );
  openPrintWindow(buildHtml(schoolInfo, [{ title: `THỜI KHOÁ BIỂU LỚP ${cls.name}`, subtitle: `GVCN: ${teachers.find(t => t.id === cls.homeroomTeacherId)?.name || ''}`, rows }], timeSlots));
}

// ========== Xuất tất cả lớp ==========
export function printAll(
  schoolInfo: SchoolInfo, classes: ClassRoom[], subjects: Subject[],
  teachers: Teacher[], slots: ScheduleSlot[]
) {
  const items = classes.map(cls => ({
    title: `THỜI KHOÁ BIỂU LỚP ${cls.name}`,
    subtitle: `GVCN: ${teachers.find(t => t.id === cls.homeroomTeacherId)?.name || ''}`,
    rows: timeSlots.map(ts =>
      DAYS.map(day => {
        const slot = slots.find(s => s.classId === cls.id && s.day === day && s.period === ts.period);
        if (!slot) return '';
        const sub = subjects.find(s => s.id === slot.subjectId);
        const tch = teachers.find(t => t.id === slot.teacherId);
        return `<b>${sub?.shortName || ''}</b>${tch ? `<br/><span style="font-size:7.5pt;">${tch.name.split(' ').pop()}</span>` : ''}`;
      })
    ),
  }));
  openPrintWindow(buildHtml(schoolInfo, items, timeSlots));
}

function openPrintWindow(html: string) {
  const win = window.open('', '_blank', 'width=1100,height=750');
  if (!win) { alert('Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép pop-up cho trang này.'); return; }
  win.document.write(html);
  win.document.close();
}
