import test from "node:test";
import assert from "node:assert/strict";
import { calculateLevel, calculateStreak, calculateXpGain, getRank } from "./progress-utils.mjs";

test("calculateLevel uses the expected XP thresholds", () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(99), 1);
  assert.equal(calculateLevel(100), 2);
  assert.equal(calculateLevel(250), 3);
});

test("calculateStreak handles daily continuity", () => {
  assert.equal(calculateStreak(null, new Date("2026-07-18T12:00:00Z")), 1);
  assert.equal(calculateStreak(new Date("2026-07-17T12:00:00Z"), new Date("2026-07-18T12:00:00Z")), 2);
  assert.equal(calculateStreak(new Date("2026-07-15T12:00:00Z"), new Date("2026-07-18T12:00:00Z")), 1);
});

test("calculateXpGain maps quest difficulty to XP", () => {
  assert.equal(calculateXpGain("Easy"), 10);
  assert.equal(calculateXpGain("Medium"), 20);
  assert.equal(calculateXpGain("Boss"), 50);
});

test("getRank returns the user position by XP", () => {
  assert.equal(getRank([{ xp: 300 }, { xp: 100 }, { xp: 250 }], { xp: 100 }), 3);
  assert.equal(getRank([{ xp: 300 }, { xp: 100 }, { xp: 250 }], { xp: 300 }), 1);
});
