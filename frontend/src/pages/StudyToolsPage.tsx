import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  HelpCircle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { DocumentItem, StudyItem, MCQItem, FlashcardItem, MultiDocCompareResult } from '../types';
import { api } from '../services/api';

interface StudyToolsPageProps {
  initialTab?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const StudyToolsPage: React.FC<StudyToolsPageProps> = ({ initialTab = 'mcq', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'flashcard' | 'compare' | 'interview' | 'summary'>(
    initialTab as any || 'mcq'
  );
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // MCQ state
  const [mcqItems, setMcqItems] = useState<MCQItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Flashcard state
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Comparison state
  const [comparisonResult, setComparisonResult] = useState<MultiDocCompareResult | null>(null);

  // Interview state
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);

  // Summaries state
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await api.getDocuments();
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocIds([docs[0].id]);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    fetchDocs();
  }, []);

  const handleGenerate = async () => {
    if (selectedDocIds.length === 0) {
      alert('Please select at least one document.');
      return;
    }
    setIsGenerating(true);

    try {
      if (activeTab === 'compare') {
        if (selectedDocIds.length < 2) {
          alert('Comparison requires at least 2 documents.');
          setIsGenerating(false);
          return;
        }
        const comp = await api.compareDocuments({ document_ids: selectedDocIds });
        setComparisonResult(comp);
      } else if (activeTab === 'summary') {
        const sum = await api.summarizeMultiDocs({ document_ids: selectedDocIds });
        setSummaryData(sum);
      } else {
        const res = await api.generateStudyContent({
          document_ids: selectedDocIds,
          item_type: activeTab,
          count: 5,
        });

        if (activeTab === 'mcq') {
          setMcqItems(res.payload.items || []);
          setUserAnswers({});
          setShowResults(false);
        } else if (activeTab === 'flashcard') {
          setFlashcards(res.payload.items || []);
          setCurrentCardIdx(0);
          setIsFlipped(false);
        } else if (activeTab === 'interview') {
          setInterviewQuestions(res.payload.items || []);
        }
      }
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optKey: string) => {
    if (showResults) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optKey }));
  };

  const calculateScore = () => {
    let score = 0;
    mcqItems.forEach((item) => {
      if (userAnswers[item.id] === item.correct_key) score++;
    });
    return score;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Study & Synthesis Suite</h1>
        <p className="text-xs text-slate-400 mt-1">
          Turn your PDF research into interactive quiz sessions, spaced-repetition flashcards, and cross-document comparison matrices.
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#111827] border border-slate-800">
        {[
          { id: 'mcq', label: 'Interactive MCQ Quiz', icon: HelpCircle },
          { id: 'flashcard', label: 'Flashcard Flip Deck', icon: GraduationCap },
          { id: 'compare', label: 'Multi-Doc Comparison', icon: Layers },
          { id: 'summary', label: 'Chapter Summaries', icon: BookOpen },
          { id: 'interview', label: 'Interview Prep', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Target Document Selector & Generation Trigger */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Select Source Documents
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'compare' ? 'Select 2 or more documents to contrast' : 'Select target documents for synthesis'}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedDocIds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Study Material</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {documents.map((d) => {
            const isSelected = selectedDocIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDocIds((prev) =>
                    prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.filename}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Display */}

      {/* 1. MCQ Tab */}
      {activeTab === 'mcq' && (
        <div className="space-y-6">
          {mcqItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 text-slate-400 text-xs">
              Click "Generate Study Material" to create a multiple-choice practice quiz based on your documents.
            </div>
          ) : (
            <div className="space-y-6">
              {showResults && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-300">Quiz Completed!</h3>
                    <p className="text-xs text-emerald-400 mt-0.5">
                      Your Score: {calculateScore()} / {mcqItems.length} (
                      {Math.round((calculateScore() / mcqItems.length) * 100)}%)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setShowResults(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {mcqItems.map((item, idx) => {
                  const userAnswer = userAnswers[item.id];
                  const isCorrect = userAnswer === item.correct_key;

                  return (
                    <div
                      key={item.id}
                      className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-semibold text-sm text-white leading-snug">
                          {idx + 1}. {item.question}
                        </h4>
                        {item.page_number && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/20 shrink-0">
                            Page {item.page_number}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {item.options.map((opt) => {
                          const isSelected = userAnswer === opt.key;
                          let optStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                          if (showResults) {
                            if (opt.key === item.correct_key) {
                              optStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200';
                            } else if (isSelected) {
                              optStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-blue-600/20 border-blue-500 text-blue-200';
                          }

                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectOption(item.id, opt.key)}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-slate-400">{opt.key}.</span>
                                <span>{opt.text}</span>
                              </div>
                              {showResults && opt.key === item.correct_key && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {showResults && isSelected && opt.key !== item.correct_key && (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {showResults && (
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <span className="font-semibold text-cyan-400">Explanation:</span>
                          <p>{item.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showResults && mcqItems.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowResults(true)}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Submit Answers & See Explanations
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Flashcard Tab */}
      {activeTab === 'flashcard' && (
        <div>
          {flashcards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 text-slate-400 text-xs">
              Click "Generate Study Material" to create interactive flashcards.
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Card {currentCardIdx + 1} of {flashcards.length}
                </span>
                <span className="font-semibold text-blue-400">
                  {flashcards[currentCardIdx].category}
                </span>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-72 p-8 rounded-3xl bg-[#111827] border border-slate-800 hover:border-slate-700 shadow-2xl flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 transform hover:scale-[1.01]"
              >
                {!isFlipped ? (
                  <div className="space-y-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                      Concept Prompt (Click to reveal)
                    </span>
                    <h3 className="text-lg font-bold text-white leading-relaxed">
                      {flashcards[currentCardIdx].front_prompt}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Document Evidence
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      "{flashcards[currentCardIdx].back_answer}"
                    </p>
                    {flashcards[currentCardIdx].page_number && (
                      <span className="inline-block text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                        {flashcards[currentCardIdx].source_citation}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentCardIdx((idx) => Math.max(0, idx - 1));
                    setIsFlipped(false);
                  }}
                  disabled={currentCardIdx === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  {isFlipped ? 'Show Prompt' : 'Flip Card'}
                </button>

                <button
                  onClick={() => {
                    setCurrentCardIdx((idx) => Math.min(flashcards.length - 1, idx + 1));
                    setIsFlipped(false);
                  }}
                  disabled={currentCardIdx === flashcards.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Multi-Document Comparison Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {!comparisonResult ? (
            <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 text-slate-400 text-xs">
              Select 2 or more documents above and click "Generate Study Material" to compute a
              cross-document synthesis matrix.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <h3 className="font-bold text-base text-white">{comparisonResult.topic}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {comparisonResult.summary}
                </p>

                {/* Contradictions & Differences */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Identified Variations & Contradictions Across Sources:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {comparisonResult.contradictions_and_differences.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Dimension</th>
                      {selectedDocIds.map((id) => (
                        <th key={id} className="p-4">
                          {documents.find((d) => d.id === id)?.filename || id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {comparisonResult.comparison_matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-4 font-semibold text-white">{row.dimension}</td>
                        {selectedDocIds.map((id) => {
                          const col = row[id];
                          return (
                            <td key={id} className="p-4 leading-relaxed">
                              {col ? (
                                <div>
                                  <p>{col.text}</p>
                                  <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
                                    Page {col.page_number}
                                  </span>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Summaries Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {!summaryData ? (
            <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 text-slate-400 text-xs">
              Select documents and click "Generate Study Material" to create chapter revision summaries.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
                <h3 className="font-bold text-sm text-white">Executive Synthesis</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {summaryData.executive_summary}
                </p>
              </div>

              {summaryData.sections.map((sec: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-blue-300">{sec.topic}</h4>
                    {sec.source_page && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                        Page {sec.source_page}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{sec.summary}</p>
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Key Takeaways:
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                      {sec.key_takeaways?.map((t: string, j: number) => (
                        <li key={j}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Interview Prep Tab */}
      {activeTab === 'interview' && (
        <div className="space-y-4">
          {interviewQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 text-slate-400 text-xs">
              Click "Generate Study Material" to synthesize technical interview questions.
            </div>
          ) : (
            interviewQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Question {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      q.difficulty === 'Beginner'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : q.difficulty === 'Intermediate'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-slate-100">{q.question}</h4>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-cyan-400">Model Answer:</span>
                  <p>{q.expected_answer}</p>
                  <span className="text-[10px] text-slate-500 italic block pt-1">
                    Source: {q.source_citation}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
