// React Native compatible utility function
// This replaces the web-only clsx and tailwind-merge functionality
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
