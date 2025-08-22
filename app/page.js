// app/page.js
import JobSearch from "./components/JobSearch.jsx";
import ChatWidget from "./components/ChatWidget.jsx";

export default function Page() {
  return (
    <main className="container">
      {/* Top Navigation */}
      <nav
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div className="gradient-text" style={{ fontWeight: 700 }}>
          AI HR Agent
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="btn" href="#jobs">Open Positions</a>
          <a className="btn" href="/?location=Paris#jobs">Paris</a>
          <a className="btn" href="/?location=London#jobs">London</a>
          <a className="btn" href="/?location=Dubai#jobs">Dubai</a>
          <a className="btn" href="/?location=Remote#jobs">Remote</a>
          <a className="btn" href="#about">About</a>
          <a className="btn" href="#process">Process</a>
          <a className="btn" href="#contact">Contact</a>

          {/* IMPORTANT: link only. No onClick here. */}
          <a
            className="btn"
            href="#chat"
            style={{ background: "linear-gradient(90deg,var(--brand-3),var(--brand-2))" }}
          >
            Chat with us
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ marginBottom: 24 }}>
        <h1 className="gradient-text" style={{ fontSize: 44, margin: "0 0 8px 0" }}>
          Find your next role
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Browse openings or ask our assistant (EN / FR / AR).
        </p>
      </section>

      {/* Jobs */}
      <JobSearch />

      {/* Info sections */}
      <section id="about" className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>About Us</h2>
        <p style={{ color: "var(--muted)" }}>
          We hire globally and value craftsmanship, empathy, and impact.
        </p>
      </section>

      <section id="process" className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Hiring Process</h2>
        <ol style={{ marginTop: 6 }}>
          <li>Quick apply</li>
          <li>Recruiter screen</li>
          <li>Technical/role interview</li>
          <li>Team panel</li>
          <li>Offer</li>
        </ol>
      </section>

      <section id="contact" className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Contact</h2>
        <p style={{ color: "var(--muted)" }}>
          Questions? Click <a href="#chat">Chat with us</a> or email careers@example.com.
        </p>
      </section>

      {/* Anchor for the widget */}
      <div id="chat" />
      <ChatWidget />
    </main>
  );
}
