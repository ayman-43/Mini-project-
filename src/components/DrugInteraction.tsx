import React, { useState } from 'react';
import { Pill, Plus, X, Loader, AlertCircle, Sparkles, ArrowRight, Activity } from 'lucide-react';
import { checkDrugInteraction, validateMedicationName } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function DrugInteraction() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [currentDrug, setCurrentDrug] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  const addDrug = async () => {
    const drugName = currentDrug.trim();

    if (!drugName) {
      return;
    }

    if (drugs.includes(drugName)) {
      setError('This medication has already been added.');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const isValid = await validateMedicationName(drugName);

      if (!isValid) {
        setError('⚠️ Invalid input. Please enter a valid medication name.');
        setValidating(false);
        return;
      }

      setDrugs([...drugs, drugName]);
      setCurrentDrug('');
      setError('');
    } catch (error) {
      setError('Error validating medication name. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDrug();
    }
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
    setError('');
  };

  const handleCheck = async () => {
    if (drugs.length < 1) {
      setError('Please enter at least one medication to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await checkDrugInteraction(drugs);
      setAnalysis(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing medications. Please try again.');
      setAnalysis('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 animate-float">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Drug Interaction Checker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Add your medications to check for potential interactions and get AI-powered safety insights.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 space-y-6">

          {/* Input Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Medication
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  value={currentDrug}
                  onChange={(e) => setCurrentDrug(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={validating}
                  className="w-full p-3 pl-4 bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all duration-200 disabled:opacity-50"
                  placeholder="e.g., Aspirin, Lisinopril..."
                />
                {validating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={addDrug}
                disabled={validating || !currentDrug.trim()}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Drug List */}
          <div className="min-h-[100px] p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-all duration-200">
            {drugs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-2 py-8">
                <Pill className="w-8 h-8 opacity-50" />
                <p className="text-sm">No medications added yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {drugs.map((drug, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 animate-scale-in"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{drug}</span>
                    <button
                      onClick={() => removeDrug(index)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleCheck}
            disabled={loading || drugs.length < 1}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analyzing Interactions...</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                <span>Check Interactions</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Analysis Result */}
        {analysis && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Analysis Results
              </h3>
            </div>
            <div className="prose prose-blue max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}