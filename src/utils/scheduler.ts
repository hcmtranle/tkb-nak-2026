import { ScheduleSlot, ScheduleConflict, Subject, Teacher, ClassRoom, GradeLevel } from '../types';
import { selfTaughtGdtcAnClasses, thPhuClasses, linkedPoolTeacherIds } from '../data/initialData';

const DAYS = [2, 3, 4, 5, 6];
const MORNING = [1, 2, 3, 4];
const AFTERNOON = [5, 6, 7];
const AFTERNOON_WITH_T8 = [5, 6, 7, 8];

// ============================================================
// VALIDATE
// ============================================================
export function validateSchedule(
  slots: ScheduleSlot[],
  classes: ClassRoom[],
  subjects: Subject[],
  teachers: Teacher[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => subjectMap.set(s.id, s));
  const classMap = new Map<string, ClassRoom>();
  classes.forEach(c => classMap.set(c.id, c));

  const strictAfternoonCodes = ['CDS', 'KNS', 'TOANTD', 'STEM', 'IC3'];
  const englishCodes = ['TA', 'TABN', 'TATK'];

  const slotsByClassDay = new Map<string, ScheduleSlot[]>();
  const teacherTimeSlots = new Map<string, ScheduleSlot[]>();
  slots.forEach(s => {
    const key = `${s.classId}_${s.day}`;
    if (!slotsByClassDay.has(key)) slotsByClassDay.set(key, []);
    slotsByClassDay.get(key)!.push(s);
    if (s.teacherId) {
      const tKey = `${s.teacherId}_${s.day}_${s.period}`;
      if (!teacherTimeSlots.has(tKey)) teacherTimeSlots.set(tKey, []);
      teacherTimeSlots.get(tKey)!.push(s);
    }
  });

  // R1: Môn liên kết (trừ TABN/TATK) chỉ buổi chiều
  slots.forEach(s => {
    const sub = subjectMap.get(s.subjectId);
    if (!sub) return;
    if (strictAfternoonCodes.includes(sub.code) && s.period <= 4) {
      const cls = classMap.get(s.classId);
      conflicts.push({ id: `lm_${s.classId}_${s.day}_${s.period}`, type: 'linked_subject_morning', severity: 'error', message: `Lớp ${cls?.name}: ${sub.name} không được buổi sáng (T${s.day} Tiết ${s.period}).`, classId: s.classId, day: s.day, period: s.period, subjectId: s.subjectId });
    }
  });

  // R2: Khối 1-2 không có Tiết 8
  classes.filter(c => c.grade <= 2).forEach(cls => {
    DAYS.forEach(day => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      if (daySlots.some(s => s.period === 8))
        conflicts.push({ id: `t8_${cls.id}_${day}`, type: 'grade12_over_7_periods', severity: 'error', message: `Lớp ${cls.name} (Khối ${cls.grade}): không được có Tiết 8.`, classId: cls.id, day });
      if (daySlots.length > 7)
        conflicts.push({ id: `max7_${cls.id}_${day}`, type: 'grade12_over_7_periods', severity: 'error', message: `Lớp ${cls.name}: Thứ ${day} có ${daySlots.length} tiết (tối đa 7).`, classId: cls.id, day });
    });
  });

  // R3: Tối đa 2 tiết Anh/ngày
  classes.forEach(cls => {
    DAYS.forEach(day => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const engCount = daySlots.filter(s => { const sub = subjectMap.get(s.subjectId); return sub && englishCodes.includes(sub.code); }).length;
      if (engCount > 2)
        conflicts.push({ id: `eng_${cls.id}_${day}`, type: 'too_many_english_per_day', severity: 'error', message: `Lớp ${cls.name}: Thứ ${day} có ${engCount} tiết Tiếng Anh (tối đa 2).`, classId: cls.id, day });
    });
  });

  // R4: Lớp 1 — ngày 3 TV không có Toán
  classes.filter(c => c.grade === 1).forEach(cls => {
    DAYS.forEach(day => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const tvCount = daySlots.filter(s => subjectMap.get(s.subjectId)?.code === 'TV').length;
      const hasMath = daySlots.some(s => subjectMap.get(s.subjectId)?.code === 'Toán');
      if (tvCount === 3 && hasMath)
        conflicts.push({ id: `tv3_${cls.id}_${day}`, type: 'grade1_tv_math_rule', severity: 'error', message: `Lớp ${cls.name}: Thứ ${day} có 3 TV và Toán cùng ngày.`, classId: cls.id, day });
    });
  });

  // R5: Khối 3-5 tối đa 2 TV/ngày
  classes.filter(c => c.grade >= 3).forEach(cls => {
    DAYS.forEach(day => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const tvCount = daySlots.filter(s => subjectMap.get(s.subjectId)?.code === 'TV').length;
      if (tvCount > 2)
        conflicts.push({ id: `tv2_${cls.id}_${day}`, type: 'grade345_tv_over_2', severity: 'error', message: `Lớp ${cls.name}: Thứ ${day} có ${tvCount} tiết TV (tối đa 2).`, classId: cls.id, day });
    });
  });

  // R6: Toán tối đa 1/ngày
  classes.forEach(cls => {
    DAYS.forEach(day => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const mathCount = daySlots.filter(s => subjectMap.get(s.subjectId)?.code === 'Toán').length;
      if (mathCount > 1)
        conflicts.push({ id: `math_${cls.id}_${day}`, type: 'grade1_tv_math_rule', severity: 'error', message: `Lớp ${cls.name}: Thứ ${day} có ${mathCount} tiết Toán (tối đa 1).`, classId: cls.id, day });
    });
  });

  // R7: GV trùng giờ
  teacherTimeSlots.forEach((list, key) => {
    if (list.length > 1 && list[0].subjectId !== 'sub_hdtn_cc') {
      const teacher = teachers.find(t => t.id === list[0].teacherId);
      const classNames = list.map(s => classMap.get(s.classId)?.name || s.classId).join(', ');
      conflicts.push({ id: `double_${key}`, type: 'teacher_double_booked', severity: 'error', message: `GV ${teacher?.name || list[0].teacherId} trùng giờ: lớp ${classNames} (T${list[0].day} Tiết ${list[0].period}).`, day: list[0].day, period: list[0].period, teacherId: list[0].teacherId });
    }
  });

  return conflicts;
}

