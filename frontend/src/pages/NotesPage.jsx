import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Trash2, 
  Send, 
  Layers, 
  FileCode, 
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Search,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditsContext.jsx';

export default function NotesPage() {
  const { user } = useAuth();
  const { spend, credits, setShowTopUp } = useCredits();

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [uploadMode, setUploadMode] = useState('paste');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Query State
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [queryError, setQueryError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setDocsError('');
    try {
      const data = await api.getDocuments();
      setDocuments(data);
      setSelectedDocumentIds((current) => current.filter((id) => data.some((doc) => doc.id === id)));
    } catch (err) {
      setDocsError(err.message || 'Unable to load your indexed notes.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!docTitle.trim()) {
      setUploadError('Please provide a title for these study notes.');
      return;
    }

    if (uploadMode === 'file' && !file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    if (uploadMode === 'paste' && !rawText.trim()) {
      setUploadError('Please paste your study notes text.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      if (uploadMode === 'file' && file) {
        formData.append('file', file);
      } else if (rawText) {
        formData.append('raw_text', rawText);
      }

      await api.uploadDocument(formData);
      setDocTitle('');
      setFile(null);
      setRawText('');
      loadDocuments();
    } catch (err) {
      setUploadError(err.message || 'Failed to index study notes.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document and its vector indexed chunks?')) return;
    try {
      await api.deleteDocument(docId);
      setSelectedDocumentIds((current) => current.filter((id) => id !== docId));
      await loadDocuments();
    } catch (err) {
      setDocsError(err.message || 'Unable to delete this note.');
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || querying) return;

    if (!spend(3)) return;
    setQuerying(true);
    setQueryError('');
    try {
      const result = await api.queryNotes({
        query: query.trim(),
        document_ids: selectedDocumentIds.length ? selectedDocumentIds : undefined,
      });
      setRagResult(result);
    } catch (err) {
      setQueryError(err.message || 'Unable to answer from your notes.');
    } finally {
      setQuerying(false);
    }
  };

  const toggleDocument = (id) => {
    setSelectedDocumentIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  const sourceChunks = ragResult?.relevant_chunks || ragResult?.sources || [];

  return (
    <div className="space-y-6 antialiased">
      
      {/* Page Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
              Ask From My Notes (RAG)
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-0.5">
              Upload your lecture notes, PDFs, or summaries. AI retrieves answers grounded directly in your study material.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================================================
            LEFT COL: NOTE UPLOADER & INDEXED DOCUMENTS (5 cols)
            ================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Note Ingestion Card */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-content-primary">
                Ingest Study Material
              </h2>
              
              <div className="flex items-center gap-1 bg-surface-secondary/70 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setUploadMode('paste')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    uploadMode === 'paste'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  Paste Notes
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    uploadMode === 'file'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g., Operating Systems Lecture 4 - Paging"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-main text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              {uploadMode === 'paste' ? (
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Paste Lecture Text
                  </label>
                  <textarea
                    rows={5}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste lecture transcript, textbook summary, or handwritten notes text..."
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-main text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">
                    Choose Text/Markdown File
                  </label>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-xs text-content-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Chunking & Vector Indexing...' : 'Index Note into Vector Store'}</span>
              </button>
            </form>
          </div>

          {/* Indexed Documents List */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-content-primary">
                Indexed Notes ({documents.length})
              </h2>
              <span className="text-[10px] text-content-muted">RAG Vector Knowledge</span>
            </div>

            {loadingDocs ? (
              <div className="py-6 text-center text-xs text-content-muted">Loading documents...</div>
            ) : docsError ? (
              <div className="p-3 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{docsError}</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-border p-4 text-xs text-content-muted space-y-1">
                <p>No study notes uploaded yet.</p>
                <p className="text-[10px]">Add your first lecture notes to begin asking questions.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-xl border bg-surface-secondary/40 flex items-center justify-between gap-3 transition-colors ${selectedDocumentIds.includes(doc.id) ? 'border-brand-primary ring-1 ring-brand-primary/20' : 'border-border hover:border-brand-primary/30'}`}
                  >
                    <button type="button" onClick={() => toggleDocument(doc.id)} className="min-w-0 flex-1 text-left">
                      <h4 className="text-xs font-bold text-content-primary truncate">{doc.title}</h4>
                      <p className="text-[10px] text-content-muted">
                        {doc.chunks_count || 1} chunks • {new Date(doc.created_at).toLocaleDateString()} {selectedDocumentIds.includes(doc.id) ? '• included in query' : ''}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleDocument(doc.id)} className={`p-1 rounded transition-colors ${selectedDocumentIds.includes(doc.id) ? 'text-brand-primary' : 'text-content-muted hover:text-brand-primary'}`} title="Include this note in the next answer">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(doc.id)} className="p-1 rounded text-content-muted hover:text-status-error hover:bg-status-error/10 transition-colors" title="Delete notes">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ==================================================
            RIGHT COL: SEMANTIC RAG Q&A CONSOLE (7 cols)
            ================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full">
                Semantic Vector Search
              </span>
              <h2 className="text-base sm:text-lg font-bold text-content-primary mt-1.5">
                Query Your Uploaded Study Material
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                The assistant analyzes semantic similarity across your indexed notes to generate verified answers with citations.
              </p>
            </div>

            {/* Query Form */}
            <form onSubmit={handleQuery} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Explain page fault resolution steps from my lecture notes..."
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-main text-xs sm:text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-xs"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={querying || !query.trim()}
                  className="absolute right-2 top-2 p-2 rounded-lg bg-brand-primary text-white shadow-xs hover:bg-brand-primary-hover disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-content-muted">
              <span className="font-bold uppercase tracking-wider">Try asking</span>
              {['What are the key definitions?', 'Explain the main process step by step', 'Give me a concise revision summary'].map((prompt) => (
                <button key={prompt} type="button" onClick={() => setQuery(prompt)} className="px-2.5 py-1 rounded-full border border-border bg-main hover:border-brand-primary/40 hover:text-brand-primary transition-colors text-left">
                  {prompt}
                </button>
              ))}
            </div>

            {queryError && (
              <div className="p-3 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {/* Querying Indicator */}
            {querying && (
              <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex items-center gap-2.5 text-xs text-content-primary">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                <span>Searching vector chunks and synthesizing grounded answer...</span>
              </div>
            )}

            {/* RAG Answer Display */}
            {ragResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="p-5 rounded-2xl border border-brand-primary/30 bg-surface-secondary/40 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Grounded Answer from Notes</span>
                  </div>

                  <p className="text-xs sm:text-sm text-content-primary leading-relaxed whitespace-pre-wrap">
                    {ragResult.answer}
                  </p>
                </div>

                {/* Source Citations */}
                {sourceChunks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                      Source Citations & Relevant Excerpts
                    </h4>

                    <div className="space-y-2">
                      {sourceChunks.map((src, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-border bg-main text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-content-primary">{src.document_title || 'Lecture Note'}</span>
                            <span className="text-brand-primary">
                              {Math.round((src.similarity ?? src.relevance_score ?? 0.85) * 100)}% Match
                            </span>
                          </div>
                          <p className="text-content-muted text-[11px] leading-relaxed italic">
                            "{src.snippet || src.content || src.chunk_text || 'Excerpt referenced from notes.'}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
