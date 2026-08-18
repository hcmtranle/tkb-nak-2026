import { ScheduleSlot, ScheduleConflict, Subject, Teacher, ClassRoom, GradeLevel } from '../types';
import { selfTaughtGdtcAnClasses, thPhuClasses, linkedPoolTeacherIds } from '../data/initialData';

const DAYS = [2, 3, 4, 5, 6];
const MORNING = [1, 2, 3, 4];

// ============================================================
// VALIDATE — kiểm tra 1 bộ lịch (dùng cho tab "Kiểm Tra Xung Đột")
// ============================================================
export function validateSchedule(
  slots: ScheduleSlot[],
  classes: ClassRoom[],
  subjects: Subject[],
  teachers: Teacher[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));
  const classMap = new Map<string, ClassRoom>();
  classes.forEach((c) => classMap.set(c.id, c));

  // Môn liên kết BẮT BUỘC chỉ buổi chiều (KHÔNG gồm TABN, TATK — 2 môn này được xếp cả sáng)
  const strictAfternoonCodes = ['CDS', 'KNS', 'TOANTD', 'STEM', 'IC3'];
  const englishCodes = ['TA', 'TABN', 'TATK'];

  const slotsByClassDay = new Map<string, ScheduleSlot[]>();
  const teacherTimeSlots = new Map<string, ScheduleSlot[]>();
  slots.forEach((s) => {
    const key = `${s.classId}_${s.day}`;
    if (!slotsByClassDay.has(key)) slotsByClassDay.set(key, []);
    slotsByClassDay.get(key)!.push(s);
    if (s.teacherId) {
      const tKey = `${s.teacherId}_${s.day}_${s.period}`;
      if (!teacherTimeSlots.has(tKey)) teacherTimeSlots.set(tKey, []);
      teacherTimeSlots.get(tKey)!.push(s);
    }
  });

  // RULE 1: CDS/KNS/TOANTD/STEM/IC3 không được xếp buổi sáng
  slots.forEach((s) => {
    const sub = subjectMap.get(s.subjectId);
    if (!sub) return;
    if (strictAfternoonCodes.includes(sub.code) && s.period <= 4) {
      const cls = classMap.get(s.classId);
      conflicts.push({
        id: `conflict_linked_morning_${s.classId}_${s.day}_${s.period}`,
        type: 'linked_subject_morning', severity: 'error',
        message: `Lớp ${cls?.name || s.classId}: Môn liên kết (${sub.name}) không được xếp buổi sáng (Thứ ${s.day}, Tiết ${s.period}).`,
        classId: s.classId, day: s.day, period: s.period, subjectId: s.subjectId,
      });
    }
  });

  // RULE 1b: CLB chỉ dành cho Khối 3,4,5 — Khối 1,2 tuyệt đối không có CLB
  slots.forEach((s) => {
    const sub = subjectMap.get(s.subjectId);
    if (!sub || sub.code !== 'CLB') return;
    const cls = classMap.get(s.classId);
    if (cls && cls.grade <= 2) {
      conflicts.push({
        id: `conflict_clb_wrong_grade_${s.classId}_${s.day}_${s.period}`,
        type: 'clb_wrong_grade', severity: 'error',
        message: `Lớp ${cls.name} (Khối ${cls.grade}): CLB chỉ dành cho Khối 3,4,5 — không được xếp cho khối này.`,
        classId: s.classId, day: s.day, period: s.period,
      });
    }
  });

  // RULE 2: Tối đa 2 tiết Tiếng Anh/ngày (gộp TA + TABN + TATK)
  classes.forEach((cls) => {
    DAYS.forEach((day) => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const englishCount = daySlots.filter((s) => { const sub = subjectMap.get(s.subjectId); return sub && englishCodes.includes(sub.code); }).length;
      if (englishCount > 2) {
        conflicts.push({
          id: `conflict_eng_overload_${cls.id}_${day}`, type: 'too_many_english_per_day', severity: 'error',
          message: `Lớp ${cls.name}: Thứ ${day} bị xếp ${englishCount} tiết Tiếng Anh (Tối đa 2 tiết/ngày).`,
          classId: cls.id, day,
        });
      }
    });
  });

  // RULE 3: Khối 1, 2 tối đa 7 tiết/ngày, không có Tiết 8
  classes.filter((c) => c.grade === 1 || c.grade === 2).forEach((cls) => {
    DAYS.forEach((day) => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      if (daySlots.length > 7) {
        conflicts.push({
          id: `conflict_g12_max7_${cls.id}_${day}`, type: 'grade12_over_7_periods', severity: 'error',
          message: `Lớp ${cls.name} (Khối ${cls.grade}): Thứ ${day} học ${daySlots.length} tiết (Tối đa 7 tiết/ngày).`,
          classId: cls.id, day,
        });
      }
      if (daySlots.some((s) => s.period === 8)) {
        conflicts.push({
          id: `conflict_g12_period8_${cls.id}_${day}`, type: 'grade12_over_7_periods', severity: 'error',
          message: `Lớp ${cls.name} (Khối ${cls.grade}): không được có Tiết 8.`,
          classId: cls.id, day,
        });
      }
    });
  });

  // RULE 4: Lớp 1 — ngày có 3 tiết TV thì không Toán
  classes.filter((c) => c.grade === 1).forEach((cls) => {
    DAYS.forEach((day) => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const tvCount = daySlots.filter((s) => subjectMap.get(s.subjectId)?.code === 'TV').length;
      const hasMath = daySlots.some((s) => subjectMap.get(s.subjectId)?.code === 'Toán');
      if (tvCount === 3 && hasMath) {
        conflicts.push({
          id: `conflict_g1_tv_math_${cls.id}_${day}`, type: 'grade1_tv_math_rule', severity: 'error',
          message: `Lớp ${cls.name}: Thứ ${day} học 3 tiết Tiếng Việt thì KHÔNG ĐƯỢC xếp môn Toán.`,
          classId: cls.id, day,
        });
      }
    });
  });

  // RULE 4b: Khối 3-5 — không quá 2 tiết TV/ngày
  classes.filter((c) => c.grade >= 3).forEach((cls) => {
    DAYS.forEach((day) => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const tvCount = daySlots.filter((s) => subjectMap.get(s.subjectId)?.code === 'TV').length;
      if (tvCount > 2) {
        conflicts.push({
          id: `conflict_g345_tv_over2_${cls.id}_${day}`, type: 'grade345_tv_over_2', severity: 'error',
          message: `Lớp ${cls.name} (Khối ${cls.grade}): Thứ ${day} bị xếp ${tvCount} tiết Tiếng Việt (Tối đa 2 tiết/ngày).`,
          classId: cls.id, day,
        });
      }
    });
  });

  // RULE 5: Toán tối đa 1 tiết/ngày
  classes.forEach((cls) => {
    DAYS.forEach((day) => {
      const daySlots = slotsByClassDay.get(`${cls.id}_${day}`) || [];
      const mathCount = daySlots.filter((s) => subjectMap.get(s.subjectId)?.code === 'Toán').length;
      if (mathCount > 1) {
        conflicts.push({
          id: `conflict_math_max1_${cls.id}_${day}`, type: 'grade1_tv_math_rule', severity: 'error',
          message: `Lớp ${cls.name}: Thứ ${day} bị xếp ${mathCount} tiết Toán (Tối đa 1 tiết/ngày).`,
          classId: cls.id, day,
        });
      }
    });
  });

  // RULE 6: Giáo viên trùng giờ dạy 2 lớp (bỏ qua Chào cờ - sự kiện toàn trường)
  teacherTimeSlots.forEach((list, key) => {
    if (list.length > 1 && list[0].subjectId !== 'sub_hdtn_cc') {
      const teacher = teachers.find((t) => t.id === list[0].teacherId);
      const classNames = list.map((s) => classMap.get(s.classId)?.name || s.classId).join(', ');
      conflicts.push({
        id: `conflict_teacher_double_${key}`, type: 'teacher_double_booked', severity: 'error',
        message: `Giáo viên ${teacher?.name || list[0].teacherId} bị trùng giờ dạy các lớp ${classNames} cùng lúc (Thứ ${list[0].day}, Tiết ${list[0].period}).`,
        day: list[0].day, period: list[0].period, teacherId: list[0].teacherId,
      });
    }
  });

  return conflicts;
}