// ============================================================
// AUTO GENERATE — theo quytachoanthien.md
// ============================================================
export function autoGenerateSchedule(classes: ClassRoom[], subjects: Subject[], teachers: Teacher[]): ScheduleSlot[] {
  const gradeOf = (clsId: string): GradeLevel => classes.find(c => c.id === clsId)!.grade;
  const subjectByCode = new Map(subjects.map(s => [s.code, s]));
  const periodsFor = (code: string, grade: GradeLevel) => subjectByCode.get(code)?.defaultPeriodsByGrade[grade] ?? 0;

  const classIds = classes.map(c => c.id);

  // Grid
  const grid: Record<string, Record<number, Set<number>>> = {};
  classIds.forEach(id => { grid[id] = {}; DAYS.forEach(d => (grid[id][d] = new Set())); });

  const teacherBusy: Record<string, Record<number, Set<number>>> = {};
  const tb = (id: string) => {
    if (!teacherBusy[id]) { teacherBusy[id] = {}; DAYS.forEach(d => { teacherBusy[id][d] = new Set(); }); }
    return teacherBusy[id];
  };

  const poolUsage: Record<string, Record<number, Record<number, number>>> = {};
  Object.keys(linkedPoolTeacherIds).forEach(code => {
    poolUsage[code] = {};
    DAYS.forEach(d => { poolUsage[code][d] = {}; for (let p = 1; p <= 8; p++) poolUsage[code][d][p] = 0; });
  });

  const slots: ScheduleSlot[] = [];

  const free = (clsId: string, day: number, p: number) => !grid[clsId][day].has(p);
  // Số tiết tối đa mỗi ngày
  const maxToday = (clsId: string) => (gradeOf(clsId) <= 2 ? 7 : 8);
  // Tiết hợp lệ cho môn học thường (KHÔNG dùng T8 cho môn học bình thường — T8 dành cho CLB/Tự học ưu tiên)
  const validPeriodsForSubject = (clsId: string) => gradeOf(clsId) <= 2 ? [...MORNING, ...AFTERNOON] : [...MORNING, ...AFTERNOON];
  const dayCount = (clsId: string, day: number) => grid[clsId][day].size;

  const put = (clsId: string, day: number, p: number, subjectId: string, teacherId?: string) => {
    grid[clsId][day].add(p);
    slots.push({ classId: clsId, day, period: p, subjectId, teacherId });
  };

  const hasSubj = (clsId: string, day: number, subjectId: string) =>
    slots.some(s => s.classId === clsId && s.day === day && s.subjectId === subjectId);
  const countSubjToday = (clsId: string, day: number, subjectId: string) =>
    slots.filter(s => s.classId === clsId && s.day === day && s.subjectId === subjectId).length;
  const countSubjTotal = (clsId: string, subjectId: string) =>
    slots.filter(s => s.classId === clsId && s.subjectId === subjectId).length;
  const englishCount = (clsId: string, day: number) =>
    slots.filter(s => s.classId === clsId && s.day === day && ['sub_ta', 'sub_tabn', 'sub_tatk'].includes(s.subjectId)).length;
  const homeroomOf = (clsId: string) => classes.find(c => c.id === clsId)!.homeroomTeacherId!;

  // Buổi chiều có thể dùng cho môn liên kết (T5-T7 bình thường, T8 nếu khối 3-5)
  const afternoonForLinked = (clsId: string, day: number): number[] => {
    const base = [...AFTERNOON];
    if (gradeOf(clsId) >= 3 && free(clsId, day, 8)) base.push(8);
    return base;
  };

  // ===== BƯỚC 1: Chào cờ — Thứ 2 Tiết 1 =====
  classIds.forEach(id => put(id, 2, 1, 'sub_hdtn_cc', 't_tpt_nhi'));

  // ===== BƯỚC 2: CLB — rải đều các ngày, ưu tiên T8 =====
  const clb345 = classIds.filter(id => gradeOf(id) >= 3);
  clb345.forEach((id, idx) => {
    const day = DAYS[idx % DAYS.length];
    // Ưu tiên T8, fallback T7
    const p = free(id, day, 8) ? 8 : free(id, day, 7) ? 7 : free(id, day, 6) ? 6 : 5;
    put(id, day, p, 'sub_clb', homeroomOf(id));
  });

  // ===== BƯỚC 3: Môn liên kết chiều bắt buộc (CDS, KNS, TOANTD, STEM) — 1 tiết/tuần =====
  const singleLinked: { code: string; subjectId: string; grades: GradeLevel[] }[] = [
    { code: 'CDS', subjectId: 'sub_cds', grades: [1, 2] },
    { code: 'KNS', subjectId: 'sub_kns', grades: [3, 4, 5] },
    { code: 'TOANTD', subjectId: 'sub_toantd', grades: [1, 2, 3, 4, 5] },
    { code: 'STEM', subjectId: 'sub_stem', grades: [1, 2, 3, 4, 5] },
  ];

  function nextPoolTeacher(code: string, day: number, p: number): string | null {
    const ids = linkedPoolTeacherIds[code] || [];
    for (const tid of ids) { if (!tb(tid)[day].has(p)) return tid; }
    return null;
  }

  // Xếp theo round-robin (mỗi lớp 1 tiết rồi mới sang lớp khác)
  const linkedQueue: Record<string, string[]> = {};
  classIds.forEach(id => {
    const g = gradeOf(id);
    linkedQueue[id] = singleLinked.filter(s => s.grades.includes(g)).map(s => s.code);
  });

  let more = true;
  while (more) {
    more = false;
    for (const clsId of classIds) {
      if (!linkedQueue[clsId]?.length) continue;
      more = true;
      const code = linkedQueue[clsId].shift()!;
      const subId = singleLinked.find(s => s.code === code)!.subjectId;
      // Rải đều ngày theo tải pool thấp nhất
      const dayLoad = DAYS.map(d => ({ d, load: AFTERNOON_WITH_T8.reduce((s, p) => s + (poolUsage[code]?.[d]?.[p] || 0), 0) }));
      dayLoad.sort((a, b) => a.load - b.load);
      let placed = false;
      for (const { d: day } of dayLoad) {
        if (hasSubj(clsId, day, 'sub_th') && code === 'IC3') continue;
        for (const p of afternoonForLinked(clsId, day)) {
          const tid = nextPoolTeacher(code, day, p);
          if (tid && free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, subId, tid); tb(tid)[day].add(p);
            if (poolUsage[code]) poolUsage[code][day][p]++;
            placed = true; break;
          }
        }
        if (placed) break;
      }
    }
  }

  // ===== BƯỚC 4: IC3 — 2 tiết liền nhau buổi chiều (khối 3-5) =====
  classIds.filter(id => gradeOf(id) >= 3 && periodsFor('IC3', gradeOf(id)) > 0).forEach(clsId => {
    let placed = false;
    for (const day of DAYS) {
      // Thứ 2: IC3 chỉ từ T3 trở đi (cần 2 tiết liền: T3-T4 hoặc chiều)
      if (hasSubj(clsId, day, 'sub_th')) continue;
      const afternoon = afternoonForLinked(clsId, day);
      for (let i = 0; i < afternoon.length - 1; i++) {
        const p1 = afternoon[i], p2 = afternoon[i + 1];
        if (p2 !== p1 + 1) continue;
        if (!free(clsId, day, p1) || !free(clsId, day, p2)) continue;
        if (dayCount(clsId, day) + 2 > maxToday(clsId)) continue;
        const t1 = nextPoolTeacher('IC3', day, p1), t2 = nextPoolTeacher('IC3', day, p2);
        if (t1 && t2) {
          put(clsId, day, p1, 'sub_ic3', t1); tb(t1)[day].add(p1); poolUsage['IC3'][day][p1]++;
          put(clsId, day, p2, 'sub_ic3', t2); tb(t2)[day].add(p2); poolUsage['IC3'][day][p2]++;
          placed = true; break;
        }
      }
      if (placed) break;
    }
  });

  // ===== BƯỚC 5: TA(BN) và TA(T-K) — 2 tiết liền nhau, cả sáng lẫn chiều =====
  ['TABN', 'TATK'].forEach(code => {
    const subId = code === 'TABN' ? 'sub_tabn' : 'sub_tatk';
    const otherId = code === 'TABN' ? 'sub_tatk' : 'sub_tabn';
    classIds.forEach(clsId => {
      const need = periodsFor(code, gradeOf(clsId));
      if (!need) return;
      let placed = 0;
      // Ưu tiên ngày chưa có TA nào
      for (const day of DAYS) {
        if (placed >= need) break;
        // Thứ 2: chỉ dùng T3 trở đi
        if (englishCount(clsId, day) > 0) continue;
        if (hasSubj(clsId, day, subjectByCode.get(otherId === 'sub_tatk' ? 'TATK' : 'TABN')?.id || '')) continue;
        const allP = day === 2 ? [3, 4, 5, 6, 7] : (gradeOf(clsId) <= 2 ? [...MORNING, ...AFTERNOON] : [...MORNING, ...AFTERNOON_WITH_T8]);
        for (let i = 0; i < allP.length - 1; i++) {
          const p1 = allP[i], p2 = allP[i + 1];
          if (p2 !== p1 + 1) continue;
          if (!free(clsId, day, p1) || !free(clsId, day, p2)) continue;
          if (dayCount(clsId, day) + 2 > maxToday(clsId)) continue;
          const t1 = nextPoolTeacher(code, day, p1), t2 = nextPoolTeacher(code, day, p2);
          if (t1 && t2) {
            put(clsId, day, p1, subId, t1); tb(t1)[day].add(p1); poolUsage[code][day][p1]++;
            put(clsId, day, p2, subId, t2); tb(t2)[day].add(p2); poolUsage[code][day][p2]++;
            placed = 2; break;
          }
        }
        if (placed >= need) break;
      }
      // Fallback: đặt rời nếu chưa đủ
      if (placed < need) {
        for (const day of DAYS) {
          if (placed >= need) break;
          if (day === 2) continue;
          if (englishCount(clsId, day) >= 2) continue;
          const allP = day === 2 ? [3, 4, 5, 6, 7] : (gradeOf(clsId) <= 2 ? [...MORNING, ...AFTERNOON] : [...MORNING, ...AFTERNOON_WITH_T8]);
          for (const p of allP) {
            const tid = nextPoolTeacher(code, day, p);
            if (tid && free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
              put(clsId, day, p, subId, tid); tb(tid)[day].add(p); poolUsage[code][day][p]++;
              placed++; break;
            }
          }
        }
      }
    });
  });

  // ===== BƯỚC 6: GDTC + ÂN + TH — GV cố định, ưu tiên sáng =====
  function assignSingle(teacherId: string, clsIds: string[], subjectId: string, periodsNeeded: number) {
    const t = tb(teacherId);
    clsIds.forEach(clsId => {
      let placedDays: number[] = [];
      let tries = 0;
      while (placedDays.length < periodsNeeded && tries < 150) {
        tries++;
        let progressed = false;
        for (const day of DAYS) {
          if (placedDays.includes(day)) continue;
          if (periodsNeeded === 2 && placedDays.length === 1 && Math.abs(day - placedDays[0]) < 2) continue;
          // Chỉ dùng T1-T7 (không dùng T8 cho môn học thường)
          const order = [1, 2, 3, 4, 5, 6, 7].filter(p => gradeOf(clsId) <= 2 ? p <= 7 : p <= 7);
          let done = false;
          for (const p of order) {
            if (free(clsId, day, p) && !t[day].has(p) && dayCount(clsId, day) < maxToday(clsId)) {
              put(clsId, day, p, subjectId, teacherId); t[day].add(p); placedDays.push(day); done = true; progressed = true; break;
            }
          }
          if (done) break;
        }
        if (!progressed) break;
      }
    });
  }

  // GDTC
  const gdtcTeachers = [
    { id: 't_gdtc_phong', classes: ['cls_41','cls_42','cls_43','cls_44','cls_51','cls_52','cls_53','cls_54','cls_32','cls_33','cls_34','cls_35'] },
    { id: 't_gdtc_tien', classes: ['cls_11','cls_12','cls_13','cls_14','cls_15','cls_16','cls_21','cls_22','cls_23','cls_24','cls_25'] },
    { id: 't_tpt_nhi', classes: ['cls_31'] },
  ];
  gdtcTeachers.forEach(({ id, classes: cls }) => assignSingle(id, cls, 'sub_gdtc', 2));
  // 5 lớp GVCN tự dạy GDTC
  selfTaughtGdtcAnClasses.forEach(name => {
    const cls = classes.find(c => c.name === name);
    if (cls) assignSingle(homeroomOf(cls.id), [cls.id], 'sub_gdtc', 2);
  });

  // Âm nhạc
  const anClasses = classIds.filter(id => !selfTaughtGdtcAnClasses.includes(classes.find(c => c.id === id)!.name));
  assignSingle('t_an_chau', anClasses, 'sub_an', 1);
  selfTaughtGdtcAnClasses.forEach(name => {
    const cls = classes.find(c => c.name === name);
    if (cls) assignSingle(homeroomOf(cls.id), [cls.id], 'sub_an', 1);
  });

  // Tin học
  const thMainClasses = classIds.filter(id => !thPhuClasses.includes(classes.find(c => c.id === id)!.name));
  const thPhuIds = thPhuClasses.map(name => classes.find(c => c.name === name)?.id).filter(Boolean) as string[];
  assignSingle('t_th_thai', thMainClasses, 'sub_th', 1);
  assignSingle('t_th_phu', thPhuIds, 'sub_th', 1);

  // ===== BƯỚC 7: TA chuẩn — 2 tiết liền nhau, không Thứ 2 =====
  const taTeacherList = teachers.filter(t => t.subjectIds.includes('sub_ta') && t.role === 'specialist');
  taTeacherList.forEach(t => {
    const teacherBusySet = tb(t.id);
    (t.assignedClassIds || []).forEach(clsId => {
      const need = periodsFor('TA', gradeOf(clsId));
      let placed = 0, dayPtr = 0, attempts = 0;
      while (placed < need && attempts < 300) {
        attempts++;
        const day = DAYS[dayPtr % DAYS.length]; dayPtr++;
        const already = englishCount(clsId, day);
        if (already >= 2) continue;
        const remain = Math.min(2 - already, need - placed);
        // Thứ 2: chỉ từ T3 trở đi (T1=Chào cờ, T2 không xếp TA vì lẻ tiết)
        // Các ngày khác: T1-T7
        const allP = day === 2 ? [3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
        if (remain >= 2) {
          let donePair = false;
          for (let i = 0; i < allP.length - 1; i++) {
            const p1 = allP[i], p2 = allP[i + 1];
            if (p2 !== p1 + 1) continue;
            if (free(clsId, day, p1) && free(clsId, day, p2) && !teacherBusySet[day].has(p1) && !teacherBusySet[day].has(p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
              put(clsId, day, p1, 'sub_ta', t.id); teacherBusySet[day].add(p1);
              put(clsId, day, p2, 'sub_ta', t.id); teacherBusySet[day].add(p2);
              placed += 2; donePair = true; break;
            }
          }
          if (donePair) continue;
        }
        for (const p of allP) {
          if (free(clsId, day, p) && !teacherBusySet[day].has(p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, 'sub_ta', t.id); teacherBusySet[day].add(p); placed++; break;
          }
        }
      }
    });
  });

  // ===== BƯỚC 8: HĐTN Chủ đề — ưu tiên Thứ 4, linh động Thứ 3/Thứ 5 =====
  classIds.forEach(clsId => {
    for (const day of [4, 3, 5]) {
      let done = false;
      for (const p of [1, 2, 3, 4, 5, 6, 7]) {
        if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
          put(clsId, day, p, 'sub_hdtn_chude', homeroomOf(clsId)); done = true; break;
        }
      }
      if (done) break;
    }
  });

  // ===== BƯỚC 9: SHL — Thứ 6, ưu tiên T7, được lùi T8 nếu T7 bị chiếm =====
  classIds.forEach(clsId => {
    const day = 6;
    // T7 trước, nếu không thì T8 (khối 3-5), nếu không thì T6, T5...
    const order = gradeOf(clsId) >= 3 ? [7, 8, 6, 5, 4, 3, 2] : [7, 6, 5, 4, 3, 2];
    for (const p of order) {
      if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
        put(clsId, day, p, 'sub_shl', homeroomOf(clsId)); break;
      }
    }
  });

  // ===== BƯỚC 10: Toán — max 1/ngày =====
  classIds.forEach(clsId => {
    const g = gradeOf(clsId);
    const need = periodsFor('Toán', g);
    let placed = 0;
    for (const day of DAYS) {
      if (placed >= need) break;
      if (hasSubj(clsId, day, 'sub_toan')) continue;
      // Lớp 1: không Toán ngày có 3 TV
      if (g === 1 && countSubjToday(clsId, day, 'sub_tv') === 3) continue;
      for (const p of [1, 2, 3, 4, 5, 6, 7]) {
        if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
          put(clsId, day, p, 'sub_toan', homeroomOf(clsId)); placed++; break;
        }
      }
    }
  });

  // ===== BƯỚC 11: TV — theo quy tắc từng khối =====
  classIds.forEach(clsId => {
    const g = gradeOf(clsId);
    const need = periodsFor('TV', g);
    let placed = 0;

    if (g === 1) {
      // 2 ngày 3 tiết (không có Toán) + 3 ngày 2 tiết
      let heavyDays = 0;
      for (const day of DAYS) {
        if (placed >= need) break;
        const hasMath = hasSubj(clsId, day, 'sub_toan');
        const target = heavyDays < 2 && !hasMath ? 3 : 2;
        let placedToday = 0;
        // Cố gắng xếp liền nhau
        const allP = [1, 2, 3, 4, 5, 6, 7];
        let blockDone = false;
        if (target === 3) {
          for (let i = 0; i <= allP.length - 3; i++) {
            const b = allP.slice(i, i + 3);
            if (b[2] !== b[0] + 2) continue;
            if (b.every(p => free(clsId, day, p)) && dayCount(clsId, day) + 3 <= maxToday(clsId)) {
              b.forEach(p => { put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placedToday++; });
              blockDone = true; break;
            }
          }
          // Fallback: 2 sáng + 1 chiều
          if (!blockDone) {
            const morning2 = [1,2,3,4].filter(p => free(clsId, day, p));
            const afternoon1 = [5,6,7].filter(p => free(clsId, day, p));
            if (morning2.length >= 2 && afternoon1.length >= 1 && dayCount(clsId, day) + 3 <= maxToday(clsId)) {
              put(clsId, day, morning2[0], 'sub_tv', homeroomOf(clsId)); placedToday++;
              put(clsId, day, morning2[1], 'sub_tv', homeroomOf(clsId)); placedToday++;
              put(clsId, day, afternoon1[0], 'sub_tv', homeroomOf(clsId)); placedToday++;
            }
          }
        }
        if (placedToday < target && target === 2) {
          for (let i = 0; i < allP.length - 1; i++) {
            const p1 = allP[i], p2 = allP[i + 1];
            if (p2 !== p1 + 1) continue;
            if (free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
              put(clsId, day, p1, 'sub_tv', homeroomOf(clsId)); placedToday++;
              put(clsId, day, p2, 'sub_tv', homeroomOf(clsId)); placedToday++;
              break;
            }
          }
        }
        placed += placedToday;
        if (target === 3 && placedToday === 3) heavyDays++;
      }
    } else if (g === 2) {
      // 5 ngày × 2 tiết liền nhau
      for (const day of DAYS) {
        if (placed >= need) break;
        const allP = [1, 2, 3, 4, 5, 6, 7];
        let done = false;
        for (let i = 0; i < allP.length - 1; i++) {
          const p1 = allP[i], p2 = allP[i + 1];
          if (p2 !== p1 + 1) continue;
          if (free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
            put(clsId, day, p1, 'sub_tv', homeroomOf(clsId));
            put(clsId, day, p2, 'sub_tv', homeroomOf(clsId));
            placed += 2; done = true; break;
          }
        }
        if (!done) {
          for (const p of allP) {
            if (placed >= need) break;
            if (countSubjToday(clsId, day, 'sub_tv') >= 2) break;
            if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
              put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placed++;
            }
          }
        }
      }
    } else {
      // Khối 3-5: ưu tiên T2 và T4 có 2 tiết liền nhau
      const priorityDays = [2, 4, 3, 5, 6];
      for (const day of priorityDays) {
        if (placed >= need) break;
        if (countSubjToday(clsId, day, 'sub_tv') >= 2) continue;
        const allP = [1, 2, 3, 4, 5, 6, 7];
        if ((day === 2 || day === 4) && placed + 2 <= need) {
          let done = false;
          for (let i = 0; i < allP.length - 1; i++) {
            const p1 = allP[i], p2 = allP[i + 1];
            if (p2 !== p1 + 1) continue;
            if (free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
              put(clsId, day, p1, 'sub_tv', homeroomOf(clsId));
              put(clsId, day, p2, 'sub_tv', homeroomOf(clsId));
              placed += 2; done = true; break;
            }
          }
          if (done) continue;
        }
        for (const p of allP) {
          if (placed >= need) break;
          if (countSubjToday(clsId, day, 'sub_tv') >= 2) break;
          if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placed++;
          }
        }
      }
    }
  });

  // ===== BƯỚC 12: Các môn còn lại — theo thứ tự ưu tiên TV > Toán > KH > LSĐL > CN =====
  // Periods hợp lệ cho môn học thường (T8 được dùng ở khối 3-5)
  const subjPeriods = (clsId: string) => gradeOf(clsId) <= 2 ? [1,2,3,4,5,6,7] : [1,2,3,4,5,6,7,8];

  function fillSubject(clsId: string, subjectId: string, need: number, spaced: boolean, afterSubjects: string[]) {
    let placed = 0;
    const daysUsed: number[] = [];
    let round = 0;
    while (placed < need && round < 3) {
      for (const day of DAYS) {
        if (placed >= need) break;
        if (daysUsed.includes(day)) continue;
        if (spaced && daysUsed.length === 1 && Math.abs(day - daysUsed[0]) < 2) continue;
        let periodsToTry = subjPeriods(clsId);
        if (afterSubjects.length > 0) {
          const afterPeriods = slots
            .filter(s => s.classId === clsId && s.day === day && afterSubjects.includes(s.subjectId))
            .map(s => s.period);
          if (afterPeriods.length > 0) {
            const laterThan = Math.max(...afterPeriods);
            periodsToTry = periodsToTry.filter(p => p > laterThan).concat(periodsToTry.filter(p => p <= laterThan));
          }
        }
        for (const p of periodsToTry) {
          if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, subjectId, homeroomOf(clsId)); placed++; daysUsed.push(day); break;
          }
        }
      }
      round++;
    }
  }

  classIds.forEach(clsId => {
    const g = gradeOf(clsId);
    fillSubject(clsId, 'sub_daoduc', periodsFor('ĐĐ', g), false, []);
    if (periodsFor('TNXH', g) > 0) fillSubject(clsId, 'sub_tnxh', periodsFor('TNXH', g), true, []);
    if (periodsFor('KH', g) > 0) fillSubject(clsId, 'sub_kh', periodsFor('KH', g), true, ['sub_tv', 'sub_toan']);
    if (periodsFor('LSĐL', g) > 0) fillSubject(clsId, 'sub_lsdl', periodsFor('LSĐL', g), true, ['sub_tv', 'sub_toan', 'sub_kh']);
    fillSubject(clsId, 'sub_mt', periodsFor('NT(MT)', g), false, []);
    if (periodsFor('CN', g) > 0) fillSubject(clsId, 'sub_cn', periodsFor('CN', g), false, ['sub_tv', 'sub_toan', 'sub_kh', 'sub_lsdl']);
  });

  // ===== BƯỚC 13: Lấp đầy cuối cùng — bù tiết còn thiếu =====
  const subjectNeedMap: Record<string, Record<string, number>> = {};
  classIds.forEach(clsId => {
    const g = gradeOf(clsId);
    subjectNeedMap[clsId] = {
      sub_toan: periodsFor('Toán', g), sub_tv: periodsFor('TV', g),
      sub_daoduc: periodsFor('ĐĐ', g), sub_tnxh: periodsFor('TNXH', g),
      sub_kh: periodsFor('KH', g), sub_lsdl: periodsFor('LSĐL', g),
      sub_mt: periodsFor('NT(MT)', g), sub_cn: periodsFor('CN', g),
      sub_an: periodsFor('NT(ÂN)', g), sub_gdtc: periodsFor('GDTC', g),
    };
  });

  classIds.forEach(clsId => {
    const g = gradeOf(clsId);
    Object.entries(subjectNeedMap[clsId]).forEach(([subjectId, n]) => {
      if (n <= 0) return;
      let have = countSubjTotal(clsId, subjectId);
      if (have >= n) return;
      for (const day of DAYS) {
        if (have >= n) break;
        if (subjectId === 'sub_toan' && hasSubj(clsId, day, 'sub_toan')) continue;
        if (subjectId === 'sub_toan' && g === 1 && countSubjToday(clsId, day, 'sub_tv') === 3) continue;
        if (subjectId === 'sub_tv' && g === 1 && hasSubj(clsId, day, 'sub_toan') && countSubjToday(clsId, day, 'sub_tv') >= 2) continue;
        if (subjectId === 'sub_tv' && g >= 3 && countSubjToday(clsId, day, 'sub_tv') >= 2) continue;
        for (const p of subjPeriods(clsId)) {
          if (have >= n) break;
          if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, subjectId, homeroomOf(clsId)); have++;
          }
        }
      }
    });
  });

  // Bù TA chuẩn còn thiếu — thử tất cả ngày (kể cả Thứ 2 T3-T7 nếu cần)
  taTeacherList.forEach(t => {
    (t.assignedClassIds || []).forEach(clsId => {
      const need = periodsFor('TA', gradeOf(clsId));
      let have = countSubjTotal(clsId, 'sub_ta');
      if (have >= need) return;
      const teacherBusySet = tb(t.id);
      for (const day of DAYS) {
        if (have >= need) break;
        if (englishCount(clsId, day) >= 2) continue;
        // Thứ 2: chỉ T3-T7
        const perms = day === 2 ? [3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
        // Thử đặt cặp trước
        for (let i = 0; i < perms.length - 1; i++) {
          const p1 = perms[i], p2 = perms[i + 1];
          if (p2 !== p1 + 1 || have + 2 > need) continue;
          if (free(clsId, day, p1) && free(clsId, day, p2) && !teacherBusySet[day].has(p1) && !teacherBusySet[day].has(p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
            put(clsId, day, p1, 'sub_ta', t.id); teacherBusySet[day].add(p1);
            put(clsId, day, p2, 'sub_ta', t.id); teacherBusySet[day].add(p2);
            have += 2; break;
          }
        }
        if (have >= need) break;
        // Đặt rời nếu cần
        for (const p of perms) {
          if (have >= need) break;
          if (free(clsId, day, p) && !teacherBusySet[day].has(p) && dayCount(clsId, day) < maxToday(clsId) && englishCount(clsId, day) < 2) {
            put(clsId, day, p, 'sub_ta', t.id); teacherBusySet[day].add(p); have++;
          }
        }
      }
    });
  });

  // Bù IC3 còn thiếu — thử linh động hơn (kể cả T8)
  classIds.filter(id => gradeOf(id) >= 3).forEach(clsId => {
    const need = periodsFor('IC3', gradeOf(clsId));
    let have = countSubjTotal(clsId, 'sub_ic3');
    if (have >= need) return;
    for (const day of DAYS) {
      if (have >= need) break;
      if (hasSubj(clsId, day, 'sub_th')) continue;
      const aft = gradeOf(clsId) >= 3 ? [5, 6, 7, 8] : [5, 6, 7];
      // Cặp liền nhau
      for (let i = 0; i < aft.length - 1; i++) {
        const p1 = aft[i], p2 = aft[i + 1];
        if (p2 !== p1 + 1 || have + 2 > need) continue;
        if (free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
          const t1 = nextPoolTeacher('IC3', day, p1), t2 = nextPoolTeacher('IC3', day, p2);
          if (t1 && t2) {
            put(clsId, day, p1, 'sub_ic3', t1); tb(t1)[day].add(p1);
            put(clsId, day, p2, 'sub_ic3', t2); tb(t2)[day].add(p2);
            have += 2; break;
          }
        }
      }
    }
    // Fallback rời tiết nếu vẫn thiếu
    for (const day of DAYS) {
      if (have >= need) break;
      for (const p of [5, 6, 7, 8]) {
        if (have >= need) break;
        if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
          const tid = nextPoolTeacher('IC3', day, p);
          if (tid) { put(clsId, day, p, 'sub_ic3', tid); tb(tid)[day].add(p); have++; }
        }
      }
    }
  });

  // ===== BƯỚC 14: Tự học — điền vào ô còn trống T5-T8 sau cùng (khối 3-5) =====
  classIds.forEach(clsId => {
    if (gradeOf(clsId) < 3) return;
    DAYS.forEach(day => {
      // T5-T8: điền Tự học vào ô trống
      for (const p of [5, 6, 7, 8]) {
        if (free(clsId, day, p)) {
          put(clsId, day, p, 'sub_tuhoc', undefined);
        }
      }
    });
  });

  return slots;
}
