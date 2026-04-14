import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
              <span className="font-display text-[15px] text-bg leading-none">O</span>
            </span>
            <span className="font-display text-[17px]">Operator AI</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
