import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { LoadingState, ConfigRequired, EmptyState } from "@/components/States";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setConfigMessage(null);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("search", { body: { query } });
      if (error) throw error;
      if (data.status === "CONFIGURATION_REQUIRED") {
        setConfigMessage(data.message);
        return;
      }
      setResults(data.results);
    } catch (err) {
      console.error(err);
      setConfigMessage("Something went wrong running that search.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">{t("nav.search")}</h1>
      <form onSubmit={runSearch} className="flex gap-2 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the web..." className="md-input flex-1" />
        <button type="submit" className="md-btn-primary">Search</button>
      </form>

      {loading && <LoadingState />}
      {configMessage && <ConfigRequired label={configMessage} />}
      {results && results.length === 0 && <EmptyState label="No results found." />}
      {results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" className="md-panel p-3 block hover:border-primary/50 transition-colors">
              <p className="text-sm font-medium text-primary truncate">{r.title}</p>
              <p className="text-xs text-text-muted truncate">{r.url}</p>
              <p className="text-sm mt-1 line-clamp-2">{r.snippet}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
