import React, { useEffect, useState, useRef } from "react";

const STORAGE_KEY = "timerTemplates";
const DEFAULT_TEMPLATES = [45, 30];

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

function loadTemplates(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading templates", e);
  }
  return [...DEFAULT_TEMPLATES];
}

function saveTemplates(templates: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Error saving templates", e);
  }
}

const FortyFiveSecondTimer: React.FC = () => {
  const [templates, setTemplates] = useState<number[]>(loadTemplates);
  const [duration, setDuration] = useState<number>(templates[0] || 45);
  const [customValue, setCustomValue] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(duration);
  const [running, setRunning] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setSecondsLeft((prev) => (prev === duration ? prev : duration));

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playBeep();
          return duration;
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
  }, [running, duration]);

  useEffect(() => {
    setSecondsLeft(duration);
  }, [duration]);

  const handleStart = () => {
    setSecondsLeft(duration);
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

  const handleTemplateSelect = (value: number) => {
    setDuration(value);
    setShowCustomInput(false);
    setCustomValue("");
  };

  const handleCustomSubmit = () => {
    const numValue = parseInt(customValue, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 3600) {
      setDuration(numValue);
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const handleAddTemplate = () => {
    const numValue = parseInt(customValue, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 3600 && !templates.includes(numValue)) {
      const newTemplates = [...templates, numValue].sort((a, b) => a - b);
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
      setCustomValue("");
    }
  };

  const handleEditTemplate = (index: number) => {
    setEditingTemplate(index);
    setEditValue(templates[index].toString());
  };

  const handleSaveEdit = () => {
    if (editingTemplate !== null) {
      const numValue = parseInt(editValue, 10);
      if (!isNaN(numValue) && numValue > 0 && numValue <= 3600) {
        const newTemplates = [...templates];
        newTemplates[editingTemplate] = numValue;
        newTemplates.sort((a, b) => a - b);
        setTemplates(newTemplates);
        saveTemplates(newTemplates);
        if (duration === templates[editingTemplate]) {
          setDuration(numValue);
        }
        setEditingTemplate(null);
        setEditValue("");
      }
    }
  };

  const handleDeleteTemplate = (index: number) => {
    if (templates.length > 1) {
      const newTemplates = templates.filter((_, i) => i !== index);
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
      if (duration === templates[index] && newTemplates.length > 0) {
        setDuration(newTemplates[0]);
      }
    }
  };

  const progress = (1 - secondsLeft / duration) * 100;

  return (
    <div className="h-full flex items-center justify-center bg-slate-900 text-slate-50 p-4">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-800 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-semibold mb-4 text-center">Таймер интервалов</h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Таймер отсчитывает интервалы и издаёт короткий звук в конце каждого интервала.
        </p>

        {/* Выбор интервала */}
        <div className="mb-6">
          <div className="text-sm text-slate-300 mb-3">Выберите интервал:</div>
          
          {/* Шаблоны */}
          <div className="flex flex-wrap gap-2 mb-3">
            {templates.map((template, index) => (
              <div key={index} className="flex items-center gap-1">
                {editingTemplate === index ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="3600"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") {
                          setEditingTemplate(null);
                          setEditValue("");
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm rounded bg-slate-700 border border-slate-600 text-slate-50 focus:outline-none focus:border-sky-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs rounded bg-sky-500 hover:bg-sky-600 text-white"
                      title="Сохранить"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        setEditValue("");
                      }}
                      className="px-2 py-1 text-xs rounded bg-slate-600 hover:bg-slate-500 text-white"
                      title="Отмена"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                        duration === template
                          ? "bg-sky-500 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                      }`}
                    >
                      {template}с
                    </button>
                    <button
                      onClick={() => handleEditTemplate(index)}
                      className="px-1.5 py-1 text-xs rounded bg-slate-600 hover:bg-slate-500 text-slate-300"
                      title="Редактировать"
                    >
                      ✎
                    </button>
                    {templates.length > 1 && (
                      <button
                        onClick={() => handleDeleteTemplate(index)}
                        className="px-1.5 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white"
                        title="Удалить"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Произвольное значение */}
          {showCustomInput ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="3600"
                  placeholder="Секунды"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomSubmit();
                    if (e.key === "Escape") {
                      setShowCustomInput(false);
                      setCustomValue("");
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded bg-slate-700 border border-slate-600 text-slate-50 focus:outline-none focus:border-sky-400"
                  autoFocus
                />
                <button
                  onClick={handleCustomSubmit}
                  className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium"
                  title="Использовать"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomValue("");
                  }}
                  className="px-3 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
                  title="Отмена"
                >
                  ✕
                </button>
              </div>
              {customValue && !isNaN(parseInt(customValue, 10)) && parseInt(customValue, 10) > 0 && !templates.includes(parseInt(customValue, 10)) && (
                <button
                  onClick={handleAddTemplate}
                  className="w-full px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition"
                >
                  + Добавить в шаблоны
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition"
            >
              + Произвольное значение
            </button>
          )}
        </div>

        {/* Таймер */}
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