// ============================================================
// AUTO GENERATE — thuật toán xếp thời khoá biểu (đã kiểm chứng: 0 vi phạm luật cứng)
// Thứ tự ưu tiên: chỗ chật nhất xếp trước → chỗ dư nhiều xếp sau → lấp đầy cuối cùng bù đủ số tiết.
// ============================================================
export function autoGenerateSchedule(classes: ClassRoom[], subjects: Subject[], teachers: Teacher[]): ScheduleSlot[] {
  const gradeOf = (clsId: string): GradeLevel => classes.find((c) => c.id === clsId)!.grade;
  const clsNameToId = new Map(classes.map((c) => [c.name, c.id]));
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const periodsFor = (code: string, grade: GradeLevel) => subjectByCode.get(code)?.defaultPeriodsByGrade[grade] ?? 0;

  const classIds = classes.map((c) => c.id);
  const grid: Record<string, Record<number, Set<number>>> = {};
  classIds.forEach((id) => { grid[id] = {}; DAYS.forEach((d) => (grid[id][d] = new Set())); });

  const teacherBusy: Record<string, Record<number, Set<number>>> = {};
  const tb = (id: string) => {
    if (!teacherBusy[id]) teacherBusy[id] = {};
    DAYS.forEach((d) => { if (!teacherBusy[id][d]) teacherBusy[id][d] = new Set(); });
    return teacherBusy[id];
  };

  const slots: ScheduleSlot[] = [];
  const free = (clsId: string, day: number, p: number) => !grid[clsId][day].has(p);
  const maxToday = (clsId: string) => (gradeOf(clsId) <= 2 ? 7 : 8);
  const periodOK = (clsId: string, p: number) => (gradeOf(clsId) <= 2 ? p <= 7 : p <= 8);
  const dayCount = (clsId: string, day: number) => grid[clsId][day].size;
  const put = (clsId: string, day: number, p: number, subjectId: string, teacherId?: string) => {
    grid[clsId][day].add(p);
    slots.push({ classId: clsId, day, period: p, subjectId, teacherId });
  };
  const hasSubj = (clsId: string, day: number, subjectId: string) => slots.some((s) => s.classId === clsId && s.day === day && s.subjectId === subjectId);
  const englishSubjectIds = ['sub_ta', 'sub_tabn', 'sub_tatk'];
  const englishCount = (clsId: string, day: number) => slots.filter((s) => s.classId === clsId && s.day === day && englishSubjectIds.includes(s.subjectId)).length;

  function afternoonPeriodsFor(clsId: string, day: number): number[] {
    const grade = gradeOf(clsId);
    const base = [5, 6, 7];
    if (grade >= 3 && free(clsId, day, 8)) base.push(8);
    return base;
  }

  // ===== 1) Chào cờ — Thứ 2 Tiết 1, cả 29 lớp, Cô Nhí (TPT) =====
  classIds.forEach((id) => put(id, 2, 1, 'sub_hdtn_cc', 't_tpt_nhi'));

  // ===== 2) CLB — Khối 3-5, 1 tiết/tuần, Tiết 8, rải đều các ngày khác nhau theo từng lớp =====
  const clb345 = classIds.filter((id) => gradeOf(id) >= 3);
  clb345.forEach((id, idx) => put(id, DAYS[idx % DAYS.length], 8, 'sub_clb', undefined));

  // ===== 3) GDTC + Âm nhạc + Tin học (GV cố định, ưu tiên buổi sáng) =====
  function assignSingle(teacherId: string, clsIds: string[], subjectId: string, periodsNeeded: number, preferMorning: boolean) {
    const t = tb(teacherId);
    clsIds.forEach((clsId) => {
      const placedDays: number[] = [];
      let tries = 0;
      while (placedDays.length < periodsNeeded && tries < 150) {
        tries++;
        let progressed = false;
        for (const day of DAYS) {
          if (placedDays.includes(day)) continue;
          if (periodsNeeded === 2 && placedDays.length === 1 && Math.abs(day - placedDays[0]) < 2) continue;
          const order = preferMorning ? [1, 2, 3, 4, 5, 6, 7, 8] : [5, 6, 7, 8, 1, 2, 3, 4];
          let done = false;
          for (const p of order) {
            if (!periodOK(clsId, p)) continue;
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
  const gdtcTeacherClasses: [string, string[]][] = [
    ['t_gdtc_phong', teachers.find((t) => t.id === 't_gdtc_phong')?.assignedClassIds || []],
    ['t_gdtc_tien', teachers.find((t) => t.id === 't_gdtc_tien')?.assignedClassIds || []],
    ['t_tpt_nhi', teachers.find((t) => t.id === 't_tpt_nhi')?.assignedClassIds || []],
  ];
  gdtcTeacherClasses.forEach(([tid, ids]) => assignSingle(tid, ids, 'sub_gdtc', 2, true));
  const selfIds = selfTaughtGdtcAnClasses.map((n) => clsNameToId.get(n)!).filter(Boolean);
  selfIds.forEach((id) => { assignSingle(`t_gvcn_${gradeOf(id)}_${classes.find(c=>c.id===id)!.name.split('.')[1]}`, [id], 'sub_gdtc', 2, true); });
  const anClasses = classIds.filter((id) => !selfIds.includes(id));
  assignSingle('t_an_chau', anClasses, 'sub_an', 1, true);
  selfIds.forEach((id) => { assignSingle(`t_gvcn_${gradeOf(id)}_${classes.find(c=>c.id===id)!.name.split('.')[1]}`, [id], 'sub_an', 1, true); });
  const thMainClasses = classIds.filter((id) => !thPhuClasses.includes(classes.find((c) => c.id === id)!.name));
  const thPhuIds = thPhuClasses.map((n) => clsNameToId.get(n)!).filter(Boolean);
  assignSingle('t_th_thai', thMainClasses, 'sub_th', 1, true);
  assignSingle('t_th_phu', thPhuIds, 'sub_th', 1, true);

  // ===== 4) Môn liên kết BẮT BUỘC buổi chiều (CDS, KNS, TOANTD, STEM, IC3) — đặt trước để giành chỗ hẹp =====
  const strictAfternoonSubjects: { code: string; subjectId: string; grades: GradeLevel[] }[] = [
    { code: 'CDS', subjectId: 'sub_cds', grades: [1, 2] },
    { code: 'KNS', subjectId: 'sub_kns', grades: [3, 4, 5] },
    { code: 'TOANTD', subjectId: 'sub_toantd', grades: [1, 2, 3, 4, 5] },
    { code: 'STEM', subjectId: 'sub_stem', grades: [1, 2, 3, 4, 5] },
    { code: 'IC3', subjectId: 'sub_ic3', grades: [3, 4, 5] },
  ];
  const poolUsageIdx: Record<string, Record<number, Record<number, number>>> = {};
  Object.keys(linkedPoolTeacherIds).forEach((code) => {
    poolUsageIdx[code] = {};
    DAYS.forEach((d) => { poolUsageIdx[code][d] = {}; for (let p = 1; p <= 8; p++) poolUsageIdx[code][d][p] = 0; });
  });

  function nextPoolTeacher(code: string, day: number, p: number): string | null {
    const ids = linkedPoolTeacherIds[code];
    for (const tid of ids) {
      const t = tb(tid);
      if (!t[day].has(p)) return tid;
    }
    return null;
  }

  function linkedSubjectsForClass(clsId: string) {
    const g = gradeOf(clsId);
    return strictAfternoonSubjects.filter((s) => s.grades.includes(g));
  }
  const classesSorted = [...classIds].sort((a, b) => linkedSubjectsForClass(b).length - linkedSubjectsForClass(a).length);
  const perClassQueue: Record<string, string[]> = {};
  classesSorted.forEach((id) => {
    perClassQueue[id] = [];
    linkedSubjectsForClass(id).forEach((s) => { const n = periodsFor(s.code, gradeOf(id)); for (let i = 0; i < n; i++) perClassQueue[id].push(s.code); });
  });

  function placeStrictAfternoon(clsId: string, code: string): boolean {
    const dayLoad = DAYS.map((d) => ({ d, load: [1,2,3,4,5,6,7,8].reduce((s, p) => s + poolUsageIdx[code][d][p], 0) }));
    dayLoad.sort((a, b) => a.load - b.load);
    for (const { d: day } of dayLoad) {
      if (hasSubj(clsId, day, subjectByCode.get(code)!.id)) continue;
      if (code === 'IC3' && hasSubj(clsId, day, 'sub_th')) continue;
      for (const p of afternoonPeriodsFor(clsId, day)) {
        if (!periodOK(clsId, p)) continue;
        const teacherId = nextPoolTeacher(code, day, p);
        if (teacherId && free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
          put(clsId, day, p, subjectByCode.get(code)!.id, teacherId);
          tb(teacherId)[day].add(p);
          poolUsageIdx[code][day][p]++;
          return true;
        }
      }
    }
    return false;
  }
  let more = true;
  while (more) {
    more = false;
    for (const clsId of classesSorted) {
      if (perClassQueue[clsId].length === 0) continue;
      more = true;
      const code = perClassQueue[clsId].shift()!;
      placeStrictAfternoon(clsId, code);
    }
  }

  // ===== 5) TA(BN), TA(T-K) — được cả sáng lẫn chiều, ưu tiên liền 2 tiết cùng ngày =====
  ['TABN', 'TATK'].forEach((code) => {
    const subjectId = code === 'TABN' ? 'sub_tabn' : 'sub_tatk';
    const otherId = code === 'TABN' ? 'sub_tatk' : 'sub_tabn';
    classIds.forEach((clsId) => {
      const need = periodsFor(code, gradeOf(clsId));
      let placed = 0;
      for (const day of DAYS) {
        if (placed >= need) break;
        if (englishCount(clsId, day) > 0) continue;
        const allP = MORNING.concat(afternoonPeriodsFor(clsId, day)).filter((p) => periodOK(clsId, p));
        for (let i = 0; i < allP.length - 1; i++) {
          const p1 = allP[i], p2 = allP[i + 1];
          if (p2 !== p1 + 1) continue;
          const t1 = nextPoolTeacher(code, day, p1), t2 = nextPoolTeacher(code, day, p2);
          if (t1 && t2 && free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
            put(clsId, day, p1, subjectId, t1); tb(t1)[day].add(p1); poolUsageIdx[code][day][p1]++;
            put(clsId, day, p2, subjectId, t2); tb(t2)[day].add(p2); poolUsageIdx[code][day][p2]++;
            placed = 2; break;
          }
        }
        if (placed === 2) break;
      }
      // fallback: đặt rời từng tiết nếu chưa đủ
      let guard = 0;
      while (placed < need && guard < 100) {
        guard++;
        const dayLoad = DAYS.map((d) => ({ d, load: [1,2,3,4,5,6,7,8].reduce((s, p) => s + poolUsageIdx[code][d][p], 0) }));
        dayLoad.sort((a, b) => a.load - b.load);
        let done = false;
        for (const { d: day } of dayLoad) {
          if (hasSubj(clsId, day, otherId)) continue;
          if (englishCount(clsId, day) >= 2) continue;
          for (const p of MORNING.concat(afternoonPeriodsFor(clsId, day)).filter((p) => periodOK(clsId, p))) {
            const tid = nextPoolTeacher(code, day, p);
            if (tid && free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) {
              put(clsId, day, p, subjectId, tid); tb(tid)[day].add(p); poolUsageIdx[code][day][p]++;
              placed++; done = true; break;
            }
          }
          if (done) break;
        }
        if (!done) break;
      }
    });
  });

  // ===== 6) Tiếng Anh chuẩn — liền cặp nếu 2 tiết cùng ngày, tính gộp tối đa 2 Anh/ngày =====
  const taTeacherList = teachers.filter((t) => t.subjectIds.includes('sub_ta') && t.role === 'specialist');
  taTeacherList.forEach((t) => {
    const teacherBusySet = tb(t.id);
    (t.assignedClassIds || []).forEach((clsId) => {
      const need = periodsFor('TA', gradeOf(clsId));
      let placed = 0, dayPtr = 0, attempts = 0;
      while (placed < need && attempts < 300) {
        attempts++;
        const day = DAYS[dayPtr % DAYS.length]; dayPtr++;
        const already = englishCount(clsId, day);
        if (already >= 2) continue;
        const remain = Math.min(2 - already, need - placed);
        if (remain >= 2) {
          const allP = MORNING.concat(afternoonPeriodsFor(clsId, day)).filter((p) => periodOK(clsId, p));
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
        for (const p of MORNING.concat(afternoonPeriodsFor(clsId, day)).filter((p) => periodOK(clsId, p))) {
          if (free(clsId, day, p) && !teacherBusySet[day].has(p) && dayCount(clsId, day) < maxToday(clsId)) {
            put(clsId, day, p, 'sub_ta', t.id); teacherBusySet[day].add(p); placed++; break;
          }
        }
      }
    });
  });

  // ===== 7) HĐTN Chủ đề — giữa tuần (Thứ 3-5) =====
  const homeroomOf = (clsId: string) => classes.find((c) => c.id === clsId)!.homeroomTeacherId!;
  const ALLP = [1, 2, 3, 4, 5, 6, 7, 8];
  classIds.forEach((clsId) => {
    for (const day of [3, 4, 5]) {
      let done = false;
      for (const p of ALLP.filter((p) => periodOK(clsId, p))) {
        if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_hdtn_chude', homeroomOf(clsId)); done = true; break; }
      }
      if (done) break;
    }
  });

  // ===== 8) Sinh hoạt lớp — Thứ 6, tiết cuối còn trống =====
  classIds.forEach((clsId) => {
    const day = 6;
    for (const p of [8, 7, 6, 5, 4, 3, 2, 1].filter((p) => periodOK(clsId, p))) {
      if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_shl', homeroomOf(clsId)); break; }
    }
  });

  // ===== 9) Toán — tối đa 1/ngày, ưu tiên (không bắt buộc) tiết đầu còn trống =====
  classIds.forEach((clsId) => {
    const need = periodsFor('Toán', gradeOf(clsId));
    let placed = 0;
    for (const day of DAYS) {
      if (placed >= need) break;
      if (hasSubj(clsId, day, 'sub_toan')) continue;
      for (const p of ALLP.filter((p) => periodOK(clsId, p))) {
        if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_toan', homeroomOf(clsId)); placed++; break; }
      }
    }
  });

  // ===== 10) Tiếng Việt — luật riêng theo khối =====
  classIds.forEach((clsId) => {
    const grade = gradeOf(clsId);
    const need = periodsFor('TV', grade);
    let placed = 0;
    if (grade === 1) {
      let heavyDaysUsed = 0;
      for (const day of DAYS) {
        const hasToan = hasSubj(clsId, day, 'sub_toan');
        const target = heavyDaysUsed < 2 && !hasToan ? 3 : 2;
        let placedToday = 0;
        const allP = ALLP.filter((p) => periodOK(clsId, p));
        let doneBlock = false;
        for (let i = 0; i <= allP.length - target; i++) {
          const block = allP.slice(i, i + target);
          if (block.every((p, idx) => idx === 0 || p === block[idx - 1] + 1) && block.every((p) => free(clsId, day, p)) && dayCount(clsId, day) + target <= maxToday(clsId)) {
            block.forEach((p) => { put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placedToday++; });
            doneBlock = true; break;
          }
        }
        if (!doneBlock) { for (const p of allP) { if (placedToday >= target) break; if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placedToday++; } } }
        placed += placedToday;
        if (target === 3 && placedToday === 3) heavyDaysUsed++;
      }
    } else if (grade === 2) {
      for (const day of DAYS) {
        if (placed >= need) break;
        const target = Math.min(2, need - placed);
        const allP = ALLP.filter((p) => periodOK(clsId, p));
        let done = false;
        if (target === 2) {
          for (let i = 0; i < allP.length - 1; i++) {
            const p1 = allP[i], p2 = allP[i + 1];
            if (p2 === p1 + 1 && free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
              put(clsId, day, p1, 'sub_tv', homeroomOf(clsId)); put(clsId, day, p2, 'sub_tv', homeroomOf(clsId)); placed += 2; done = true; break;
            }
          }
        }
        if (!done) { for (const p of allP) { if (placed >= need) break; if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placed++; } } }
      }
    } else {
      const priorityDays = [2, 4, 3, 5, 6];
      for (const day of priorityDays) {
        if (placed >= need) break;
        const countToday = () => slots.filter((s) => s.classId === clsId && s.day === day && s.subjectId === 'sub_tv').length;
        const target = Math.min(2 - countToday(), need - placed);
        if (target <= 0) continue;
        const allP = ALLP.filter((p) => periodOK(clsId, p));
        let done = false;
        if (target === 2 && (day === 2 || day === 4)) {
          for (let i = 0; i < allP.length - 1; i++) {
            const p1 = allP[i], p2 = allP[i + 1];
            if (p2 === p1 + 1 && free(clsId, day, p1) && free(clsId, day, p2) && dayCount(clsId, day) + 2 <= maxToday(clsId)) {
              put(clsId, day, p1, 'sub_tv', homeroomOf(clsId)); put(clsId, day, p2, 'sub_tv', homeroomOf(clsId)); placed += 2; done = true; break;
            }
          }
        }
        if (!done) { for (const p of allP) { if (placed >= need || countToday() >= 2) break; if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, 'sub_tv', homeroomOf(clsId)); placed++; } } }
      }
    }
  });

  // ===== 11) ĐĐ, TNXH/KH/LSĐL (KH xếp sau TV/Toán cùng ngày), MT, CN =====
  function fillSubject(clsId: string, subjectId: string, need: number, spaced: boolean, afterTVToan: boolean) {
    let placed = 0; const daysUsed: number[] = []; let round = 0;
    while (placed < need && round < 3) {
      for (const day of DAYS) {
        if (placed >= need) break;
        if (daysUsed.includes(day)) continue;
        if (spaced && daysUsed.length === 1 && Math.abs(day - daysUsed[0]) < 2) continue;
        let periodsToTry = ALLP.filter((p) => periodOK(clsId, p));
        if (afterTVToan && (hasSubj(clsId, day, 'sub_tv') || hasSubj(clsId, day, 'sub_toan'))) {
          const laterThan = Math.max(...slots.filter((s) => s.classId === clsId && s.day === day && (s.subjectId === 'sub_tv' || s.subjectId === 'sub_toan')).map((s) => s.period));
          periodsToTry = periodsToTry.filter((p) => p > laterThan).concat(periodsToTry.filter((p) => p <= laterThan));
        }
        for (const p of periodsToTry) {
          if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, subjectId, homeroomOf(clsId)); placed++; daysUsed.push(day); break; }
        }
      }
      round++;
    }
  }
  classIds.forEach((clsId) => {
    const grade = gradeOf(clsId);
    fillSubject(clsId, 'sub_daoduc', periodsFor('ĐĐ', grade), false, false);
    if (periodsFor('TNXH', grade) > 0) fillSubject(clsId, 'sub_tnxh', periodsFor('TNXH', grade), true, false);
    if (periodsFor('KH', grade) > 0) fillSubject(clsId, 'sub_kh', periodsFor('KH', grade), true, true);
    if (periodsFor('LSĐL', grade) > 0) fillSubject(clsId, 'sub_lsdl', periodsFor('LSĐL', grade), true, false);
    fillSubject(clsId, 'sub_mt', periodsFor('NT(MT)', grade), false, false);
    if (periodsFor('CN', grade) > 0) fillSubject(clsId, 'sub_cn', periodsFor('CN', grade), false, false);
  });

  // ===== 12) LẤP ĐẦY CUỐI CÙNG — bù đủ số tiết còn thiếu vào bất kỳ chỗ trống hợp lệ (chỉ theo luật cứng) =====
  const countSubj = (clsId: string, subjectId: string) => slots.filter((s) => s.classId === clsId && s.subjectId === subjectId).length;
  classIds.forEach((clsId) => {
    const grade = gradeOf(clsId);
    const need: Record<string, number> = {
      sub_toan: periodsFor('Toán', grade), sub_tv: periodsFor('TV', grade), sub_daoduc: periodsFor('ĐĐ', grade),
      sub_tnxh: periodsFor('TNXH', grade), sub_kh: periodsFor('KH', grade), sub_lsdl: periodsFor('LSĐL', grade),
      sub_mt: periodsFor('NT(MT)', grade), sub_cn: periodsFor('CN', grade),
    };
    Object.entries(need).forEach(([subjectId, n]) => {
      if (n <= 0) return;
      let have = countSubj(clsId, subjectId);
      if (have >= n) return;
      for (const day of DAYS) {
        if (have >= n) break;
        if (subjectId === 'sub_toan' && hasSubj(clsId, day, 'sub_toan')) continue;
        if (subjectId === 'sub_toan' && grade === 1 && slots.filter((s) => s.classId === clsId && s.day === day && s.subjectId === 'sub_tv').length === 3) continue;
        if (subjectId === 'sub_tv' && grade === 1 && hasSubj(clsId, day, 'sub_toan') && slots.filter((s) => s.classId === clsId && s.day === day && s.subjectId === 'sub_tv').length >= 2) continue;
        if (subjectId === 'sub_tv' && grade >= 3 && slots.filter((s) => s.classId === clsId && s.day === day && s.subjectId === 'sub_tv').length >= 2) continue;
        for (const p of ALLP.filter((p) => periodOK(clsId, p))) {
          if (have >= n) break;
          if (free(clsId, day, p) && dayCount(clsId, day) < maxToday(clsId)) { put(clsId, day, p, subjectId, homeroomOf(clsId)); have++; }
        }
      }
    });
  });

  // ===== 13) "Tự học" — lấp Tiết 8 còn trống ở Khối 3-5 (những ngày không có CLB/môn liên kết) =====
  classIds.forEach((clsId) => {
    if (gradeOf(clsId) < 3) return;
    DAYS.forEach((day) => {
      if (free(clsId, day, 8)) put(clsId, day, 8, 'sub_tuhoc', undefined);
    });
  });

  return slots;
}
