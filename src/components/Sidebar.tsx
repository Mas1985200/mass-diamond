import { NavLink } from "react-router-dom";
import { Home, Search, ShoppingBag, Building2, Store, MessageCircle, Bell, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Logo } from "./Logo";

const items = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/marketplace", icon: ShoppingBag, key: "nav.marketplace" },
  { to: "/real-estate", icon: Building2, key: "nav.realEstate" },
  { to: "/businesses", icon: Store, key: "nav.businesses" },
  { to: "/messages", icon: MessageCircle, key: "nav.messages" },
  { to: "/notifications", icon: Bell, key: "nav.notifications" },
  { to: "/profile", icon: User, key: "nav.profile" }
];

// Desktop-only responsive sidebar per spec section 7.
export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-e border-border bg-panel h-screen sticky top-0 p-4">
      <div className="flex items-center gap-2 px-2 py-3">
        <Logo size={32} />
        <span className="font-semibold text-lg tracking-tight">Mass Diamond</span>
      </div>
      <nav className="mt-6 flex-1">
        <ul className="space-y-1">
          {items.map(({ to, icon: Icon, key }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm transition-colors",
                    isActive ? "bg-surface text-primary border border-border" : "text-text-muted hover:text-text"
                  )
                }
              >
                <Icon size={18} />
                <span>{t(key, key.split(".")[1])}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
