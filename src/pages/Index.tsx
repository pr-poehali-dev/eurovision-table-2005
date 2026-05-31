import { useState, useEffect, useCallback } from "react";
// useEffect used in TwelveScreen

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

type Phase = "setup" | "voting" | "twelve" | "twelve_then_results" | "results";

interface VoteEntry { voter: string; recipient: string; points: number; }

interface GameState {
  phase: Phase;
  participants: string[];
  voters: string[];
  scores: Record<string, number>;
  currentVoterIndex: number;
  currentVotes: Record<string, number>;
  usedVoters: string[];
  twelveFrom: string;
  twelveTo: string;
  voteHistory: VoteEntry[];
}

const STORAGE_KEY = "eurovision2005_state";

function getInitialState(): GameState {
  return {
    phase: "setup", participants: [], voters: [], scores: {},
    currentVoterIndex: 0, currentVotes: {}, usedVoters: [],
    twelveFrom: "", twelveTo: "", voteHistory: [],
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_e) {
    // ignore parse errors
  }
  return getInitialState();
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---- SETUP SCREEN ----
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
            <button className="select-all-btn" onClick={() => setSelP(selP.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
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
            <button className="select-all-btn" onClick={() => setSelV(selV.length === ALL_PARTICIPANTS.length ? [] : [...ALL_PARTICIPANTS])}>
              {selV.length === ALL_PARTICIPANTS.length ? "Снять все" : "Все"}
            </button>
          </div>
          <p className="setup-hint">Можно добавить голосующих не из числа участников</p>
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

// ---- 12 POINTS SCREEN ----
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

// ---- VOTING SCREEN ----
function VotingScreen({ state, onVote, onFinishVoter }: {
  state: GameState; onVote: (r: string, p: number) => void; onFinishVoter: () => void;
}) {
  const currentVoter = state.voters[state.currentVoterIndex];
  const sortedP = [...state.participants].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));
  const usedPts = Object.values(state.currentVotes);
  const availPts = VOTE_ORDER.filter(p => !usedPts.includes(p));
  const allDone = availPts.length === 0;

  return (
    <div className="voting-screen">
      <div className="voting-header">
        <div className="vh-logo">ESC<span>2005</span></div>
        <div className="vh-voter">
          <div className="vh-voter-label">ГОЛОСУЕТ</div>
          <div className="vh-voter-name">{currentVoter}</div>
        </div>
        <div className="vh-progress">
          <div className="vh-progress-num">{state.usedVoters.length + 1}</div>
          <div className="vh-progress-of">из {state.voters.length}</div>
        </div>
      </div>

      <div className="voting-body">
        {/* SCOREBOARD */}
        <div className="scoreboard-wrap">
          <div className="scoreboard-title">ТАБЛИЦА ОЧКОВ</div>
          <div className="scoreboard-scroll">
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th className="sb-th-pos">#</th>
                  <th className="sb-th-name">УЧАСТНИК</th>
                  <th className="sb-th-total">ИТОГО</th>
                  {state.usedVoters.slice(-8).map((v, i) => (
                    <th key={i} className="sb-th-v" title={v}>{v.split(" ")[0].substring(0, 5)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedP.map((p, idx) => {
                  const score = state.scores[p] || 0;
                  const myVote = state.currentVotes[p];
                  return (
                    <tr key={p} className={`sb-row ${myVote === 12 ? "sb-row-twelve" : myVote ? "sb-row-voted" : ""}`}
                      style={{ backgroundColor: idx % 2 === 0 ? "#0d2464" : "#091b4e" }}>
                      <td className="sb-td-pos">{idx + 1}</td>
                      <td className="sb-td-name">
                        {p}
                        {myVote && <span className={`sb-vote-tag ${myVote === 12 ? "tag-12" : myVote >= 8 ? "tag-high" : "tag-low"}`}>+{myVote}</span>}
                      </td>
                      <td className="sb-td-total">
                        <span className={`total-num ${score === 0 ? "total-zero" : ""}`}>{score || "—"}</span>
                      </td>
                      {state.usedVoters.slice(-8).map((voter, vi) => {
                        const h = state.voteHistory.find(x => x.voter === voter && x.recipient === p);
                        return (
                          <td key={vi} className="sb-td-v">
                            {h ? <span className={`hist-pt ${h.points === 12 ? "hp-12" : h.points >= 8 ? "hp-hi" : ""}`}>{h.points}</span> : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* VOTE PANEL */}
        <div className="vote-panel">
          <div className="vp-header">
            <div className="vp-title">ПРИСУДИТЕ БАЛЛЫ</div>
            <div className="vp-voter">{currentVoter}</div>
          </div>

          <div className="vp-pts-row">
            {VOTE_ORDER.map(p => (
              <div key={p} className={`vp-pt-chip ${availPts.includes(p) ? "vp-pt-avail" : "vp-pt-used"} ${p === 12 ? "vp-pt-12" : ""}`}>
                {p}
              </div>
            ))}
          </div>

          <div className="vp-list">
            {sortedP.map(p => {
              const myVote = state.currentVotes[p];
              const isMe = p === currentVoter;
              return (
                <div key={p} className={`vp-row ${isMe ? "vp-row-me" : ""} ${myVote ? "vp-row-done" : ""}`}>
                  <span className="vp-pname">{p}</span>
                  {isMe ? (
                    <span className="vp-me-badge">нельзя голосовать</span>
                  ) : myVote ? (
                    <div className="vp-done-group">
                      <span className={`vp-done-num ${myVote === 12 ? "dn-12" : myVote >= 8 ? "dn-hi" : "dn-lo"}`}>{myVote}</span>
                      <button className="vp-cancel" onClick={() => onVote(p, 0)}>✕</button>
                    </div>
                  ) : (
                    <div className="vp-pts-btns">
                      {availPts.map(pt => (
                        <button key={pt} onClick={() => onVote(p, pt)}
                          className={`vp-btn ${pt === 12 ? "vp-btn-12" : pt >= 8 ? "vp-btn-hi" : "vp-btn-lo"}`}>
                          {pt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className={`vp-finish ${allDone ? "vp-finish-ready" : ""}`} disabled={!allDone} onClick={onFinishVoter}>
            {allDone ? "✓ ПЕРЕДАТЬ ГОЛОС →" : `Осталось: ${availPts.join(" · ")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- RESULTS ----
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

// ---- ROOT ----
export default function Index() {
  const [state, setState] = useState<GameState>(() => loadState());

  const update = useCallback((s: GameState) => { setState(s); saveState(s); }, []);

  const handleStart = (participants: string[], voters: string[]) => {
    const scores: Record<string, number> = {};
    participants.forEach(p => { scores[p] = 0; });
    update({ phase: "voting", participants, voters, scores, currentVoterIndex: 0, currentVotes: {}, usedVoters: [], twelveFrom: "", twelveTo: "", voteHistory: [] });
  };

  const handleVote = (recipient: string, points: number) => {
    setState(prev => {
      const nv = { ...prev.currentVotes };
      if (points === 0) delete nv[recipient]; else nv[recipient] = points;
      const updated = { ...prev, currentVotes: nv };
      saveState(updated); return updated;
    });
  };

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
      const phase: Phase = twelveR ? (isLast ? "twelve_then_results" : "twelve") : (isLast ? "results" : "voting");
      const s: GameState = { ...prev, scores: newScores, voteHistory: newHist, usedVoters: [...prev.usedVoters, voter], currentVotes: {}, currentVoterIndex: nextIdx, twelveFrom: voter, twelveTo: twelveR, phase };
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
      {state.phase === "voting" && <VotingScreen state={state} onVote={handleVote} onFinishVoter={handleFinishVoter} />}
      {(state.phase === "twelve" || state.phase === "twelve_then_results") && (
        <TwelveScreen from={state.twelveFrom} to={state.twelveTo} onContinue={handleTwelveCont} />
      )}
      {state.phase === "results" && <ResultsScreen state={state} onReset={handleReset} />}
    </div>
  );
}