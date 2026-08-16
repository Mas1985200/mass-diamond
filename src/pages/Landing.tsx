import { Link } from "react-router-dom";
import { Search, ShoppingBag, Building2, Store, Sparkles, ShieldCheck, Globe2 } from "lucide-react";
import { Logo } from "@/components/Logo";

// Public marketing page — separate from the authenticated AI-chat
// home experience, per spec section 46.
export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-semibold text-lg">Mass Diamond</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="md-btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="md-btn-primary text-sm">Get started</Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          One app. <span className="text-primary">Every need.</span><br />Anywhere in the world.
        </h1>
        <p className="mt-5 text-text-muted text-lg max-w-2xl mx-auto">
          Mass Diamond brings AI chat, marketplace, real estate, and local businesses into a single, global,
          multilingual assistant.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register" className="md-btn-primary">Try Mass Diamond</Link>
          <Link to="/login" className="md-btn-ghost">Sign in</Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Search, title: "Search", desc: "Ask naturally, get real results." },
          { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell with AI-assisted listings." },
          { icon: Building2, title: "Real Estate", desc: "Find or list properties to rent or buy." },
          { icon: Store, title: "Businesses", desc: "Discover verified local businesses." }
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="md-panel p-5">
            <Icon className="text-primary mb-3" size={22} />
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-text-muted mt-1">{desc}</p>
          </div>
        ))}
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Sparkles className="text-primary mx-auto mb-3" size={28} />
        <h2 className="text-2xl font-semibold">AI-assisted listings</h2>
        <p className="text-text-muted mt-2 max-w-xl mx-auto">
          Upload a few photos and basic details — Mass Diamond drafts your title, description, and category. Every
          listing is reviewed before it goes live.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center sm:text-left">
        <div>
          <ShieldCheck className="text-primary mb-2" size={22} />
          <h3 className="font-medium">Privacy by design</h3>
          <p className="text-sm text-text-muted mt-1">Seller and business phone numbers stay private — all contact happens through in-app messaging.</p>
        </div>
        <div>
          <Globe2 className="text-primary mb-2" size={22} />
          <h3 className="font-medium">Built for the world</h3>
          <p className="text-sm text-text-muted mt-1">Eight languages, full RTL support, and location-aware results wherever you are.</p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Logo size={20} withGlow={false} />
            <span>Mass Diamond</span>
          </div>
          <p>© {new Date().getFullYear()} Mass Diamond. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
