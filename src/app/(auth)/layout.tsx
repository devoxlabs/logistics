import type { Metadata } from 'next';
import '../globals.css';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import PageTransition from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Auth | Logistics',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageTransition>
      <div className='min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:px-6 relative overflow-hidden'>
        {/* Animated background */}
        <AnimatedBackground />

        {/* Decorative background pattern */}
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.1),transparent_50%)] pointer-events-none' />

        <div className='w-full max-w-md relative'>
          {/* Logo/Branding */}
          <div className='text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 shadow-lg shadow-primary/20'>
              <svg className='w-8 h-8 text-primary' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
              </svg>
            </div>
            <h1 className='text-2xl font-bold text-foreground tracking-tight'>Logistics</h1>
            <p className='text-sm text-muted-foreground mt-1'>Streamline your operations</p>
          </div>

          {/* Auth Card */}
          <div className='bg-card shadow-xl rounded-2xl border border-border p-6 sm:p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100'>
            {children}
          </div>

          {/* Footer */}
          <p className='text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500 delay-200'>
            © 2024 Logistics. All rights reserved.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
