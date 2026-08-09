"use client";

import { useEffect, useState } from "react";

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

let currentAudioInstance = null;

function stopCurrentAudio() {
  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance.currentTime = 0;
    currentAudioInstance = null;
  }
}

function playCompletionSound(soundName, customSoundUrl) {
  if (typeof window === "undefined" || soundName === "none") return;

  stopCurrentAudio();

  if (soundName === "custom" && customSoundUrl) {
    const audio = new Audio(customSoundUrl);
    currentAudioInstance = audio;
    audio.play().catch(() => undefined);
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gainNode = context.createGain();
  const oscillator = context.createOscillator();
  gainNode.gain.setValueAtTime(0.06, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);

  if (soundName === "bell") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.18);
  } else if (soundName === "sparkle") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1110, context.currentTime + 0.12);
    oscillator.frequency.exponentialRampToValueAtTime(1480, context.currentTime + 0.24);
  } else {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.16);
  }

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.45);
  context.close();
}

export default function PomodoroTimer({ quests = [], onFocusComplete }) {
  const [mode, setMode] = useState("focus");
  const [focusDuration, setFocusDuration] = useState(DEFAULT_FOCUS_MINUTES);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_MINUTES);
  const [focusInput, setFocusInput] = useState(String(DEFAULT_FOCUS_MINUTES));
  const [breakInput, setBreakInput] = useState(String(DEFAULT_BREAK_MINUTES));
  const [selectedSound, setSelectedSound] = useState("chime");
  const [customSoundUrl, setCustomSoundUrl] = useState("");
  const [customSoundName, setCustomSoundName] = useState("");
  const [customSoundUrlInput, setCustomSoundUrlInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Set a focus and break length, then begin your first sprint.");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [showFocusXpPop, setShowFocusXpPop] = useState(false);

  const duration = mode === "focus" ? focusDuration * 60 : breakDuration * 60;

  useEffect(() => {
    if (!isRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;

        setIsRunning(false);
        if (mode === "focus") {
          setCompletedSessions((count) => count + 1);
          setMode("break");
          playCompletionSound(selectedSound, customSoundUrl);
          setStatusMessage("Focus sprint complete! +25 XP earned. Take your recovery break.");
          if (onFocusComplete) {
            onFocusComplete(focusDuration);
          }
          setShowFocusXpPop(true);
          window.setTimeout(() => setShowFocusXpPop(false), 2500);
          return breakDuration * 60;
        }

        playCompletionSound(selectedSound, customSoundUrl);
        setMode("focus");
        setStatusMessage("Break complete. Start the next study sprint.");
        return focusDuration * 60;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [breakDuration, focusDuration, isRunning, mode, onFocusComplete, selectedSound, customSoundUrl]);

  function changeMode(nextMode) {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(nextMode === "focus" ? focusDuration * 60 : breakDuration * 60);
    setStatusMessage(nextMode === "focus" ? "Focus mode is ready. Start whenever you are." : "Break mode is ready. Recharge before the next sprint.");
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(duration);
    setStatusMessage(mode === "focus" ? "Timer reset. Ready for another focus sprint." : "Timer reset. Enjoy your break.");
  }

  function applyCustomDuration(event) {
    event.preventDefault();
    const nextFocus = Number.parseInt(focusInput, 10);
    const nextBreak = Number.parseInt(breakInput, 10);

    if ([nextFocus, nextBreak].some((value) => Number.isNaN(value) || value < 1 || value > 180)) {
      setStatusMessage("Choose values between 1 and 180 minutes.");
      return;
    }

    setFocusDuration(nextFocus);
    setBreakDuration(nextBreak);
    setSecondsLeft(mode === "focus" ? nextFocus * 60 : nextBreak * 60);
    setStatusMessage(`Custom timer saved: ${nextFocus} min focus, ${nextBreak} min break.`);
  }

  function restoreDefaults() {
    setFocusDuration(DEFAULT_FOCUS_MINUTES);
    setBreakDuration(DEFAULT_BREAK_MINUTES);
    setFocusInput(String(DEFAULT_FOCUS_MINUTES));
    setBreakInput(String(DEFAULT_BREAK_MINUTES));
    setSecondsLeft(mode === "focus" ? DEFAULT_FOCUS_MINUTES * 60 : DEFAULT_BREAK_MINUTES * 60);
    setStatusMessage("Classic Pomodoro restored: 25 minutes focus, 5 minutes break.");
  }

  function handleCustomFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const dataUrl = fileReader.result;
      if (typeof dataUrl === "string") {
        setCustomSoundUrl(dataUrl);
        setCustomSoundName(file.name);
        setSelectedSound("custom");
        setStatusMessage(`Custom sound ready: ${file.name}`);
      }
    };
    fileReader.readAsDataURL(file);
  }

  function applyCustomUrl() {
    if (!customSoundUrlInput.trim()) {
      setStatusMessage("Paste an audio URL first.");
      return;
    }

    setCustomSoundUrl(customSoundUrlInput.trim());
    setCustomSoundName(customSoundUrlInput.trim());
    setSelectedSound("custom");
    setStatusMessage("Custom sound URL saved. It will play when a session ends.");
  }

  function clearCustomSound() {
    setCustomSoundUrl("");
    setCustomSoundName("");
    setCustomSoundUrlInput("");
    setSelectedSound("chime");
    setStatusMessage("Custom sound cleared. The built-in chime is back.");
  }

  function handleStopSound() {
    stopCurrentAudio();
    setStatusMessage("Audio stopped.");
  }

  return (
    <section id="pomodoro-timer" className="mt-8 rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-[color:var(--accent-info)]">FOCUS ARENA</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[color:var(--foreground)]">Pomodoro timer</h2>
        </div>
        <span className="rounded-full bg-[color:var(--bg)] px-3 py-1 font-mono text-xs text-[color:var(--foreground)]">{completedSessions} focus rounds</span>
      </div>

      <form onSubmit={applyCustomDuration} className="mt-6 rounded-xl border border-[color:var(--surface)] bg-[color:var(--bg)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm text-[color:var(--foreground)]">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Focus minutes</span>
            <input type="number" min="1" max="180" value={focusInput} onChange={(event) => setFocusInput(event.target.value)} className="w-full rounded-lg border border-[color:var(--surface)] bg-[color:var(--surface)] px-3 py-2 text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent-info)]" />
          </label>
          <label className="flex-1 text-sm text-[color:var(--foreground)]">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Break minutes</span>
            <input type="number" min="1" max="180" value={breakInput} onChange={(event) => setBreakInput(event.target.value)} className="w-full rounded-lg border border-[color:var(--surface)] bg-[color:var(--surface)] px-3 py-2 text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent-secondary)]" />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className="rounded-lg bg-[color:var(--accent-info)] px-3 py-2 text-sm font-bold text-[color:var(--bg)]">Apply custom timer</button>
          <button type="button" onClick={restoreDefaults} className="rounded-lg border border-[color:var(--surface)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">Use classic 25/5</button>
        </div>

        <label className="mt-3 flex flex-col gap-2 text-sm text-[color:var(--foreground)]">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Completion sound</span>
          <select value={selectedSound} onChange={(event) => setSelectedSound(event.target.value)} className="w-full rounded-lg border border-[color:var(--surface)] bg-[color:var(--surface)] px-3 py-2 text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent-info)]">
            <option value="chime">Chime</option>
            <option value="bell">Bell</option>
            <option value="sparkle">Sparkle</option>
            {customSoundUrl ? <option value="custom">Custom sound</option> : null}
            <option value="none">No sound</option>
          </select>
        </label>

        <div className="mt-3 space-y-3 rounded-lg border border-[color:var(--surface)] bg-[color:var(--surface)] p-3">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--foreground)]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Upload your own audio</span>
            <input type="file" accept="audio/*" onChange={handleCustomFileUpload} className="text-sm text-[color:var(--foreground)]/80 file:mr-3 file:rounded file:border-0 file:bg-[color:var(--accent-info)] file:px-3 file:py-2 file:font-bold file:text-[color:var(--bg)]" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-[color:var(--foreground)]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Or use an audio URL</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="url" value={customSoundUrlInput} onChange={(event) => setCustomSoundUrlInput(event.target.value)} placeholder="https://example.com/alert.mp3" className="min-w-0 flex-1 rounded-lg border border-[color:var(--surface)] bg-[color:var(--bg)] px-3 py-2 text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent-info)]" />
              <button type="button" onClick={applyCustomUrl} className="rounded-lg border border-[color:var(--surface)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">Use URL</button>
            </div>
          </label>

          {customSoundName ? <p className="text-sm text-[color:var(--foreground)]">Loaded: {customSoundName}</p> : <p className="text-sm text-[color:var(--foreground)]/70">No custom sound selected yet.</p>}

          <div className="flex flex-wrap gap-2">
            {customSoundUrl ? <button type="button" onClick={clearCustomSound} className="text-sm font-bold text-[color:var(--accent-alert)]">Clear custom sound</button> : null}
            <button type="button" onClick={handleStopSound} className="rounded-lg border border-[color:var(--surface)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">Stop current sound</button>
          </div>
        </div>

        <p className="mt-3 text-sm text-[color:var(--foreground)]">{statusMessage}</p>
      </form>

      <label className="mt-6 flex flex-col gap-2 text-sm text-[color:var(--foreground)]">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Check in to a quest</span>
        <select value={selectedQuestId} onChange={(event) => setSelectedQuestId(event.target.value)} className="w-full rounded-lg border border-[color:var(--surface)] bg-[color:var(--bg)] px-3 py-2 text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent-info)]">
          <option value="">No quest selected</option>
          {(quests || []).map((quest) => (
            <option key={quest.id} value={quest.id}>
              {quest.title}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-6 flex gap-2 rounded-lg bg-[color:var(--bg)] p-1">
        <button onClick={() => changeMode("focus")} className={`flex-1 rounded-md px-3 py-2 font-display text-xs font-bold tracking-wide ${mode === "focus" ? "bg-[color:var(--accent-primary)] text-[color:var(--bg)]" : "text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"}`}>FOCUS · {focusDuration} MIN</button>
        <button onClick={() => changeMode("break")} className={`flex-1 rounded-md px-3 py-2 font-display text-xs font-bold tracking-wide ${mode === "break" ? "bg-[color:var(--accent-secondary)] text-[color:var(--foreground)]" : "text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"}`}>BREAK · {breakDuration} MIN</button>
      </div>

      <div className={`relative mt-6 rounded-xl border border-[color:var(--surface)] bg-[color:var(--bg)] py-10 text-center ${isRunning ? "animate-pulse-cyan" : ""}`}>
        <p className={`font-display text-sm font-bold tracking-[0.25em] ${mode === "focus" ? "text-[color:var(--accent-primary)]" : "text-[color:var(--accent-secondary)]"}`}>{mode === "focus" ? "FOCUS SESSION" : "RECOVERY BREAK"}</p>
        <p className="mt-4 font-mono text-6xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-7xl">{formatTime(secondsLeft)}</p>
        {showFocusXpPop ? (
          <span className="animate-float-xp absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-lg font-black text-[color:var(--accent-primary)]">
            +25 XP Focus Bonus!
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={() => setIsRunning((running) => !running)} className="flex-1 rounded-lg bg-[color:var(--accent-info)] px-4 py-3 font-display text-sm font-bold text-[color:var(--bg)] transition hover:shadow-focus-cyan">{isRunning ? "Pause" : "Start"}</button>
        <button onClick={resetTimer} className="rounded-lg border border-[color:var(--surface)] px-4 py-3 font-display text-sm font-bold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-info)]">Reset</button>
      </div>

      <div className="mt-6 rounded-xl border border-[color:var(--surface)] bg-[color:var(--bg)] p-4 text-sm text-[color:var(--foreground)]">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/70">Pomodoro flow</p>
        <ol className="mt-3 space-y-2">
          <li>1. Pick a single study task and set your focus timer.</li>
          <li>2. Work with full attention until the timer ends.</li>
          <li>3. Take a short break, then repeat for a few rounds.</li>
          <li>4. After several rounds, take a longer break and reset your energy.</li>
        </ol>
      </div>
    </section>
  );
}
