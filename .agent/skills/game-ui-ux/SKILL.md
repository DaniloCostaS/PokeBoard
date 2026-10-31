---
name: game-ui-ux
description: Specialized game UI and UX design skill for crafting modern game interfaces, character inspection sheets, HUDs, tactile menus, and modal dialogs. Use when styling, structuring, or refining in-game visual components, layout hierarchy, and player inspection screens.
---

# Game UI / UX Design & Architecture

## Core Philosophy
1. **The Character/Unit is the Hero:** When inspecting a character, card, or Pokémon, the entity itself takes center stage. Use dynamic framing, elemental ambient glows, high-resolution sprites, and clear visual hierarchy.
2. **Tactile & Diegetic Feel:** Game UI should feel physical and responsive—not like a generic enterprise SaaS dashboard. Utilize subtle glassmorphism, metallic trims, type-colored ambient glows, and clean micro-badges.
3. **Information Hierarchy (Scan & Drill-down):**
   - **Hero Tier:** Identity (Name, ID, Sprites, Shiny sparkle, Primary/Secondary Types, Level).
   - **Vital Gauges:** Immediate resources (HP bar with health thresholds green/yellow/red, XP curve, Affection/Happiness).
   - **Combat Attributes:** Radar/Grid of key stats (HP, Atk, Def, Speed) paired with genetics (IVs) and upgrades.
   - **Synergy & Progression:** Evolutionary pathway, equipment/held items, and Dex mastery bonuses.
4. **Consistency with Game Aesthetic:** Honor existing color palettes, tokens (`--pb-*`), typography, and border treatments while modernizing layout depth, contrasts, and micro-animations.

## Layout Best Practices
- **Card-Based Modals:** Encapsulate inspect screens inside well-proportioned card frames (max-width ~480px to 540px on mobile/desktop), avoiding harsh borders or empty whitespace.
- **Header Identity Strip:** Dynamically tint or glow the header according to the primary element/type (Fire orange, Water cyan-blue, Grass emerald, Electric amber, etc.).
- **Gauges with Personality:** Use animated or gradient fills with high-contrast numerical readouts.
- **Interactive Elements:** Equip/Remove buttons and Close buttons should have clear hover, active, and focus states with tactile feedback.
