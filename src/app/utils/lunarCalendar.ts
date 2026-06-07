/* ─────────────────────────────────────────────────────────────
 * Âm lịch Việt Nam — múi giờ UTC+7
 * Thuật toán: Hồ Ngọc Đức (www.informatik.uni-leipzig.de/~duc)
 * ───────────────────────────────────────────────────────────── */

const TZ = 7; // UTC+7

function jdFromDate(d: number, m: number, y: number): number {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  let jd = d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
  if (jd < 2299161) {
    jd = d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, tz: number): number {
  const T  = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M   = 359.2242   + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253   + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F   = 21.2964    + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001  * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return Math.floor(Jd1 + C1 - deltat + 0.5 + tz / 24);
}

function getSunLongitude(jdn: number, tz: number): number {
  const T  = (jdn - 2451545.5 - tz / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M  = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL   = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL      += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L    = L0 + DL;
  const omega = 125.04 - 1934.136 * T;
  L -= 0.00569 + 0.00478 * Math.sin(omega * dr);
  L  = L * dr;
  L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor(L / Math.PI * 6);
}

function getLunarMonth11(yy: number, tz: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k   = Math.floor(off / 29.530588853);
  let nm    = getNewMoonDay(k, tz);
  const sl  = getSunLongitude(nm, tz);
  if (sl >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  let last: number;
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean; // tháng nhuận
}

export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const dayNumber  = jdFromDate(dd, mm, yy);
  const k          = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart   = getNewMoonDay(k + 1, TZ);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, TZ);

  let a11 = getLunarMonth11(yy, TZ);
  let b11 = a11;
  let lunarYear: number;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, TZ);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, TZ);
  }

  const lunarDay  = dayNumber - monthStart + 1;
  const diff      = Math.floor((monthStart - a11) / 29);
  let lunarLeap   = false;
  let lunarMonth  = diff + 11;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, TZ);
    if (diff >= leapOff) {
      lunarMonth = diff + 10;
      if (diff === leapOff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

/* ── Tiết khí & ngày đặc biệt ── */
const SPECIAL_DAYS: Record<string, string> = {
  "1-1":  "Tết Nguyên Đán",
  "1-2":  "Mùng 2 Tết",
  "1-3":  "Mùng 3 Tết",
  "15-1": "Rằm tháng Giêng",
  "3-3":  "Tết Hàn Thực",
  "15-4": "Phật Đản",
  "5-5":  "Tết Đoan Ngọ",
  "15-7": "Lễ Vu Lan",
  "15-8": "Tết Trung Thu",
  "23-12":"Ông Táo về trời",
  "30-12":"Tất Niên",
};

export function getLunarSpecialDay(lunarDay: number, lunarMonth: number): string | null {
  return SPECIAL_DAYS[`${lunarDay}-${lunarMonth}`] ?? null;
}

/* ── Can Chi ── */
const CAN  = ["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"];
const CHI  = ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi"];

export function getCanChi(lunarYear: number): string {
  return `${CAN[lunarYear % 10]} ${CHI[lunarYear % 12]}`;
}

/* ── Format ngắn: "12 Th.1" hoặc "R" (rằm) hoặc "M1" (mùng) ── */
export function formatLunarShort(day: number, month: number): string {
  if (day === 1)  return `1/${month}`;
  if (day === 15) return `15/${month}`;
  return String(day);
}

/* ── Tìm các ngày lễ âm lịch sắp tới ── */
export interface UpcomingEvent {
  name: string;
  solarDate: Date;   // ngày dương lịch tương ứng
  daysLeft: number;  // số ngày còn lại (0 = hôm nay)
  lunarDay: number;
  lunarMonth: number;
}

export function getUpcomingLunarEvents(count = 5): UpcomingEvent[] {
  const results: UpcomingEvent[] = [];
  const seen = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Quét 400 ngày tới để tìm đủ sự kiện
  for (let offset = 0; offset <= 400 && results.length < count; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    const yy = d.getFullYear();
    const lunar = solarToLunar(dd, mm, yy);
    const name = getLunarSpecialDay(lunar.day, lunar.month);
    if (name) {
      const key = `${lunar.day}-${lunar.month}-${lunar.year}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          name,
          solarDate: new Date(d),
          daysLeft: offset,
          lunarDay: lunar.day,
          lunarMonth: lunar.month,
        });
      }
    }
  }
  return results;
}
