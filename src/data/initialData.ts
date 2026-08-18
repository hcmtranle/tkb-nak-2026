import { SchoolInfo, Subject, Teacher, ClassRoom, TimeSlotDef, GradeLevel } from '../types';

export const timeSlots: TimeSlotDef[] = [
  { period: 1, session: 'morning', sessionPeriod: 1, label: 'Tiết 1', time: '7:45 - 8:20' },
  { period: 2, session: 'morning', sessionPeriod: 2, label: 'Tiết 2', time: '8:25 - 9:00' },
  { period: 3, session: 'morning', sessionPeriod: 3, label: 'Tiết 3', time: '9:35 - 10:10' },
  { period: 4, session: 'morning', sessionPeriod: 4, label: 'Tiết 4', time: '10:15 - 10:50' },
  { period: 5, session: 'afternoon', sessionPeriod: 1, label: 'Tiết 5 (Chiều 1)', time: '13:30 - 14:05' },
  { period: 6, session: 'afternoon', sessionPeriod: 2, label: 'Tiết 6 (Chiều 2)', time: '14:10 - 14:45' },
  { period: 7, session: 'afternoon', sessionPeriod: 3, label: 'Tiết 7 (Chiều 3)', time: '15:15 - 15:50' },
  { period: 8, session: 'afternoon', sessionPeriod: 4, label: 'Tiết 8 (CLB / Tự học)', time: '15:55 - 16:30' },
];

export const initialSchoolInfo: SchoolInfo = {
  headerOrg: 'UỶ BAN NHÂN DÂN PHƯỜNG ĐÔNG HƯNG THUẬN',
  name: 'TRƯỜNG TIỂU HỌC NGUYỄN AN KHƯƠNG',
  year: '2026-2027',
  title: 'THỜI KHOÁ BIỂU TIỂU HỌC 2026-2027 (29 LỚP)',
};

