import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Search,
  ShoppingBag,
  Store,
  MoreHorizontal,
  Building2,
  MessageCircle,
  Bell,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const mainItems = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/marketplace", icon: ShoppingBag, key: "nav.marketplace" },
  { to: "/businesses", icon: Store, key: "nav.businesses" },
];

const hubItems = [
  { to: "/real-estate", icon: Building2, key: "nav.realEstate" },
  { to: "/messages", icon: MessageCircle, key: "nav.messages" },
  { to: "/notifications", icon: Bell, key: "nav.notifications" },
  { to: "/profile", icon: User, key: "nav.profile" },
];

export function BottomNav() {
  const { t } = useTranslation();
  const [hubOpen, setHubOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!hubOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setHubOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHubOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hubOpen]);

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-panel/95 backdrop-blur md:hidden"
      aria-label={t("nav.more", "More")}
    >
      {hubOpen && (
        <div
          role="menu"
          aria-label={t("nav.more", "More")}
          className="absolute bottom-full inset-x-0 z-50 border-t border-border bg-panel/95 backdrop-blur"
        >
          <ul className="grid grid-cols-4 gap-1 p-2">
            {hubItems.map(({ to, icon: Icon, key }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  role="menuitem"
                  onClick={() => setHubOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex flex-col items-center gap-1 rounded-xl2 px-2 py-2 text-xs transition-colors duration-180",
                      isActive
                        ? "text-primary"
                        : "text-text-muted hover:text-text"
                    )
                  }
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{t(key)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex justify-around py-2">
        {mainItems.map(({ to, icon: Icon, key }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors duration-180",
                  isActive
                    ? "text-primary"
                    : "text-text-muted hover:text-text"
                )
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          </li>
        ))}

        <li>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={hubOpen}
            aria-label={t("nav.more", "More")}
            onClick={() => setHubOpen((open) => !open)}
            className={clsx(
              "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors duration-180",
              hubOpen ? "text-primary" : "text-text-muted"
            )}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
            <span>{t("nav.more", "More")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
