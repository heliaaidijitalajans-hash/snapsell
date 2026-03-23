import { Loader2 } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-600">
      <Loader2 className="w-10 h-10 text-[#FF5A5F] animate-spin" aria-hidden />
      <p className="text-sm">Oturum kontrol ediliyor…</p>
    </div>
  );
}
