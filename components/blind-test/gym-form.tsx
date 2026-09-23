"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type ScoreField = {
  key: string;
  label: string;
  weight: number;
};

type PublicConfig = {
  samples: string[];
  defaultRound: string;
  gyms: string[];
  rounds: string[];
  scoreFields: ScoreField[];
};

type Step =
  | "pin"
  | "session"
  | "sample"
  | "score"
  | "extras"
  | "done";

const DEFAULT_FIELDS: ScoreField[] = [
  { key: "friction", label: "Friction / Grip", weight: 25 },
  { key: "moisture", label: "Moisture / Dryness", weight: 20 },
  { key: "particle_feel", label: "Particle / Feel", weight: 15 },
  { key: "dust", label: "Dust / Residue", weight: 10 },
  { key: "longevity", label: "Longevity / Re-chalk", weight: 10 },
];

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return String(Date.now()).slice(-8);
}

export function GymBlindTestForm() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinAttempted, setPinAttempted] = useState(false);

  const [round, setRound] = useState("R1");
  const [gym, setGym] = useState("");
  const [testerCode, setTesterCode] = useState("");
  const [sessionId, setSessionId] = useState("");

  const [sample, setSample] = useState<string | null>(null);
  const [scoreIndex, setScoreIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [preferenceRank, setPreferenceRank] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastWeighted, setLastWeighted] = useState<number | null>(null);

  const fields = config?.scoreFields?.length ? config.scoreFields : DEFAULT_FIELDS;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blind-test/config");
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setConfigError(data.error || "Config failed.");
          return;
        }
        if (!cancelled) {
          setConfig({
            samples: data.samples ?? [],
            defaultRound: data.defaultRound ?? "R1",
            gyms: data.gyms ?? ["Campus Climbing", "Other"],
            rounds: data.rounds ?? ["R1", "R2", "R3"],
            scoreFields: data.scoreFields ?? DEFAULT_FIELDS,
          });
          setRound(data.defaultRound ?? "R1");
          setGym((data.gyms ?? [])[0] ?? "Campus Climbing");
          setSessionId(newSessionId());
        }
      } catch {
        if (!cancelled) setConfigError("Could not load blind test config.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentField = fields[scoreIndex];

  const progressLabel = useMemo(() => {
    if (step === "pin") return "Unlock";
    if (step === "session") return "Session";
    if (step === "sample") return "Sample";
    if (step === "score")
      return `Score ${scoreIndex + 1}/${fields.length}`;
    if (step === "extras") return "Extras";
    return "Saved";
  }, [step, scoreIndex, fields.length]);

  const appendPinDigit = useCallback((digit: string) => {
    setPinError(null);
    setPin((prev) => (prev.length >= 4 ? prev : prev + digit));
  }, []);

  const clearPin = () => {
    setPin("");
    setPinError(null);
    setPinAttempted(false);
  };

  async function verifyPin() {
    if (pin.length !== 4) {
      setPinError("Enter 4 digits.");
      return;
    }
    setPinLoading(true);
    setPinError(null);
    setPinAttempted(true);
    try {
      const res = await fetch("/api/blind-test/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", pin }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPinError(data?.error || "Incorrect PIN.");
        setPin("");
        setPinAttempted(false);
        return;
      }
      setStep("session");
    } catch {
      setPinError("Could not verify PIN.");
      setPin("");
      setPinAttempted(false);
    } finally {
      setPinLoading(false);
    }
  }

  useEffect(() => {
    if (
      step === "pin" &&
      pin.length === 4 &&
      !pinLoading &&
      !pinAttempted
    ) {
      void verifyPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, step, pinLoading, pinAttempted]);

  function pickScore(value: number | null) {
    if (!currentField) return;
    setScores((prev) => ({ ...prev, [currentField.key]: value }));
    if (scoreIndex < fields.length - 1) {
      setScoreIndex((i) => i + 1);
    } else {
      setStep("extras");
    }
  }

  async function submitScore() {
    if (!sample) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: Record<string, unknown> = {
        pin,
        sample_code: sample,
        round,
        gym,
        tester_code: testerCode,
        session_id: sessionId,
        notes,
        preference_rank: preferenceRank,
      };
      for (const f of fields) {
        body[f.key] = scores[f.key] ?? null;
      }

      const res = await fetch("/api/blind-test/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitError(data?.error || "Save failed.");
        return;
      }
      setLastWeighted(
        typeof data?.weighted === "number" ? data.weighted : null
      );
      setStep("done");
    } catch {
      setSubmitError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function nextSample() {
    setSample(null);
    setScores({});
    setScoreIndex(0);
    setPreferenceRank(null);
    setNotes("");
    setLastWeighted(null);
    setSubmitError(null);
    setStep("sample");
  }

  if (configError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-semibold text-ink">
          Blind test
        </h1>
        <p className="mt-4 text-destructive">{configError}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col px-4 py-6 pb-24">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-salt">
          Grippy research
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink">
          Blind test
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{progressLabel}</p>
        <div className="mt-4 h-1.5 w-full bg-secondary">
          <div
            className="h-full bg-salt transition-all"
            style={{
              width: `${
                step === "pin"
                  ? 8
                  : step === "session"
                    ? 20
                    : step === "sample"
                      ? 35
                      : step === "score"
                        ? 35 + ((scoreIndex + 1) / fields.length) * 45
                        : step === "extras"
                          ? 90
                          : 100
              }%`,
            }}
          />
        </div>
      </header>

      {step === "pin" ? (
        <section className="flex flex-1 flex-col">
          <p className="text-lg text-ink">Session PIN</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask the test lead for today’s 4-digit code.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex h-16 w-14 items-center justify-center border-2 text-3xl font-semibold",
                  pin.length > i
                    ? "border-ink bg-ink text-chalk"
                    : "border-border bg-chalk text-ink"
                )}
              >
                {pin[i] ? "•" : ""}
              </div>
            ))}
          </div>
          {pinError ? (
            <p className="mt-4 text-center text-sm text-destructive" role="alert">
              {pinError}
            </p>
          ) : null}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  disabled={pinLoading}
                  onClick={() => {
                    if (label === "⌫") clearPin();
                    else if (label === "OK") void verifyPin();
                    else appendPinDigit(label);
                  }}
                  className="flex h-16 items-center justify-center bg-secondary text-2xl font-semibold text-ink active:bg-ink active:text-chalk"
                >
                  {label === "OK" && pinLoading ? "…" : label}
                </button>
              )
            )}
          </div>
        </section>
      ) : null}

      {step === "session" ? (
        <section className="flex flex-1 flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-medium text-ink">Round</p>
            <div className="grid grid-cols-3 gap-3">
              {(config.rounds ?? ["R1", "R2", "R3"]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRound(r)}
                  className={cn(
                    "h-16 text-xl font-semibold",
                    round === r
                      ? "bg-ink text-chalk"
                      : "bg-secondary text-ink"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-ink">Gym</p>
            <div className="flex flex-col gap-2">
              {config.gyms.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGym(g)}
                  className={cn(
                    "h-14 px-4 text-left text-lg font-medium",
                    gym === g ? "bg-ink text-chalk" : "bg-secondary text-ink"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink">
              Your code (optional)
            </span>
            <input
              value={testerCode}
              onChange={(e) =>
                setTesterCode(e.target.value.slice(0, 12).toUpperCase())
              }
              placeholder="e.g. T07"
              className="mt-2 h-14 w-full border border-border bg-chalk px-4 text-xl uppercase tracking-widest outline-none ring-salt focus:ring-2"
              inputMode="text"
              autoCapitalize="characters"
            />
          </label>
          <button
            type="button"
            onClick={() => setStep("sample")}
            className="mt-auto h-16 bg-salt text-xl font-semibold text-ink"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === "sample" ? (
        <section className="flex flex-1 flex-col">
          <p className="text-lg text-ink">Which sample?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the letter on the bag — do not guess the blend.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {config.samples.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSample(code);
                  setScoreIndex(0);
                  setScores({});
                  setStep("score");
                }}
                className="flex h-28 items-center justify-center bg-ink font-heading text-5xl font-semibold text-chalk active:bg-salt active:text-ink"
              >
                {code}
              </button>
            ))}
          </div>
          {!config.samples.length ? (
            <p className="mt-6 text-sm text-destructive">
              No samples enabled. Ask the lead to enable codes in WordPress →
              Settings → Blind Test.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setStep("session")}
            className="mt-8 h-12 text-muted-foreground underline"
          >
            Back to session
          </button>
        </section>
      ) : null}

      {step === "score" && currentField ? (
        <section className="flex flex-1 flex-col">
          <p className="text-sm uppercase tracking-wide text-mist">
            Sample {sample}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
            {currentField.label}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            1 = clearly worse · 3 = average · 5 = best in this session
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pickScore(n)}
                className="flex h-16 items-center justify-between bg-secondary px-5 text-xl font-semibold text-ink active:bg-ink active:text-chalk"
              >
                <span>{n}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {n === 5
                    ? "Best"
                    : n === 4
                      ? "Better"
                      : n === 3
                        ? "Average"
                        : n === 2
                          ? "Below"
                          : "Poor"}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => pickScore(null)}
              className="h-14 text-base text-muted-foreground underline"
            >
              Skip / N/A
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (scoreIndex === 0) setStep("sample");
              else setScoreIndex((i) => i - 1);
            }}
            className="mt-6 h-12 text-muted-foreground underline"
          >
            Back
          </button>
        </section>
      ) : null}

      {step === "extras" ? (
        <section className="flex flex-1 flex-col gap-6">
          <div>
            <p className="text-lg font-medium text-ink">
              Preference rank (optional)
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Among samples you’ve tried today — 1 = favourite.
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setPreferenceRank((prev) => (prev === n ? null : n))
                  }
                  className={cn(
                    "h-14 text-xl font-semibold",
                    preferenceRank === n
                      ? "bg-ink text-chalk"
                      : "bg-secondary text-ink"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink">Note (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Short note — dusty, sticky…"
              className="mt-2 w-full border border-border bg-chalk p-4 text-base outline-none ring-salt focus:ring-2"
            />
          </label>
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitScore()}
            className={cn(
              "mt-auto h-16 bg-salt text-xl font-semibold text-ink",
              submitting && "opacity-50"
            )}
          >
            {submitting ? "Saving…" : `Save Sample ${sample}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setScoreIndex(fields.length - 1);
              setStep("score");
            }}
            className="h-12 text-muted-foreground underline"
          >
            Back to scores
          </button>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center bg-salt font-heading text-4xl text-ink">
            ✓
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold text-ink">
            Saved
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sample {sample}
            {lastWeighted != null
              ? ` · gym weighted ${lastWeighted.toFixed(2)}`
              : ""}
          </p>
          <button
            type="button"
            onClick={nextSample}
            className="mt-10 h-16 w-full max-w-sm bg-ink text-xl font-semibold text-chalk"
          >
            Test next sample
          </button>
          <button
            type="button"
            onClick={() => setStep("session")}
            className="mt-4 h-12 text-muted-foreground underline"
          >
            Change round / gym
          </button>
        </section>
      ) : null}
    </div>
  );
}
