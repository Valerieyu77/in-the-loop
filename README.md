# Daily Brief 📰

> A bilingual learning companion for filling everyday knowledge gaps — built for people who moved to a new culture and want to catch up, one small piece at a time.

**🌐 Live Demo:** [daily-brief-lemon.vercel.app](https://daily-brief-lemon.vercel.app)

---

## 💡 Why I'm Building This

After moving to the U.S., I realized I had real gaps in everyday knowledge — not just news, but the kind of general literacy that makes you part of conversations: **U.S. politics, geography, sports culture (NFL, NBA, NCAA, baseball), world events, history, food culture.** People around me would casually reference things I'd never heard of, and I'd nod along.

The problem wasn't motivation — I genuinely wanted to learn. The problem was that existing tools didn't fit how learning actually happens in real life:

- **NYT-style daily briefings** are long and dense. As an English learner, I'd lose steam after two paragraphs.
- **Wikipedia rabbit holes** are deep but unstructured — no progress tracking, no sense of "I'm getting somewhere."
- **Chinese news apps** are easy to read but don't help me improve English or build context for the place I now live in.

**Daily Brief is designed for the small pockets of time in a day** — waiting for coffee, on the bus, before bed. The goal isn't to make you study; it's to make catching up on the world feel light, rewarding, and sustainable.

---

## 🧩 Two Modules, One Goal

The app is built around two complementary ways to fill knowledge gaps:

### 📰 News Module — Stay Current Without Drowning

Each news item is presented in three layers, so you choose your own depth:

1. **One English headline** — short, scannable. You instantly know if you care.
2. **Tap to expand → Chinese explanation** — understand the background, key terms, and why it matters, in your native language first.
3. **Read the original article** — once you've got the context, the English original feels natural instead of intimidating.

This three-layer structure removes the "wall of text" problem while keeping English exposure intact. News will be sourced from authoritative outlets (BBC, Reuters, AP) via a real-time news API, with AI-generated Chinese summaries.

### 📚 Knowledge Module — Build Lasting General Literacy

This is the heart of the product. Unlike news (which expires), knowledge **accumulates**. The module is built around three principles:

**1. Hierarchical categories you can choose from.**
Pick the areas you care about, and drill down as deep as you want:

**2. Mastery percentage for every category.**
Each topic has a progress bar, like Duolingo. As you learn and answer questions correctly, the percentage grows. The goal: turn vague "I should learn more about X" into a concrete, visible "I've mastered 60% of Italian food culture."

**3. Bite-sized, AI-generated content.**
Knowledge cards and quizzes are generated dynamically, so the content stays fresh and the system can adapt to what you already know. No static question bank to maintain.

The point isn't to make you an expert. It's to give you **enough to participate** — enough to follow a conversation, get a joke, ask a smart follow-up question.

---

## 🎯 Features

### ✅ Currently Live (v0.1)
- Three-layer news cards (English headline → Chinese explanation → original)
- Knowledge cards across multiple categories
- Quick quiz with instant feedback and explanation
- Daily streak tracker
- Mobile-friendly responsive design

### 🚧 In Development
- [ ] Real-time news via news API (NewsData.io)
- [ ] AI-generated Chinese explanations (Claude / Gemini API)
- [ ] Hierarchical knowledge category selection
- [ ] Mastery percentage system per category
- [ ] User accounts & cross-device sync

### 🔮 Future
- [ ] Personalized daily push notifications
- [ ] iOS app via React Native
- [ ] TestFlight beta with friends
- [ ] App Store launch
- [ ] Subscription model to support development

---

## 🛠 Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (frameworks coming as the project grows)
- **Hosting:** Vercel
- **Version Control:** Git + GitHub
- **Planned:** NewsData.io API, Claude/Gemini API, React Native

---

## 🗺 Roadmap

| Phase | Goal | Status |
|---|---|---|
| 1 | Static prototype + deploy | ✅ Done |
| 2 | Real news API integration | 🚧 In progress |
| 3 | AI-generated Chinese content | ⏳ Planned |
| 4 | Knowledge category system + mastery tracking | ⏳ Planned |
| 5 | User accounts & data persistence | ⏳ Planned |
| 6 | Mobile app (React Native) | ⏳ Planned |
| 7 | App Store launch | 🎯 Goal |

---

## 🧠 About the Development Process

This project is being built using an **AI-assisted development workflow** (sometimes called "vibe coding") — I describe what I want in natural language, AI helps generate the code, and I'm responsible for product decisions, user experience, debugging, and iteration direction.

This isn't a shortcut — it's a different kind of craft. Every design decision, every feature priority, every user-facing detail comes from me. AI is the tool, like Figma is to a designer or a compiler is to an engineer. The full development history is recorded in the commit log.

---

## 👋 About Me

I'm a student at UIUC, building this as my first complete independent project. The goal: ship something real, learn the full stack of modern indie development, and (hopefully) build something other people actually want to use.

If you have feedback, ideas, or just want to say hi — feel free to open an issue or reach out.

---

*Last updated: April 2026*
