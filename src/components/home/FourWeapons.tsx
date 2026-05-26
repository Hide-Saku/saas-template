"use client";

/**
 * FourWeapons — 学習に必要な4つの武器（2x2 グリッド）。
 * 仕様書 §2【4】 + §3「アイコン + タイトル + 1行説明 + 数値バッジ」。
 *
 * ④継続学習中ユーザー向けには <details> で折りたたみ可能にできるよう、
 * 親コンポーネント側で <details> でラップする運用とする。
 */

import Link from "next/link";
import { stats } from "@/lib/content";

type Weapon = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  badge: string;
  badgeSub?: string;
};

const WEAPONS: Weapon[] = [
  {
    href: "/quiz/",
    icon: "📝",
    title: "問題演習",
    desc: "章ごとに分かれた本格演習。全問に解説 + 音声つき。",
    badge: "全945問",
    badgeSub: "無料300問",
  },
  {
    href: "/exam/",
    icon: "🎯",
    title: "模試",
    desc: "本番と同じ100問・100分で実力チェック。",
    badge: "9回分",
    badgeSub: "無料3回",
  },
  {
    href: "/glossary/",
    icon: "📚",
    title: "用語集",
    desc: "AI・データサイエンスの重要用語を網羅。音声で聞ける。",
    badge: "全333語",
    badgeSub: "無料閲覧",
  },
  {
    href: "/listen/",
    icon: "🎧",
    title: "聞き流しモード",
    desc: "問題→解説を自動連続再生。通勤・運動中の耳学に。",
    badge: "1章 無料",
    badgeSub: "★全章 有料",
  },
];

export default function FourWeapons() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100">
        学習に必要な4つの武器
      </h2>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        問題演習・模試・用語集・聞き流し。すべて1つのサイトで。
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {WEAPONS.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition hover:border-teal-500 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {w.icon}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {w.title}
                </span>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {w.badge}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {w.desc}
            </p>
            {w.badgeSub && (
              <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                {w.badgeSub}
              </p>
            )}
          </Link>
        ))}
      </div>
      {/* stats を使って未使用 import 警告を避けつつ実数値も活用 */}
      <p className="sr-only">
        収録: {stats.totalQuestions}問 / 模試{stats.examCount}回 / 用語{stats.glossaryCount}語
      </p>
    </section>
  );
}
