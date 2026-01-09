
import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// إضافة معالج أخطاء بسيط لضمان تجربة مستخدم مستقرة
// Fix: Explicitly extending React.Component and declaring state property for full TypeScript support
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare the props and state properties to solve 'Property ... does not exist' errors
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("MathMaster Critical Error:", error, errorInfo);
  }

  render() {
    // Standard access to state with class component syntax
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-10 text-right" dir="rtl">
          <div className="space-y-6">
            <h1 className="text-4xl font-black">عذراً، حدث خطأ تقني غير متوقع ⚠️</h1>
            <p className="text-slate-400">يرجى إعادة تحميل الصفحة. إذا استمرت المشكلة، تأكد من اتصال الإنترنت.</p>
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-blue-600 rounded-2xl font-black shadow-xl">تحديث الصفحة</button>
          </div>
        </div>
      );
    }
    // Standard access to props children
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
