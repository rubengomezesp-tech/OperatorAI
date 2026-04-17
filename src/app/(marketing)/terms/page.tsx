'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/lib/i18n';

export default function TermsPage() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-bg text-fg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-[860px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
          <span className="font-display text-[15px]">Operator AI</span>
        </Link>
        <LanguageToggle />
      </nav>
      <main className="max-w-[860px] mx-auto px-6 py-12">
        <h1 className="font-display text-[36px] mb-2">{t('legal.terms')}</h1>
        <p className="text-[12px] text-fg-muted mb-8">Last updated: April 2026</p>

        {locale === 'es' ? (
          <div className="prose prose-invert max-w-none text-[14px] text-fg-soft leading-relaxed space-y-6">
            <h2 className="font-display text-[20px] text-fg">1. Aceptación de los Términos</h2>
            <p>Al acceder o utilizar Operator AI, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo, no utilice nuestros servicios.</p>

            <h2 className="font-display text-[20px] text-fg">2. Descripción del Servicio</h2>
            <p>Operator AI es una plataforma de operaciones autónomas impulsada por inteligencia artificial que proporciona herramientas de generación de contenido, automatización de flujos de trabajo, análisis de datos y gestión de marca.</p>

            <h2 className="font-display text-[20px] text-fg">3. Cuentas de Usuario</h2>
            <p>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Notifíquenos inmediatamente sobre cualquier uso no autorizado.</p>

            <h2 className="font-display text-[20px] text-fg">4. Uso Aceptable</h2>
            <p>Usted se compromete a no utilizar nuestros servicios para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Actividades ilegales o fraudulentas.</li>
              <li>Generar contenido dañino, abusivo o engañoso.</li>
              <li>Violar derechos de propiedad intelectual de terceros.</li>
              <li>Intentar acceder sin autorización a nuestros sistemas.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">5. Propiedad Intelectual</h2>
            <p>El contenido generado por usted a través de nuestras herramientas de IA le pertenece. Operator AI retiene los derechos sobre la plataforma, marca, código y tecnología subyacente.</p>

            <h2 className="font-display text-[20px] text-fg">6. Pagos y Suscripciones</h2>
            <p>Algunos servicios requieren una suscripción de pago. Los precios están sujetos a cambios con notificación previa. Las cancelaciones se pueden realizar en cualquier momento desde la configuración de su cuenta.</p>

            <h2 className="font-display text-[20px] text-fg">7. Limitación de Responsabilidad</h2>
            <p>Operator AI se proporciona &ldquo;tal cual&rdquo;. No garantizamos que el servicio sea ininterrumpido o libre de errores. En la máxima medida permitida por la ley, no seremos responsables por daños indirectos o consecuentes.</p>

            <h2 className="font-display text-[20px] text-fg">8. Contacto</h2>
            <p>Para preguntas sobre estos términos: <a href="mailto:legal@operatorai.app" className="text-gold hover:underline">legal@operatorai.app</a></p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-[14px] text-fg-soft leading-relaxed space-y-6">
            <h2 className="font-display text-[20px] text-fg">1. Acceptance of Terms</h2>
            <p>By accessing or using Operator AI, you agree to be bound by these Terms of Service. If you disagree, do not use our services.</p>

            <h2 className="font-display text-[20px] text-fg">2. Service Description</h2>
            <p>Operator AI is an autonomous operations platform powered by artificial intelligence that provides content generation, workflow automation, data analysis, and brand management tools.</p>

            <h2 className="font-display text-[20px] text-fg">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. Notify us immediately of any unauthorized use.</p>

            <h2 className="font-display text-[20px] text-fg">4. Acceptable Use</h2>
            <p>You agree not to use our services for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Illegal or fraudulent activities.</li>
              <li>Generating harmful, abusive, or misleading content.</li>
              <li>Violating third-party intellectual property rights.</li>
              <li>Attempting unauthorized access to our systems.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">5. Intellectual Property</h2>
            <p>Content you generate through our AI tools belongs to you. Operator AI retains rights to the platform, brand, code, and underlying technology.</p>

            <h2 className="font-display text-[20px] text-fg">6. Payments and Subscriptions</h2>
            <p>Some services require a paid subscription. Prices are subject to change with prior notice. Cancellations can be made at any time from your account settings.</p>

            <h2 className="font-display text-[20px] text-fg">7. Limitation of Liability</h2>
            <p>Operator AI is provided "as is." We do not guarantee the service will be uninterrupted or error-free. To the maximum extent permitted by law, we shall not be liable for indirect or consequential damages.</p>

            <h2 className="font-display text-[20px] text-fg">8. Contact</h2>
            <p>For questions about these terms: <a href="mailto:legal@operatorai.app" className="text-gold hover:underline">legal@operatorai.app</a></p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-[13px] text-gold hover:underline">&larr; {t('legal.back')}</Link>
        </div>
      </main>
    </div>
  );
}
