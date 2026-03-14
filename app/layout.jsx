import "./globals.css";

export const metadata = {
  title: "Dream Planner",
  description: "Transforma sonhos em planos concretos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
