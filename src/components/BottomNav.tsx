import { NavLink } from "react-router-dom";
import { Home, Search, ShoppingBag, Building2, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const items = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/marketplace", icon: ShoppingBag, key: "nav.marketplace" },
  { to: "/real-estate", icon: Building2, key: "nav.realEstate" },
  { to: "/businesses", icon: Store, key: "nav.businesses" }
];

// Mobile bottom navigation per spec section 7. Hidden on desktop in
// favor of the sidebar (see Sidebar.tsx).
export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-panel/95 backdrop-blur md:hidden">
      <ul className="flex justify-around py-2">
        {items.map(({ to, icon: Icon, key }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                  isActive ? "text-primary" : "text-text-muted"
                )
              }
            >
              <Icon size={20} />
              <span>{t(key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
