:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #f5f7fb;
  background: #07111f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(57, 131, 255, 0.18), transparent 34%),
    #07111f;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

.hero,
.dashboard {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.heroCard {
  max-width: 760px;
  padding: 56px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  background: rgba(13, 27, 45, 0.86);
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.3);
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  font-size: clamp(42px, 7vw, 78px);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.heroCard p {
  max-width: 640px;
  color: #aebbd0;
  font-size: 19px;
  line-height: 1.7;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 16px;
  color: #71a7ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.button {
  display: inline-flex;
  margin-top: 18px;
  padding: 14px 20px;
  border-radius: 12px;
  background: #f5f7fb;
  color: #07111f;
  font-weight: 800;
}

.dashboard {
  padding: 48px 0 80px;
}

.topbar {
  margin-bottom: 28px;
}

.topbar h1 {
  font-size: 44px;
  margin-bottom: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 26px;
}

.card,
.panel {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(13, 27, 45, 0.86);
  border-radius: 20px;
}

.card {
  padding: 24px;
}

.card span {
  color: #9dabc0;
}

.card strong {
  display: block;
  margin-top: 12px;
  font-size: 36px;
}

.panel {
  padding: 26px;
}

.panelHeader h2 {
  margin-bottom: 18px;
}

.jobList {
  display: grid;
  gap: 12px;
}

.jobRow {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.jobRow p {
  margin-bottom: 0;
  color: #9dabc0;
}

.jobMeta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.jobMeta span {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(113, 167, 255, 0.12);
  color: #bcd4ff;
  font-size: 13px;
  text-transform: capitalize;
}

@media (max-width: 760px) {
  .heroCard {
    padding: 28px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .jobRow {
    flex-direction: column;
  }

  .jobMeta {
    flex-wrap: wrap;
  }
}
