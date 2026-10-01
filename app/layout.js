import "./globals.css";

export const metadata = {
  title: "Advanced Voltage Drop & Cable Sizing Calculator",
  description:
    "Professional electrical distribution engineering tool for voltage drop verification and cable sizing per standard mV/A/m conductor tables, with parallel-run and cumulative multi-section support.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="grid-lines min-h-screen">{children}</div>
      </body>
    </html>
  );
}
