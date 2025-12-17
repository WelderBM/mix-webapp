"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro renderizando seção:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Em produção, simplesmente não renderiza nada se der erro (fail gracefully)
      // Em desenvolvimento, você pode querer retornar uma div vermelha para avisar
      return process.env.NODE_ENV === "development" ? (
        <div className="p-4 m-4 border border-red-200 bg-red-50 text-red-600 rounded text-sm">
          Erro ao renderizar esta seção. Verifique o console.
        </div>
      ) : null;
    }

    return this.props.children;
  }
}
