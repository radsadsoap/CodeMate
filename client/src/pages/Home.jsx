import { Faq } from '../components/landing/Faq';
import { Features } from '../components/landing/Features';
import { Hero } from '../components/landing/Hero';
import { SiteFooter } from '../components/landing/SiteFooter';
import { SiteHeader } from '../components/landing/SiteHeader';

export default function Home() {
    return (
        <div className="min-h-dvh bg-bg">
            <SiteHeader />
            <main id="main">
                <Hero />
                <Features />
                <Faq />
            </main>
            <SiteFooter />
        </div>
    );
}
