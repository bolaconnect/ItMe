import { getUpcomingLunarEvents } from "../utils/lunarCalendar";

const EMOJI: Record<string, string> = {
  "Tết Nguyên Đán": "🎊", "Mùng 2 Tết": "🎊", "Mùng 3 Tết": "🎊",
  "Rằm tháng Giêng": "🌕", "Tết Hàn Thực": "🍡", "Phật Đản": "🪷",
  "Tết Đoan Ngọ": "🍑", "Lễ Vu Lan": "🪔", "Tết Trung Thu": "🥮",
  "Ông Táo về trời": "🔥", "Tất Niên": "🎉",
};

/* ── Horizontal scrolling strip (dùng trong CalendarPage) ── */
export function LunarCountdownStrip({ count = 5 }: { count?: number }) {
  const events = getUpcomingLunarEvents(count);

  return (
    <div className="shrink-0 border-b border-border bg-card overflow-x-auto">
      <div className="flex items-stretch divide-x divide-border min-w-max">
        {events.map((ev) => {
          const isToday    = ev.daysLeft === 0;
          const isTomorrow = ev.daysLeft === 1;
          const isClose    = ev.daysLeft <= 7;
          return (
            <div
              key={`${ev.lunarDay}-${ev.lunarMonth}`}
              className={`flex items-center gap-2.5 px-4 py-2 ${isToday ? "bg-primary/8" : ""}`}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{EMOJI[ev.name] ?? "📅"}</span>
              <div>
                <p className="text-foreground whitespace-nowrap" style={{ fontWeight: 700, fontSize: "0.8rem" }}>
                  {ev.name}
                </p>
                <p className="whitespace-nowrap" style={{
                  fontSize: "0.72rem",
                  fontWeight: isClose ? 700 : 400,
                  color: isToday ? "var(--primary)" : isClose ? "#F59E0B" : "var(--muted-foreground)",
                }}>
                  {isToday ? "Hôm nay! 🎉" : isTomorrow ? "Ngày mai" : `Còn ${ev.daysLeft} ngày`}
                  {" · "}
                  {ev.solarDate.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}
                  {" ("}
                  {ev.lunarDay}/{ev.lunarMonth} ÂL)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Card widget (dùng trong Dashboard, GoalsPage, HabitsPage...) ── */
export function LunarCountdownCard({ count = 3 }: { count?: number }) {
  const events = getUpcomingLunarEvents(count);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <span style={{ fontSize: "1rem" }}>🗓️</span>
        <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
          Ngày lễ sắp tới
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {events.map((ev) => {
          const isToday    = ev.daysLeft === 0;
          const isTomorrow = ev.daysLeft === 1;
          const isClose    = ev.daysLeft <= 7;
          return (
            <li
              key={`${ev.lunarDay}-${ev.lunarMonth}`}
              className={`flex items-center gap-3 px-4 py-2.5 ${isToday ? "bg-primary/5" : ""}`}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}>{EMOJI[ev.name] ?? "📅"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {ev.name}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {ev.solarDate.toLocaleDateString("vi-VN", { day: "numeric", month: "long" })}
                  {" · "}
                  {ev.lunarDay}/{ev.lunarMonth} ÂL
                </p>
              </div>
              <span
                className="flex-shrink-0 px-2 py-0.5 rounded-full"
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  background: isToday ? "var(--primary)" : isClose ? "#FEF3C7" : "var(--muted)",
                  color: isToday ? "var(--primary-foreground)" : isClose ? "#92400E" : "var(--muted-foreground)",
                }}
              >
                {isToday ? "Hôm nay!" : isTomorrow ? "Ngày mai" : `${ev.daysLeft} ngày`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Inline mini badge (dùng trong GoalsPage, HabitsPage header) ── */
export function LunarCountdownBadge() {
  const events = getUpcomingLunarEvents(1);
  if (events.length === 0) return null;
  const ev = events[0];
  const isToday = ev.daysLeft === 0;
  const isClose = ev.daysLeft <= 7;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{
        background: isToday ? "var(--primary)" : isClose ? "#FEF3C7" : "var(--secondary)",
        color: isToday ? "var(--primary-foreground)" : isClose ? "#92400E" : "var(--secondary-foreground)",
      }}
    >
      <span style={{ fontSize: "0.875rem" }}>{EMOJI[ev.name] ?? "📅"}</span>
      <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
        {ev.name}
        {" · "}
        {isToday ? "Hôm nay!" : ev.daysLeft === 1 ? "Ngày mai" : `Còn ${ev.daysLeft} ngày`}
      </span>
    </div>
  );
}
