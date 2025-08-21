import "./globals.css";
export const metadata = { title: "AI HR Agent", description: "Multilingual HR assistant" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
