import "./globals.css";

export const metadata = {
  title: "AI HR Agent",
  description: "Job search and applications with a helpful assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
