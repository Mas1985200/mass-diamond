import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Bath, Maximize, MapPin, Share2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database";
import {
  ConfigRequired,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/States";
import { useAuth } from "@/hooks/useAuth";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  /*
   * Every request receives a monotonically increasing ID.
   * Only the latest request is allowed to update component state.
   *
   * This protects both the initial load and Retry from stale responses.
   */
  const requestSequence = useRef(0);

  const loadProperty = useCallback(async () => {
    const requestId = ++requestSequence.current;

    if (!id) {
      setProperty(null);
      setNotFound(true);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    const { data, error: queryError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    /*
     * Ignore responses from an older request.
     */
    if (requestId !== requestSequence.current) {
      return;
    }

    if (queryError) {
      if (queryError.code === "PGRST116") {
        setProperty(null);
        setNotFound(true);
        setError(null);
      } else {
        setProperty(null);
        setNotFound(false);
        setError(queryError.message);
      }

      setLoading(false);
      return;
    }

    setProperty(data as Property);
    setNotFound(false);
    setError(null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadProperty();

    return () => {
      /*
       * Invalidate any in-flight request when the component unmounts
       * or before a new effect cycle begins.
       */
      requestSequence.current += 1;
    };
  }, [loadProperty]);

  async function contactOwner() {
    if (!property || !user || starting) return;

    setStarting(true);

    try {
      const { data: thread, error: threadError } = await supabase
        .from("message_threads")
        .insert({
          context_type: "real_estate",
          context_id: property.id,
        })
        .select("id")
        .single();

      if (threadError) {
        throw threadError;
      }

      const { error: participantsError } = await supabase
        .from("thread_participants")
        .insert([
          {
            thread_id: thread.id,
            user_id: user.id,
          },
          {
            thread_id: thread.id,
            user_id: property.owner_id,
          },
        ]);

      if (participantsError) {
        throw participantsError;
      }

      navigate(`/messages?thread=${thread.id}`);
    } catch (contactError) {
      console.error("Failed to start property conversation:", contactError);
    } finally {
      setStarting(false);
    }
  }

  async function featureProperty() {
    if (!property || featuring) return;

    setFeaturing(true);
    setFeatureError(null);

    try {
      const { data, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            purpose: "featured_property",
            property_id: property.id,
          },
        },
      );

      if (checkoutError) {
        throw checkoutError;
      }

      if (data?.status === "CONFIGURATION_REQUIRED") {
        setFeatureError(
          data.message ?? t("realEstate.errors.checkoutConfiguration"),
        );
        return;
      }

      if (
        typeof data?.checkout_url !== "string" ||
        data.checkout_url.length === 0
      ) {
        throw new Error("Checkout URL was not returned.");
      }

      window.location.assign(data.checkout_url);
    } catch (checkoutError) {
      console.error("Failed to start property checkout:", checkoutError);
      setFeatureError(t("realEstate.errors.checkout"));
    } finally {
      setFeaturing(false);
    }
  }

  async function shareProperty() {
    if (!property) return;

    setShareError(null);

    const shareUrl = window.location.href;
    const shareTitle = property.title;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: property.description ?? shareTitle,
          url: shareUrl,
        });

        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return;
      }

      throw new Error("No supported sharing method is available.");
    } catch (shareException) {
      /*
       * Closing the native share sheet is not an actual error.
       */
      if (
        shareException instanceof DOMException &&
        shareException.name === "AbortError"
      ) {
        return;
      }

      console.error("Failed to share property:", shareException);
      setShareError(t("realEstate.errors.share"));
    }
  }

  if (loading) {
    return <LoadingState label={t("realEstate.loading")} />;
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="md-panel p-6 text-center">
          <EmptyState label={t("realEstate.notFound")} />

          <button
            type="button"
            onClick={() => navigate("/real-estate")}
            className="md-btn-primary mt-5 inline-flex items-center gap-2"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
              className="rtl:rotate-180"
            />
            {t("realEstate.backToProperties")}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ErrorState
          label={t("realEstate.errors.loadProperty")}
          onRetry={() => void loadProperty()}
        />

        <p className="mt-3 text-center text-xs text-text-muted break-words">
          {error}
        </p>
      </div>
    );
  }

  if (!property) {
    return <LoadingState label={t("realEstate.loading")} />;
  }

  const formattedPrice =
    property.price !== null && property.price !== undefined
      ? new Intl.NumberFormat(undefined, {
          maximumFractionDigits: 2,
        }).format(property.price)
      : null;

  const priceLabel = formattedPrice
    ? `${formattedPrice} ${property.currency}${
        property.purpose === "rent"
          ? `/${property.rent_period ?? t("realEstate.month")}`
          : ""
      }`
    : t("realEstate.priceOnRequest");

  const purposeLabel =
    property.purpose === "rent"
      ? t("realEstate.purpose.rent")
      : t("realEstate.purpose.sale");

  const isOwner = user?.id === property.owner_id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate("/real-estate")}
          className="md-btn-ghost inline-flex items-center gap-2 text-sm"
          aria-label={t("realEstate.backToProperties")}
        >
          <ArrowLeft
            size={18}
            aria-hidden="true"
            className="rtl:rotate-180"
          />
          <span>{t("realEstate.back")}</span>
        </button>

        <button
          type="button"
          onClick={() => void shareProperty()}
          className="md-btn-ghost inline-flex items-center gap-2 text-sm"
          aria-label={t("realEstate.share")}
        >
          <Share2 size={17} aria-hidden="true" />
          <span>{t("realEstate.share")}</span>
        </button>
      </div>

      {shareError && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300"
        >
          {shareError}
        </p>
      )}

      {/* Property visual placeholder */}
      <div className="aspect-video rounded-2xl bg-surface border border-white/5 flex items-center justify-center overflow-hidden mb-5">
        <div className="text-center px-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles
              size={22}
              className="text-primary"
              aria-hidden="true"
            />
          </div>

          <p className="text-sm text-text-muted">
            {t("realEstate.noImage")}
          </p>
        </div>
      </div>

      {/* Title / meta */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            {purposeLabel}
          </span>

          {property.is_featured && (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary inline-flex items-center gap-1.5">
              <Sparkles size={13} aria-hidden="true" />
              {t("realEstate.featured")}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
          {property.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-text-muted">
          <MapPin size={16} aria-hidden="true" />
          <span>
            {property.city}, {property.country}
          </span>
        </div>

        <p className="text-2xl font-semibold text-primary pt-1">
          {priceLabel}
        </p>
      </div>

      {/* Facts */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="md-panel p-4">
          <BedDouble
            size={19}
            className="text-primary mb-2"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold">
            {property.bedrooms ?? "-"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t("realEstate.bedrooms")}
          </p>
        </div>

        <div className="md-panel p-4">
          <Bath
            size={19}
            className="text-primary mb-2"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold">
            {property.bathrooms ?? "-"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t("realEstate.bathrooms")}
          </p>
        </div>

        <div className="md-panel p-4">
          <Maximize
            size={19}
            className="text-primary mb-2"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold">
            {property.area ?? "-"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t("realEstate.area")}
          </p>
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <section className="mt-6 md-panel p-5">
          <h2 className="text-base font-semibold">
            {t("realEstate.description")}
          </h2>

          <p className="mt-3 text-sm leading-7 text-text-muted whitespace-pre-wrap">
            {property.description}
          </p>
        </section>
      )}

      {/* Contact owner */}
      {user && !isOwner && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => void contactOwner()}
            disabled={starting}
            className="md-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting
              ? t("realEstate.startingConversation")
              : t("realEstate.messageOwner")}
          </button>
        </section>
      )}

      {/* Owner actions */}
      {user && isOwner && (
        <section className="mt-6 md-panel p-5">
          <div className="flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-primary"
              aria-hidden="true"
            />
            <h2 className="font-semibold">
              {t("realEstate.boostVisibility")}
            </h2>
          </div>

          <p className="text-sm text-text-muted mt-2">
            {t("realEstate.boostDescription")}
          </p>

          {featureError && (
            <div className="mt-4">
              <ConfigRequired label={featureError} />
            </div>
          )}

          <button
            type="button"
            onClick={() => void featureProperty()}
            disabled={featuring}
            className="md-btn-ghost w-full mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {featuring
              ? t("realEstate.redirecting")
              : t("realEstate.featureProperty")}
          </button>

          <Link
            to={`/checkout/crypto?purpose=featured_property&amount=9.99&ref=${encodeURIComponent(
              property.id,
            )}`}
            className="block text-center text-xs text-text-muted hover:text-primary transition-colors mt-3"
          >
            {t("realEstate.payWithCrypto")}
          </Link>
        </section>
      )}
    </div>
  );
}
