/**
 * 学習アクティビティ管理（学習カレンダー用）
 * G検定研究室の loadActivity / recordActivity / getStreak / getActiveDayCount を
 * 本テンプレ用に汎用化。
 *
 * localStorage キー: ds-cert:activity
 * 値: { "YYYY-MM-DD": 問題数 }
 */

const ACTIVITY_KEY = "ds-cert:activity";

type ActivityMap = Record<string, number>;

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loadActivity(): ActivityMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? (data as ActivityMap) : {};
  } catch {
    return {};
  }
}

/** 学習 N 問を本日分に追加（QuizRunner / ExamRunner から呼ぶ） */
export function recordActivity(count = 1): void {
  if (typeof window === "undefined") return;
  try {
    const map = loadActivity();
    const key = todayKey();
    map[key] = (map[key] ?? 0) + count;
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** 連続学習日数（今日から遡って活動が記録されている日数） */
export function getStreak(): number {
  const map = loadActivity();
  let streak = 0;
  const d = new Date();
  // 今日まだ未学習なら昨日を起点に判定（途中救済）
  if ((map[todayKey()] ?? 0) === 0) {
    d.setDate(d.getDate() - 1);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    if ((map[key] ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** 学習した日数（1問以上ある日のカウント） */
export function getActiveDayCount(): number {
  const map = loadActivity();
  return Object.values(map).filter((c) => c > 0).length;
}
