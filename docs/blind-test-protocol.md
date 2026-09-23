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
7. Confirm Vercel has `BLIND_TEST_ACCESS_KEY` (redeploy after adding)

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

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wrong PIN | Check WP Settings PIN — not the access key |
| `BLIND_TEST_ACCESS_KEY is not set` | Add env on Vercel and Redeploy |
| Incorrect access key | Value mismatch with env |
| No sample buttons | Enable samples in WP settings |
| Climber asks for the ratio | Do not answer; decode later on results |

---

## Security

| Share with climbers | Internal only |
|---------------------|---------------|
| `/blind-test` link | `/blind-test/lab`, `/blind-test/results` |
| Session PIN | Access key |
| Sample letters | Code→ratio map, decoded CSV |