// ============================================================
// MÔN HỌC — số tiết/tuần theo khối đã đối chiếu đúng Bảng phân công giảng dạy HK1 2026-2027
// ============================================================
export const initialSubjects: Subject[] = [
  { id: 'sub_tv', name: 'Tiếng Việt', shortName: 'TV', code: 'TV',
    color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
    defaultPeriodsByGrade: { 1: 12, 2: 10, 3: 7, 4: 7, 5: 7 } },
  { id: 'sub_toan', name: 'Toán', shortName: 'Toán', code: 'Toán',
    color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
    defaultPeriodsByGrade: { 1: 3, 2: 5, 3: 5, 4: 5, 5: 5 } },
  { id: 'sub_daoduc', name: 'Đạo đức', shortName: 'Đạo đức', code: 'ĐĐ',
    color: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_tnxh', name: 'Tự nhiên và Xã hội', shortName: 'TNXH', code: 'TNXH',
    color: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800',
    defaultPeriodsByGrade: { 1: 2, 2: 2, 3: 2, 4: 0, 5: 0 } },
  { id: 'sub_an', name: 'Âm nhạc', shortName: 'NT(ÂN)', code: 'NT(ÂN)',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800',
    isSpecialRoom: true,
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_mt', name: 'Mĩ thuật', shortName: 'NT(MT)', code: 'NT(MT)',
    color: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800',
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_gdtc', name: 'Giáo dục thể chất', shortName: 'GDTC', code: 'GDTC',
    color: 'bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-950 dark:text-lime-200 dark:border-lime-800',
    isSpecialRoom: true,
    defaultPeriodsByGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 } },
  { id: 'sub_cn', name: 'Công nghệ', shortName: 'CN', code: 'CN',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } },
  { id: 'sub_th', name: 'Tin học TH(2018)', shortName: 'TH', code: 'TH',
    color: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800',
    isSpecialRoom: true,
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_ta', name: 'Ngoại ngữ (Tiếng Anh)', shortName: 'TA', code: 'TA',
    color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
    defaultPeriodsByGrade: { 1: 2, 2: 2, 3: 4, 4: 4, 5: 4 } },
  { id: 'sub_kh', name: 'Khoa học', shortName: 'KH', code: 'KH',
    color: 'bg-emerald-200 text-emerald-950 border-emerald-400 dark:bg-emerald-900 dark:text-emerald-100',
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 } },
  { id: 'sub_lsdl', name: 'Lịch sử và Địa lí', shortName: 'LSĐL', code: 'LSĐL',
    color: 'bg-yellow-200 text-yellow-950 border-yellow-400 dark:bg-yellow-900 dark:text-yellow-100',
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 } },
  { id: 'sub_hdtn_cc', name: 'HĐTN (Chào cờ)', shortName: 'HĐTN (CC)', code: 'HĐTN(CC)',
    color: 'bg-red-200 text-red-950 border-red-400 dark:bg-red-900 dark:text-red-100 font-bold',
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_hdtn_chude', name: 'HĐTN (Chủ đề)', shortName: 'HĐTN (CĐ)', code: 'HĐTN(CĐ)',
    color: 'bg-stone-200 text-stone-900 border-stone-400 dark:bg-stone-800 dark:text-stone-200',
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_shl', name: 'Sinh hoạt lớp', shortName: 'HĐTN (SHL)', code: 'HĐTN(SHL)',
    color: 'bg-stone-300 text-stone-900 border-stone-500 dark:bg-stone-700 dark:text-stone-200',
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },

  // ---- Môn liên kết (thực chất là câu lạc bộ) ----
  { id: 'sub_cds', name: 'Công dân số', shortName: 'CDS', code: 'CDS',
    color: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950 dark:text-fuchsia-200',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0 } },
  { id: 'sub_toantd', name: 'Toán tư duy', shortName: 'Toán TD', code: 'TOANTD',
    color: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950 dark:text-violet-200',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_kns', name: 'Kỹ năng sống', shortName: 'KNS', code: 'KNS',
    color: 'bg-amber-200 text-amber-950 border-amber-400 dark:bg-amber-900 dark:text-amber-100',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_tabn', name: 'Tiếng Anh (Bản ngữ)', shortName: 'TA (BN)', code: 'TABN',
    color: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950 dark:text-pink-200',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 } },
  { id: 'sub_tatk', name: 'Tiếng Anh (Toán-Khoa)', shortName: 'TA (T-K)', code: 'TATK',
    color: 'bg-purple-200 text-purple-950 border-purple-400 dark:bg-purple-900 dark:text-purple-100',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 } },
  { id: 'sub_stem', name: 'Bài học STEM', shortName: 'Stem', code: 'STEM',
    color: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200',
    isLinkedSubject: true,
    defaultPeriodsByGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  { id: 'sub_ic3', name: 'Tin học IC3', shortName: 'IC3', code: 'IC3',
    color: 'bg-cyan-200 text-cyan-950 border-cyan-400 dark:bg-cyan-900 dark:text-cyan-100',
    isLinkedSubject: true, isSpecialRoom: true,
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 2 } },

  { id: 'sub_clb', name: 'Câu lạc bộ', shortName: 'CLB', code: 'CLB',
    color: 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200',
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 } },

  { id: 'sub_tuhoc', name: 'Tự học có hướng dẫn', shortName: 'Tự học', code: 'TUHOC',
    color: 'bg-gray-100 text-gray-500 border-gray-300 border-dashed dark:bg-gray-900 dark:text-gray-500',
    defaultPeriodsByGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
];

// ============================================================
// LỚP HỌC — 29 lớp
// ============================================================
export const initialClasses: ClassRoom[] = (() => {
  const list: ClassRoom[] = [];
  const perGrade: Record<number, number> = { 1: 6, 2: 6, 3: 6, 4: 6, 5: 5 };
  ([1, 2, 3, 4, 5] as GradeLevel[]).forEach((grade) => {
    for (let i = 1; i <= perGrade[grade]; i++) {
      list.push({ id: `cls_${grade}${i}`, name: `${grade}.${i}`, grade, homeroomTeacherId: `t_gvcn_${grade}_${i}`, studentCount: 35 });
    }
  });
  return list;
})();

const homeroomNames: Record<string, string> = {
  '1.1': 'Trần Thị Diễm Linh', '1.2': 'Lê Thị Hoa', '1.3': 'Phạm Thị Ngọc Hân',
  '1.4': 'Hoàng Thị Hiền Nga', '1.5': 'Nguyễn Thị Phương Thảo', '1.6': 'Lê Phương Anh',
  '2.1': 'Lai Quí Phượng', '2.2': 'Dương Phạm Bích Ngân', '2.3': 'Nguyễn Thị Hải Yến',
  '2.4': 'Vương Gia Linh', '2.5': 'Phan Thị Thanh Tịnh', '2.6': 'Ngô Thị Thanh Hằng',
  '3.1': 'Nguyễn Thị Thanh Trúc', '3.2': 'Nguyễn Hoàng Yến Nhi', '3.3': 'Đỗ Thị Kim Anh',
  '3.4': 'Phạm Thị Thanh Uyên', '3.5': 'Võ Thị Yến Nhi', '3.6': 'Nguyễn Thanh Thảo',
  '4.1': 'Phạm Thị Huế', '4.2': 'Trần Thị Thu Hương', '4.3': 'Nguyễn Minh Thắng',
  '4.4': 'Trịnh Ngọc Minh Phương', '4.5': 'Lê Thị Dạ Thảo', '4.6': 'Phạm Quỳnh Như',
  '5.1': 'Nguyễn Thị Tuyết Mai', '5.2': 'Trần Nguyễn Trung Trực', '5.3': 'Đặng Kim Anh',
  '5.4': 'Nguyễn Duy Đang', '5.5': 'Huỳnh Ngọc Trâm',
};

