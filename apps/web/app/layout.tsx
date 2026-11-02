import type { Metadata } from "next";
import "./globals.css";
import UtmCapture from "../src/components/UtmCapture";
import Providers from "../src/components/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TekRovia | Learning to Placement",
  description: "Your journey from learning to career success.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Restore auth cookie from localStorage BEFORE page renders
            so middleware finds it on the next navigation/refresh */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var auth = localStorage.getItem('tekrovia_auth');
            if (auth) {
              var parsed = JSON.parse(auth);
              var token = parsed && parsed.state && parsed.state.token;
              if (token && token.length > 10) {
                var maxAge = 60 * 60 * 24 * 7;
                document.cookie = 'tekrovia_token=' + token + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
              }
            }
          } catch(e) {}
        `}} />
      </head>
      <body>
        <Providers>
          <UtmCapture />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
