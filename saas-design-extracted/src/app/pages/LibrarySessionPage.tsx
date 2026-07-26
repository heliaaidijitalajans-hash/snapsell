import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchLibrarySession, type LibrarySession } from "../lib/libraryImages";
import { ResultView } from "./EditorReplicatePage";

/**
 * Restores a full transformation session from Library history.
 * Never re-runs generation or price-analysis APIs.
 */
export function LibrarySessionPage() {
  const { imageId } = useParams<{ imageId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [session, setSession] = useState<LibrarySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !imageId) {
      setLoading(false);
      setSession(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const row = await fetchLibrarySession(imageId, user.id);
      if (cancelled) return;
      if (!row) {
        setError(t("library.sessionNotFound"));
        setSession(null);
      } else {
        setSession(row);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, imageId, t]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-600">
        {t("library.signInToView")}
        <Link to="/login" className="text-[#FF5A5F] font-medium ml-1 hover:underline">
          {t("nav.login")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF5A5F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !session || !session.imageUrl) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">{error || t("library.sessionNotFound")}</p>
        <Link to="/kutuphane" className="text-[#FF5A5F] font-medium hover:underline">
          {t("library.backToLibrary")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t("library.sessionTitle")}</h1>
        <Link to="/kutuphane" className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline">
          {t("library.backToLibrary")}
        </Link>
      </div>

      <ResultView
        previewUrl={session.originalImageUrl}
        outputUrl={session.imageUrl}
        seoDescription={session.seoDescription || session.prompt || null}
        sessionConfig={session.config}
        libraryImageId={session.id}
        cachedPriceAnalysis={session.priceAnalysis}
        disablePriceFetch
        autoScroll={false}
        createdAt={session.createdAt}
        onNew={() => navigate("/gorsel-duzenleme")}
        t={t}
      />
    </div>
  );
}
