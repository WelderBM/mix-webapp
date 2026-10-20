# Chapter 1: Growth

## Core Idea
Mobile isn't a future consideration or an afterthought version of the desktop site — by every growth metric (shipments, traffic, revenue, engagement) it had already overtaken or was about to overtake desktop by the time this book was written, and starting with the mobile web (not just native apps) is the fastest way to capture that growth without waiting on platform-specific tooling or app-store approval.

## Frameworks Introduced
- **Mobile First** (the book's namesake framework): design and build the mobile experience *before* the desktop one, rather than shrinking a desktop design down to fit a small screen afterward.
  - When to use: at the start of any new product or redesign, before any layout or feature decisions are locked in.
  - How: treat mobile as the primary design target — its constraints (Ch 2) force prioritization decisions that then get applied consistently across desktop too, not the reverse.
- **Mobile web vs. native, not mobile web *or* native**: the two aren't mutually exclusive; the deciding factors are which one you need, not which one is "better."
  - When to use: whenever scoping a new mobile initiative and the native-vs-web question comes up.
  - How: reach for native only when the product genuinely needs deep hardware access, background processes, in-app purchases, or app-store discovery. Default to mobile web otherwise — it reaches every platform without per-OS rewrites (Objective-C, Java, Silverlight, C++, WebWorks...), updates instantly without an app-store review cycle, and supports rapid A/B testing.

## Key Concepts
- **Mobile web**: the browser-based experience on a mobile device, as opposed to a platform-specific native application.
- **Native application**: platform-specific software (iOS, Android, etc.) with direct access to system/hardware resources.
- **Feature phone**: a basic mobile device without a modern smartphone-class browser or app ecosystem — still the majority of handsets by volume at the time of writing, but a small share of actual traffic.
- **Data traffic vs. handset share**: the gap between how many devices exist versus how much traffic/value they generate — smartphones were ~13% of global handsets but 78% of handset traffic (Cisco).

## Mental Models
- Think of the desktop web's "1024×768 pixel beachhead" as a *luxury* that let bloat accumulate for over a decade; mobile removes that luxury and forces the same discipline you should have had all along.
- Think of a web link as a promise: "web links don't open apps, they go to web pages" (Jason Grigsby) — if your product has no mobile web presence, every shared/searched/emailed link to your content breaks for mobile users, regardless of how good your native app is.
- Use "the desktop is diving, mobile is snorkeling" (Rachel Hinman) when deciding what kind of session length and task depth to design for on mobile — short, frequent bursts, not long focused dives.

## Anti-patterns
- **Treating mobile as a stripped-down afterthought of the desktop site**: this was the default approach for years and produced consistently bad experiences (2 minutes to render a page of text links on a 2006-era browser was normal).
- **Betting only on native because it "feels" more legitimate**: ignores that mobile web often carries *more* usage than native apps for the same product — 14% of Twitter's members used the mobile web vs. 8% on the native iPhone app and 7% on Blackberry; every other native app trailed at under 4% each. The same pattern held for Facebook.
- **Assuming smartphone growth projections are aggressive enough**: multiple "bold" analyst predictions (smartphones out-shipping PCs by 2012, mobile overtaking PC as the primary web-access device by 2013) were hit *early*, not on schedule — plan capacity and roadmaps assuming the growth curve is understated, not overstated.

## Worked Example
The book's central "why mobile web, not just native" case study is a three-way comparison across Twitter, Facebook, and general web-traffic data:
- **Twitter (2010)**: 14% of members used the mobile *web* experience, vs. 8% on the native iPhone app and 7% on the native Blackberry app. Every other native client individually accounted for under 4% of users.
- **Facebook**: ~19% of all posts were created via the mobile web experience, while the native iPhone, Android, and Blackberry apps each accounted for roughly 4% of posts.
- **The mechanism**: native apps actually *increase* mobile web traffic, because any link shared or tapped inside a native app opens in the device's browser. More native app usage indirectly drives more mobile web usage — the two channels reinforce each other rather than compete.
- **The conclusion Wroblewski draws**: if you had to pick only one channel to build first with limited resources, the data says mobile web, not native — it has the broadest reach (every platform, no per-OS rewrite), the fastest iteration loop (no app-store review, easy A/B testing), and it's already carrying comparable or greater usage than dedicated native clients for content-driven products.

## Key Takeaways
1. Mobile internet usage was compounding faster than even bullish analyst forecasts — plan for the growth curve to be understated.
2. Native and mobile web are complementary tools, not competing bets — choose native specifically for deep hardware access, background processes, or app-store monetization; default to mobile web for reach, update velocity, and cross-platform cost.
3. A native app doesn't eliminate the need for a mobile web presence — shared links, search results, and social posts all route through the browser regardless of what native apps you've shipped.
4. Usage differs sharply even within "smartphones" — device capability gaps (browser quality, network) mean a one-size-fits-all mobile strategy still has to account for real variance.
5. The core value of your product doesn't change based on device — don't dumb down mobile content just because the screen is smaller; the audience's needs are the same, only the context of use differs (this sets up Ch 2's constraints).

## Connects To
- **Ch 2 (Constraints)**: explains *why* going mobile first (not mobile-last) produces better designs — the screen/network/attention limits described there are the mechanism behind the discipline this chapter argues for.
- **Ch 3 (Capabilities)**: the flip side of constraints — once you've committed to mobile web as a first-class channel, these are the new capabilities (location, sensors, touch) it unlocks that desktop never had.
- **External**: Jason Grigsby's writing on mobile context; Ethan Marcotte's *Responsive Web Design* (referenced throughout the book, expanded in Ch 7).
