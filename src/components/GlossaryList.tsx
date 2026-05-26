"use client";

/**
 * 用語集の一覧クライアント（G検定研究室パターン移植）。
 * - ABC順 / 五十音順 の切替
 * - 章フィルタ・検索
 * - 用語クリックで定義をインライン展開
 * - 展開時に音声再生ボタン（glossary 音声があれば）
 *
 * 注: 本テンプレの GlossaryTerm は importance フィールドを持たないため、
 *     G検定の「★ 重要 / 周辺用語」フィルタは省略。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GlossaryTerm, DomainId } from "@/lib/content";
import { DOMAIN_LABEL } from "@/lib/content";
import { chapterNumber, DOMAIN_ORDER } from "@/lib/domain";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import {
  glossaryTermUrl,
  glossaryDefUrl,
  loadSpeed,
} from "@/lib/audio";

type Props = { terms: GlossaryTerm[] };

type SortKey = "alphabet" | "kana";
const ALL = "__all__";

export default function GlossaryList({ terms }: Props) {
  const params = useSearchParams();
  const focusId = params.get("focus");

  const [sortKey, setSortKey] = useState<SortKey>("alphabet");
  const [chapterFilter, setChapterFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const audio = useAudioQueue();

  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
    setChapterFilter(ALL);
    setQuery("");
    const t = setTimeout(() => {
      itemRefs.current[focusId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
    return () => clearTimeout(t);
  }, [focusId]);

  const visible = useMemo(() => {
    let arr = terms;
    if (chapterFilter !== ALL) {
      arr = arr.filter((t) => t.domainIds.includes(chapterFilter as DomainId));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.reading.includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return sortTerms(arr, sortKey);
  }, [terms, chapterFilter, query, sortKey]);

  const groups = useMemo(() => groupByHead(visible, sortKey), [visible, sortKey]);

  return (
    <div>
      {/* 用語クイズで力試し バナー */}
      <a
        href="/glossary/quiz/"
        className="mb-5 flex items-center gap-4 rounded-2xl border border-teal-300 dark:border-teal-700 bg-teal-50/70 dark:bg-teal-900/20 p-5 shadow-sm transition hover:shadow-md hover:border-teal-400"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-200 dark:bg-teal-800/60 text-xl">
          📝
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-teal-900 dark:text-teal-100">
            用語クイズで力試し
          </div>
          <div className="mt-0.5 text-xs text-teal-700 dark:text-teal-300">
            用語名から定義を当てる4択クイズ。覚えた / 覚えていないをサクッと確認できます。
          </div>
        </div>
        <span className="text-teal-600 dark:text-teal-400 text-lg">→</span>
      </a>

      {/* 操作バー */}
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="用語を検索（例: 過学習、GDPR）"
          aria-label="用語を検索"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="並び順"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="alphabet">ABC順</option>
            <option value="kana">五十音順</option>
          </select>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            aria-label="章で絞り込み"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={ALL}>全ての章</option>
            {DOMAIN_ORDER.map((d, i) => (
              <option key={d} value={d}>
                第{i + 1}章 {DOMAIN_LABEL[d]}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
            {visible.length} 語
          </span>
        </div>
      </div>

      {/* リスト */}
      {groups.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          該当する用語がありません
        </p>
      ) : (
        groups.map(({ head, items }) => (
          <section key={head} className="mb-6">
            <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {head}
            </h2>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((t) => {
                const expanded = expandedId === t.id;
                const isFocused = focusId === t.id;
                const primaryDomain = t.domainIds[0];
                const chNum = primaryDomain ? chapterNumber(primaryDomain) : 0;
                return (
                  <li
                    key={t.id}
                    ref={(el) => {
                      itemRefs.current[t.id] = el;
                    }}
                    className={
                      isFocused
                        ? "rounded-md ring-2 ring-teal-300 dark:ring-teal-600"
                        : ""
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : t.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 py-3 text-left"
                    >
                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {t.term}
                          </span>
                          {primaryDomain && chNum > 0 && (
                            <span className="rounded-sm bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              第{chNum}章 {DOMAIN_LABEL[primaryDomain]}
                            </span>
                          )}
                        </span>
                        {t.reading && t.reading !== t.term && (
                          <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
                            {t.reading}
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-xs text-slate-400 transition-transform dark:text-slate-500 ${
                          expanded ? "rotate-90" : ""
                        }`}
                        aria-hidden
                      >
                        ▶
                      </span>
                    </button>
                    {expanded && (
                      <div className="pb-4 pl-1 pr-2">
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                          {t.description}
                        </p>
                        {t.tags && t.tags.length > 0 && (
                          <p className="mt-2 flex flex-wrap gap-1 text-[10px]">
                            {t.tags.slice(0, 6).map((tag, i) => (
                              <span
                                key={i}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            audio.playing
                              ? audio.stop()
                              : audio.play(
                                  [glossaryTermUrl(t.id), glossaryDefUrl(t.id)],
                                  loadSpeed(),
                                )
                          }
                          className="mt-3 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
                        >
                          {audio.playing ? "■ 停止" : "▶ 用語を音声で聞く"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function sortTerms(terms: GlossaryTerm[], sortKey: SortKey): GlossaryTerm[] {
  const arr = [...terms];
  if (sortKey === "kana") {
    arr.sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
  } else {
    arr.sort((a, b) => a.term.localeCompare(b.term, "en", { numeric: true }));
  }
  return arr;
}

function groupByHead(
  terms: GlossaryTerm[],
  sortKey: SortKey,
): { head: string; items: GlossaryTerm[] }[] {
  const map = new Map<string, GlossaryTerm[]>();
  for (const t of terms) {
    const firstChar = t.term.charAt(0).toUpperCase();
    const isLatin = firstChar >= "A" && firstChar <= "Z";
    const head =
      sortKey === "kana"
        ? kanaHead(t.reading)
        : isLatin
          ? firstChar
          : kanaHead(t.reading);
    const arr = map.get(head) ?? [];
    arr.push(t);
    map.set(head, arr);
  }
  return Array.from(map.entries()).map(([head, items]) => ({ head, items }));
}

function kanaHead(reading: string): string {
  const ch = reading.charAt(0);
  const rows: [string, string][] = [
    ["あいうえお", "あ行"],
    ["かきくけこがぎぐげご", "か行"],
    ["さしすせそざじずぜぞ", "さ行"],
    ["たちつてとだぢづでど", "た行"],
    ["なにぬねの", "な行"],
    ["はひふへほばびぶべぼぱぴぷぺぽ", "は行"],
    ["まみむめも", "ま行"],
    ["やゆよ", "や行"],
    ["らりるれろ", "ら行"],
    ["わをん", "わ行"],
  ];
  for (const [chars, label] of rows) {
    if (chars.includes(ch)) return label;
  }
  return "その他";
}
