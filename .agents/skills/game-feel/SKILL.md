---
name: game-feel
description: Game feel, juiciness, and micro-interactions design skill for creating tactile, responsive, and animated game interfaces. Use when adding particle effects, shiny holographic sheens, floating animations, bar fills, and audio-visual feedback.
---

# Game Feel & Juice

## Core Principles
1. **Feedback is Layered:** Meaningful game interactions provide layered feedback (audio cues, micro-shakes, glow flashes, scale transitions).
2. **Organic Easing:** Avoid linear motions (`linear`). Use cubic-bezier easings (e.g., `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for bouncy pop-ins, `ease-out` for snappy entrances).
3. **Hero Unit Animation:**
   - Subtle idle breathing / floating effect (`@keyframes pb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`).
   - Radiant elemental backdrop glow matching the unit's type.
   - For rare/shiny units: shimmering animated sparkle particle or holographic holographic gradient angle sweep.
4. **Snappy Transitions:** Modals should scale up with a smooth pop-in (`scale(0.96) -> scale(1)`), bars should smoothly transition their widths (`transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1)`), and buttons should provide tactile click displacement (`transform: translateY(1px)`).
