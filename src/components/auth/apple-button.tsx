'use client';
import type { ButtonHTMLAttributes } from 'react';

/**
 * "Sign in with Apple" button. Follows Apple HIG:
 * - Black background, white text (HIG preferred)
 * - Apple logo on the left, label "Continue with Apple"
 * - SF Pro-ish system font weight
 * https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
 */
export function AppleButton({
  label = 'Continue with Apple',
  loading,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string; loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={loading || rest.disabled}
      {...rest}
      className={
        'w-full h-11 rounded-md bg-black text-white hover:bg-zinc-900 ' +
        'transition-colors flex items-center justify-center gap-2.5 ' +
        'text-[14px] font-medium border border-white/10 ' +
        'disabled:opacity-60 disabled:cursor-not-allowed ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ' +
        className
      }
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        <AppleLogo className="h-4 w-4 -mt-0.5" />
      )}
      <span>{label}</span>
    </button>
  );
}

function AppleLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
