export const metadata = {
  title: 'Cookie Policy — Operator AI',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[780px] mx-auto px-6 py-16 lg:py-24">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Legal</div>
        <h1 className="font-display text-[36px] lg:text-[44px] leading-tight mb-2">Cookie Policy</h1>
        <p className="text-[13px] text-fg-muted mb-10">Last updated: April 15, 2026</p>

        <div className="prose-gold space-y-8 text-[14.5px] text-fg-soft leading-relaxed">
          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">What Cookies We Use</h2>
            <p><strong className="text-fg">Essential Cookies:</strong> Required for authentication and security. These include Supabase session cookies that keep you logged in. These cannot be disabled.</p>
            <p><strong className="text-fg">Preference Cookies:</strong> Store your language preference (ES/EN), theme, and UI state. Stored in localStorage, not transmitted to servers.</p>
            <p><strong className="text-fg">Payment Cookies:</strong> Stripe uses cookies for fraud prevention during checkout. See Stripe&apos;s cookie policy for details.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">What We Don&apos;t Use</h2>
            <p>Operator AI does <strong className="text-fg">NOT</strong> use: advertising cookies or trackers; analytics cookies (Google Analytics, Facebook Pixel, etc.); third-party marketing cookies; cross-site tracking of any kind.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">Your Control</h2>
            <p>You can clear cookies and localStorage at any time through your browser settings. Essential cookies are required for the app to function. Clearing them will log you out.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">Contact</h2>
            <p>Questions? Email us at <a href="mailto:privacy@operatoraiapp.com" className="text-gold hover:underline">privacy@operatoraiapp.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
