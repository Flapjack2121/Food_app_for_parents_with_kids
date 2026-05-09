# Little Helpers

A mobile-first React MVP that helps parents turn what's in the fridge into kid-friendly recipes, powered by the Claude API.

## Stack

- React 18 + Vite
- Tailwind CSS (palette: dark green `#2D5016`, orange `#E8610A`, cream `#F5F0E8`)
- `@anthropic-ai/sdk` (`claude-sonnet-4-20250514`)
- `localStorage` for the family profile, favorites, and the active shopping list

## Setup

```bash
npm install
cp .env.example .env        # add your Anthropic key
npm run dev
```

Set `VITE_ANTHROPIC_API_KEY` in `.env`. Without a key the app falls back to a built-in mock recipe so you can still click through every screen.

> Browser-side API calls use `dangerouslyAllowBrowser: true`. For anything beyond a local demo, proxy requests through a backend so the key isn't shipped to clients.

## Screens

1. **Onboarding** — name, kid count, ages, allergies, picky-eater toggle. Persisted to `lh.profile`.
2. **Home** — greeting, fridge input, 8 popular-ingredient quick-tags, green **Find Recipe**, orange **Lazy Mode** (≤10 min, ≤4 ingredients).
3. **Recipe** — image card, prep-time + kid-friendly badges, stat chips, ingredients, steps, **Cook This!** → shopping list, **Next Idea**, heart to save.
4. **Shopping List** — only the missing items, grouped Vegetables / Dairy / Meat / Other, checkboxes, "X of Y items checked", clear-checked.
5. **Favorites** — grid of saved recipes; tap to reopen.

## Layout

Designed for ≤390 px width. The whole app is mounted inside a `PhoneFrame` shell so it looks right on desktop too.
