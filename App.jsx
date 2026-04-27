import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const QUESTS = [
  { id: "water", title: "Вода после сна", stat: "BODY", xp: 3, icon: "💧" },
  { id: "bed", title: "Заправил кровать", stat: "MIND", xp: 2, icon: "🛏️" },
  { id: "phone", title: "Без телефона 30 мин", stat: "MIND", xp: 10, icon: "📵" },
  { id: "work", title: "1 важная рабочая задача", stat: "MONEY", xp: 20, icon: "💼" },
  { id: "focus", title: "2 часа фокуса", stat: "MONEY", xp: 20, icon: "⚡" },
  { id: "steps", title: "8к шагов", stat: "BODY", xp: 15, icon: "🚶" },
  { id: "food", title: "Норм питание", stat: "BODY", xp: 15, icon: "🥗" },
  { id: "plan", title: "План на завтра", stat: "STATUS", xp: 5, icon: "👑" },
  { id: "sleep", title: "Сон до 00:00", stat: "MIND", xp: 20, icon: "🌙" },
];

const BOSSES = [
  { id: "doomscroll", title: "Телефон 2ч+", penalty: 20 },
  { id: "binge", title: "Срыв в еду", penalty: 20 },
  { id: "zero", title: "День без движения", penalty: 15 },
  { id: "selfhate", title: "Самобичевание", penalty: 10 },
];

const LEVELS = [
  { name: "Civilian", xp: 0 },
  { name: "Stable Man", xp: 150 },
  { name: "Operator", xp: 400 },
  { name: "Beast Mode", xp: 700 },
  { name: "Elite", xp: 1200 },
  { name: "Founder Mode", xp: 2000 },
];

const STAT_MAX = { BODY: 35, MONEY: 40, MIND: 40, STATUS: 15 };

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function clamp(value, min = 0, max = 1) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return min;
  return Math.max(min, Math.min(max, numericValue));
}

function getLevel(totalXp) {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  let current = LEVELS[0];
  let next = null;

  for (let index = 0; index < LEVELS.length; index += 1) {
    if (safeXp >= LEVELS[index].xp) {
      current = LEVELS[index];
      next = LEVELS[index + 1] || null;
    }
  }

  const progress = next ? (safeXp - current.xp) / (next.xp - current.xp) : 1;
  return { current, next, progress: clamp(progress) };
}

function Card({ children, className = "" }) {
  return <div className={cx("rounded-3xl border border-white/10 bg-white/10 shadow-xl", className)}>{children}</div>;
}

function Metric({ title, value, accent }) {
  return (
    <Card>
      <div className="p-3 text-center">
        <p className="text-xs text-slate-400">{title}</p>
        <p className={cx("mt-1 text-xl font-black", accent)}>{value}</p>
      </div>
    </Card>
  );
}

function StatBar({ name, value, max }) {
  const pct = clamp(max > 0 ? value / max : 0);

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-xs">
        <span className="font-bold text-slate-300">{name}</span>
        <span className="text-slate-400">{value} XP</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-300 to-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.45 }}
        />
      </div>
    </div>
  );
}

