import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph image for the root URL.
 * Generated at request time by Next.js — no manual image needed.
 *
 * Output: 1200x630 PNG showing logo + tagline.
 */

export const runtime = 'edge';
export const alt = 'Operator AI - Your AI Marketing Operator';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0c',
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(201,168,99,0.28), transparent 55%), radial-gradient(circle at 82% 80%, rgba(180,140,80,0.22), transparent 50%), radial-gradient(circle at 50% 50%, rgba(60,50,30,0.18), transparent 70%)',
          padding: '80px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Top: brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                'linear-gradient(135deg, #d4b574 0%, #b8975e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(201,168,99,0.4)',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a0a0c"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 38,
              color: 'rgb(245,243,238)',
              letterSpacing: '-0.5px',
              fontWeight: 500,
            }}
          >
            Operator
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Tagline (large) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              color: 'rgb(245,243,238)',
              maxWidth: 1000,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Stop creating campaigns.</span>
            <span
              style={{
                background:
                  'linear-gradient(135deg, #f4d68f 0%, #d4b574 50%, #b8975e 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Start launching them.
            </span>
          </div>

          <div
            style={{
              fontSize: 26,
              color: 'rgba(245,243,238,0.65)',
              maxWidth: 800,
              fontFamily: 'sans-serif',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            Your AI marketing operator. One conversation replaces an entire creative
            team.
          </div>
        </div>

        {/* Bottom: URL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 60,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: 'rgba(245,243,238,0.45)',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
            }}
          >
            operatoraiapp.com
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(201,168,99,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontFamily: 'sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'rgb(201,168,99)',
              }}
            />
            <span>AI · Marketing · Real DNA</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
