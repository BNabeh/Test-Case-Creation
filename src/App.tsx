import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Layout,
  TestTube,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTestCases, TestCase } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TEST_CASE_TEMPLATES = [
  "User Authentication: Login with email/password, SSO, and 2FA.",
  "E-commerce Checkout: Adding items to cart, applying coupons, and guest checkout.",
  "Search Functionality: Filtering, sorting, and pagination of results.",
  "Profile Management: Updating personal info, uploading avatar, and password change."
];

export default function App() {
  const [scenario, setScenario] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filter, setFilter] = useState<'All' | 'Positive' | 'Negative' | 'Edge' | 'Security' | 'Performance'>('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!scenario && !selectedImage) return;
    setIsGenerating(true);
    try {
      const generated = await generateTestCases(scenario, selectedImage || undefined);
      setTestCases(generated);
    } catch (error) {
      console.error(error);
      alert("Something went wrong during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToJson = () => {
    const blob = new Blob([JSON.stringify(testCases, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_cases.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    if (testCases.length === 0) return;
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Module', 'Preconditions', 'TestData', 'Steps', 'Expected Result'];
    const rows = testCases.map(tc => [
      tc.id,
      tc.title,
      tc.type,
      tc.priority,
      tc.module,
      tc.preconditions,
      tc.testData,
      tc.steps.join(' | '),
      tc.expectedResult
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_cases.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all inputs and generated cases?")) {
      setScenario('');
      setTestCases([]);
      setSelectedImage(null);
      setFilter('All');
      setModuleFilter('All');
      setPriorityFilter('All');
      setSearchQuery('');
    }
  };

  const filteredTestCases = testCases.filter(tc => {
    const matchesType = filter === 'All' || tc.type === filter;
    const matchesModule = moduleFilter === 'All' || tc.module === moduleFilter;
    const matchesPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
    const matchesSearch = searchQuery === '' || 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesModule && matchesPriority && matchesSearch;
  });

  const modules = Array.from(new Set(testCases.map(tc => tc.module)));

  const stats = {
    total: testCases.length,
    positive: testCases.filter(tc => tc.type === 'Positive').length,
    negative: testCases.filter(tc => tc.type === 'Negative').length,
    edge: testCases.filter(tc => tc.type === 'Edge').length,
    special: testCases.filter(tc => ['Security', 'Performance'].includes(tc.type)).length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <TestTube size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">QA Automated Test Cases</h1>
          </div>
          <div className="flex items-center gap-3">
            {testCases.length > 0 && (
              <>
                <button 
                  onClick={exportToJson}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <FileJson size={16} />
                  JSON
                </button>
                <button 
                  onClick={exportToCsv}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <FileSpreadsheet size={16} />
                  CSV
                </button>
              </>
            )}
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Input Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layout size={20} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Scenario Context</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Application Description
                  </label>
                  <textarea
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="Describe the feature or scenario..."
                    className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    UI Reference / Screenshot
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                      selectedImage ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    {selectedImage ? (
                      <div className="relative w-full group">
                        <img src={selectedImage} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <X 
                            size={20} 
                            className="text-white cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(null);
                            }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400" />
                        <span className="text-xs text-slate-500 font-medium text-center px-4">Click to upload screenshot for business logic extraction</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!scenario && !selectedImage)}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]",
                    isGenerating || (!scenario && !selectedImage)
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCcw size={18} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Create Test Suite
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Templates</h3>
              <div className="space-y-2">
                {TEST_CASE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScenario(tmpl)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-[600px]">
            <AnimatePresence mode="wait">
              {testCases.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-2xl font-bold text-slate-800 tracking-tight">{stats.total}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cases</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-2xl font-bold text-emerald-600 tracking-tight">{stats.positive}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Happy Path</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-2xl font-bold text-rose-600 tracking-tight">{stats.negative}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negative</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-2xl font-bold text-amber-600 tracking-tight">{stats.edge + stats.special}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Edge & Special</div>
                    </div>
                  </div>

                  {/* Filters & Search Row */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search test cases..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <Layout size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select 
                          value={filter} 
                          onChange={(e) => setFilter(e.target.value as any)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="All">All Types</option>
                          <option value="Positive">Happy Path</option>
                          <option value="Negative">Negative</option>
                          <option value="Edge">Edge Case</option>
                          <option value="Security">Security</option>
                          <option value="Performance">Performance</option>
                        </select>
                        <select 
                          value={moduleFilter} 
                          onChange={(e) => setModuleFilter(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="All">All Modules</option>
                          {modules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select 
                          value={priorityFilter} 
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="All">All Priorities</option>
                          <option value="P1">P1 - Critical</option>
                          <option value="P2">P2 - High</option>
                          <option value="P3">P3 - Medium</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-1">
                      Showing {filteredTestCases.length} of {testCases.length} test cases
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredTestCases.map((tc) => (
                      <motion.div 
                        key={tc.id}
                        layout
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors shadow-sm"
                      >
                        <div 
                          onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
                          className="p-5 flex flex-col gap-4 cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-400 min-w-[70px] font-mono tracking-tight">{tc.id}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide",
                              tc.type === 'Positive' ? "bg-[#EAF3DE] text-[#3B6D11]" :
                              tc.type === 'Negative' ? "bg-[#FCEBEB] text-[#A32D2D]" :
                              tc.type === 'Edge' ? "bg-[#FAEEDA] text-[#854F0B]" :
                              tc.type === 'Security' ? "bg-[#EEEDFE] text-[#3C3489]" :
                              "bg-[#E6F1FB] text-[#185FA5]"
                            )}>
                              {tc.type}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide",
                              tc.priority === 'P1' ? "bg-[#FCEBEB] text-[#A32D2D]" :
                              tc.priority === 'P2' ? "bg-[#FAEEDA] text-[#854F0B]" :
                              "bg-[#EAF3DE] text-[#3B6D11]"
                            )}>
                              {tc.priority}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">
                              {tc.module}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm leading-snug">{tc.title}</h3>
                            {expandedId === tc.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </div>
                        </div>

                        {expandedId === tc.id && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-5 pb-5 border-t border-slate-50 bg-slate-50/20"
                          >
                            <div className="pt-5 space-y-6">
                              <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">Preconditions</label>
                                  <div className="text-xs text-slate-600 font-medium leading-relaxed">{tc.preconditions}</div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">Test Data</label>
                                  <div className="text-xs text-slate-600 font-medium leading-relaxed">{tc.testData}</div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">Steps</label>
                                <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-4 space-y-2 leading-relaxed">
                                  {tc.steps.map((step, sIdx) => (
                                    <div key={sIdx} className="flex gap-3">
                                      <span className="text-indigo-400 font-bold shrink-0">{sIdx + 1}.</span>
                                      {step}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2">
                                <div className="p-4 bg-white border-l-4 border-indigo-600 rounded-r-xl rounded-l shadow-sm space-y-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Expected Result</label>
                                  <div className="text-xs text-slate-700 font-bold leading-relaxed">{tc.expectedResult}</div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">Actual Observation</label>
                                <textarea 
                                  placeholder="Record actual result or remarks during testing..."
                                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px]"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 shadow-inner">
                  <div className="p-8 bg-indigo-50 rounded-full mb-6 text-indigo-400 animate-pulse">
                    <Zap size={64} strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Strategy Begins Here</h3>
                  <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
                    Forge comprehensive test suites from app descriptions or UI screenshots. 
                    I'll cross-reference edge cases, security vulnerabilities, and functional requirements.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2024 QA TestForge &bull; AI-Powered Strategic Test Generation
          </p>
        </div>
      </footer>
    </div>
  );
}
