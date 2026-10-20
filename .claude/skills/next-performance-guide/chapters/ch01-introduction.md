# Chapter 1: Introduction to Next.js Performance Optimization

## Core Idea
Performance in Next.js requires deliberate technique on top of the framework's defaults — the guide's structure (Overview → Implementation → Keypoints per chapter) mirrors how to approach any optimization: understand the problem, apply the concrete technique, retain the essentials.

## Key Concepts
- **Performance budget**: a measurable ceiling on page weight/timing that keeps an app from growing slower over time (expanded in Ch 9).
- **Core Web Vitals**: Google's standardized UX metrics — LCP, INP, CLS (expanded in Ch 8).

## Mental Models
- Treat each optimization chapter as Overview (why it matters) → Implementation (how, in code) → Keypoints (what to retain) — the same rhythm the authors use throughout the book.

## Key Takeaways
1. Good performance in Next.js is not automatic — it requires layering framework tools (code splitting, `next/image`, `next/font`, rendering strategy choice) on top of the defaults.
2. The guide's own chapter structure is itself a usable template for documenting a team's performance practices.

## Connects To
- **Ch 9**: Development culture — turns these one-off techniques into standing team practice via performance budgets and code review checks.
