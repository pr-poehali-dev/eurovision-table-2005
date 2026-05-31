import { useState, useEffect, useCallback } from "react";

const ALL_PARTICIPANTS = [
  "Маша Сергеева", "Руслан Шлем", "Руслан Хмелинин", "Даня Шустов",
  "Дима Тарасов", "Юля Рунова", "Сергей Сумбаев", "Егор Коновалов ст",
  "Егор Коновалов мл", "Ярослав Ткачев", "Ярослав Удовиков", "Ваня Фальтенберг",
  "Тимофей Зелюченко", "Тимофей Павлов", "Егор Привалов", "Олег Линьков",
  "Миша Сумбаев", "Магомед Дутханов", "Антон Цепецавер", "Вова Молчанов",
  "Егор Ступак", "Саша Кондратьев", "Ваня Гринкевич", "Сергей Петрушин",
  "Артем Дорохов", "Максим Дунин", "Антон Викторович", "Влад Варанкин"
];

// Евровидение: баллы объявляются от меньшего к большему
const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

type Phase = "setup" | "voting" | "twelve" | "twelve_then_results" | "results";

interface VoteEntry { voter: string; recipient: string; points: number; }

interface GameState {
  phase: Phase;
  participants: string[];
  voters: string[];
  scores: Record<string, number>;
  currentVoterIndex: number;
  // currentVotes: все распределённые баллы текущего голосующего
  currentVotes: Record<string, number>;
  // pointStep: индекс в VOTE_ORDER — какой балл сейчас объявляем (0=1pt, ..., 9=12pt)
  pointStep: number;
  usedVoters: string[];
  twelveFrom: string;
  twelveTo: string;
  voteHistory: VoteEntry[];
}

const STORAGE_KEY = "eurovision2005_v2";

function getInitialState(): GameState {
  return {
    phase: "setup", participants: [], voters: [], scores: {},
    currentVoterIndex: 0, currentVotes: {}, pointStep: 0,
    usedVoters: [], twelveFrom: "", twelveTo: "", voteHistory: [],
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_e) {
    // ignore
  }
  return getInitialState();
}

