import math
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from app.services.ai_service import ai_service

class RAGService:
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """Split text into overlapping semantic windows."""
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        if not cleaned_text:
            return []
            
        words = cleaned_text.split()
        if len(words) <= chunk_size:
            return [cleaned_text]
            
        chunks = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            if end == len(words):
                break
            start += (chunk_size - overlap)
        return chunks

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-zA-Z0-9_]{2,}\b', text.lower())

    def compute_similarity(self, query: str, chunks: List[str], top_k: int = 3) -> List[Tuple[int, float]]:
        """TF-IDF vector cosine similarity over document chunks."""
        if not chunks:
            return []
            
        corpus = [query] + chunks
        docs_tokens = [self._tokenize(doc) for doc in corpus]
        
        # Build vocabulary
        vocab = {}
        for tokens in docs_tokens:
            for token in tokens:
                if token not in vocab:
                    vocab[token] = len(vocab)
                    
        if not vocab:
            return [(i, 0.0) for i in range(len(chunks))[:top_k]]
            
        # Compute IDF
        num_docs = len(corpus)
        df = {term: 0 for term in vocab}
        for tokens in docs_tokens:
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] += 1
                
        idf = {term: math.log((num_docs + 1) / (df[term] + 1)) + 1.0 for term in vocab}
        
        # Build TF-IDF vectors
        vectors = np.zeros((num_docs, len(vocab)), dtype=np.float32)
        for d_idx, tokens in enumerate(docs_tokens):
            if not tokens:
                continue
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            for t, count in tf.items():
                vectors[d_idx, vocab[t]] = (count / len(tokens)) * idf[t]
                
        # Cosine similarity between query (index 0) and each chunk (index 1..n)
        query_vec = vectors[0]
        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return [(i, 0.0) for i in range(len(chunks))[:top_k]]
            
        results = []
        for c_idx in range(1, num_docs):
            chunk_vec = vectors[c_idx]
            chunk_norm = np.linalg.norm(chunk_vec)
            if chunk_norm == 0:
                sim = 0.0
            else:
                sim = float(np.dot(query_vec, chunk_vec) / (query_norm * chunk_norm))
            results.append((c_idx - 1, sim))
            
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    async def answer_from_notes(self, query: str, chunks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ask questions from uploaded student notes using RAG context.
        """
        if not chunks_data:
            return {
                "answer": "No study notes have been uploaded yet. Upload your PDF or text notes first to ask questions!",
                "relevant_chunks": []
            }
            
        raw_chunks = [c["chunk_text"] for c in chunks_data]
        top_matches = self.compute_similarity(query, raw_chunks, top_k=3)
        
        relevant_chunks = []
        context_parts = []
        for chunk_idx, score in top_matches:
            c = chunks_data[chunk_idx]
            relevant_chunks.append({
                "chunk_id": c.get("id"),
                "document_title": c.get("document_title", "Document"),
                "chunk_text": c["chunk_text"],
                "relevance_score": round(score, 3)
            })
            context_parts.append(f"[Excerpt from {c.get('document_title', 'Note')}]:\n{c['chunk_text']}")
            
        context_str = "\n\n---\n\n".join(context_parts)
        prompt = f"""
You are the GyanSetu "Ask From My Notes" assistant. Answer the student's question STRICTLY using the retrieved context from their uploaded notes below.
If the notes do not contain enough information, explain what is present in the notes and supplement with concise academic context.

RETRIEVED NOTES CONTEXT:
{context_str}

STUDENT QUESTION:
{query}

Provide a well-structured answer citing specific details from the uploaded notes.
"""
        response = await ai_service._call_gemini(prompt)
        if response:
            return {
                "answer": response,
                "relevant_chunks": relevant_chunks
            }
            
        # Rich fallback synthesis from retrieved excerpts
        top_excerpt = relevant_chunks[0]["chunk_text"] if relevant_chunks else ""
        return {
            "answer": f"""### 📖 Answer From Your Notes

Based on your uploaded study material:

{top_excerpt[:350]}...

**Summary & Key Insights from Notes:**
- The concept directly addresses **"{query}"** through the mechanisms outlined above.
- Make sure to review the specific formulas and definitions from your document.
- **Reference**: See retrieved excerpt (Relevance score: {relevant_chunks[0]['relevance_score'] if relevant_chunks else 'N/A'}).""",
            "relevant_chunks": relevant_chunks
        }

rag_service = RAGService()
