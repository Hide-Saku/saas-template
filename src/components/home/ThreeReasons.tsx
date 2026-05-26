"use client";

/**
 * ThreeReasons — 仕様書 §2【7】「選ばれる3つの理由」。
 * アイコン + タイトル + 1文（横3列）。
 */

type Reason = {
  icon: string;
  title: string;
  desc: string;
};

const REASONS: Reason[] = [
  {
    icon: "🔊",
    title: "全問音声付き",
    desc: "問題・選択肢・解説を高品質ニューラル音声で再生。耳から学べる{{CERT_NAME}}対策はここだけ。",
  },
  {
    icon: "📝",
    title: "誤答も解説",
    desc: "正解の根拠だけでなく、間違った選択肢にも触れる詳細解説。理解の取りこぼしを防ぐ。",
  },
  {
    icon: "🎯",
    title: "{{SYLLABUS_VERSION}}完全対応",
    desc: "{{CERT_NAME}} {{SYLLABUS_VERSION}} シラバスに準拠。最新出題傾向に沿った全{{QUESTION_COUNT}}問。",
  },
];

export default function ThreeReasons() {
  return (
    <section className="py-10">
      <h2 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100">
        選ばれる3つの理由
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
        {REASONS.map((r) => (
          <div key={r.title} className="text-center px-2">
            <div className="text-3xl mb-2" aria-hidden>
              {r.icon}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {r.title}
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {r.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
