import React, { useEffect, useState, useRef } from "react";

// 45-second timer app with a short beep at the end of each interval
// To use: render <FortyFiveSecondTimer /> in your React app.
const DURATION_SECONDS = 45;

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("AudioContext error", e);
  }
}

const FortyFiveSecondTimer: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Ensure we start fresh from 45 when turning on
    setSecondsLeft((prev) => (prev === DURATION_SECONDS ? prev : DURATION_SECONDS));

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playBeep();
          return DURATION_SECONDS; // restart the 45-second period
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const handleStart = () => {
    setSecondsLeft(DURATION_SECONDS);
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
  };

  const handleToggle = () => {
    if (running) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const progress = (1 - secondsLeft / DURATION_SECONDS) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-800 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-semibold mb-4 text-center">45-секундный таймер</h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Таймер отсчитывает интервалы по 45 секунд и издаёт короткий звук в конце каждого интервала.
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-700 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-sky-400 fill-none"
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={(283 * (100 - progress)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-semibold tabular-nums">{secondsLeft}</div>
              <div className="text-xs text-slate-400">секунд</div>
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`px-6 py-2 rounded-full font-medium transition shadow-lg border 
              ${running
                ? "bg-red-500 hover:bg-red-600 border-red-400"
                : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400"}
            `}
          >
            {running ? "Стоп" : "Старт"}
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Обратите внимание: в некоторых браузерах звук может не проигрываться до первого взаимодействия с
          страницей (клик, нажатие кнопки).
        </p>
      </div>
    </div>
  );
};

export default FortyFiveSecondTimer;

