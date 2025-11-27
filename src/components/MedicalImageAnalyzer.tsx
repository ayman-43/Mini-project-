import React, { useState } from 'react';
import { Camera, Upload, Send, AlertTriangle, Loader, Activity, TrendingUp, CheckCircle, AlertCircle, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { analyzeMedicalImage, validateMedicalImage } from '../lib/gemini';

interface Finding {
    finding: string;
    location: string;
    severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';
    significance: string;
}

interface MedicalImageAnalysis {
    imageType: string;
    bodyPart: string;
    keyFindings: Finding[];
    overallAssessment: {
        status: 'Normal' | 'Attention Needed' | 'Urgent Care Required';
        summary: string;
        urgencyLevel: 'Low' | 'Medium' | 'High';
    };
    recommendations: {
        immediate: string[];
        followUp: string[];
        lifestyle: string[];
    };
    differentialDiagnosis: string[];
    redFlags: string[];
    nextSteps: string[];
    confidence: number;
}

export default function MedicalImageAnalyzer() {
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [analysis, setAnalysis] = useState<MedicalImageAnalysis | null>(null);
    const [error, setError] = useState('');
    const [validationWarning, setValidationWarning] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

                // Validate if it's a medical image
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
            const validation = await validateMedicalImage(base64Image);

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
            setError('Please upload a medical image');
            return;
        }

        // If there's a validation warning, prevent analysis
        if (validationWarning) {
            setError('Cannot analyze non-medical images. Please upload a valid medical image (X-ray, CT scan, MRI, ultrasound, ECG, etc.).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const base64Image = await convertImageToBase64(image);

            // Final validation before analysis
            const validation = await validateMedicalImage(base64Image);
            if (!validation.isValid) {
                setError(validation.message + '\n\nPlease upload a valid medical image such as X-rays, CT scans, MRI, ultrasound, or ECG images.');
                setLoading(false);
                return;
            }

            const result = await analyzeMedicalImage(base64Image, additionalInfo.trim());
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze medical image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            Normal: 'bg-green-500 text-white',
            Mild: 'bg-yellow-500 text-gray-900',
            Moderate: 'bg-orange-500 text-white',
            Severe: 'bg-red-500 text-white',
            Critical: 'bg-red-700 text-white'
        };
        return colors[severity as keyof typeof colors] || 'bg-gray-500 text-white';
    };

    const getUrgencyColor = (urgency: string) => {
        const colors = {
            Low: 'bg-green-500 text-white',
            Medium: 'bg-yellow-500 text-gray-900',
            High: 'bg-red-500 text-white'
        };
        return colors[urgency as keyof typeof colors] || 'bg-gray-500 text-white';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 animate-float">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Medical Image Analyzer
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                        Upload X-rays, CT scans, MRIs, or other medical images for instant AI-powered analysis and insights.
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
                                            alt="Medical image preview"
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
                                            Upload Medical Image
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                                            Drag and drop or click to upload X-Ray, CT Scan, MRI, Ultrasound, or ECG images
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="medical-image-upload"
                                        />
                                        <label htmlFor="medical-image-upload">
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
                                <Activity className="w-4 h-4 text-blue-500" />
                                Additional Context (Optional)
                            </label>
                            <textarea
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                className="w-full h-24 p-4 bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                                placeholder="Enter patient age, symptoms, medical history, or specific areas of concern..."
                            />
                        </div>

                        {validationWarning && (
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-500/30 rounded-xl animate-slide-up">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">⚠️ Not a Medical Image</h4>
                                        <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">{validationWarning}</p>
                                        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2 uppercase tracking-wide">
                                                Accepted Image Types:
                                            </p>
                                            <ul className="text-sm text-orange-700 dark:text-orange-400 grid grid-cols-2 gap-1">
                                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> X-rays</li>
                                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> CT scans</li>
                                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> MRI scans</li>
                                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Ultrasound</li>
                                                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> ECG/EKG</li>
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
                                    <span>Analyzing Medical Image...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Analyze Medical Image</span>
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
                                            {analysis.imageType} - {analysis.bodyPart}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getUrgencyColor(analysis.overallAssessment.urgencyLevel)}`}>
                                            {analysis.overallAssessment.urgencyLevel} Urgency
                                        </span>
                                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600">
                                            {analysis.confidence}% Confidence
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-5 rounded-xl border-2 ${analysis.overallAssessment.status === 'Normal'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : analysis.overallAssessment.status === 'Attention Needed'
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    }`}>
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        Status: {analysis.overallAssessment.status}
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.overallAssessment.summary}</p>
                                </div>
                            </div>

                            {analysis.keyFindings.length > 0 && (
                                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Key Findings</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {analysis.keyFindings.map((finding, idx) => (
                                            <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-gray-800 dark:text-gray-200">{finding.finding}</h5>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getSeverityColor(finding.severity)}`}>
                                                        {finding.severity}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        <strong className="text-gray-900 dark:text-gray-200">Location:</strong> {finding.location}
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        <strong className="text-gray-900 dark:text-gray-200">Significance:</strong> {finding.significance}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.redFlags.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border-2 border-red-200 dark:border-red-800/50 overflow-hidden">
                                    <div className="p-4 bg-red-100/50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800/50 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <h3 className="font-bold text-red-800 dark:text-red-200">Critical Alerts</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {analysis.redFlags.map((flag, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-700 dark:text-red-300 font-medium">{flag}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.differentialDiagnosis.length > 0 && (
                                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Differential Diagnosis</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.differentialDiagnosis.map((diagnosis, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200 font-medium">
                                                    <ArrowRight className="w-4 h-4 text-blue-500" />
                                                    {diagnosis}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {analysis.recommendations.immediate.length > 0 && (
                                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">Immediate Actions</h3>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {analysis.recommendations.immediate.map((action, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{action}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysis.recommendations.followUp.length > 0 && (
                                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">Follow-up Actions</h3>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {analysis.recommendations.followUp.map((action, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{action}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {analysis.nextSteps.length > 0 && (
                                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Recommended Next Steps</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {analysis.nextSteps.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-gray-700 dark:text-gray-300 font-medium">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-500/30 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                                    <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical consultation. Always discuss your medical images and results with a qualified healthcare provider for proper interpretation and treatment recommendations.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

