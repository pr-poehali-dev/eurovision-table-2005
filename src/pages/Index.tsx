import { useState, useEffect, useCallback, useRef } from "react";

const ALL_PARTICIPANTS = [
  "Маша Сергеева", "Руслан Шлем", "Руслан Хмелинин", "Даня Шустов",
  "Дима Тарасов", "Юля Рунова", "Сергей Сумбаев", "Егор Коновалов ст",
  "Егор Коновалов мл", "Ярослав Ткачев", "Ярослав Удовиков", "Ваня Фальтенберг",
  "Тимофей Зелюченко", "Тимофей Павлов", "Егор Привалов", "Олег Линьков",
  "Миша Сумбаев", "Магомед Дутханов", "Антон Цепецавер", "Вова Молчанов",
  "Егор Ступак", "Саша Кондратьев", "Ваня Гринкевич", "Сергей Петрушин",
  "Артем Дорохов", "Максим Дунин", "Антон Викторович", "Влад Варанкин"
];

const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];
const ROW_H = 38;

type Phase = "setup" | "voting" | "twelve" | "twelve_then_results" | "results";
interface VoteEntry { voter: string; recipient: string; points: number; }
interface GameState {
  phase: Phase;
  participants: string[];
  voters: string[];
  scores: Record<string, number>;
  currentVoterIndex: number;
  currentVotes: Record<string, number>;
  pointStep: number;
  usedVoters: string[];
  twelveFrom: string;
  twelveTo: string;
  voteHistory: VoteEntry[];
}

const STORAGE_KEY = "esc2005_v4";

function getInitial(): GameState {
  return {
    phase: "setup", participants: [], voters: [], scores: {},
    currentVoterIndex: 0, currentVotes: {}, pointStep: 0,
    usedVoters: [], twelveFrom: "", twelveTo: "", voteHistory: [],
  };
}

function loadState(): GameState {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (p && Array.isArray(p.participants) && p.scores && typeof p.scores === "object") {
        return { ...getInitial(), ...p };
      }
    }
  } catch (_e) { /* ignore */ }
  return getInitial();
}

