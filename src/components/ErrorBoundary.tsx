import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon3D } from './Icon3D';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi gangguan pada aplikasi.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary menangkap kesalahan:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let friendlyMessage = 'Terjadi kendala saat memuat data portal SDN Cikawao.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendlyMessage = `Akses data (${parsed.path || 'sistem'}) mengalami kendala: ${parsed.error}`;
        }
      } catch {
        if (this.state.errorMessage) {
          friendlyMessage = this.state.errorMessage;
        }
      }

      return (
        <div className="min-h-screen portal-colorful-canvas flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border-2 border-amber-200 rounded-2xl p-8 shadow-lg">
            <div className="mb-5">
              <Icon3D name="alert" tone="amber" size="lg" variant="tile" />
            </div>
            <h1 className="font-editorial text-2xl font-semibold text-[#132A2E] mb-2">
              Gangguan Memuat Portal
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{friendlyMessage}</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 text-white text-sm font-semibold rounded-xl"
            >
              <Icon3D name="refresh" tone="white" size="xs" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
