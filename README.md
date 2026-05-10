# Little Helpers

A mobile-first React MVP that helps parents turn what's in the fridge into kid-friendly recipes, powered by the Claude API.

## Deploy to Vercel (from your phone)

1. Go to [vercel.com](https://vercel.com) and **Sign up with GitHub** (free).
2. Tap **Add New… → Project**.
3. Find **`food_app_for_parents_with_kids`** in the list and tap **Import**.
4. **Important — change the branch:** under "Git Repository", expand the options and switch the branch from `main` to **`claude/little-helpers-app-gG0Za`**.
5. (Optional) Open **Environment Variables** and add:
   - **Name:** `VITE_ANTHROPIC_API_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com/)
   Skip this and the app still works with built-in sample recipes.
6. Tap **Deploy**. After ~1–2 minutes you get a public URL like `little-helpers-xxxx.vercel.app`.

> ⚠️ Anything starting with `VITE_` is **inlined into the JS bundle**, so the key is visible to anyone who looks at your site. For a personal demo that's fine; for a real launch put the key behind a tiny serverless route (e.g. `/api/recipe.js` on Vercel).

Every push to the `claude/little-helpers-app-gG0Za` branch redeploys automatically.

## Run locally

```bash
npm install
cp .env.example .env        # add your Anthropic key
npm run dev                 # http://localhost:5173
```

## Stack

- React 18 + Vite
- Tailwind CSS (`#2D5016` green, `#E8610A` orange, `#F5F0E8` cream, `Inter` font)
- `@anthropic-ai/sdk` calling `claude-sonnet-4-20250514` from the browser
- `localStorage` for the profile, favorites, week plan, shopping list, ratings, cook history, badges, daily suggestion
- Food photos via `image.pollinations.ai` (no key, deterministic per recipe)

## Screens

1. **Onboarding** — parent name, kid name + age + picky toggle, 9 allergies/restrictions, cooking skill (Beginner / Comfortable / Confident).
2. **Home** — greeting card with mascot + streak/badge chips, today's auto-suggested recipe, time + energy chips, fridge input with "still have these from last time?" memory, 8 popular ingredients, **Find Recipe** (green), **🆘 Rescue Mode** (3 levels), **🍟 Healthy Clone** (homemade McNuggets etc.).
3. **Recipe** — hero photo with overlay, kid-friendly reason chip, calories/protein/carbs row, ingredients with have-it dots, steps with per-step timers, **Cook This!** opens cook-mode, **Next Idea**, **My kid won't eat this** swap, heart to save.
4. **Cook Mode** — full-screen one-step-at-a-time guide with countdown ring, beep + vibrate alarm, **Done Cooking** asks 👎 / 😐 / 👍 to learn what the family likes.
5. **Plan** — 7 day cards, **Auto-fill Week** (single batched call), **Generate Shopping List** merges all missing items.
6. **Shopping List** — Vegetables / Dairy / Meat / Pantry / Frozen sections, servings slider rescales quantities, **Share** button (native share sheet, clipboard fallback).
7. **Favorites** — saved recipes grid with photos.

## Layout

Mobile-first, max-width 390 px, mounted inside a `PhoneFrame` so it looks right on desktop too.
