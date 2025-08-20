import ChatWidget from "../components/ChatWidget.jsx";

export default function Page() {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "system-ui" }}>
      <h1>AI HR Agent</h1>
      <p>Chat is ready at the bottom right.</p>
      <ChatWidget />
    </main>
  );
}
