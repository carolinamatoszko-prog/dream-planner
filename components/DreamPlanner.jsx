"use client";

import { useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// Chama a Serverless Function /api/analyze — a chave OpenAI fica no servidor
// ═══════════════════════════════════════════════════════════════════════════════
async function analyzeDream(dreamText) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dream: dreamText }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro desconhecido");
  return data;
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
const StarField = () => {
  const stars = useRef(
    [...Array(60)].map(() => ({
      w: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      op: Math.random() * 0.6 + 0.1,
      dur: Math.random() * 3 + 2,
      delay: Math.random() * 4,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.current.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: s.w + "px", height: s.w + "px",
            top: s.top + "%", left: s.left + "%",
            opacity: s.op,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

const Spinner = () => (
  <svg className="w-5 h-5" style={{ animation: "spin-slow 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="rgba(26,10,0,0.3)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a0a00" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Dots = () => (
  <div className="flex items-center gap-1.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ background: "#1a0a00", animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
      />
    ))}
  </div>
);

const Shimmer = ({ className = "", style = {} }) => (
  <div className={`skeleton-shimmer rounded-lg ${className}`} style={style} />
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DreamPlanner() {
  const [dream, setDream]       = useState("");
  const [focused, setFocused]   = useState(false);
  const [status, setStatus]     = useState("idle"); // idle | loading | done | error
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cardVisible, setCardVisible]   = useState(false);
  const [stepVisible, setStepVisible]   = useState([false, false, false]);
  const resultsRef  = useRef(null);
  const textareaRef = useRef(null);

  const PLACEHOLDERS = [
    "Viajar pelo Japão durante 3 semanas…",
    "Abrir o meu próprio café…",
    "Comprar o meu primeiro carro elétrico…",
    "Fazer um mestrado em design…",
    "Correr uma maratona este ano…",
    "Comprar uma máquina de café profissional…",
  ];
  const [phIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  const isLoading = status === "loading";
  const isDone    = status === "done";
  const isError   = status === "error";
  const canSubmit = dream.trim().length > 0 && !isLoading;

  const handlePlan = async () => {
    if (!canSubmit) return;
    setResult(null);
    setErrorMsg("");
    setCardVisible(false);
    setStepVisible([false, false, false]);
    setStatus("loading");

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    try {
      const data = await analyzeDream(dream);
      setResult(data);
      setStatus("done");
      setTimeout(() => setCardVisible(true), 60);
      setTimeout(() => setStepVisible([true, false, false]), 380);
      setTimeout(() => setStepVisible([true, true, false]), 600);
      setTimeout(() => setStepVisible([true, true, true]), 820);
    } catch (err) {
      setErrorMsg(err.message || "Erro ao analisar o sonho. Tenta novamente.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setDream(""); setResult(null); setErrorMsg(""); setStatus("idle");
    setCardVisible(false); setStepVisible([false, false, false]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => textareaRef.current?.focus(), 400);
  };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center px-6 py-16"
      style={{
        background: "linear-gradient(135deg,#0a0118 0%,#0d0a2e 40%,#0a1628 70%,#050d1a 100%)",
        fontFamily: "'Georgia','Times New Roman',serif",
      }}
    >
      <style>{`
        @keyframes twinkle{0%,100%{opacity:.1;transform:scale(1)}50%{opacity:.8;transform:scale(1.4)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pulse-dot{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes popIn{0%{opacity:0;transform:scale(.85)}70%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
        .icon-float{animation:float 4s ease-in-out infinite}
        .dream-card{animation:fadeUp .8s ease forwards;background:rgba(255,255,255,.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
        .result-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);transition:all .35s cubic-bezier(.34,1.56,.64,1)}
        .result-card:hover{background:rgba(255,255,255,.07);border-color:rgba(251,191,36,.25);transform:translateY(-3px);box-shadow:0 8px 32px rgba(251,191,36,.08)}
        .skeleton-shimmer{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
        .card-enter{animation:slideIn .5s cubic-bezier(.34,1.56,.64,1) forwards}
        .step-enter{animation:slideIn .45s cubic-bezier(.34,1.56,.64,1) forwards}
        .badge-pop{animation:popIn .4s cubic-bezier(.34,1.56,.64,1) forwards}
        .btn-plan{transition:all .25s ease}
        .btn-plan:hover:not(:disabled){filter:brightness(1.08);box-shadow:0 0 30px rgba(251,191,36,.35)}
        .btn-plan:active:not(:disabled){transform:scale(.98)}
        .btn-reset{transition:all .2s ease;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05)}
        .btn-reset:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);transform:translateY(-1px)}
        .btn-reset:active{transform:scale(.97)}
      `}</style>

      <div className="orb w-96 h-96 top-10 -left-20 opacity-20" style={{background:"radial-gradient(circle,#7c3aed,transparent)"}}/>
      <div className="orb w-80 h-80 bottom-20 -right-10 opacity-15" style={{background:"radial-gradient(circle,#1d4ed8,transparent)"}}/>
      <div className="orb w-64 h-64 top-1/2 left-1/2 opacity-10" style={{background:"radial-gradient(circle,#fbbf24,transparent)",transform:"translate(-50%,-50%)"}}/>
      <StarField />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-12" style={{animation:"fadeUp .6s ease forwards"}}>
          <div className="icon-float text-5xl mb-5">✦</div>
          <h1 className="text-5xl font-bold mb-3" style={{color:"#fbbf24",textShadow:"0 0 40px rgba(251,191,36,.4)",letterSpacing:"-.02em"}}>
            Dream Planner
          </h1>
          <p className="text-lg" style={{color:"rgba(196,181,253,.7)",fontStyle:"italic",letterSpacing:".04em"}}>
            Transforma sonhos em planos concretos
          </p>
        </div>

        <div className="dream-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-3">
            <label className="tracking-widest uppercase" style={{color:"rgba(251,191,36,.6)",fontSize:".7rem"}}>
              Qual é o teu sonho?
            </label>
            {isDone && result && (
              <span
                className="badge-pop flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                style={{background:"rgba(251,191,36,.12)",border:"1px solid rgba(251,191,36,.25)",color:"rgba(251,191,36,.8)"}}
              >
                <span>{result.categoryIcon}</span>
                <span>{result.categoryLabel}</span>
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full rounded-2xl px-5 py-4 text-white text-lg resize-none outline-none transition-all duration-300"
              rows={3}
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePlan(); }}
              placeholder={PLACEHOLDERS[phIndex]}
              disabled={isLoading}
              style={{
                background: "rgba(255,255,255,.06)",
                border: focused ? "1.5px solid rgba(251,191,36,.5)" : "1.5px solid rgba(255,255,255,.1)",
                boxShadow: focused ? "0 0 0 4px rgba(251,191,36,.08),inset 0 1px 0 rgba(255,255,255,.05)" : "inset 0 1px 0 rgba(255,255,255,.05)",
                fontFamily: "inherit", color: "#f1f5f9", caretColor: "#fbbf24",
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            {dream && !isLoading && (
              <span className="absolute bottom-3 right-4 text-xs" style={{color:"rgba(148,163,184,.4)"}}>⌘↵ para planear</span>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handlePlan}
              disabled={!canSubmit}
              className="btn-plan flex-1 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#d97706 100%)"
                  : isLoading ? "linear-gradient(135deg,#d97706,#b45309)"
                  : "rgba(255,255,255,.08)",
                color: dream.trim() ? "#1a0a00" : "rgba(255,255,255,.3)",
                border: dream.trim() ? "none" : "1px solid rgba(255,255,255,.1)",
                cursor: canSubmit ? "pointer" : "not-allowed",
                letterSpacing: ".07em", fontFamily: "'Georgia',serif",
              }}
            >
              {isLoading
                ? <><Spinner /><span>A IA está a pensar…</span><Dots /></>
                : <span>{dream.trim() ? "✦  Planear Sonho" : "Escreve o teu sonho…"}</span>
              }
            </button>

            {(dream.trim() || isDone || isError) && !isLoading && (
              <button
                onClick={handleReset}
                className="btn-reset rounded-2xl px-5 py-4 flex items-center gap-2 text-sm font-medium"
                style={{color:"rgba(196,181,253,.7)",cursor:"pointer",fontFamily:"inherit",letterSpacing:".04em",flexShrink:0}}
              >
                <span style={{fontSize:"1rem"}}>↺</span>
                <span>Limpar</span>
              </button>
            )}
          </div>

          {isError && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",color:"rgba(252,165,165,.9)"}}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        <div ref={resultsRef} className="mt-8 grid grid-cols-1 gap-4">
          {(isLoading || isDone) && (
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`result-card rounded-2xl p-5 ${isDone && cardVisible ? "card-enter" : ""}`}
                style={{opacity: isLoading ? 1 : isDone && cardVisible ? 1 : 0}}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span style={{fontSize:"1.2rem"}}>💰</span>
                  <span className="text-xs tracking-widest uppercase" style={{color:"rgba(148,163,184,.5)"}}>Custo Estimado</span>
                </div>
                {isLoading
                  ? <><Shimmer className="h-7 mb-2" style={{width:"70%"}} /><Shimmer className="h-4" style={{width:"50%"}} /></>
                  : result && (
                    <>
                      <p className="text-2xl font-bold mb-1" style={{color:"#fbbf24",letterSpacing:"-.02em"}}>{result.cost}</p>
                      <p className="text-xs" style={{color:"rgba(148,163,184,.6)",fontStyle:"italic"}}>{result.costNote}</p>
                    </>
                  )
                }
              </div>

              <div
                className={`result-card rounded-2xl p-5 ${isDone && cardVisible ? "card-enter" : ""}`}
                style={{opacity: isLoading ? 1 : isDone && cardVisible ? 1 : 0, animationDelay:".08s"}}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span style={{fontSize:"1.2rem"}}>⏳</span>
                  <span className="text-xs tracking-widest uppercase" style={{color:"rgba(148,163,184,.5)"}}>Tempo de Prep.</span>
                </div>
                {isLoading
                  ? <><Shimmer className="h-7 mb-2" style={{width:"60%"}} /><Shimmer className="h-4" style={{width:"45%"}} /></>
                  : result && (
                    <>
                      <p className="text-2xl font-bold mb-1" style={{color:"#a78bfa",letterSpacing:"-.02em"}}>{result.months} meses</p>
                      <p className="text-xs" style={{color:"rgba(148,163,184,.6)",fontStyle:"italic"}}>{result.timeNote}</p>
                    </>
                  )
                }
              </div>
            </div>
          )}

          {(isLoading || isDone) && (
            <div
              className={`result-card rounded-2xl p-6 ${isDone && cardVisible ? "card-enter" : ""}`}
              style={{opacity: isLoading ? 1 : isDone && cardVisible ? 1 : 0, animationDelay:".16s"}}
            >
              <div className="flex items-center gap-2 mb-5">
                <span style={{fontSize:"1.2rem"}}>🗺️</span>
                <span className="text-xs tracking-widest uppercase" style={{color:"rgba(148,163,184,.5)"}}>3 Passos Práticos</span>
              </div>
              <div className="space-y-4">
                {isLoading
                  ? [1,2,3].map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <Shimmer className="flex-shrink-0 w-7 h-7 rounded-full" />
                      <Shimmer className="h-4 flex-1" style={{width:`${85 - n * 8}%`}} />
                    </div>
                  ))
                  : result && result.steps.map((step, i) => (
                    <div
                      key={i}
                      className={stepVisible[i] ? "step-enter" : ""}
                      style={{display:"flex",alignItems:"flex-start",gap:".875rem",opacity:stepVisible[i] ? 1 : 0}}
                    >
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{background:"rgba(251,191,36,.15)",color:"#fbbf24",border:"1px solid rgba(251,191,36,.3)",minWidth:"1.75rem"}}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed" style={{color:"rgba(226,232,240,.85)"}}>{step}</p>
                    </div>
                  ))
                }
              </div>
              {isDone && result && (
                <div className="mt-6 pt-5" style={{borderTop:"1px solid rgba(255,255,255,.06)"}}>
                  <button
                    onClick={handleReset}
                    className="btn-reset w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                    style={{color:"rgba(196,181,253,.6)",cursor:"pointer",fontFamily:"inherit",letterSpacing:".05em"}}
                  >
                    <span>↺</span><span>Planear um Novo Sonho</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-xs" style={{color:"rgba(148,163,184,.25)",letterSpacing:".05em"}}>
          Dream Planner · Powered by GPT-4o mini · Os sonhos merecem um plano
        </p>
      </div>
    </div>
  );
}
