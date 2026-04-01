'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AIStudio() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<{ subject: string; body: string } | null>(null);
  const [brief, setBrief] = useState({ product: '', audience: '', tone: 'Professional', customPrompt: '' });
  const [promptMode, setPromptMode] = useState<'templates' | 'custom'>('templates');
  const router = useRouter();

  const handleTransfer = () => {
    if (output) {
      localStorage.setItem('omega_draft_subject', output.subject);
      localStorage.setItem('omega_draft_body', output.body);
      router.push('/composer');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = { 
        brief: { ...brief, promptMode }, 
        mode: 'email', 
        variants: 1 
      };
      
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.result) {
        let finalResult = data.result;

        // --- Improved Robust Recovery Layer ---
        if (finalResult.subject === 'Error' && typeof finalResult.body === 'string') {
          const bodyText = finalResult.body.trim();
          
          // Find the core JSON object (handles if AI added preamble/intro text)
          const startIdx = bodyText.indexOf('{');
          const endIdx = bodyText.lastIndexOf('}');

          if (startIdx !== -1 && endIdx !== -1) {
            const rawJson = bodyText.substring(startIdx, endIdx + 1);
            
            // Function to attempt parsing with various fixes
            const attemptParse = (str: string) => {
              try {
                return JSON.parse(str);
              } catch (e) {
                try {
                  // Fix unescaped newlines (CRITICAL: LLMs often emit raw newlines inside JSON strings)
                  let fixed = str.replace(/\n/g, '\\n');
                  
                  // Fix single quotes to double quotes for keys/values (Python-style dicts)
                  fixed = fixed.replace(/([{,]\s*)'([^']+)':/g, '$1"$2":');
                  fixed = fixed.replace(/:\s*'([^']*)'(\s*[,}])/g, ': "$1"$2');
                  
                  return JSON.parse(fixed);
                } catch (innerE) {
                  return null;
                }
              }
            };

            const parsed = attemptParse(rawJson);
            if (parsed && parsed.subject && parsed.body) {
              finalResult = parsed;
            }
          }
        }
        setOutput(finalResult);
      }
    } catch (e) {
      setOutput({ 
        subject: 'Error connecting to API', 
        body: 'Check that the backend is running. If it is, verify your GROQ API key in settings.' 
      });
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-white border border-[#D8DADF] rounded-lg px-4 py-2.5 text-sm text-[#0C0D10] placeholder:text-[#8D909C] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors";

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold text-[#0C0D10]">AI Studio</h1>
        <p className="text-[#8D909C] mt-1 text-sm flex items-center gap-2">
          Engine: <span className="text-[#1297FD] font-medium">Groq LLaMA 3.3 70B</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-8">
        {/* Input Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 bg-[rgba(18,151,253,.08)] text-[#1297FD] rounded-xl flex items-center justify-center mb-6 border border-[rgba(18,151,253,.14)]">
            <Bot size={22} />
          </div>

          <div className="flex bg-[#F2F3F5] p-0.5 rounded-lg border border-[#E8E9EC] w-full mb-6 relative">
            <button onClick={() => setPromptMode('templates')} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${promptMode === 'templates' ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>Templates</button>
            <button onClick={() => setPromptMode('custom')} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${promptMode === 'custom' ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>Custom Prompt</button>
          </div>

          <div className="space-y-5">
            {promptMode === 'templates' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#474A56] mb-1.5">Product / Offer</label>
                  <input value={brief.product} onChange={e => setBrief({ ...brief, product: e.target.value })} type="text" className={inputCls} placeholder="e.g. B2B SaaS for accountants" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#474A56] mb-1.5">Target Audience</label>
                  <input value={brief.audience} onChange={e => setBrief({ ...brief, audience: e.target.value })} type="text" className={inputCls} placeholder="e.g. Founders in North America" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#474A56] mb-1.5">Tone</label>
                  <select value={brief.tone} onChange={e => setBrief({ ...brief, tone: e.target.value })} className={inputCls}>
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Direct / Aggressive</option>
                    <option>Casual</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#474A56] mb-1.5 flex items-center gap-2">
                  Custom Instructions
                </label>
                <textarea value={brief.customPrompt} onChange={e => setBrief({ ...brief, customPrompt: e.target.value })}
                  className={`${inputCls} min-h-[220px] resize-none whitespace-pre-wrap`}
                  placeholder="e.g. Write a cold email to SaaS founders about an outbound AI tool. Mention our 14-day free trial. Keep it under 50 words..." />
              </div>
            )}
            
            <button onClick={handleGenerate} disabled={loading || (promptMode === 'templates' ? !brief.product : !brief.customPrompt)}
              className="w-full py-3 bg-[#1297FD] text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#0A82E0] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles size={17} /> {loading ? 'Generating...' : 'Generate Email'}
            </button>
          </div>
        </motion.div>

        {/* Output Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-[#E8E9EC] rounded-2xl p-6 shadow-sm flex flex-col min-h-[560px]">
          <h3 className="text-xs font-bold font-mono text-[#8D909C] uppercase tracking-wider mb-6">Generated Output</h3>

          {output ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col">
              <input type="text" value={output.subject}
                className="w-full text-lg font-semibold text-[#0C0D10] bg-transparent border-b border-[#E8E9EC] pb-4 mb-5 outline-none"
                readOnly />
              <div 
                className="flex-1 w-full bg-[#F2F3F5] border border-[#E8E9EC] rounded-xl p-5 text-sm text-[#474A56] leading-relaxed overflow-y-auto custom-scrollbar prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: output.body }}
              />
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => navigator.clipboard.writeText(output.subject + '\n\n' + output.body)}
                  className="px-5 py-2.5 border border-[#D8DADF] rounded-lg text-sm text-[#474A56] font-medium hover:bg-[#F2F3F5] transition-colors">
                  Copy
                </button>
                <button onClick={handleTransfer}
                  className="px-5 py-2.5 bg-[#1297FD] text-white rounded-lg text-sm font-semibold hover:bg-[#0A82E0] transition-colors shadow-sm">
                  Transfer to Composer →
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#D8DADF] flex items-center justify-center mb-4">
                <Bot size={26} className="text-[#D8DADF]" />
              </div>
              <p className="text-[#8D909C] text-sm">Fill in the brief and click Generate<br />to create your email copy.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