export default function LifeRPGApp() {
  const [done, setDone] = useState({});
  const [bosses, setBosses] = useState({});
  const [savedXp, setSavedXp] = useState(280);
  const [streak, setStreak] = useState(4);

  const dayXp = useMemo(() => {
    const gained = QUESTS.reduce((sum, quest) => sum + (done[quest.id] ? quest.xp : 0), 0);
    const lost = BOSSES.reduce((sum, boss) => sum + (bosses[boss.id] ? boss.penalty : 0), 0);
    return Math.max(0, gained - lost);
  }, [done, bosses]);

  const completed = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const activeBossCount = useMemo(() => Object.values(bosses).filter(Boolean).length, [bosses]);
  const totalXp = savedXp + dayXp;
  const level = getLevel(totalXp);
  const dayScore = Math.min(100, Math.round((dayXp / 90) * 100));
  const winDay = dayScore >= 70;

  const statXp = useMemo(() => {
    const base = { BODY: 0, MONEY: 0, MIND: 0, STATUS: 0 };
    QUESTS.forEach((quest) => {
      if (done[quest.id] && Object.prototype.hasOwnProperty.call(base, quest.stat)) {
        base[quest.stat] += quest.xp;
      }
    });
    return base;
  }, [done]);

  const badges = useMemo(
    () => [
      { label: "No Zero Day", active: completed >= 3, icon: "🔥" },
      { label: "Quest Crusher", active: completed >= 6, icon: "🏆" },
      { label: "Clean Mind", active: !bosses.doomscroll && Boolean(done.phone), icon: "🧠" },
      { label: "Boss Slayer", active: activeBossCount === 0 && completed >= 5, icon: "💀" },
    ],
    [activeBossCount, bosses.doomscroll, completed, done.phone]
  );

  const resetDay = () => {
    setDone({});
    setBosses({});
  };

  const saveDay = () => {
    setSavedXp((currentXp) => currentXp + dayXp);
    setStreak((currentStreak) => (winDay ? currentStreak + 1 : 0));
    resetDay();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 font-sans text-white">
      <div className="mx-auto max-w-md space-y-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-200">Life RPG</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight">Builder Mode</h1>
                  <p className="mt-1 text-sm text-slate-300">День как квест. Прогресс как игра.</p>
                </div>
                <div className="rounded-2xl bg-cyan-400/20 px-3 py-2 text-right">
                  <p className="text-xs text-cyan-100">Streak</p>
                  <p className="text-xl font-black">🔥 {streak}</p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-black/30 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Level</p>
                    <p className="text-2xl font-black">{level.current.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Total XP</p>
                    <p className="text-2xl font-black text-cyan-200">{totalXp}</p>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${level.progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="mt-2 flex justify-between gap-4 text-xs text-slate-400">
                  <span>{level.current.xp} XP</span>
                  <span>{level.next ? `${level.next.xp} XP до ${level.next.name}` : "MAX LEVEL"}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <Metric title="Day XP" value={`+${dayXp}`} accent="text-emerald-200" />
          <Metric title="Score" value={`${dayScore}%`} accent={winDay ? "text-emerald-200" : "text-yellow-200"} />
          <Metric title="Quests" value={`${completed}/${QUESTS.length}`} accent="text-cyan-200" />
        </div>

        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Daily Quests</h2>
                <p className="text-xs text-slate-400">Отмечай выполненное и фарми XP</p>
              </div>
              <button type="button" onClick={resetDay} className="rounded-2xl p-3 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Reset day">
                ↺
              </button>
            </div>

            <div className="space-y-2">
              {QUESTS.map((quest) => {
                const active = Boolean(done[quest.id]);
                return (
                  <button
                    type="button"
                    key={quest.id}
                    onClick={() => setDone((current) => ({ ...current, [quest.id]: !current[quest.id] }))}
                    className={cx("flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", active ? "border-emerald-300/30 bg-emerald-400/20" : "border-white/10 bg-black/20 hover:bg-white/10")}
                  >
                    <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl", active ? "bg-emerald-300/20" : "bg-white/10")}>
                      {active ? "✅" : quest.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-tight">{quest.title}</span>
                      <span className="block text-xs text-slate-400">{quest.stat}</span>
                    </span>
                    <span className="shrink-0 text-right font-black text-cyan-200">+{quest.xp}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="bg-red-500/10">
          <div className="p-4">
            <h2 className="text-lg font-black">Bosses</h2>
            <p className="mb-3 text-xs text-slate-400">Отметь, если враг сегодня тебя пробил</p>
            <div className="grid grid-cols-2 gap-2">
              {BOSSES.map((boss) => {
                const active = Boolean(bosses[boss.id]);
                return (
                  <button
                    type="button"
                    key={boss.id}
                    onClick={() => setBosses((current) => ({ ...current, [boss.id]: !current[boss.id] }))}
                    className={cx("rounded-2xl border p-3 text-left transition", active ? "border-red-300/40 bg-red-400/20" : "border-white/10 bg-black/20 hover:bg-white/10")}
                  >
                    <span className="block text-sm font-bold">{boss.title}</span>
                    <span className="block text-xs text-red-100">-{boss.penalty} XP</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="mb-3 text-lg font-black">Stats</h2>
            <div className="space-y-3">
              <StatBar name="BODY" value={statXp.BODY} max={STAT_MAX.BODY} />
              <StatBar name="MONEY" value={statXp.MONEY} max={STAT_MAX.MONEY} />
              <StatBar name="MIND" value={statXp.MIND} max={STAT_MAX.MIND} />
              <StatBar name="STATUS" value={statXp.STATUS} max={STAT_MAX.STATUS} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="mb-3 text-lg font-black">Achievements</h2>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((badge) => (
                <div key={badge.label} className={cx("rounded-2xl border p-3 transition", badge.active ? "border-yellow-200/30 bg-yellow-300/20" : "border-white/10 bg-black/20 opacity-50")}>
                  <div className="mb-2 text-xl">{badge.icon}</div>
                  <p className="text-sm font-bold">{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <button type="button" onClick={saveDay} className="h-14 w-full rounded-3xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/10 transition active:scale-[0.98]">
          Завершить день · Save XP
        </button>
      </div>
    </main>
  );
}