function saveState(s: GameState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function sorted(participants: string[], scores: Record<string, number>): string[] {
  const sc = scores || {};
  return [...(participants || [])].sort((a, b) => {
    const d = (sc[b] || 0) - (sc[a] || 0);
    return d !== 0 ? d : a.localeCompare(b, "ru");
  });
}

// ── SETUP ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (p: string[], v: string[]) => void }) {
  const [selP, setSelP] = useState<string[]>([...ALL_PARTICIPANTS]);
  const [selV, setSelV] = useState<string[]>([...ALL_PARTICIPANTS]);
  const tP = (n: string) => setSelP(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  const tV = (n: string) => setSelV(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <div className="setup-stars">★ ★ ★ ★ ★ ★ ★</div>
        <h1 className="setup-title">EUROVISION</h1>
        <div className="setup-year">SONG CONTEST 2005</div>
        <div className="setup-city">КИЕВ • УКРАИНА</div>
      </div>
      <div className="setup-cols">
        <div className="setup-col">
          <div className="setup-col-hdr">
            <span>🎤 УЧАСТНИКИ</span>
            <button className="setup-all-btn" onClick={() => setSelP(selP.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
              {selP.length === ALL_PARTICIPANTS.length ? "Снять все" : "Все"}
            </button>
          </div>
          <div className="setup-chips">
            {ALL_PARTICIPANTS.map(n => (
              <div key={n} className={`setup-chip ${selP.includes(n) ? "chip-p" : ""}`} onClick={() => tP(n)}>
                {selP.includes(n) ? "✓ " : ""}{n}
              </div>
            ))}
          </div>
        </div>
        <div className="setup-col">
          <div className="setup-col-hdr">
            <span>🗳️ ГОЛОСУЮЩИЕ</span>
            <button className="setup-all-btn" onClick={() => setSelV(selV.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
              {selV.length === ALL_PARTICIPANTS.length ? "Снять все" : "Все"}
            </button>
          </div>
          <p className="setup-hint">Могут голосовать и те, кто не участвует</p>
          <div className="setup-chips">
            {ALL_PARTICIPANTS.map(n => (
              <div key={n} className={`setup-chip ${selV.includes(n) ? "chip-v" : ""}`} onClick={() => tV(n)}>
                {selV.includes(n) ? "✓ " : ""}{n}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="setup-footer">
        <div className="setup-counts">
          <div className="setup-count"><b>{selP.length}</b><span>участников</span></div>
          <div className="setup-count"><b>{selV.length}</b><span>голосующих</span></div>
        </div>
        <button className="setup-start" disabled={selP.length < 2 || selV.length < 1} onClick={() => onStart(selP, selV)}>
          ★ НАЧАТЬ ГОЛОСОВАНИЕ ★
        </button>
      </div>
    </div>
  );
}

// ── 12 POINTS ──────────────────────────────────────────────────────────
function TwelveScreen({ from, to, onContinue }: { from: string; to: string; onContinue: () => void }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div className={`twelve-wrap ${vis ? "twelve-in" : ""}`}>
      <div className="twelve-bg">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="twelve-star" style={{
            left: `${(i * 17 + 5) % 100}%`,
            animationDelay: `${(i * 0.18) % 2.5}s`,
            animationDuration: `${1.8 + (i % 5) * 0.4}s`,
            fontSize: `${14 + (i % 4) * 9}px`,
          }}>★</div>
        ))}
      </div>
      <div className="twelve-body">
        <div className="twelve-jury">ЖЮРИ</div>
        <div className="twelve-from">{from}</div>
        <div className="twelve-gives">ПРИСУЖДАЕТ</div>
        <div className="twelve-badge">
          <span className="twelve-num">12</span>
          <span className="twelve-pts">БАЛЛОВ</span>
        </div>
        <div className="twelve-arrow">▼</div>
        <div className="twelve-to">{to}</div>
      </div>
      <button className="twelve-continue" onClick={onContinue}>ПРОДОЛЖИТЬ →</button>
    </div>
  );
}

// ── SCOREBOARD — точная копия скриншота ────────────────────────────────
// Строки абсолютно позиционированы, анимируются через transition:top
function Scoreboard({
  participants, scores, currentVotes, onPick, canPick, flashKey,
}: {
  participants: string[];
  scores: Record<string, number>;
  currentVotes: Record<string, number>;
  onPick: (name: string) => void;
  canPick: (name: string) => boolean;
  flashKey: number;
}) {
  const list = sorted(participants, scores);
  const half = Math.ceil(list.length / 2);
  const left = list.slice(0, half);
  const right = list.slice(half);
  const colH = half * ROW_H;

  const renderRow = (name: string, idx: number) => {
    const score = scores[name] || 0;
    const awarded = currentVotes[name] || 0;
    const clickable = canPick(name);
    const isBig = awarded >= 10;

    return (
      <div
        key={name}
        className={`sb-row ${clickable ? "sb-row-pick" : ""} ${awarded ? "sb-row-lit" : ""}`}
        style={{ top: idx * ROW_H, height: ROW_H }}
        onClick={() => clickable && onPick(name)}
      >
        {/* Флаг-кружок */}
        <div className="sb-flag" />
        {/* Имя */}
        <span className="sb-name">{name.toUpperCase()}</span>
        {/* Балл текущего голосующего */}
        {awarded > 0 && (
          <span
            key={`aw-${flashKey}-${name}`}
            className={`sb-awarded ${isBig ? "sb-awarded-big" : "sb-awarded-small"}`}
          >
            {awarded}
          </span>
        )}
        {/* Общий счёт */}
        <span
          key={awarded ? `sc-${flashKey}-${name}` : `sc-${name}`}
          className={`sb-score ${awarded ? "sb-score-flash" : ""}`}
        >
          {score > 0 ? score : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="sb-table">
      {/* Левая колонка */}
      <div className="sb-col" style={{ height: colH }}>
        {left.map((name, i) => renderRow(name, i))}
      </div>
      {/* Правая колонка */}
      <div className="sb-col" style={{ height: colH }}>
        {right.map((name, i) => renderRow(name, i))}
      </div>
    </div>
  );
}

// ── VOTING SCREEN ───────────────────────────────────────────────────────
function VotingScreen({ state, onAward, onFinish }: {
  state: GameState;
  onAward: (name: string) => void;
  onFinish: () => void;
}) {
  const voter = state.voters[state.currentVoterIndex];
  const curPts = VOTE_ORDER[state.pointStep];
  const done = state.pointStep >= VOTE_ORDER.length;
  const alreadyVoted = new Set(Object.keys(state.currentVotes));

  const [flashKey, setFlashKey] = useState(0);
  const prevStep = useRef(state.pointStep);
  useEffect(() => {
    if (state.pointStep !== prevStep.current) {
      prevStep.current = state.pointStep;
      setFlashKey(k => k + 1);
    }
  }, [state.pointStep]);

  const canPick = (name: string) =>
    !done && name !== voter && !alreadyVoted.has(name);

  return (
    <div className="esc-screen">
      {/* ФОН — зелёно-синие волны */}
      <div className="esc-bg" />

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ */}
      <div className="esc-main">
        {/* Таблица */}
        <Scoreboard
          participants={state.participants}
          scores={state.scores}
          currentVotes={state.currentVotes}
          onPick={onAward}
          canPick={canPick}
          flashKey={flashKey}
        />

        {/* Фото-кружок голосующего справа */}
        <div className="esc-photo-wrap">
          <div className="esc-photo">
            <span className="esc-photo-letter">{voter.charAt(0)}</span>
          </div>
        </div>
      </div>

      {/* НИЖНЯЯ ПОЛОСА */}
      <div className="esc-bottom">
        {/* Флаг + имя голосующего */}
        <div className="esc-voter-block">
          <div className="esc-voter-flag">
            <span className="esc-voter-flag-letter">{voter.charAt(0)}</span>
          </div>
          <span className="esc-voter-name">{voter.toUpperCase()}</span>
        </div>

        {/* Шарики 10 и 12 */}
        <div className="esc-bubbles">
          {VOTE_ORDER.slice(-5).map((pts, i) => {
            const idx = VOTE_ORDER.indexOf(pts);
            const given = state.pointStep > idx;
            const current = state.pointStep === idx && !done;
            const show = pts >= 8;
            if (!show) return null;
            return (
              <div
                key={pts}
                className={[
                  "esc-bubble",
                  given ? "bubble-done" : "",
                  current ? "bubble-now" : "",
                  pts === 12 ? "bubble-12" : "",
                ].filter(Boolean).join(" ")}
              >
                {pts}
              </div>
            );
          })}
        </div>
      </div>

      {/* Подсказка / кнопка */}
      <div className="esc-hint">
        {!done ? (
          <span>Нажмите на участника, чтобы дать <strong style={{ color: "#4cff6e" }}>{curPts}</strong> {curPts === 1 ? "балл" : curPts < 5 ? "балла" : "баллов"}</span>
        ) : (
          <button className="esc-next" onClick={onFinish}>СЛЕДУЮЩИЙ ГОЛОСУЮЩИЙ →</button>
        )}
      </div>
    </div>
  );
}

// ── RESULTS ─────────────────────────────────────────────────────────────
function ResultsScreen({ state, onReset }: { state: GameState; onReset: () => void }) {
  const list = sorted(state.participants, state.scores);
  const twelves: Record<string, number> = {};
  const tens: Record<string, number> = {};
  state.voteHistory.forEach(h => {
    if (h.points === 12) twelves[h.recipient] = (twelves[h.recipient] || 0) + 1;
    if (h.points === 10) tens[h.recipient] = (tens[h.recipient] || 0) + 1;
  });
  const medal = ["🥇", "🥈", "🥉"];

  return (
    <div className="results-wrap">
      <div className="results-header">
        <div className="results-stars">★ ★ ★ ★ ★ ★ ★</div>
        <h1 className="results-title">ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ</h1>
        <div className="results-sub">EUROVISION SONG CONTEST 2005</div>
      </div>
      <div className="results-podium">
        {[1, 0, 2].map(i => list[i] ? (
          <div key={i} className="podium-item">
            <div className="podium-name">{list[i]}</div>
            <div className="podium-score" style={{ color: ["#FFD700","#C0C0C0","#CD7F32"][i] }}>
              {state.scores[list[i]] || 0}
            </div>
            <div className="podium-block" style={{
              height: `${120 - i * 30}px`,
              background: `linear-gradient(180deg,${["#FFD700","#C0C0C0","#CD7F32"][i]}33,${["#FFD700","#C0C0C0","#CD7F32"][i]}88)`,
              borderTop: `3px solid ${["#FFD700","#C0C0C0","#CD7F32"][i]}`
            }}>
              <span style={{ color: ["#FFD700","#C0C0C0","#CD7F32"][i], fontFamily: "var(--fm)", fontSize: 28, fontWeight: 700 }}>{i + 1}</span>
            </div>
          </div>
        ) : null)}
      </div>
      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr><th>МЕСТО</th><th>УЧАСТНИК</th><th>ОЧКИ</th><th>✦12</th><th>✦10</th></tr>
          </thead>
          <tbody>
            {list.map((name, i) => (
              <tr key={name} style={{ background: i % 2 === 0 ? "#0d2464" : "#091b4e" }}
                className={i < 3 ? "rt-top" : ""}>
                <td className="rt-pos">{i < 3 ? medal[i] : i + 1}</td>
                <td className="rt-name">{name}</td>
                <td className="rt-score"><span className="rt-pill">{state.scores[name] || 0}</span></td>
                <td className="rt-12">{twelves[name] ? <span className="rt-12b">×{twelves[name]}</span> : "—"}</td>
                <td className="rt-10">{tens[name] ? <span className="rt-10b">×{tens[name]}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="results-reset" onClick={onReset}>★ НОВОЕ ГОЛОСОВАНИЕ ★</button>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────────────────────────
export default function Index() {
  const [state, setState] = useState<GameState>(() => loadState());
  const upd = useCallback((s: GameState) => { setState(s); saveState(s); }, []);

  const handleStart = (participants: string[], voters: string[]) => {
    const scores: Record<string, number> = {};
    participants.forEach(p => { scores[p] = 0; });
    upd({ phase: "voting", participants, voters, scores, currentVoterIndex: 0, currentVotes: {}, pointStep: 0, usedVoters: [], twelveFrom: "", twelveTo: "", voteHistory: [] });
  };

  const handleAward = (name: string) => {
    setState(prev => {
      const pts = VOTE_ORDER[prev.pointStep];
      const newVotes = { ...prev.currentVotes, [name]: pts };
      const newScores = { ...prev.scores, [name]: (prev.scores[name] || 0) + pts };
      const s = { ...prev, currentVotes: newVotes, scores: newScores, pointStep: prev.pointStep + 1 };
      saveState(s); return s;
    });
  };

  const handleFinish = () => {
    setState(prev => {
      const voter = prev.voters[prev.currentVoterIndex];
      const newHist = [...prev.voteHistory];
      Object.entries(prev.currentVotes).forEach(([r, p]) => newHist.push({ voter, recipient: r, points: p }));
      const twelveR = Object.entries(prev.currentVotes).find(([, p]) => p === 12)?.[0] || "";
      const nextIdx = prev.currentVoterIndex + 1;
      const isLast = nextIdx >= prev.voters.length;
      const phase: Phase = twelveR ? (isLast ? "twelve_then_results" : "twelve") : (isLast ? "results" : "voting");
      const s: GameState = { ...prev, voteHistory: newHist, usedVoters: [...prev.usedVoters, voter], currentVotes: {}, pointStep: 0, currentVoterIndex: nextIdx, twelveFrom: voter, twelveTo: twelveR, phase };
      saveState(s); return s;
    });
  };

  const handleTwelveCont = () => {
    setState(prev => {
      const phase: Phase = prev.phase === "twelve_then_results" ? "results" : "voting";
      const s = { ...prev, phase }; saveState(s); return s;
    });
  };

  const handleReset = () => { localStorage.removeItem(STORAGE_KEY); upd(getInitial()); };

  return (
    <div className="app-root">
      {state.phase === "setup" && <SetupScreen onStart={handleStart} />}
      {state.phase === "voting" && <VotingScreen state={state} onAward={handleAward} onFinish={handleFinish} />}
      {(state.phase === "twelve" || state.phase === "twelve_then_results") && (
        <TwelveScreen from={state.twelveFrom} to={state.twelveTo} onContinue={handleTwelveCont} />
      )}
      {state.phase === "results" && <ResultsScreen state={state} onReset={handleReset} />}
    </div>
  );
}