export const selfTaughtGdtcAnClasses = ['2.6', '3.6', '4.5', '4.6', '5.5'];
export const thPhuClasses = ['1.1', '1.2', '1.3', '1.4'];

// ============================================================
// GIÁO VIÊN
// ============================================================
export const initialTeachers: Teacher[] = [
  ...initialClasses.map((cls) => ({
    id: cls.homeroomTeacherId!,
    name: homeroomNames[cls.name] || `GVCN Lớp ${cls.name}`,
    shortName: `${homeroomNames[cls.name]?.split(' ').pop() || cls.name}`,
    role: 'homeroom' as const,
    subjectIds: ['sub_tv', 'sub_toan', 'sub_daoduc', 'sub_tnxh', 'sub_kh', 'sub_lsdl', 'sub_hdtn_chude', 'sub_shl', 'sub_cn', 'sub_clb', 'sub_mt'].concat(
      selfTaughtGdtcAnClasses.includes(cls.name) ? ['sub_gdtc', 'sub_an'] : []
    ),
    assignedClassIds: [cls.id],
  })),

  { id: 't_gdtc_phong', name: 'Lưu Thanh Phong', shortName: 'Thầy Phong (GDTC)', role: 'specialist', subjectIds: ['sub_gdtc'],
    assignedClassIds: ['cls_41','cls_42','cls_43','cls_44','cls_51','cls_52','cls_53','cls_54','cls_32','cls_33','cls_34','cls_35'] },
  { id: 't_gdtc_tien', name: 'Vũ Trần Hoàng Nhật Tiến', shortName: 'Thầy Tiến (GDTC)', role: 'specialist', subjectIds: ['sub_gdtc'],
    assignedClassIds: ['cls_11','cls_12','cls_13','cls_14','cls_15','cls_16','cls_21','cls_22','cls_23','cls_24','cls_25'] },
  { id: 't_tpt_nhi', name: 'Lê Phạm Yến Nhí', shortName: 'Cô Nhí (TPT)', role: 'total_leader', subjectIds: ['sub_hdtn_cc', 'sub_gdtc'],
    assignedClassIds: ['cls_31'] },

  { id: 't_an_chau', name: 'Phạm Thị Hồng Châu', shortName: 'Cô Châu (ÂN)', role: 'specialist', subjectIds: ['sub_an'] },

  { id: 't_th_thai', name: 'Phạm Lê Hoàng Thái', shortName: 'Thầy Thái (Tin học)', role: 'specialist', subjectIds: ['sub_th', 'sub_ic3'] },
  { id: 't_th_phu', name: 'GV Tin học (Lớp 1.1-1.4)', shortName: 'GV Tin học phụ', role: 'specialist', subjectIds: ['sub_th'] },

  { id: 't_ta_trang', name: 'Khưu Thị Minh Trang', shortName: 'Cô Trang (TA)', role: 'specialist', subjectIds: ['sub_ta'],
    assignedClassIds: ['cls_51','cls_52','cls_53','cls_54','cls_55','cls_36'] },
  { id: 't_ta_phuong', name: 'Nguyễn Thị Kim Phượng', shortName: 'Cô Phượng (TA)', role: 'specialist', subjectIds: ['sub_ta'],
    assignedClassIds: ['cls_41','cls_42','cls_43','cls_44','cls_45','cls_46'] },
  { id: 't_ta_thy', name: 'Nguyễn Thị Hữu Thy', shortName: 'Cô Thy (TA)', role: 'specialist', subjectIds: ['sub_ta'],
    assignedClassIds: ['cls_11','cls_12','cls_13','cls_14','cls_15','cls_16','cls_31','cls_32','cls_21'] },
  { id: 't_ta_tam', name: 'Tăng Thị Minh Tâm', shortName: 'Cô Tâm (TA)', role: 'specialist', subjectIds: ['sub_ta'],
    assignedClassIds: ['cls_22','cls_23','cls_24','cls_25','cls_26','cls_33','cls_34','cls_35'] },

  { id: 't_pool_tabn_1', name: 'GV TA (BN) 1', shortName: 'GV TA(BN)_1', role: 'specialist', subjectIds: ['sub_tabn'] },
  { id: 't_pool_tabn_2', name: 'GV TA (BN) 2', shortName: 'GV TA(BN)_2', role: 'specialist', subjectIds: ['sub_tabn'] },
  { id: 't_pool_tabn_3', name: 'GV TA (BN) 3', shortName: 'GV TA(BN)_3', role: 'specialist', subjectIds: ['sub_tabn'] },
  { id: 't_pool_tatk_1', name: 'GV TA (T-K) 1', shortName: 'GV TA(T-K)_1', role: 'specialist', subjectIds: ['sub_tatk'] },
  { id: 't_pool_tatk_2', name: 'GV TA (T-K) 2', shortName: 'GV TA(T-K)_2', role: 'specialist', subjectIds: ['sub_tatk'] },
  { id: 't_pool_tatk_3', name: 'GV TA (T-K) 3', shortName: 'GV TA(T-K)_3', role: 'specialist', subjectIds: ['sub_tatk'] },
  { id: 't_pool_ic3_1', name: 'GV IC3 1', shortName: 'GV IC3_1', role: 'specialist', subjectIds: ['sub_ic3'] },
  { id: 't_pool_ic3_2', name: 'GV IC3 2', shortName: 'GV IC3_2', role: 'specialist', subjectIds: ['sub_ic3'] },
  { id: 't_pool_cds_1', name: 'GV Công dân số 1', shortName: 'GV CDS_1', role: 'specialist', subjectIds: ['sub_cds'] },
  { id: 't_pool_cds_2', name: 'GV Công dân số 2', shortName: 'GV CDS_2', role: 'specialist', subjectIds: ['sub_cds'] },
  { id: 't_pool_kns_1', name: 'GV KNS 1', shortName: 'GV KNS_1', role: 'specialist', subjectIds: ['sub_kns'] },
  { id: 't_pool_kns_2', name: 'GV KNS 2', shortName: 'GV KNS_2', role: 'specialist', subjectIds: ['sub_kns'] },
  { id: 't_pool_kns_3', name: 'GV KNS 3', shortName: 'GV KNS_3', role: 'specialist', subjectIds: ['sub_kns'] },
  { id: 't_pool_toantd_1', name: 'GV Toán Tư duy 1', shortName: 'GV ToánTD_1', role: 'specialist', subjectIds: ['sub_toantd'] },
  { id: 't_pool_toantd_2', name: 'GV Toán Tư duy 2', shortName: 'GV ToánTD_2', role: 'specialist', subjectIds: ['sub_toantd'] },
  { id: 't_pool_toantd_3', name: 'GV Toán Tư duy 3', shortName: 'GV ToánTD_3', role: 'specialist', subjectIds: ['sub_toantd'] },
  { id: 't_pool_stem_1', name: 'GV STEM 1', shortName: 'GV STEM_1', role: 'specialist', subjectIds: ['sub_stem'] },
  { id: 't_pool_stem_2', name: 'GV STEM 2', shortName: 'GV STEM_2', role: 'specialist', subjectIds: ['sub_stem'] },
  { id: 't_pool_stem_3', name: 'GV STEM 3', shortName: 'GV STEM_3', role: 'specialist', subjectIds: ['sub_stem'] },
];

export const linkedPoolTeacherIds: Record<string, string[]> = {
  TABN: ['t_pool_tabn_1', 't_pool_tabn_2', 't_pool_tabn_3'],
  TATK: ['t_pool_tatk_1', 't_pool_tatk_2', 't_pool_tatk_3'],
  IC3: ['t_pool_ic3_1', 't_pool_ic3_2'],
  CDS: ['t_pool_cds_1', 't_pool_cds_2'],
  KNS: ['t_pool_kns_1', 't_pool_kns_2', 't_pool_kns_3'],
  TOANTD: ['t_pool_toantd_1', 't_pool_toantd_2', 't_pool_toantd_3'],
  STEM: ['t_pool_stem_1', 't_pool_stem_2', 't_pool_stem_3'],
};
