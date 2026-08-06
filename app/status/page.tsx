import type { Metadata } from 'next';
import { Activity, CheckCircle2, Clock } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Status',
  description: 'Current status and uptime for StackPilot services.',
  alternates: { canonical: '/status' },
};

const services = [
  { name: 'Website', status: 'Operational', uptime: '99.99%', lastChecked: '2 minutes ago' },
  { name: 'AI Analysis API', status: 'Operational', uptime: '99.95%', lastChecked: '1 minute ago' },
  { name: 'Results & Categories', status: 'Operational', uptime: '99.98%', lastChecked: '3 minutes ago' },
  { name: 'Documentation', status: 'Operational', uptime: '100%', lastChecked: '4 minutes ago' },
];

export default function StatusPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-violet-400">Status</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            All systems <span className="gradient-text">operational</span>
          </h1>
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <Activity className="h-4 w-4" />
            All services operational
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-2xl space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {service.lastChecked}
                </span>
                <span className="font-medium text-emerald-400">{service.uptime} uptime</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
