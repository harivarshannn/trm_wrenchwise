%%writefile app.py
"""
Refined Healthcare Portal - WrenchWise Care
Focus: Enhanced text cleaning and clinical context retrieval.
"""

import os
import re
import pandas as pd
import numpy as np
import joblib
import streamlit as st
import faiss
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

# Configuration
MODEL_FILE = "model.pkl"
SCALER_FILE = "scaler.pkl"

st.set_page_config(page_title="WrenchWise Care", page_icon="\u2695", layout="wide")

def clean_text(text):
    """Removes non-ASCII characters, page markers, and common symbolic noise."""
    # Remove non-printable/symbolic characters
    text = re.sub(r'[^\x20-\x7E\n]+', ' ', text)
    # Remove 'Page X of Y' patterns that pollute RAG results
    text = re.sub(r'(?i)Page\s*\d+\s*of\s*\d+', '', text)
    # Consolidate whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def apply_styles():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
    html, body, [class*='css'] { font-family: 'Poppins', sans-serif; }
    .stApp { background-color: #F8FAFC; }
    .glass-card { background: white; border-radius: 15px; padding: 20px; border: 1px solid #E2E8F0; margin-bottom: 20px; }
    </style>
    """, unsafe_allow_html=True)

class SimpleRAG:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.chunks = []
    def index_text(self, text):
        cleaned = clean_text(text)
        # Using smaller chunks with overlap for better accuracy
        self.chunks = [cleaned[i:i+400] for i in range(0, len(cleaned), 300)]
        if not self.chunks: return
        embeddings = self.model.encode(self.chunks)
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(np.array(embeddings).astype('float32'))
    def search(self, query):
        if not self.index or not self.chunks: return None
        xq = self.model.encode([query]).astype('float32')
        _, I = self.index.search(xq, 3) # Get top 3 to filter junk
        for idx in I[0]:
            if idx != -1:
                candidate = self.chunks[idx].strip()
                if len(candidate) > 20: # Ensure it's not a tiny fragment
                    return candidate
        return None

@st.cache_resource
def load_ml():
    return joblib.load(MODEL_FILE), joblib.load(SCALER_FILE)

apply_styles()
model, scaler = load_ml()
if 'rag' not in st.session_state: st.session_state.rag = SimpleRAG()

with st.sidebar:
    st.title("\u2695 WrenchWise")
    page = st.selectbox("Navigation", ["Dashboard", "AI Assistant", "Document Search"])

if page == "Dashboard":
    st.header("Patient Dashboard (Interim Status)")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.write("**Patient:** DR. DUMMY (Lab No. Z6152301)")
        gl = st.slider("Glucose", 40, 200, 110)
        bmi = st.slider("BMI", 15, 50, 25)
        st.markdown("</div>", unsafe_allow_html=True)
    with col2:
        feat = pd.DataFrame([[0, gl, 80, 20, 80, bmi, 0.5, 25]], columns=scaler.feature_names_in_)
        prob = model.predict_proba(scaler.transform(feat))[0][1]
        st.metric("ASCVD Probability", f"{prob*100:.1f}%")
        st.warning("Note: A clinical intervention of 3 months is mandatory before status updates.")

elif page == "AI Assistant":
    st.header("Clinical Support Chat")
    if "history" not in st.session_state: st.session_state.history = []
    for m in st.session_state.history:
        with st.chat_message(m['role']): st.markdown(m['content'])

    if prompt := st.chat_input("Ask about your health, risk, or intervention..."):
        st.session_state.history.append({"role": "user", "content": prompt})
        with st.chat_message("user"): st.markdown(prompt)

        p_low = prompt.lower()
        if any(x in p_low for x in ["risk", "report", "download", "category"]):
            ans = "To view your risk category, follow the bit.ly link sent to your mobile, complete the questionnaire, and download the report from our website."
        elif any(x in p_low for x in ["intervention", "how long", "3 month", "status"]):
            ans = "Standard clinical protocol requires an intervention period of at least 3 months before your interim status can be updated."
        else:
            res = st.session_state.rag.search(prompt)
            if res:
                ans = f"Based on retrieved clinical context: {res}"
            else:
                ans = "I am your clinical assistant. Please ask about your ASCVD risk reports, or the 3-month intervention protocol. You can also upload a diagnostic PDF for context."

        st.session_state.history.append({"role": "assistant", "content": ans})
        with st.chat_message("assistant"): st.markdown(ans)

elif page == "Document Search":
    st.header("Clinical Knowledge Base")
    up = st.file_uploader("Upload PDF", type="pdf")
    if up:
        pdf = PdfReader(up)
        full_text = " "
        for p in pdf.pages:
            full_text += p.extract_text() + " "
        st.session_state.rag.index_text(full_text)
        st.success("Document indexed successfully. Page numbers and noise have been filtered.")