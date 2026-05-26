"use client";

type Props = {
  enabled: boolean;
  onToggle: () => void;
};

export function AudioToggle({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={enabled ? "音声モードをOFFにする" : "音声モードをONにする"}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        enabled
          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <span aria-hidden="true">{enabled ? "🔊" : "🔇"}</span>
      {enabled ? "音声ON" : "音声OFF"}
    </button>
  );
}
