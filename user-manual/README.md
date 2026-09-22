# Study English — User Manual

Modern documentation website for the Study English AI-powered English learning platform.

## Overview

This is a fully static documentation website built with HTML, CSS, and vanilla JavaScript. It features a premium AI SaaS design aesthetic inspired by OpenAI, Linear, Vercel, and Notion AI.

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Home — Hero, navigation cards, overview, quick start |
| `features.html` | All platform features with visual walkthroughs |
| `ai-features.html` | AI models, system prompts, and prompt engineering |
| `ai-flow.html` | AI architecture diagrams, model table, prompt patterns |
| `tech-stack.html` | Complete technology stack documentation |

## Features

- ✅ Responsive UI (mobile, tablet, desktop)
- ✅ Light / Dark mode (auto-detects preference, persists in localStorage)
- ✅ Glassmorphism design system
- ✅ Smooth scroll animations (IntersectionObserver)
- ✅ Animated hero with canvas particles
- ✅ Interactive AI flow diagrams
- ✅ Copy-to-clipboard code blocks
- ✅ Floating navbar with blur backdrop
- ✅ Mobile hamburger menu
- ✅ Stats counter animation
- ✅ Tooltip system
- ✅ Premium hover effects with glow

## UI Design System

- **Fonts**: Inter (UI), JetBrains Mono (code)
- **Primary**: Indigo `#6366f1`
- **Accents**: Violet, Cyan, Emerald, Amber, Rose
- **Style**: Glassmorphism + Gradient glow
- **Animations**: Cubic-bezier easing, stagger effects

## How to Run

Simply open `index.html` in a browser, or use VS Code Live Server:

```bash
# With VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Or with Python
python -m http.server 8080

# Or with Node.js
npx serve .
```

## Screenshots

Place screenshots in `assets/images/`:

```
assets/images/
├── dashboard.png        ← Main dashboard
├── speaking-mode.png    ← AI speaking practice
├── ai-chat.png          ← AI chat assistant
├── vocabulary.png       ← Vocabulary learning
├── pronunciation.png    ← Pronunciation analysis
└── analytics.png        ← Analytics dashboard
```

Use the Playwright MCP prompt in `ai-flow.html` to auto-capture these screenshots.

## File Structure

```
user-manual/
├── index.html           ← Home page
├── features.html        ← Platform features
├── ai-features.html     ← AI features & prompts
├── ai-flow.html         ← AI architecture & flow
├── tech-stack.html      ← Technology stack
├── README.md            ← This file
└── assets/
    ├── css/
    │   └── style.css    ← Complete design system
    ├── js/
    │   └── app.js       ← Interactive features
    ├── images/          ← Screenshots (place here)
    └── icons/           ← Custom icons (optional)
```

## Version

`v2.0.0` — May 2026
