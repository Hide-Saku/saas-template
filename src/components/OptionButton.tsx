"use client";

type State = "idle" | "correct" | "wrong" | "missed";

type Props = {
  label: string;
  text: string;
  state: State;
  disabled: boolean;
  onClick: () => void;
};

const stateStyles: Record<State, string> = {
  idle: "border-slate-200 bg-white text-slate-800 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-teal-500 dark:hover:bg-slate-700",
  correct:
    "border-green-500 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950 dark:text-white",
  wrong:
    "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950 dark:text-white",
  missed:
    "border-green-400 bg-green-50 text-green-700 opacity-80 dark:border-green-600 dark:bg-green-950 dark:text-white",
};

const labelStyles: Record<State, string> = {
  idle: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  correct: "bg-green-500 text-white",
  wrong: "bg-amber-500 text-white",
  missed: "bg-green-400 text-white",
};

export function OptionButton({ label, text, state, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${stateStyles[state]} ${disabled && state === "idle" ? "cursor-not-allowed opacity-50 dark:opacity-65" : ""}`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${labelStyles[state]}`}
      >
        {label}
      </span>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
}