function saveState(s: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─────────────────────────────────────────────
// SETUP SCREEN
// ─────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (p: string[], v: string[]) => void }) {
  const [selP, setSelP] = useState<string[]>([...ALL_PARTICIPANTS]);
  const [selV, setSelV] = useState<string[]>([...ALL_PARTICIPANTS]);

  const toggleP = (n: string) => setSelP(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  const toggleV = (n: string) => setSelV(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <div className="esc-stars-top">★ ★ ★ ★ ★ ★ ★</div>
        <h1 className="esc-main-title">EUROVISION</h1>
        <div className="esc-main-year">SONG CONTEST 2005</div>
        <div className="esc-main-city">КИЕВ • УКРАИНА</div>
      </div>
      <div className="setup-columns">
        <div className="setup-col">
          <div className="setup-col-header">
            <span>🎤 УЧАСТНИКИ КОНКУРСА</span>
            <button className="select-all-btn"
              onClick={() => setSelP(selP.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
              {selP.length === ALL_PARTICIPANTS.length ? "Снять все" : "Все"}
            </button>
          </div>
          <div className="names-grid">
            {ALL_PARTICIPANTS.map(name => (
              <div key={name} className={`name-chip ${selP.includes(name) ? "chip-active-p" : ""}`} onClick={() => toggleP(name)}>
                <span className="chip-check">{selP.includes(name) ? "✓" : ""}</span>{name}
              </div>
            ))}
          </div>
        </div>
        <div className="setup-col">
          <div className="setup-col-header">
            <span>🗳️ ГОЛОСУЮЩИЕ ЖЮРИ</span>
            <button className="select-all-btn"
              onClick={() => setSelV(selV.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
              {selV.length === ALL_PARTICIPANTS.length ? "Снять все" : "Все"}
            </button>
          </div>
          <p className="setup-hint">Голосующие могут не входить в список участников</p>
          <div className="names-grid">
            {ALL_PARTICIPANTS.map(name => (
              <div key={name} className={`name-chip ${selV.includes(name) ? "chip-active-v" : ""}`} onClick={() => toggleV(name)}>
                <span className="chip-check">{selV.includes(name) ? "✓" : ""}</span>{name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="setup-footer">
        <div className="setup-counts">
          <div className="count-badge"><span className="count-num">{selP.length}</span><span className="count-label">участников</span></div>
          <div className="count-sep">×</div>
          <div className="count-badge"><span className="count-num">{selV.length}</span><span className="count-label">голосующих</span></div>
        </div>
        <button className="start-btn" disabled={selP.length < 2 || selV.length < 1} onClick={() => onStart(selP, selV)}>
          ★ НАЧАТЬ ГОЛОСОВАНИЕ ★
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 12 POINTS SCREEN
// ─────────────────────────────────────────────
function TwelveScreen({ from, to, onContinue }: { from: string; to: string; onContinue: () => void }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div className={`twelve-screen ${vis ? "twelve-visible" : ""}`}>
      <div className="twelve-stars-bg">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="falling-star" style={{
            left: `${(i * 17 + 5) % 100}%`,
            animationDelay: `${(i * 0.18) % 2.5}s`,
            animationDuration: `${1.8 + (i % 5) * 0.4}s`,
            fontSize: `${12 + (i % 4) * 8}px`,
          }}>★</div>
        ))}
      </div>
      <div className="twelve-content">
        <div className="twelve-jury-label">ЖЮРИ</div>
        <div className="twelve-from-name">{from}</div>
        <div className="twelve-gives-text">ПРИСУЖДАЕТ</div>
        <div className="twelve-badge">
          <div className="twelve-big-num">12</div>
          <div className="twelve-pts-label">БАЛЛОВ</div>
        </div>
        <div className="twelve-arrow-down">▼</div>
        <div className="twelve-to-name">{to}</div>
      </div>
      <button className="twelve-btn" onClick={onContinue}>ПРОДОЛЖИТЬ →</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCOREBOARD — 2 колонки как на видео
// ─────────────────────────────────────────────
function Scoreboard({ participants, scores, lastRecipient, lastPoints }: {
  participants: string[];
  scores: Record<string, number>;
  lastRecipient: string;
  lastPoints: number;
}) {
  // Сортируем по убыванию очков
  const sorted = [...participants].sort((a, b) => {
    const diff = (scores[b] || 0) - (scores[a] || 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b, "ru");
  });

  const half = Math.ceil(sorted.length / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half);

  const renderRow = (name: string) => {
    const score = scores[name] || 0;
    const isHighlighted = name === lastRecipient;
    return (
      <div key={name} className={`sb2-row ${isHighlighted ? "sb2-row-highlight" : ""}`}>
        <span className="sb2-name">{name.toUpperCase()}</span>
        <span className={`sb2-score ${isHighlighted ? "sb2-score-flash" : ""}`}>
          {score > 0 ? score : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="sb2-wrap">
      <div className="sb2-col">{left.map(renderRow)}</div>
      <div className="sb2-divider" />
      <div className="sb2-col">{right.map(renderRow)}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VOTING SCREEN — главный экран как на видео
// ─────────────────────────────────────────────
function VotingScreen({ state, onAwardPoint, onFinishVoter }: {
  state: GameState;
  onAwardPoint: (recipient: string) => void;
  onFinishVoter: () => void;
}) {
  const currentVoter = state.voters[state.currentVoterIndex];
  const currentPointValue = VOTE_ORDER[state.pointStep]; // балл который сейчас присуждается
  const allPointsGiven = state.pointStep >= VOTE_ORDER.length;

  // Кому уже дали баллы в этом раунде (нельзя выбрать снова)
  const alreadyVoted = new Set(Object.keys(state.currentVotes));

  // Последний присуждённый балл и получатель (для подсветки)
  const lastEntries = Object.entries(state.currentVotes);
  const lastEntry = lastEntries.length > 0 ? lastEntries[lastEntries.length - 1] : null;
  const lastRecipient = lastEntry ? lastEntry[0] : "";
  const lastPoints = lastEntry ? lastEntry[1] : 0;

  // Список участников отсортированных по очкам для выбора
  const sortedForPick = [...state.participants]
    .filter(p => p !== currentVoter && !alreadyVoted.has(p))
    .sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));

  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="esc-voting-wrap">
      {/* Фон в стиле Евровидения */}
      <div className="esc-bg-gradient" />

      {/* ТАБЛИЦА — центр экрана */}
      <div className="esc-center">
        <Scoreboard
          participants={state.participants}
          scores={state.scores}
          lastRecipient={lastRecipient}
          lastPoints={lastPoints}
        />

        {/* Шарики с баллами справа (уже розданные + текущий) */}
        <div className="esc-balls">
          {VOTE_ORDER.map((pts, idx) => {
            const given = state.pointStep > idx;
            const current = state.pointStep === idx && !allPointsGiven;
            const isTwelve = pts === 12;
            return (
              <div key={pts} className={`esc-ball ${given ? "ball-given" : ""} ${current ? "ball-current" : ""} ${current && isTwelve ? "ball-twelve-current" : ""}`}>
                {pts}
              </div>
            );
          })}
        </div>
      </div>

      {/* Имя голосующего — внизу крупно как BULGARIA на видео */}
      <div className="esc-voter-bar">
        <div className="esc-voter-name">{currentVoter.toUpperCase()}</div>
        <div className="esc-voter-progress">{state.usedVoters.length + 1} / {state.voters.length}</div>
      </div>

      {/* Панель присуждения балла */}
      {!allPointsGiven ? (
        <div className="esc-award-panel">
          <div className="esc-award-info">
            Присудить <span className="esc-award-pts">{currentPointValue}</span> {currentPointValue === 1 ? "балл" : currentPointValue < 5 ? "балла" : "баллов"}
          </div>
          <button className="esc-pick-btn" onClick={() => setShowPicker(true)}>
            ВЫБРАТЬ УЧАСТНИКА →
          </button>
        </div>
      ) : (
        <div className="esc-award-panel">
          <div className="esc-award-info">Все баллы розданы</div>
          <button className="esc-next-btn" onClick={onFinishVoter}>
            СЛЕДУЮЩИЙ ГОЛОСУЮЩИЙ →
          </button>
        </div>
      )}

      {/* Модальный выбор участника */}
      {showPicker && (
        <div className="esc-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="esc-picker" onClick={e => e.stopPropagation()}>
            <div className="esc-picker-title">
              КТО ПОЛУЧАЕТ <span className="esc-picker-pts">{currentPointValue}</span> {currentPointValue === 1 ? "БАЛЛ" : currentPointValue < 5 ? "БАЛЛА" : "БАЛЛОВ"}?
            </div>
            <div className="esc-picker-list">
              {sortedForPick.map(name => (
                <div key={name} className="esc-picker-row" onClick={() => {
                  onAwardPoint(name);
                  setShowPicker(false);
                }}>
                  <span className="esc-picker-name">{name.toUpperCase()}</span>
                  <span className="esc-picker-score">{state.scores[name] || 0}</span>
                </div>
              ))}
            </div>
            <button className="esc-picker-cancel" onClick={() => setShowPicker(false)}>ОТМЕНА</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────
function ResultsScreen({ state, onReset }: { state: GameState; onReset: () => void }) {
  const sorted = [...state.participants].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));
  const twelves: Record<string, number> = {};
  const tens: Record<string, number> = {};
  state.voteHistory.forEach(h => {
    if (h.points === 12) twelves[h.recipient] = (twelves[h.recipient] || 0) + 1;
    if (h.points === 10) tens[h.recipient] = (tens[h.recipient] || 0) + 1;
  });
  const podColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <div className="results-screen">
      <div className="results-header">
        <div className="res-stars">★ ★ ★ ★ ★ ★ ★</div>
        <h1 className="res-title">ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ</h1>
        <div className="res-subtitle">EUROVISION SONG CONTEST 2005</div>
      </div>
      <div className="podium-wrap">
        {[1, 0, 2].map(i => (
          <div key={i} className={`podium-item pod-${i + 1}`}>
            <div className="pod-name">{sorted[i]}</div>
            <div className="pod-score" style={{ color: podColors[i] }}>{state.scores[sorted[i]] || 0}</div>
            <div className="pod-block" style={{
              height: `${130 - i * 35}px`,
              background: `linear-gradient(180deg, ${podColors[i]}33, ${podColors[i]}99)`,
              borderTop: `4px solid ${podColors[i]}`
            }}>
              <span className="pod-place" style={{ color: podColors[i] }}>{i + 1}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="res-table-wrap">
        <table className="res-table">
          <thead>
            <tr><th>МЕСТО</th><th>УЧАСТНИК</th><th>ОЧКИ</th><th>✦ 12</th><th>✦ 10</th></tr>
          </thead>
          <tbody>
            {sorted.map((name, i) => (
              <tr key={name} style={{ backgroundColor: i % 2 === 0 ? "#0d2464" : "#091b4e" }}
                className={i < 3 ? "res-top-row" : ""}>
                <td className="res-td-pos">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                <td className="res-td-name">{name}</td>
                <td className="res-td-score"><span className="res-score-pill">{state.scores[name] || 0}</span></td>
                <td className="res-td-12">{twelves[name] ? <span className="res-12-badge">×{twelves[name]}</span> : "—"}</td>
                <td className="res-td-10">{tens[name] ? <span className="res-10-badge">×{tens[name]}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="res-footer">
        <button className="res-reset-btn" onClick={onReset}>★ НОВОЕ ГОЛОСОВАНИЕ ★</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function Index() {
  const [state, setState] = useState<GameState>(() => loadState());

  const update = useCallback((s: GameState) => { setState(s); saveState(s); }, []);

  const handleStart = (participants: string[], voters: string[]) => {
    const scores: Record<string, number> = {};
    participants.forEach(p => { scores[p] = 0; });
    update({
      phase: "voting", participants, voters, scores,
      currentVoterIndex: 0, currentVotes: {}, pointStep: 0,
      usedVoters: [], twelveFrom: "", twelveTo: "", voteHistory: []
    });
  };

  // Присуждаем текущий балл (VOTE_ORDER[pointStep]) выбранному участнику
  const handleAwardPoint = (recipient: string) => {
    setState(prev => {
      const pts = VOTE_ORDER[prev.pointStep];
      const newVotes = { ...prev.currentVotes, [recipient]: pts };
      const newStep = prev.pointStep + 1;
      const s: GameState = { ...prev, currentVotes: newVotes, pointStep: newStep };
      saveState(s);
      return s;
    });
  };

  // Завершаем голосование текущего жюри — фиксируем баллы, показываем 12
  const handleFinishVoter = () => {
    setState(prev => {
      const voter = prev.voters[prev.currentVoterIndex];
      const newScores = { ...prev.scores };
      const newHist = [...prev.voteHistory];
      Object.entries(prev.currentVotes).forEach(([r, p]) => {
        newScores[r] = (newScores[r] || 0) + p;
        newHist.push({ voter, recipient: r, points: p });
      });
      const twelveR = Object.entries(prev.currentVotes).find(([, p]) => p === 12)?.[0] || "";
      const nextIdx = prev.currentVoterIndex + 1;
      const isLast = nextIdx >= prev.voters.length;
      const phase: Phase = twelveR
        ? (isLast ? "twelve_then_results" : "twelve")
        : (isLast ? "results" : "voting");
      const s: GameState = {
        ...prev, scores: newScores, voteHistory: newHist,
        usedVoters: [...prev.usedVoters, voter],
        currentVotes: {}, pointStep: 0,
        currentVoterIndex: nextIdx,
        twelveFrom: voter, twelveTo: twelveR, phase
      };
      saveState(s); return s;
    });
  };

  const handleTwelveCont = () => {
    setState(prev => {
      const phase: Phase = prev.phase === "twelve_then_results" ? "results" : "voting";
      const s = { ...prev, phase };
      saveState(s); return s;
    });
  };

  const handleReset = () => { localStorage.removeItem(STORAGE_KEY); update(getInitialState()); };

  return (
    <div className="esc-app">
      <div className="esc-starfield">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="sf-star" style={{
            left: `${(i * 31 + 11) % 100}%`, top: `${(i * 47 + 17) % 100}%`,
            animationDelay: `${(i * 0.25) % 5}s`, fontSize: `${6 + (i % 5) * 3}px`,
            opacity: 0.05 + (i % 6) * 0.06
          }}>★</div>
        ))}
      </div>
      {state.phase === "setup" && <SetupScreen onStart={handleStart} />}
      {state.phase === "voting" && (
        <VotingScreen state={state} onAwardPoint={handleAwardPoint} onFinishVoter={handleFinishVoter} />
      )}
      {(state.phase === "twelve" || state.phase === "twelve_then_results") && (
        <TwelveScreen from={state.twelveFrom} to={state.twelveTo} onContinue={handleTwelveCont} />
      )}
      {state.phase === "results" && <ResultsScreen state={state} onReset={handleReset} />}
    </div>
  );
}