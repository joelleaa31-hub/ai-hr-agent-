import ChatWidget from "../components/ChatWidget.jsx";
import JobSearch from "../components/JobSearch.jsx";

export default function Page() {
  return (
    <main className="container">
      <section className="hero" style={{marginBottom:24}}>
        <h1 className="gradient-text" style={{fontSize:44,margin:"0 0 8px 0"}}>AI HR Agent</h1>
        <p style={{color:"var(--muted)",margin:0}}>Ask in English, Français, or العربية — or browse open roles below.</p>
        <div style={{marginTop:16,display:"flex",gap:12}}>
          <a href="#jobs" className="btn">View Openings</a>
          <a href="#chat" className="btn" style={{background:"linear-gradient(90deg,var(--brand-3),var(--brand-2))"}}>Chat with us</a>
        </div>
      </section>
      <JobSearch />
      <div id="chat" />
      <ChatWidget />
    </main>
  );
}
