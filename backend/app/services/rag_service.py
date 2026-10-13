"""
RAG (Retrieval-Augmented Generation) Service for Karachi WasteWatch AI.
Provides vector-based TF-IDF semantic retrieval over civic knowledge documents
and synthesizes conversational answers for citizens.
"""

from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.services.rag_knowledge import KNOWLEDGE_DOCS


class CitizenRAGAssistant:
    def __init__(self, docs: Optional[List[Dict[str, Any]]] = None):
        self.docs = docs or KNOWLEDGE_DOCS
        self.corpus = [
            f"{doc['title']} {doc['category']} {doc['content']}"
            for doc in self.docs
        ]
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant knowledge documents for a given citizen question.
        """
        if not query.strip():
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        top_indices = similarities.argsort()[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.08:  # relevance threshold
                doc_copy = dict(self.docs[idx])
                doc_copy["relevance_score"] = round(score, 3)
                results.append(doc_copy)

        return results

    def answer(self, query: str, citizen_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesize a helpful, conversational, grounded answer based on retrieved documents.
        """
        retrieved = self.retrieve(query, top_k=2)

        greeting = f"Hello {citizen_name}! " if citizen_name else "Hello! "

        if not retrieved:
            # Fallback for out-of-domain or ungrounded questions
            response_text = (
                f"{greeting}I am your **Karachi WasteWatch AI Assistant**. "
                "I can guide you on reporting street garbage, understanding your Citizen ID, "
                "using the AI Waste Scanner, tracking complaint statuses (Pending, Verified, In Progress, Resolved), "
                "or exploring the Karachi Waste Map.\n\n"
                "Please ask a specific question such as:\n"
                "• *How do I report garbage in my area?*\n"
                "• *What does the 'In Progress' status mean?*\n"
                "• *How does the AI Waste Scanner work?*\n"
                "• *Where do I find my Citizen ID?*"
            )
            return {
                "answer": response_text,
                "sources": [],
                "confidence": 0.0
            }

        # Build answer using the top retrieved contexts
        primary_doc = retrieved[0]
        secondary_doc = retrieved[1] if len(retrieved) > 1 else None

        answer_parts = [f"{greeting}{primary_doc['content']}"]

        if secondary_doc and secondary_doc["id"] != primary_doc["id"]:
            answer_parts.append(f"\n\n**Additional Tip ({secondary_doc['title']}):** {secondary_doc['content']}")

        answer_parts.append(
            "\n\n*If you need further help, you can use the sidebar to navigate to 'Report Waste', 'AI Waste Scanner', or 'My Reports'.*"
        )

        return {
            "answer": "".join(answer_parts),
            "sources": [{"title": doc["title"], "category": doc["category"]} for doc in retrieved],
            "confidence": primary_doc["relevance_score"]
        }


# Global singleton instance
rag_assistant = CitizenRAGAssistant()
