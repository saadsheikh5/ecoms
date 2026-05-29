import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI boundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="min-h-screen bg-[#D5E8D4] px-4 py-10 flex items-center">
          <div className="max-w-2xl mx-auto bg-white border border-[#f9c0d9] p-8 text-center shadow-sm">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d9006c] font-bold">
              Something Went Wrong
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase text-[#d9006c]">
              We could not load this view
            </h1>
            <p className="mt-4 text-gray-600">
              Refresh the page or try again in a moment. No payment or order action was processed.
            </p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
