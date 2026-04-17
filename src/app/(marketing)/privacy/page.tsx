'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/lib/i18n';

export default function PrivacyPage() {
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
        <h1 className="font-display text-[36px] mb-2">{t('legal.privacy')}</h1>
        <p className="text-[12px] text-fg-muted mb-8">Last updated: April 2026</p>

        {locale === 'es' ? (
          <div className="prose prose-invert max-w-none text-[14px] text-fg-soft leading-relaxed space-y-6">
            <h2 className="font-display text-[20px] text-fg">1. Información que recopilamos</h2>
            <p>Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, utiliza nuestros servicios o se comunica con nosotros. Esto incluye:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Información de cuenta: nombre, dirección de correo electrónico, contraseña.</li>
              <li>Contenido del usuario: textos, imágenes, archivos y otros contenidos que suba o genere a través de nuestros servicios.</li>
              <li>Datos de uso: información sobre cómo interactúa con nuestros servicios, incluyendo marcas de tiempo, funciones utilizadas y consultas realizadas.</li>
              <li>Información del dispositivo: tipo de navegador, sistema operativo, dirección IP.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">2. Cómo usamos su información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
              <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
              <li>Personalizar la experiencia del usuario.</li>
              <li>Responder a comentarios, preguntas y solicitudes de soporte.</li>
              <li>Monitorear y analizar tendencias de uso.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">3. Compartición de datos</h2>
            <p>No vendemos su información personal. Podemos compartir información con:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveedores de servicios que nos ayudan a operar la plataforma (procesamiento de pagos, alojamiento, IA).</li>
              <li>Autoridades legales cuando sea requerido por ley.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">4. Seguridad de datos</h2>
            <p>Implementamos medidas de seguridad estándar de la industria para proteger su información, incluyendo cifrado en tránsito y en reposo. Sin embargo, ningún método de transmisión por Internet es 100% seguro.</p>

            <h2 className="font-display text-[20px] text-fg">5. Sus derechos</h2>
            <p>Usted tiene derecho a acceder, corregir o eliminar su información personal. Puede ejercer estos derechos contactándonos en privacy@operatorai.app.</p>

            <h2 className="font-display text-[20px] text-fg">6. Retención de datos</h2>
            <p>Conservamos su información mientras su cuenta esté activa o según sea necesario para proporcionarle servicios. Puede solicitar la eliminación de su cuenta y datos en cualquier momento.</p>

            <h2 className="font-display text-[20px] text-fg">7. Contacto</h2>
            <p>Para preguntas sobre esta política, contáctenos en: <a href="mailto:privacy@operatorai.app" className="text-gold hover:underline">privacy@operatorai.app</a></p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-[14px] text-fg-soft leading-relaxed space-y-6">
            <h2 className="font-display text-[20px] text-fg">1. Information We Collect</h2>
            <p>We collect information you provide directly, such as when you create an account, use our services, or contact us. This includes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account information: name, email address, password.</li>
              <li>User content: text, images, files, and other content you upload or generate through our services.</li>
              <li>Usage data: information about how you interact with our services, including timestamps, features used, and queries made.</li>
              <li>Device information: browser type, operating system, IP address.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our services.</li>
              <li>Process transactions and send related notifications.</li>
              <li>Personalize user experience.</li>
              <li>Respond to comments, questions, and support requests.</li>
              <li>Monitor and analyze usage trends.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service providers who help us operate the platform (payment processing, hosting, AI providers).</li>
              <li>Legal authorities when required by law.</li>
            </ul>

            <h2 className="font-display text-[20px] text-fg">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including encryption in transit and at rest. However, no method of Internet transmission is 100% secure.</p>

            <h2 className="font-display text-[20px] text-fg">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You can exercise these rights by contacting us at privacy@operatorai.app.</p>

            <h2 className="font-display text-[20px] text-fg">6. Data Retention</h2>
            <p>We retain your information as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time.</p>

            <h2 className="font-display text-[20px] text-fg">7. Contact</h2>
            <p>For questions about this policy, contact us at: <a href="mailto:privacy@operatorai.app" className="text-gold hover:underline">privacy@operatorai.app</a></p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-[13px] text-gold hover:underline">&larr; {t('legal.back')}</Link>
        </div>
      </main>
    </div>
  );
}
