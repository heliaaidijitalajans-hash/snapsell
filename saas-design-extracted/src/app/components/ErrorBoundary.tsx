import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 bg-gray-50">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bir hata oluştu</h2>
            <p className="text-gray-600 mb-4">
              İşleminiz sırasında beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF5A5F]/90"
              >
                Sayfayı yenile
              </button>
              <a href="/dashboard" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">
                Ana sayfa
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
