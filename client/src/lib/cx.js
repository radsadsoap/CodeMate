import { twMerge } from 'tailwind-merge';

// Later classes replace conflicting earlier ones, so a `className` override always beats component defaults.
export const cx = twMerge;
