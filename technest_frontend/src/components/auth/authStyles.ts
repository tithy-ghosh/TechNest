/**
 * Shared styles for the login / register forms so the two pages stay aligned.
 */

export const authInputCx = (hasError: boolean) =>
  `h-12 w-full rounded-xl border bg-white pl-11 pr-11 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition-all duration-200 ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100'
      : 'border-neutral-200 hover:border-neutral-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-200/60'
  }`;

export const authPrimaryButtonCx =
  'group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#a3dc0b] to-[#65a30d] text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(143,190,10,0.35)] transition-all duration-200 hover:shadow-[0_10px_32px_rgba(143,190,10,0.5)] disabled:cursor-not-allowed disabled:opacity-60';
