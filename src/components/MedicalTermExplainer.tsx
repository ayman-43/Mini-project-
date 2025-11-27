import React, { useState } from 'react';
import { BookOpen, Loader, AlertCircle, Search, Sparkles, Lightbulb } from 'lucide-react';
import { explainMedicalTerm, validateMedicalTerm } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function MedicalTermExplainer() {
  const [term, setTerm] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) {
      setError('Please enter a medical term to explain.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Validate if the input is a legitimate medical term
      const isValidMedicalTerm = await validateMedicalTerm(term);

      if (!isValidMedicalTerm) {
        setError('⚠️ The input you provided is not recognized as a valid medical term. Please enter a valid term or code.');
        setExplanation('');
        return;
      }

      const result = await explainMedicalTerm(term);
      setExplanation(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error explaining term. Please try again.');
      setExplanation('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 animate-float">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Medical Term Explainer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Understand complex medical terminology in simple language with AI-powered explanations.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 space-y-6">

          <form onSubmit={handleExplain} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setError('');
                }}
                className="block w-full pl-11 pr-12 py-4 bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                placeholder="Enter a medical term (e.g., 'Hypertension', 'MRI')..."
              />
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm('');
                    setError('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-slide-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !term.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Explaining Term...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Explain Term</span>
                </>
              )}
            </button>
          </form>

          {/* Pro Tip */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Pro Tip</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400/80 leading-relaxed">
                You can enter medical terms in multiple languages. The explanation will be provided in the same language as your input.
              </p>
            </div>
          </div>
        </div>

        {/* Explanation Result */}
        {explanation && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Explanation
              </h3>
            </div>
            <div className="prose prose-blue max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}