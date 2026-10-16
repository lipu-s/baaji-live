import './globals.css';

export const metadata = {
  title: 'Baaji Live - Live Streaming',
  description: 'Watch Live TV Channels on Android Phone and Google TV',
};

export default function RootLayout({ children }) {
  return (
    <html lang="or">
      <body className="bg-slate-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
