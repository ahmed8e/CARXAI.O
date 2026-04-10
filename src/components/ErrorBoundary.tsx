import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-100">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-display font-black text-[#0E1B39] tracking-tight mb-4">
            Something went wrong
          </h2>
          
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
            We encountered an unexpected error while rendering this page. Our team has been notified.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0070E0] text-white rounded-2xl font-bold shadow-lg shadow-[#0070E0]/20 hover:bg-[#005bb5] transition-all group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Try Refreshing
            </button>
            
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </a>
          </div>
          
          {import.meta.env.DEV && (
            <div className="mt-12 p-6 bg-slate-100 rounded-2xl text-left max-w-2xl overflow-auto border border-slate-200">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Error Details (Dev Only)</p>
              <code className="text-[11px] text-red-600 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
