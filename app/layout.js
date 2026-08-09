import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Study Buddy",
  description: "A focused study companion for students.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Inline script that runs BEFORE React hydration.
          It strips attributes injected by browser extensions (cz-shortcut-listen,
          fdprocessedid, etc.) which cause hydration mismatches because they are
          present in the live DOM but NOT in the server-rendered HTML.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var unwanted = [
                  'cz-shortcut-listen', 'fdprocessedid',
                  'data-gr-ext-installed', 'data-new-gr-c-s-check-loaded',
                  'data-gr-c-s-loaded', 'data-lt-installed',
                  'data-lp-injected', 'data-lpb-injected', 'data-bw-injected',
                  'data-dashlane-observed', 'data-dashlane-autofill',
                  'data-dashlane-show', 'data-dashlane-responsive'
                ];
                function clean(node) {
                  if (!node || node.nodeType !== 1) return;
                  var i, name, attrs = node.attributes;
                  for (i = attrs.length - 1; i >= 0; i--) {
                    name = attrs[i].name;
                    if (unwanted.indexOf(name) !== -1) {
                      node.removeAttribute(name);
                    }
                  }
                  for (i = 0; i < node.children.length; i++) {
                    clean(node.children[i]);
                  }
                }
                // 1. Immediate cleanup + 2. Watch for re-injected attributes
                function run() {
                  if (!document.body) { setTimeout(run, 0); return; }
                  clean(document.body);
                  // Use a short-lived observer to catch extension re-injection
                  var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                      if (m.type === 'attributes' && unwanted.indexOf(m.attributeName) !== -1) {
                        m.target.removeAttribute(m.attributeName);
                      }
                      if (m.type === 'childList' && m.addedNodes.length) {
                        for (var k = 0; k < m.addedNodes.length; k++) {
                          clean(m.addedNodes[k]);
                        }
                      }
                    });
                  });
                  observer.observe(document.documentElement, {
                    attributes: true, childList: true, subtree: true
                  });
                  // Disconnect after 3s — long enough for React to hydrate
                  setTimeout(function() { observer.disconnect(); }, 3000);
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', run);
                } else { run(); }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[color:var(--bg)] text-slate-100 font-sans" suppressHydrationWarning>
        <Providers>
        <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
