# Grippy Blind Test Protocol

Working knowledge base for gym blind testing, lab data entry, and analysis.

**Live guide (frontend):** [/blind-test/guide](https://grippy.io/blind-test/guide)

Share that URL with the team so everyone follows the same playbook.

---

## Purpose

Compare seawater : mineral chalk blend ratios. Collect gym subjective scores (blind) and lab measurements, then decide which blend to advance.

**Rules:** Keep the gym blind. Ratios are internal-only.

---

## Three tools

| Page | URL | Who | What | Key |
|------|-----|-----|------|-----|
| Gym scoring | `/blind-test` | Climbers / field scribes | Score Sample A/B/C… (1–5) | 4-digit session PIN (WP) |
| Lab entry | `/blind-test/lab` | R&D | Enter raw measurements + hard gates | Access key |
| Analysis | `/blind-test/results` | Decision / R&D | Rankings, stability, CSV export | Same access key |
| This guide | `/blind-test/guide` | Everyone | Protocol & role playbooks | None |

Production base: `https://grippy.io`  
CMS: `https://cms.grippy.io/wp-admin`

Do not confuse:

- Climbers only use `/blind-test`
- Climbers must not open lab / results (ratios are revealed)
- Access key ≠ WP login ≠ Application Password ≠ session PIN

---

## Roles

| Role | Responsibility |
|------|----------------|
| Test lead | Configure PIN, enabled samples, code→ratio map in WP; share PIN with floor; share access key only with lab/analysis |
| Climber / scribe | Score bags on `/blind-test`; never discuss ratios |
| Lab / R&D | Enter instrument data on `/blind-test/lab` |
| Analysis / decision | Use `/blind-test/results`; pick next-round blends |

WordPress storage:

- **Blind Scores** — each gym submission
- **Lab Data** — each lab row
- **Settings → Blind Test** — PIN, enabled codes, mapping, gyms

---

## Blindness rules

1. Bags show only Sample A, B, C… — never the ratio.
2. Mapping lives only in WP → Settings → Blind Test.
3. No “this is 30:70” talk on the floor.
4. Decode ratios only on `/blind-test/results` (internal).
5. One PIN + enabled-sample set per session; changing samples requires a WP update and a team ping.

---

## Lead pre-session checklist

In WordPress: **Settings → Blind Test**

1. Set a 4-digit PIN for the session
2. Enable only the sample codes you brought
3. Map each enabled code to a seawater:mineral ratio
4. Confirm gym list and default round
5. Share PIN with floor staff privately
6. Share access key only with people who need lab/results

Hosting / env issues: see **Lead / tech only** below.

---

## Gym flow (climber / scribe)

Open `/blind-test`

1. Enter session PIN
2. Choose Round (R1/R2/R3) and Gym; optional short tester code
3. Tap the letter on the bag
4. Score 1–5 (or Skip) for: Grip, Moisture, Feel, Dust, Longevity
5. Optional preference rank + short note
6. Save → Test next sample

Scale: 1 = clearly worse · 3 = average · 5 = best in this session

---

## Lab flow (R&D)

Open `/blind-test/lab` → access key

1. Select round
2. Fill raw values per ratio
3. Set hard gates Pass/Fail
4. Save each row
5. Failed gates → “not recommended” in analysis

---

## Analysis flow (decision)

Open `/blind-test/results` → same access key

- **Gym scores** — aggregates by sample (n, mean, SD) + decoded ratios
- **Lab multi-round** — normalized weighted scores, stability, gates
- **Decision matrix** — Highest Avg / Lowest SD / Best Balance / Lowest Cost OK

Diff &lt; 0.3 → treat as no significant difference; prefer stability and cost.

---

## Recommended rounds

| Round | Focus |
|-------|--------|
| R1 | Screen all planned blends |
| R2 | Retest remaining / all for stability |
| R3 | Confirm top 3–4 |

---

## “Which page?”

| Situation | Go to |
|-----------|--------|
| Scoring bags at the gym | `/blind-test` |
| Entering instrument readings | `/blind-test/lab` |
| Seeing winners / exporting CSV | `/blind-test/results` |
| Learning the protocol | `/blind-test/guide` |
| Changing PIN / samples | WP Settings → Blind Test |
| Checking raw submissions | WP Blind Scores / Lab Data |

---

## FAQ (team)

### Everyone / climber

**Which page should I open?**  
Scoring bags → `/blind-test`. Lab numbers → `/blind-test/lab`. Rankings & CSV → `/blind-test/results`. Learning the rules → `/blind-test/guide`.

**What is the PIN vs the access key?**  
The 4-digit PIN unlocks gym scoring for climbers. The access key unlocks lab and results for internal staff only. Never share the access key on the floor.

**Someone asked what ratio Sample A is — what do I say?**  
Do not answer. Blindness is the point. Ratios are decoded later on `/blind-test/results` by the lead or analysis team.

**PIN wrong or locked out — who do I ask?**  
Ask the test lead. They set the PIN in WordPress → Settings → Blind Test. Do not guess the access key on the gym page.

**Can I change a score after Save?**  
Not from the phone form. Tell the lead — they can review entries in WordPress → Blind Scores and decide whether to re-score.

**Skip vs score 3 — what’s the difference?**  
Skip / N/A means you did not rate that criterion (left out of the weighted average). Score 3 means you rated it as average. Prefer Skip only when you truly could not judge that item.

**How many samples do I need to finish today?**  
Score every sample letter shown on the gym page (bags enabled for this session). Ask the lead if unsure.

### Lead

**Where do I change today’s PIN and which samples are enabled?**  
WordPress Admin → Settings → Blind Test. Update PIN, enable sample codes, map ratios, Save. Tell the floor the new PIN.

**Someone submitted the same Sample twice — is that OK?**  
Yes. Extra submissions are kept and averaged. Clear mistakes can be noted / removed in Blind Scores by the lead.

**How do I start a new session or round without confusing the team?**  
Announce Round (R1/R2/R3) and gym before scoring. Update WP default round or PIN if the session changes. Climbers must pick the correct Round on the gym form.

### Lab

**Can I leave a cell empty?**  
Yes. Analysis only uses entered values — leave blanks rather than guessing.

**I saved the wrong Pass/Fail — how do I fix it?**  
Correct the gate on `/blind-test/lab` for that ratio and round, then Save again (same row is updated).

**Do R1 / R2 / R3 need separate rows?**  
Yes. Use the Round tabs and save each round separately for multi-round averages and stability.

### Analysis

**Why is a blend missing from the ranking?**  
Usually no gym scores yet, or a hard-gate Fail excluded it. Check Blind Scores / Lab Data and the Gate column on Results.

**What does “diff < 0.3” mean in practice?**  
Treat those blends as a performance tie. Prefer lower SD (stability) or lower cost instead of a tiny score winner.

**Who can see the CSV and decoded ratios?**  
Only people with the access key. Do not forward decoded CSVs or `/blind-test/results` to climbers.

---

## Lead / tech only

Skip this if you are scoring bags on the floor.

| Issue | Fix |
|-------|-----|
| Lab/Results says access key is not set | Add `BLIND_TEST_ACCESS_KEY` on Vercel (match `.env.local`), then Redeploy |
| Incorrect access key | Typed value ≠ env value; confirm with whoever manages hosting |
| Gym save fails / plugin errors | Activate Grippy Blind Test plugin; check WP Application Password |
| No sample buttons on gym form | Enable sample codes in WP → Settings → Blind Test |

---

## Security

| Share with climbers | Internal only |
|---------------------|---------------|
| `/blind-test` link | `/blind-test/lab`, `/blind-test/results` |
| Session PIN | Access key |
| Sample letters | Code→ratio map, decoded CSV |
