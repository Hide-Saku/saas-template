"use client";

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

type Props = {
  speed: number;
  onChangeSpeed: (speed: number) => void;
};

export function AudioSpeedSelector({ speed, onChangeSpeed }: Props) {
  function cycle() {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onChangeSpeed(next);
  }
  const label = speed === 1.0 ? "1x" : `${speed}x`;
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`再生速度: ${label}`}
      className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-teal-50 px-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50"
    >
      {label}
    </button>
  );
}
