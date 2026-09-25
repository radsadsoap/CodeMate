import { ArrowRightIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { buttonStyles } from '../ui/Button';

const CollabDemo = lazy(() => import('./CollabDemo'));

const EASE = [0.22, 1, 0.36, 1];
const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function DemoPlaceholder() {
    return (
        <div
            aria-hidden
            className="border-border-strong bg-surface h-[27.5rem] border"
        />
    );
}

export function Hero() {
    const reduceMotion = useReducedMotion();
    const { status } = useAuth();
    const signedIn = status === 'authenticated';

    return (
        <section className="border-border relative isolate overflow-hidden border-b">
            <div
                aria-hidden
                className="dot-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_75%_65%_at_30%_35%,black,transparent)]"
            />
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:pt-24 lg:pb-28">
                <motion.div
                    initial={reduceMotion ? false : 'hidden'}
                    animate="show"
                    variants={{
                        show: { transition: { staggerChildren: 0.09 } },
                    }}
                    className="max-w-xl"
                >
                    <motion.h1
                        variants={item}
                        className="text-fg text-5xl leading-[1.04] font-semibold tracking-tighter sm:text-6xl"
                    >
                        Code Here.
                        <br />
                        <span className="bg-linear-to-r from-green-600 to-green-100 bg-clip-text text-transparent">
                            Code Now.
                        </span>
                    </motion.h1>
                    <motion.p
                        variants={item}
                        className="text-fg-muted mt-6 max-w-[40ch] text-lg leading-relaxed"
                    >
                        One shared editor for TAs and students, with real
                        compilers, voice, and a raised hand when you are stuck.
                    </motion.p>
                    <motion.div
                        variants={item}
                        className="mt-9 flex flex-wrap gap-3"
                    >
                        <Link
                            to={signedIn ? '/session' : '/signup'}
                            className={buttonStyles({
                                variant: 'primary',
                                size: 'lg',
                                className: 'group',
                            })}
                        >
                            {signedIn ? 'Your sessions' : 'Get started'}
                            <ArrowRightIcon
                                aria-hidden
                                size={17}
                                weight="bold"
                                className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                            />
                        </Link>
                        <Link
                            to="/session?dialog=join"
                            className={buttonStyles({
                                variant: 'secondary',
                                size: 'lg',
                            })}
                        >
                            Join with a code
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                >
                    <Suspense fallback={<DemoPlaceholder />}>
                        <CollabDemo />
                    </Suspense>
                </motion.div>
            </div>
        </section>
    );
}
