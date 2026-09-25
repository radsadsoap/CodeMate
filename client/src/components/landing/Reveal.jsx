import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

// Fades a block up the first time it scrolls into view; static when reduced motion is requested.
export function Reveal({ as = 'div', delay = 0, className, children, ...rest }) {
    const reduceMotion = useReducedMotion();
    const Component = motion[as];

    return (
        <Component
            className={className}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay, ease: EASE }}
            {...rest}
        >
            {children}
        </Component>
    );
}
