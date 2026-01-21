
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Fixed ErrorBoundary by using explicit Component import and property definitions to resolve TS errors.
// This ensures that TypeScript correctly recognizes 'state' and 'props' as members of the class.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state as a property to fix TS error: Property 'state' does not exist on type 'ErrorBoundary' (Lines 20, 33)
  public state: ErrorBoundaryState = { hasError: false };
  // Explicitly declare props as a property to fix TS error: Property 'props' does not exist on type 'ErrorBoundary' (Line 47)
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Explicitly set props to resolve TS error
    this.props = props;
    // State is initialized above as a class property
  }

  static getDerivedStateFromError(_error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("MathMaster Critical Error:", error, errorInfo);
  }

  render() {
    // Accessing this.state is now recognized by TypeScript after explicit declaration above
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-10 text-right" dir="rtl">
          <div className="space-y-6">
            <h1 className="text-4xl font-black">عذراً، حدث خطأ تقني ⚠️</h1>
            <p className="text-slate-400">يرجى إعادة تحميل الصفحة.</p>
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-blue-600 rounded-2xl font-black shadow-xl">تحديث</button>
          </div>
        </div>
      );
    }
    // Accessing this.props.children is now recognized correctly by TypeScript (Line 45)
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
