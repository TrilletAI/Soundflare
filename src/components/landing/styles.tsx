"use client"

// Fonts and shared effects for the marketing pages (landing + blog)
export function LandingStyles() {
  return (
    <>
      <style jsx global>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap');

        .soundflare-landing-font {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .sf-grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .sf-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black 30%, transparent 75%);
        }
        @keyframes sf-wave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        .sf-wave-bar {
          transform-origin: center;
          animation-name: sf-wave;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @keyframes sf-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .sf-marquee { animation: sf-marquee 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sf-wave-bar, .sf-marquee { animation: none; }
        }
      `}</style>
    </>
  )
}
