import React, { useState } from 'react';
import { Pill, Upload, AlertTriangle, Loader, Clock, Heart, Shield, Utensils, RefreshCw, Sparkles, ArrowRight, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { analyzeMedicine, validateMedicineImage } from '../lib/gemini';

interface MedicineAnalysis {
  medicineName: string;
  activeIngredients: string[];
  whatItHelps: string[];
  severity: 'Low' | 'Medium' | 'High';
  doctorConsultationRequired: boolean;
  whenToTake: {
    timing: string[];
    withFood: 'Before' | 'After' | 'With' | "Doesn't matter";
    frequency: string;
  };
  sideEffects: {
    common: string[];
    serious: string[];
    patientSpecific: string[];
  };
  precautions: string[];
  interactions: string[];
  confidence: number;
}

export default function MedicineAnalyzer() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [analysis, setAnalysis] = useState<MedicineAnalysis | null>(null);
  const [error, setError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImage(file);
        const reader = new FileReader();
        reader.onload = (evt) => {
          setImagePreview(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
        setError('');
        setValidationWarning('');
        setAnalysis(null);

        // Validate the uploaded image
        validateUploadedImage(file);
      } else {
        setError('Please upload a valid image file');
      }
    }
  };

  const validateUploadedImage = async (file: File) => {
    setValidating(true);
    try {
      const base64Image = await convertImageToBase64(file);
      const validation = await validateMedicineImage(base64Image);

      if (!validation.isValid) {
        setValidationWarning(validation.message);
      } else {
        setValidationWarning('');
      }
    } catch (err) {
      console.error('Validation error:', err);
      // Continue even if validation fails
    } finally {
      setValidating(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload an image of the medicine');
      return;
    }

    // If there's a validation warning, prevent analysis
    if (validationWarning) {
      setError('Cannot analyze non-medicine images. Please upload a valid medicine image (tablets, capsules, bottles, packaging, etc.).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64Image = await convertImageToBase64(image);

      // Final validation before analysis
      const validation = await validateMedicineImage(base64Image);
      if (!validation.isValid) {
        setError(validation.message + '\n\nPlease upload a clear image of medicine packaging, tablets, capsules, or medicine bottles.');
        setLoading(false);
        return;
      }

      const result = await analyzeMedicine(base64Image, additionalInfo.trim());
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      High: 'bg-red-500 text-white',
      Medium: 'bg-yellow-500 text-gray-900',
      Low: 'bg-green-500 text-white'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 animate-float">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Medicine Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Upload a photo of any medicine to instantly get detailed information about usage, side effects, and precautions.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 space-y-6">

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${imagePreview
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              {imagePreview ? (
                <div className="space-y-6 animate-scale-in">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Medicine preview"
                      className="max-h-80 mx-auto rounded-xl shadow-lg border-4 border-white dark:border-gray-700"
                    />
                    <div className="absolute -bottom-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        setValidationWarning('');
                      }}
                      className="px-6 py-2.5 bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-8">
                  <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Upload Medicine Image
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Take a clear photo of the medicine package - PNG, JPG up to 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="medicine-image-upload"
                    />
                    <label htmlFor="medicine-image-upload">
                      <span className="cursor-pointer inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200">
                        <ImageIcon className="w-5 h-5" />
                        Choose Image
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" />
                Additional Information (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full h-24 p-4 bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                placeholder="Enter any specific questions about this medicine, your medical conditions, or concerns..."
              />
            </div>

            {validationWarning && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-500/30 rounded-xl animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">⚠️ Not a Medicine Image</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">{validationWarning}</p>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2 uppercase tracking-wide">
                        Accepted Image Types:
                      </p>
                      <ul className="text-sm text-orange-700 dark:text-orange-400 grid grid-cols-2 gap-1">
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Tablets/Capsules</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Bottles/Containers</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Packaging/Boxes</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Prescription Labels</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-3 animate-slide-up">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 font-medium whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !image || validating || !!validationWarning}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {validating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Validating Image...</span>
                </>
              ) : loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Analyzing Medicine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Medicine</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {analysis && (
            <div className="space-y-6 animate-slide-up">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {analysis.medicineName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity} Risk
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${analysis.doctorConsultationRequired
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-500 text-white'
                      }`}>
                      {analysis.doctorConsultationRequired ? 'Doctor Required' : 'Self-Medication OK'}
                    </span>
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600">
                      {analysis.confidence}% Confidence
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-blue-500" />
                      Active Ingredients
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.activeIngredients.map((ingredient, idx) => (
                        <span key={idx} className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 rounded-full text-sm font-medium text-blue-800 dark:text-blue-200 shadow-sm">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      What it helps with
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.whatItHelps.map((condition, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">When & How to Take</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h5 className="font-bold text-gray-800 dark:text-gray-200">Timing</h5>
                    </div>
                    <div className="space-y-2">
                      {analysis.whenToTake.timing.map((time, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="w-5 h-5 text-green-600" />
                      <h5 className="font-bold text-gray-800 dark:text-gray-200">With Food</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{analysis.whenToTake.withFood} meals</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-5 h-5 text-purple-600" />
                      <h5 className="font-bold text-gray-800 dark:text-gray-200">Frequency</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{analysis.whenToTake.frequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Side Effects & Precautions</h3>
                </div>

                <div className="p-6 space-y-6">
                  {analysis.sideEffects.common.length > 0 && (
                    <div>
                      <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wide">Common Side Effects</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.sideEffects.common.map((effect, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{effect}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.sideEffects.serious.length > 0 && (
                    <div>
                      <h5 className="font-bold text-red-600 dark:text-red-400 mb-3 text-sm uppercase tracking-wide">Serious Side Effects (Seek Help)</h5>
                      <div className="grid grid-cols-1 gap-3">
                        {analysis.sideEffects.serious.map((effect, idx) => (
                          <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{effect}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.precautions.length > 0 && (
                    <div>
                      <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wide">Important Precautions</h5>
                      <div className="space-y-2">
                        {analysis.precautions.map((precaution, idx) => (
                          <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30 flex items-center gap-3">
                            <Shield className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{precaution}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {analysis.interactions.length > 0 && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Drug Interactions</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {analysis.interactions.map((interaction, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{interaction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                  <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider before starting, stopping, or changing any medication.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
