export const metadata = {
  title: 'Privacy Policy — Operator AI',
  description: 'How Operator AI handles your data.',
};

export default function PrivacyPage() {
  const updated = 'April 15, 2026';
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[780px] mx-auto px-6 py-16 lg:py-24">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Legal</div>
        <h1 className="font-display text-[36px] lg:text-[44px] leading-tight mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-fg-muted mb-10">Last updated: {updated}</p>

        <div className="prose-gold space-y-8 text-[14.5px] text-fg-soft leading-relaxed">
          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">1. Introduction</h2>
            <p>Operator AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and services.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">2. Information We Collect</h2>
            <p><strong className="text-fg">Account Information:</strong> When you create an account, we collect your email address, name, and authentication credentials. We use Supabase for secure authentication.</p>
            <p><strong className="text-fg">Usage Data:</strong> We collect information about how you use our services, including chat messages, generated images, generated videos, uploaded documents, and workflow configurations. This data is stored securely and associated with your organization.</p>
            <p><strong className="text-fg">Payment Information:</strong> Payment processing is handled by Stripe. We do not store credit card numbers on our servers. Stripe&apos;s privacy policy governs payment data handling.</p>
            <p><strong className="text-fg">Voice Data:</strong> If you use Voice Mode, audio is processed by OpenAI&apos;s Whisper for transcription and is not stored after processing. Voice fingerprints are stored locally to personalize your experience.</p>
            <p><strong className="text-fg">Memory Data:</strong> Our AI memory feature stores conversation summaries and user preferences to improve your experience. You can view and delete memory data at any time in Settings &gt; Memory.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">3. How We Use Your Information</h2>
            <p>We use collected information to: provide and maintain our services; process your transactions; personalize your experience through AI memory; improve our AI models and service quality; communicate with you about updates and support; comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services to provide our functionality:</p>
            <p><strong className="text-fg">OpenAI</strong> — Chat (GPT-4o), voice transcription (Whisper), voice synthesis. Data is processed according to OpenAI&apos;s API data usage policy and is not used to train their models.</p>
            <p><strong className="text-fg">Anthropic</strong> — Chat (Claude). Data is processed according to Anthropic&apos;s API policy and is not used for training.</p>
            <p><strong className="text-fg">Google</strong> — Chat (Gemini), video generation (Veo 3.1), image generation (Imagen 4). Data is processed per Google&apos;s Gemini API terms.</p>
            <p><strong className="text-fg">Replicate</strong> — Image generation (Flux 2 Pro). Data is processed per Replicate&apos;s terms.</p>
            <p><strong className="text-fg">Stripe</strong> — Payment processing. See Stripe&apos;s privacy policy.</p>
            <p><strong className="text-fg">Supabase</strong> — Database and authentication. Data is stored in Supabase&apos;s EU/US infrastructure.</p>
            <p><strong className="text-fg">Brave Search</strong> — Web search functionality. Queries are anonymous.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Chat history, generated content, and uploaded documents are stored until you delete them. You can delete individual items or request complete account deletion at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures including: encryption in transit (TLS 1.3) and at rest; row-level security (RLS) ensuring data isolation between organizations; secure API key management; regular security audits; CORS protection and rate limiting; Content Security Policy headers.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">7. Your Rights</h2>
            <p>You have the right to: access your personal data; correct inaccurate data; delete your data (&quot;right to be forgotten&quot;); export your data in a portable format; opt out of AI memory features; withdraw consent at any time.</p>
            <p>To exercise these rights, visit Settings in the app or contact us at <a href="mailto:privacy@operatoraiapp.com" className="text-gold hover:underline">privacy@operatoraiapp.com</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">8. Data Deletion</h2>
            <p>You can delete your account and all associated data at any time by visiting Settings &gt; Billing &gt; Delete Account, or by contacting <a href="mailto:privacy@operatoraiapp.com" className="text-gold hover:underline">privacy@operatoraiapp.com</a>. Upon deletion, all your data including chat history, generated content, documents, memories, and personal information will be permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">9. Children&apos;s Privacy</h2>
            <p>Operator AI is not intended for users under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">10. International Data Transfers</h2>
            <p>Your data may be processed in the United States and European Union through our service providers. We ensure appropriate safeguards are in place for international transfers in compliance with applicable data protection laws including GDPR.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] text-fg mb-3">12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
            <p className="text-fg">Operator AI<br /><a href="mailto:privacy@operatoraiapp.com" className="text-gold hover:underline">privacy@operatoraiapp.com</a><br /><a href="https://operatoraiapp.com" className="text-gold hover:underline">operatoraiapp.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
