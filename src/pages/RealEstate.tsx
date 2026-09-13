import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  BedDouble,
  Bath,
  Building2,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Ruler,
  Search,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/States";

type Purpose = "all" | "sale" | "rent";

export default function RealEstate() {
  const { t } = useTranslation();

  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("all");
  const [bedrooms, setBedrooms] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    let query = supabase
      .from("properties")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (purpose !== "all") {
      query = query.eq("purpose", purpose);
    }

    const minBedrooms = bedrooms.trim()
      ? Number(bedrooms)
      : null;

    const maximumPrice = maxPrice.trim()
      ? Number(maxPrice)
      : null;

    if (
      minBedrooms !== null &&
      Number.isFinite(minBedrooms) &&
      minBedrooms >= 0
    ) {
      query = query.gte("bedrooms", minBedrooms);
    }

    if (
      maximumPrice !== null &&
      Number.isFinite(maximumPrice) &&
      maximumPrice >= 0
    ) {
      query = query.lte("price", maximumPrice);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setProperties(null);
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setProperties((data ?? []) as Property[]);
    setLoading(false);
  }, [purpose, bedrooms, maxPrice]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetFilters() {
    setPurpose("all");
    setBedrooms("");
    setMaxPrice("");
  }

  const hasFilters =
    purpose !== "all" || bedrooms.trim() !== "" || maxPrice.trim() !== "";

  return (
    <div className="mobile-page-bottom-spacing min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="relative mb-6 overflow-hidden rounded-[1.5rem] border border-border bg-panel p-5 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles size={14} aria-hidden="true" />
                Smart real estate
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {t("nav.realEstate")}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                Discover properties that match what you are looking for.
              </p>
            </div>

            <Link
              to="/real-estate/new"
              className="md-btn-primary inline-flex shrink-0 items-center justify-center gap-2 text-sm"
            >
              <Plus size={17} aria-hidden="true" />
              List a property
            </Link>
          </div>
        </section>

        {/* Filter bar */}
        <section className="mb-6 rounded-[1.25rem] border border-border bg-surface/80 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search size={17} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-text">
                  Find your place
                </p>
                <p className="truncate text-xs text-text-muted">
                  {hasFilters
                    ? "Filters are active"
                    : "Browse available properties"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="md-btn-ghost inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm"
            >
              <Filter size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-background">
                  !
                </span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="sr-only">Purpose</span>
                  <select
                    value={purpose}
                    onChange={(event) =>
                      setPurpose(event.target.value as Purpose)
                    }
                    className="md-input w-full"
                  >
                    <option value="all">For sale or rent</option>
                    <option value="sale">For sale</option>
                    <option value="rent">For rent</option>
                  </select>
                </label>

                <label className="block">
                  <span className="sr-only">Minimum bedrooms</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                    placeholder="Min bedrooms"
                    className="md-input w-full"
                  />
                </label>

                <label className="block">
                  <span className="sr-only">Maximum price</span>
                  <input
                    inputMode="decimal"
                    min="0"
                    type="number"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Max price"
                    className="md-input w-full"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="md-btn-primary inline-flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search size={15} aria-hidden="true" />
                  Apply filters
                </button>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="md-btn-ghost inline-flex items-center gap-2 text-sm"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text">
              {loading
                ? "Finding properties..."
                : properties
                  ? `${properties.length} ${
                      properties.length === 1
                        ? "property"
                        : "properties"
                    }`
                  : "Properties"}
            </p>

            {hasFilters && (
              <p className="mt-0.5 text-xs text-text-muted">
                Matching your selected filters
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {properties === null && !error && <LoadingState />}

        {/* Error */}
        {error && (
          <ErrorState
            label={error}
            onRetry={() => void load()}
          />
        )}

        {/* Empty */}
        {properties && properties.length === 0 && !error && (
          <div className="md-panel p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={26} aria-hidden="true" />
            </div>

            <EmptyState label={t("empty.properties")} />

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary-light"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Property grid */}
        {properties && properties.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/real-estate/${property.id}`}
                className="group md-panel overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow-sm focus-visible:-translate-y-0.5"
              >
                {/* Visual */}
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(57,255,136,0.10),transparent_42%),linear-gradient(135deg,#101814,#080c0a)] transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
                    <Building2 size={28} strokeWidth={1.5} />
                    <span className="text-[11px]">Property preview</span>
                  </div>

                  {property.is_featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-background shadow-glow-sm">
                      <BadgeCheck size={12} aria-hidden="true" />
                      Featured
                    </span>
                  )}

                  <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-text backdrop-blur-md">
                    {property.purpose === "rent"
                      ? "For rent"
                      : "For sale"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-text transition-colors group-hover:text-primary">
                        {property.title}
                      </h2>

                      <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <MapPin size={13} aria-hidden="true" />
                        <span className="truncate">
                          {property.city || "Location unavailable"}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      size={17}
                      className="mt-0.5 shrink-0 text-text-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mb-4 text-base font-semibold text-primary">
                    {property.price
                      ? `${property.price} ${property.currency}${
                          property.purpose === "rent"
                            ? `/${property.rent_period ?? "month"}`
                            : ""
                        }`
                      : "Price on request"}
                  </p>

                  <div className="flex items-center gap-3 border-t border-border pt-3 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble size={14} aria-hidden="true" />
                      {property.bedrooms ?? "-"} bd
                    </span>

                    <span
                      className="h-3 w-px bg-border"
                      aria-hidden="true"
                    />

                    <span className="inline-flex items-center gap-1.5">
                      <Bath size={14} aria-hidden="true" />
                      {property.bathrooms ?? "-"} ba
                    </span>

                    <span
                      className="h-3 w-px bg-border"
                      aria-hidden="true"
                    />

                    <span className="inline-flex items-center gap-1.5">
                      <Ruler size={14} aria-hidden="true" />
                      {property.area ?? "-"} m²
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
