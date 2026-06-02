# World Cup 2026 Fixture Correction Summary
**Date:** 2026-06-02  
**Source:** Wikipedia group/knockout stage pages (extracted via WebFetch)  
**Reference file:** `WORLD_CUP_OFFICIAL_FIXTURE_SOURCE.md`  
**File patched:** `src/lib/calendar-data.ts`

---

## Result
- **104 matches maintained** (72 group + 16 R32 + 8 R16 + 4 QF + 2 SF + 1 3rd + 1 Final)
- TypeScript: **0 errors**
- Build: **✓ pass**
- Countdown Hero: **consistent** (`2026-06-11T13:00:00-06:00` = 13:00 CT Mexico)

---

## Scope of changes

### What was wrong in the original file
The original `calendar-data.ts` contained estimated/placeholder scheduling data that did not match the official FIFA 2026 schedule. Virtually every group stage match had incorrect dates, times, venues, and/or home/away team assignments.

### Group stage — corrections per group

| Group | Date errors | Time errors | Venue errors | Team order errors |
|-------|------------|-------------|--------------|-------------------|
| A     | 4/6        | 4/6         | 3/6          | 2/6 |
| B     | 6/6        | 6/6         | 6/6          | 2/6 |
| C     | 4/6        | 3/6         | 3/6          | 4/6 |
| D     | 6/6        | 5/6         | 6/6          | 3/6 |
| E     | 4/6        | 5/6         | 6/6          | 3/6 |
| F     | 6/6        | 6/6         | 6/6          | 4/6 |
| G     | 6/6        | 5/6         | 6/6          | 4/6 |
| H     | 6/6        | 4/6         | 5/6          | 2/6 |
| I     | 6/6        | 5/6         | 6/6          | 4/6 |
| J     | 6/6        | 5/6         | 6/6          | 4/6 |
| K     | 6/6        | 6/6         | 6/6          | 4/6 |
| L     | 6/6        | 6/6         | 6/6          | 4/6 |

### Key structural corrections (group stage)

- **Group A MD1:** Opening match MEX vs RSA was 20:00 → corrected to **13:00 CT**. 2nd match (KOR vs CZE) moved from June 12/AT&T Dallas → **June 11/Estadio Akron Guadalajara**.
- **Group B MD1:** CAN vs BIH moved from BC Place Vancouver → **BMO Field Toronto** (June 12, 15:00 ET). QAT vs SUI moved from Arrowhead Kansas City → **Levi's Stadium San Francisco** (June 13, 12:00 PT).
- **Group D:** USA vs PAR opening match moved from MetLife June 14 → **SoFi Stadium June 12 18:00 PT**.
- **Group F:** NED vs JPN moved from SoFi June 15 → **AT&T Stadium Dallas June 14 15:00 CT**. SWE vs TUN moved from Hard Rock → **Estadio BBVA Monterrey**.
- **Group G:** BEL vs EGY moved from Lincoln Financial June 16 → **Lumen Field Seattle June 15 12:00 PT**.
- **Group H:** ESP vs CPV moved from Estadio BBVA June 16 → **Mercedes-Benz Atlanta June 15 12:00 ET**.
- **Group I:** FRA vs SEN moved from June 18 → **June 16 15:00 ET**. IRQ vs NOR moved from SoFi → **Gillette Stadium Boston**.
- **Group J:** ARG vs ALG moved from Hard Rock June 19 → **Arrowhead Kansas City June 16 20:00 CT**.
- **Group K:** All 6 matches had wrong dates (off by 3–13 days) and wrong venues.
- **Group L:** ENG vs CRO moved from BMO Toronto June 21 → **AT&T Dallas June 17 15:00 CT**.

### Knockout stage corrections

| Phase | Dates before | Dates after | Key venue changes |
|-------|-------------|-------------|-------------------|
| R32   | Jul 5–12    | **Jun 28 – Jul 3** | Complete reshuffle: SoFi, NRG, Gillette, BBVA, AT&T, MetLife, Azteca, MB, Lumen, Levi's, BMO, BC Place, Hard Rock, Arrowhead |
| R16   | Jul 14–17   | **Jul 4–7**  | Lincoln Financial, NRG, MetLife, Azteca, AT&T, Lumen, Mercedes-Benz, BC Place |
| QF    | Jul 19–20   | **Jul 9–11** | Gillette, SoFi, Hard Rock, Arrowhead |
| SF    | Jul 22–23   | **Jul 14–15** | AT&T Dallas, Mercedes-Benz Atlanta (was SoFi) |
| 3rd   | Jul 25      | **Jul 18**   | Hard Rock Miami ✓ (same) |
| Final | Jul 26      | **Jul 19**   | MetLife ✓ (same venue, time 18:00→**15:00 ET**) |

---

## Countdown Hero
- `CountdownHero.tsx` line 6: `new Date('2026-06-11T13:00:00-06:00')`
- **Status: CONSISTENT** — matches corrected A-1-1 (13:00 CT, Estadio Azteca). No change needed.

---

## NEEDS_CONFIRMATION
None. All 104 matches were extracted from Wikipedia with explicit date, time, venue, and team data.  
The knockout bracket slot assignments (which group feeds which R32 match) remain TBD placeholders — this is correct as the bracket depends on group results.

---

## Files changed
- `src/lib/calendar-data.ts` — 104 matches corrected
- `WORLD_CUP_OFFICIAL_FIXTURE_SOURCE.md` — created (source of truth)
- `WORLD_CUP_FIXTURE_CORRECTION_SUMMARY.md` — this file
