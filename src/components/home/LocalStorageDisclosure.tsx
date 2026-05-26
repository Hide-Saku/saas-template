"use client";

/**
 * LocalStorageDisclosure — 別アカウントログイン時のトップバナー通知。
 * 仕様書 §5-A:
 *   - useAuth() の ownerCleared=true（前回と違うメールでログインし、
 *     localStorage の進捗を安全のためクリアした時）に表示
 *   - 数秒で自動的に閉じる非モーダル
 *   - app/layout.tsx に組み込み、どのページでも通知できる
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";

const AUTO_CLOSE_MS = 8000; // 8秒で自動非表示

export default function LocalStorageDisclosure() {
  const { ownerCleared } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ownerCleared) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [ownerCleared]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/30 px-5 py-2.5"
    >
      <div className="mx-auto max-w-5xl flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex-1 leading-relaxed">
          <strong>新しいアカウントでログインしました。</strong>
          {" / "}
          端末に残っていた前回の学習進捗は、安全のためリセットされました。
          同じアカウントで別端末からログインしても進捗は同期されません（端末ごとに別管理）。
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="閉じる"
          className="shrink-0 rounded px-2 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
