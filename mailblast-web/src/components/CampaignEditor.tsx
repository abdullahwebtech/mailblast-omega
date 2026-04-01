'use client';

import { motion } from 'framer-motion';
import { Upload, Target, XCircle, Loader2, Play, User, Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import RichTextEditor, { RichTextEditorRef } from './Editor/RichTextEditor';

interface CampaignEditorProps {
  mode: 'instant' | 'scheduled';
  onSuccess: (campaignId: number) => void;
  onCancel?: () => void;
}

export default function CampaignEditor({ mode, onSuccess, onCancel }: CampaignEditorProps) {
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientVar, setRecipientVar] = useState('');
  const [delayMode, setDelayMode] = useState<number | string>(10);
  const [customDelay, setCustomDelay] = useState<number>(5);
  const [status, setStatus] = useState('');
  const [fileName, setFileName] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [attachmentsBatchId, setAttachmentsBatchId] = useState<string | null>(null);
  const [attachmentVar, setAttachmentVar] = useState('');
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isSingleEmail, setIsSingleEmail] = useState(false);
  const [singleRecipient, setSingleRecipient] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const bodyRef = useRef<RichTextEditorRef>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const subjectCursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const [varTarget, setVarTarget] = useState<'body' | 'subject'>('body');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [testAccountId, setTestAccountId] = useState<number | null>(null);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [testRecipients, setTestRecipients] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts`).then(r => r.json()).then(d => {
      setAccounts(d.accounts || []);
      if (d.accounts?.length > 0) setTestAccountId(d.accounts[0].id);
    }).catch(() => {});
    const draftSubj = localStorage.getItem('omega_draft_subject');
    const draftBody = localStorage.getItem('omega_draft_body');
    if (draftSubj) { setSubject(draftSubj); localStorage.removeItem('omega_draft_subject'); }
    if (draftBody) { setBody(draftBody); localStorage.removeItem('omega_draft_body'); }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const headers = (XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[]).filter(h => h && typeof h === 'string');
        const json = XLSX.utils.sheet_to_json(ws);
        setVariables(headers);
        setRecipientVar(headers.find(h => h.toLowerCase().includes('email')) || headers[0]);
        setSheetData(json);
        setIsSingleEmail(false);
      } catch (err: any) { setStatus('Error reading file: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploadingAttachments(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/attachments/upload`, { method: 'POST', body: fd });
      const d = await res.json();
      if (d.status === 'success') { setAttachmentsBatchId(d.batch_id); setAttachmentCount(d.files.length); setStatus(`${d.files.length} attachments uploaded.`); }
      else setStatus('Error uploading attachments.');
    } catch (err: any) { setStatus('Error: ' + err.message); }
    finally { setIsUploadingAttachments(false); }
  };

  const handleAction = async () => {
    if (isTestingMode) {
      if (!testRecipients || !subject || !body || !testAccountId) { setStatus('Error: Fill in test recipient, subject, and body.'); return; }
    } else if (isSingleEmail) {
      if (!singleRecipient || !subject || !body || !testAccountId) { setStatus('Error: Missing required fields.'); return; }
    } else {
      const missing = [];
      if (!sheetData.length) missing.push('Mailing Ledger');
      if (!subject) missing.push('Subject');
      if (!body) missing.push('Email Content');
      if (!recipientVar) missing.push('Email Column');
      if (!testAccountId) missing.push('Sender Account');
      if (attachmentCount > 0 && !attachmentVar) missing.push('Attachment Column');
      if (missing.length) { setStatus(`Error: Please provide ${missing.join(', ')}.`); return; }
    }
    if (mode === 'scheduled' && !scheduledAt && !isTestingMode) { setStatus('Error: Select a date and time.'); return; }

    const endpoint = mode === 'instant' ? '/api/campaign/launch' : (isSingleEmail ? '/api/scheduler/single' : '/api/scheduler/create');
    const payload: any = {
      campaign_name: campaignName || (isTestingMode ? 'Test Blast' : isSingleEmail ? `Single: ${singleRecipient}` : 'Untitled Blast'),
      subject, body, account_id: testAccountId, is_test: isTestingMode,
      test_recipients: isTestingMode ? testRecipients : null
    };
    if (!isTestingMode) {
      if (isSingleEmail) {
        payload.recipient = singleRecipient;
        if (mode === 'scheduled') payload.scheduled_at = scheduledAt;
      } else {
        const rawVar = recipientVar.replace(/[{}]/g, '');
        payload.recipient_var = rawVar;
        const expanded: any[] = [];
        sheetData.forEach(row => {
          const rawEmailString = String(row[rawVar] || '').trim();
          if (!rawEmailString) return; 
          const emails = rawEmailString.split(/[,;]+/).map(e => e.trim()).filter(Boolean);
          if (emails.length) emails.forEach(email => expanded.push({ ...row, [rawVar]: email }));
          else expanded.push(row);
        });
        payload.data = expanded;
        payload.delay_seconds = delayMode === 'custom' ? customDelay : Number(delayMode);
        if (attachmentsBatchId && attachmentVar) { payload.attachments_batch_id = attachmentsBatchId; payload.attachment_var = attachmentVar; }
        if (mode === 'scheduled') payload.scheduled_at = scheduledAt;
      }
    } else { payload.data = []; payload.recipient_var = 'test'; }

    setStatus(mode === 'instant' ? 'Launching campaign...' : 'Scheduling...');
    try {
      const url = mode === 'instant' ? endpoint : `${endpoint}${isSingleEmail ? '' : `?scheduled_at=${scheduledAt}`}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.detail)) throw new Error(data.detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', '));
        throw new Error(typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail || res.statusText);
      }
      onSuccess(data.campaign_id);
    } catch (e: any) { setStatus('Error: ' + e.message); }
  };

  const inputCls = "w-full bg-white border border-[#D8DADF] rounded-lg px-3 py-2.5 text-sm text-[#0C0D10] focus:outline-none focus:border-[#1297FD] focus:ring-2 focus:ring-[rgba(18,151,253,.12)] transition-colors placeholder:text-[#8D909C]";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,2fr)_minmax(0,5fr)_minmax(200px,1.5fr)] gap-4 lg:gap-5">

      {/* ── Config Column ── */}
      <div className="bg-white border border-[#E8E9EC] rounded-2xl p-5 space-y-5 shadow-sm">
        <div>
          <h3 className="text-xs font-bold font-mono text-[#1297FD] uppercase tracking-wider flex items-center gap-2 mb-3"><Target size={15} /> Configuration</h3>
          {!isTestingMode && (
            <div className="flex bg-[#F2F3F5] p-0.5 rounded-lg border border-[#E8E9EC] w-full">
              <button onClick={() => setIsSingleEmail(false)} className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${!isSingleEmail ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>BULK</button>
              <button onClick={() => setIsSingleEmail(true)} className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${isSingleEmail ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>SINGLE</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!isTestingMode && (
            <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Campaign Name</label>
              <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} className={inputCls} placeholder="e.g. Monthly Newsletter" /></div>
          )}

          {!isTestingMode && isSingleEmail && (
            <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Recipient Address</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D909C]" size={15} />
                <input type="email" value={singleRecipient} onChange={e => setSingleRecipient(e.target.value)} className={`${inputCls} pl-9`} placeholder="target@example.com" /></div></div>
          )}

          {!isTestingMode && !isSingleEmail && (
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Upload Mailing Ledger</label>
                <div className="relative flex items-center justify-center border-2 border-dashed border-[#D8DADF] hover:border-[#1297FD] hover:bg-[rgba(18,151,253,.025)] rounded-xl py-7 transition-colors cursor-pointer">
                  <input type="file" accept=".csv,.xlsx,.xls,.numbers" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center gap-2 pointer-events-none text-center">
                    <Upload size={20} className="text-[#8D909C]" />
                    <span className="text-xs text-[#8D909C] px-2">{fileName || 'Drop CSV, Excel or Numbers'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#E8E9EC]">
                <label className="block text-xs font-medium text-[#474A56] mb-1.5">Dynamic Attachments Folder</label>
                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#D8DADF] hover:border-[#1297FD] hover:bg-[rgba(18,151,253,.025)] rounded-xl py-5 transition-colors cursor-pointer">
                  <input type="file" multiple {...{ webkitdirectory: 'true', directory: 'true' } as any} onChange={handleAttachmentUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center gap-1 pointer-events-none text-center">
                    {isUploadingAttachments ? <Loader2 className="animate-spin text-[#1297FD]" size={18} /> : <Upload size={18} className="text-[#8D909C]" />}
                    <span className="text-xs text-[#8D909C] px-2">{attachmentCount > 0 ? `${attachmentCount} files ready` : 'Upload Attachments Folder'}</span>
                  </div>
                </div>
                {attachmentCount > 0 && variables.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-mono text-[#8D909C] uppercase tracking-wider mb-1">Attachment Filename Column</label>
                    <select value={attachmentVar} onChange={e => setAttachmentVar(e.target.value)} className={selectCls}>
                      <option value="" disabled>Select column...</option>
                      {variables.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isTestingMode && mode === 'scheduled' && (
            <div><label className="block text-xs font-medium text-[#F59E0B] mb-1.5">Scheduled Date & Time</label>
              <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F59E0B]" size={15} />
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full bg-white border border-[rgba(245,158,11,.3)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#0C0D10] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[rgba(245,158,11,.12)] transition-colors" /></div></div>
          )}

          {mode === 'instant' && (
            <div className="pt-3 border-t border-[#E8E9EC]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-[#EF4444] flex items-center gap-1.5"><Target size={13} /> Test Mode</label>
                <button onClick={() => setIsTestingMode(!isTestingMode)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isTestingMode ? 'bg-[#EF4444]' : 'bg-[#E8E9EC]'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${isTestingMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {isTestingMode && (
                <div><label className="block text-xs font-medium text-[#474A56] mb-1.5">Test Recipients</label>
                  <input type="text" value={testRecipients} onChange={e => setTestRecipients(e.target.value)}
                    className="w-full bg-white border border-[rgba(239,68,68,.3)] rounded-lg px-3 py-2 text-xs text-[#0C0D10] focus:outline-none focus:border-[#EF4444] transition-colors placeholder:text-[#8D909C]"
                    placeholder="test1@me.com, test2@me.com" /></div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#E8E9EC]">
            <label className="block text-[10px] font-mono text-[#8D909C] uppercase tracking-wider mb-1.5">Sender Account</label>
            <select value={testAccountId || ''} onChange={e => setTestAccountId(Number(e.target.value))} className={selectCls}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.email} ({a.provider})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Editor Column ── */}
      <div className="bg-white border border-[#E8E9EC] rounded-2xl p-4 lg:p-6 flex flex-col min-h-[500px] xl:min-h-[700px] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold font-mono text-[#8D909C] uppercase tracking-wider">✉ Email Content</h3>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="text-[#8D909C] hover:text-[#474A56] text-sm font-medium transition-colors px-3 py-2">Cancel</button>
            <button onClick={handleAction}
              className={`px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm ${
                isTestingMode ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                : mode === 'instant' ? 'bg-[#1297FD] text-white hover:bg-[#0A82E0]'
                : 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
              }`}>
              {isTestingMode ? <Target size={15} /> : mode === 'instant' ? <Play size={15} fill="currentColor" /> : <Calendar size={15} />}
              {isTestingMode ? 'Send Test' : mode === 'instant' ? 'Launch Campaign' : 'Schedule Dispatch'}
            </button>
          </div>
        </div>

        <div className="space-y-3 flex-1 flex flex-col">
          {!isTestingMode && !isSingleEmail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F2F3F5] border border-[#E8E9EC] rounded-xl">
              <div>
                <label className="block text-[10px] font-mono text-[#8D909C] uppercase tracking-wider mb-1">Email Column</label>
                <select value={recipientVar} onChange={e => setRecipientVar(e.target.value)} className={selectCls}>
                  <option value="" disabled>Select...</option>
                  {variables.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#8D909C] uppercase tracking-wider mb-1">Delay Interval</label>
                <div className="flex gap-2">
                  <select value={delayMode} onChange={e => setDelayMode(e.target.value === 'custom' ? 'custom' : Number(e.target.value))} className={selectCls}>
                    <option value={10}>10s (Fast)</option>
                    <option value={15}>15s (Standard)</option>
                    <option value={30}>30s (Safe)</option>
                    <option value={60}>60s (Stealth)</option>
                    <option value="custom">Custom...</option>
                  </select>
                  {delayMode === 'custom' && (
                    <input type="number" min="0.1" step="0.1" value={customDelay} onChange={e => setCustomDelay(Number(e.target.value))}
                      className="w-20 bg-white border border-[#D8DADF] rounded-lg px-2 py-2 text-sm text-[#0C0D10] focus:outline-none focus:border-[#1297FD] text-center transition-colors" placeholder="sec" />
                  )}
                </div>
              </div>
            </div>
          )}

          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            ref={subjectRef}
            onFocus={() => setVarTarget('subject')}
            onBlur={e => { subjectCursorRef.current = { start: e.target.selectionStart ?? subject.length, end: e.target.selectionEnd ?? subject.length }; }}
            onSelect={e => { const t = e.target as HTMLInputElement; subjectCursorRef.current = { start: t.selectionStart ?? subject.length, end: t.selectionEnd ?? subject.length }; }}
            className="w-full bg-transparent border-b-2 border-[#E8E9EC] px-1 py-2.5 font-semibold text-lg text-[#0C0D10] focus:outline-none focus:border-[#1297FD] transition-colors placeholder:text-[#D8DADF]"
            placeholder="Subject Line..." />

          <RichTextEditor ref={bodyRef} content={body} onChange={setBody} onFocus={() => setVarTarget('body')}
            placeholder="Write your email here... Use {Variables} if needed." className="mt-1 flex-1" />
        </div>
      </div>

      {/* ── Variables & Preview Column ── */}
      <div className="space-y-4 xl:sticky xl:top-6">
        <div className="bg-white border border-[#E8E9EC] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[10px] font-bold font-mono text-[#8D909C] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-[#1297FD]">{'{}'}</span> Variables
          </h3>
          {!isSingleEmail && variables.length > 0 && (
            <div className="flex bg-[#F2F3F5] p-0.5 rounded-lg border border-[#E8E9EC] mb-3">
              <button id="var-target-body" onClick={() => setVarTarget('body')}
                className={`flex-1 px-2 py-1 text-[10px] font-bold rounded-md transition-all ${varTarget === 'body' ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>
                BODY
              </button>
              <button id="var-target-subject" onClick={() => setVarTarget('subject')}
                className={`flex-1 px-2 py-1 text-[10px] font-bold rounded-md transition-all ${varTarget === 'subject' ? 'bg-white text-[#0C0D10] shadow-sm border border-[#E8E9EC]' : 'text-[#8D909C] hover:text-[#474A56]'}`}>
                SUBJECT
              </button>
            </div>
          )}
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
            {!isSingleEmail && variables.length > 0 ? variables.map(v => (
              <button key={v} onClick={() => {
                if (varTarget === 'subject') {
                  const tag = `{${v}}`;
                  const start = subjectCursorRef.current.start;
                  const end = subjectCursorRef.current.end;
                  const next = subject.slice(0, start) + tag + subject.slice(end);
                  setSubject(next);
                  const newPos = start + tag.length;
                  subjectCursorRef.current = { start: newPos, end: newPos };
                  setTimeout(() => {
                    const el = subjectRef.current;
                    if (el) { el.focus(); el.setSelectionRange(newPos, newPos); }
                  }, 0);
                } else {
                  bodyRef.current?.insertContent(`{${v}}`);
                }
              }}
                className="w-full text-left bg-[#F2F3F5] hover:bg-[rgba(18,151,253,.07)] hover:border-[rgba(18,151,253,.2)] px-3 py-2 rounded-lg font-mono text-[#1297FD] border border-[#E8E9EC] transition-all text-xs">
                {`{${v}}`}
              </button>
            )) : (
              <p className="text-xs text-[#8D909C] p-3 text-center leading-relaxed">
                {isSingleEmail ? 'Single mode — no variables.' : 'Upload a ledger to see variables.'}
              </p>
            )}
          </div>
        </div>

        {!isSingleEmail && sheetData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E8E9EC] rounded-2xl p-4 shadow-sm overflow-hidden">
            <h3 className="text-[10px] font-mono text-[#8D909C] uppercase tracking-wider mb-3 flex items-center gap-2"><Upload size={11} /> Preview</h3>
            <div className="overflow-x-auto custom-scrollbar max-h-[260px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E9EC]">
                    {variables.slice(0, 3).map(v => (
                      <th key={v} className="px-2 py-1.5 text-[8px] font-mono text-[#1297FD] uppercase tracking-tight whitespace-nowrap bg-[#F2F3F5]">{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-[#E8E9EC] hover:bg-[rgba(18,151,253,.025)] transition-colors">
                      {variables.slice(0, 3).map(v => (
                        <td key={v} className="px-2 py-1.5 text-[10px] text-[#474A56] whitespace-nowrap truncate max-w-[80px]">{String(row[v] || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {variables.length > 3 && <div className="text-[9px] text-[#8D909C] mt-2 font-mono text-right">+{variables.length - 3} more columns</div>}
            </div>
          </motion.div>
        )}
      </div>

      {/* Toast */}
      {status && (
        <div className={`fixed bottom-4 right-4 sm:right-6 sm:bottom-6 z-[9999] px-5 py-3.5 rounded-xl border flex items-center gap-3 font-medium text-sm shadow-md max-w-sm ${
          status.includes('Error') ? 'bg-white border-[rgba(239,68,68,.3)] text-[#EF4444]' : 'bg-white border-[rgba(18,151,253,.2)] text-[#1297FD]'
        }`}>
          <span>{status}</span>
          <button onClick={() => setStatus('')} className="text-[#8D909C] hover:text-[#0C0D10] transition-colors"><XCircle size={16} /></button>
        </div>
      )}
    </div>
  );
}
