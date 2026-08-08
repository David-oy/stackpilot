import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} collects, uses, and protects your information.`,
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: 'Information we collect',
    body: `When you use ${siteConfig.name}, we process the project description you enter to generate AI-powered technology recommendations. We do not require an account, and we do not sell your data.`,
  },
  {
    title: 'How we use your information',
    body: 'Your project descriptions are used solely to generate recommendations and to improve the quality of the analysis. We may store anonymized, aggregated data to understand usage patterns.',
  },
  {
    title: 'Cookies and local storage',
    body: 'We use local storage on your device to remember preferences such as your theme and the stack you are building. We do not use third-party advertising cookies.',
  },
  {
    title: 'Third-party services',
    body: 'The analysis is powered by an AI provider. Your project description is sent to that provider to generate recommendations. We recommend you do not include sensitive personal data in project descriptions.',
  },
  {
    title: 'Data retention',
    body: 'Analysis results are kept only as long as needed to provide the service. You can clear locally saved data at any time through your browser settings.',
  },
  {
    title: 'Your rights',
    body: 'Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information. Contact us and we will help.',
  },
  {
    title: 'Contact',
    body: 'Questions about this policy? Contact us through the contact page or by email.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Privacy</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Last updated: August 2026
          </p>
        </header>

        <div className="mx-auto mt-14 max-w-2xl space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
