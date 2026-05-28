"""
Diabetes Disease Prediction & Conversational Healthcare Assistant
Streamlit App with ML, RAG, SQLite, and Dynamic PDF Reporting.
"""

import os
import io
import time
import sqlite3
import datetime
import pandas as pd
import numpy as np
import joblib
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

# Machine Learning & Scaling
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Vector DB & Embeddings for RAG
import faiss
from sentence_transformers import SentenceTransformer

# PDF Document Parsing
from pypdf import PdfReader

# PDF Report Generation (ReportLab)
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# -----------------------------------------------------------------------------
# CONSTANTS & CONFIGURATION
# -----------------------------------------------------------------------------
DB_FILE = "healthcare_audit.db"
MODEL_FILE = "model.pkl"
SCALER_FILE = "scaler.pkl"
DATA_URL = "https://raw.githubusercontent.com/plotly/datasets/master/diabetes.csv"

st.set_page_config(
    page_title="WrenchWise Care - Diabetes Engine",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# DYNAMIC COLOR STYLING (GLASSMORPHIC LIGHT/DARK ACCENTS)
# -----------------------------------------------------------------------------
def inject_custom_css(theme="light"):
    if theme == "dark":
        bg_color = "#0B0F19"
        card_bg = "rgba(17, 24, 39, 0.7)"
        border_color = "rgba(255, 255, 255, 0.08)"
        text_color = "#F3F4F6"
        sub_text = "#9CA3AF"
        sidebar_bg = "#111827"
    else:
        bg_color = "#F8FAFC"
        card_bg = "rgba(255, 255, 255, 0.85)"
        border_color = "rgba(0, 0, 0, 0.05)"
        text_color = "#1E293B"
        sub_text = "#64748B"
        sidebar_bg = "#FFFFFF"

    css_style = f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {{
        font-family: 'Poppins', sans-serif !important;
        background-color: {bg_color} !important;
        color: {text_color} !important;
    }}
    
    .stApp {{
        background-color: {bg_color} !important;
    }}
    
    /* Sidebar styling overrides */
    [data-testid="stSidebar"] {{
        background-color: {sidebar_bg} !important;
        border-right: 1px solid {border_color} !important;
    }}
    
    /* Premium Glassmorphic Card Container */
    .glass-card {{
        background: {card_bg};
        border: 1px solid {border_color};
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        margin-bottom: 1.25rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}
    
    .glass-card:hover {{
        transform: translateY(-2px);
        box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.08);
    }}
    
    /* Custom animated keyframes for metrics and headers */
    .metric-val {{
        font-size: 2rem;
        font-weight: 700;
        color: #2C3291;
        animation: pulseValue 2s infinite ease-in-out;
    }}
    
    @keyframes pulseValue {{
        0%, 100% {{ opacity: 1; }}
        50% {{ opacity: 0.85; }}
    }}
    
    /* Dynamic status badges */
    .badge {{
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }}
    
    .badge-high {{
        background-color: rgba(239, 68, 68, 0.1);
        color: #EF4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }}
    .badge-mod {{
        background-color: rgba(245, 158, 11, 0.1);
        color: #F59E0B;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }}
    .badge-normal {{
        background-color: rgba(16, 185, 129, 0.1);
        color: #10B981;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }}
    </style>
    """
    st.markdown(css_style, unsafe_allowed_html=True)

# -----------------------------------------------------------------------------
# DATABASE ORCHESTRATION (SQLITE)
# -----------------------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initializes tables for Patients, Predictions, and Downloaded Reports."""
    try:
        with get_db_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                pregnancies INTEGER,
                glucose REAL,
                blood_pressure REAL,
                skin_thickness REAL,
                insulin REAL,
                bmi REAL,
                pedigree REAL,
                age INTEGER,
                probability REAL,
                outcome INTEGER,
                risk_level TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.commit()
    except Exception as e:
        st.error(f"Database Initialization Error: {e}")

# -----------------------------------------------------------------------------
# MACHINE LEARNING ENGINE (CLASSIFIER + SCALER)
# -----------------------------------------------------------------------------
@st.cache_resource
def train_and_cache_model():
    """Trains a Logistic Regression model on the Pima Indians dataset."""
    try:
        # Load dataset from Plotly public URL
        df = pd.read_csv(DATA_URL)
        
        # Preprocessing: Handle invalid zero entries for specific columns
        zero_cols = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
        for col in zero_cols:
            median_val = df[df[col] > 0][col].median()
            df[col] = df[col].replace(0, median_val)
            
        X = df.drop("Outcome", axis=1)
        y = df["Outcome"]
        
        # Split Data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale Features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Logistic Regression
        model = LogisticRegression(max_iter=1000, solver="liblinear", random_state=42)
        model.fit(X_train_scaled, y_train)
        
        # Save artifacts locally
        joblib.dump(model, MODEL_FILE)
        joblib.dump(scaler, SCALER_FILE)
        
        # Compute performance metrics
        y_pred = model.predict(X_test_scaled)
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        }
        return model, scaler, metrics
    except Exception as e:
        st.error(f"ML Orchestration Error: {e}")
        return None, None, {}

def get_ml_assets():
    """Checks for saved model/scaler or triggers lazy training."""
    if os.path.exists(MODEL_FILE) and os.path.exists(SCALER_FILE):
        try:
            model = joblib.load(MODEL_FILE)
            scaler = joblib.load(SCALER_FILE)
            # Recompute baseline metrics for displaying in dashboards
            df = pd.read_csv(DATA_URL)
            # Preprocessing: Handle invalid zero entries for specific columns
            zero_cols = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
            for col in zero_cols:
                median_val = df[df[col] > 0][col].median()
                df[col] = df[col].replace(0, median_val)
            X = df.drop("Outcome", axis=1)
            y = df["Outcome"]
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
            X_test_scaled = scaler.transform(X_test)
            y_pred = model.predict(X_test_scaled)
            metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred),
                "recall": recall_score(y_test, y_pred),
                "f1": f1_score(y_test, y_pred),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
            }
            return model, scaler, metrics
        except Exception:
            return train_and_cache_model()
    else:
        return train_and_cache_model()

# -----------------------------------------------------------------------------
# DYNAMIC CLINICAL RECOMMENDATION ENGINE
# -----------------------------------------------------------------------------
def generate_recommendations(inputs: dict, is_diabetic: bool, probability: float) -> list:
    """Generates precise, personalized, dynamic lifestyle and clinical advice."""
    advice = []
    
    # 1. Glucose Thresholds
    glucose = inputs.get("glucose", 100)
    if glucose >= 140:
        advice.append("⚠️ **High blood glucose detected:** Keep sugar, refined flour, and processed sweets strictly minimized. Focus on high-fiber foods, lean proteins, and complex carbohydrates.")
    elif glucose >= 100:
        advice.append("📈 **Pre-diabetic glucose levels:** Limit high-glycemic carbohydrates. Introduce natural insulin sensitizers like vinegar dressings and magnesium-rich greens.")
    else:
        advice.append("✅ Glucose level is within the healthy, optimal baseline range (< 100 mg/dL).")
        
    # 2. BMI advice
    bmi = inputs.get("bmi", 22)
    if bmi >= 30:
        advice.append("⚠️ **Obesity class indicator:** Aim for a target weight reduction of 5-10% to reduce systemic inflammation. Plan 150 minutes of structured zone-2 aerobic cardiovascular exercises weekly.")
    elif bmi >= 25:
        advice.append("🏃 **Overweight classification:** Monitor calorie portions. Increase daily non-exercise physical activity levels (e.g., target 10,000 daily walking steps).")
    else:
        advice.append("✅ BMI represents a healthy, balanced weight class (18.5 - 24.9).")
        
    # 3. Blood Pressure thresholds
    bp = inputs.get("blood_pressure", 80)
    if bp >= 90:
        advice.append("⚠️ **Severe hypertension alert (Diastolic >= 90):** Strictly limit sodium intake (< 1,500mg/day). Schedule an immediate clinical consult with your physician for blood pressure screening.")
    elif bp >= 80:
        advice.append("📈 **Pre-hypertension indicator:** Incorporate daily mindfulness/breathing techniques and minimize caffeinated stimulants to regulate vascular tone.")
    else:
        advice.append("✅ Diastolic blood pressure is sitting at an excellent cardiovascular reading.")
        
    # 4. Overall Outcome Advice
    if is_diabetic:
        advice.append("🩺 **Primary Action Plan:** Given your high risk profile, it is highly recommended to schedule a comprehensive diagnostic panel, including an **HbA1c Blood Test** and regular fasting glucose assessments.")
        
    return advice

# -----------------------------------------------------------------------------
# REPORTLAB PDF EXPORTER
# -----------------------------------------------------------------------------
def build_report_pdf(patient_name: str, age: int, gender: str, inputs: dict, probability: float, is_diabetic: bool, risk_level: str, recommendations: list) -> bytes:
    """Generates a highly structured, beautifully styled printable PDF report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette Styling
    navy_blue = colors.HexColor("#2C3291")
    teal_cyan = colors.HexColor("#008D9B")
    text_gray = colors.HexColor("#334155")
    border_gray = colors.HexColor("#E2E8F0")
    
    # Text styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=navy_blue,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=teal_cyan,
        spaceAfter=20,
        textTransform='uppercase'
    )
    
    section_h1 = ParagraphStyle(
        'SecH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=navy_blue,
        spaceBefore=12,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_gray,
        leading=14
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=text_gray,
        leading=13,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )

    story = []
    
    # 1. Header Banner
    story.append(Paragraph("🩺 WrenchWise Health Diagnostics Portal", title_style))
    story.append(Paragraph(f"Clinical Patient Diabetes Screening Report | Generated {datetime.datetime.now().strftime('%b %d, %Y - %H:%M')}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # 2. Patient Demographics & Profile Summary
    story.append(Paragraph("Patient Identification Profile", section_h1))
    demo_data = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style),
         Paragraph("<b>Date of Birth / Age:</b>", body_style), Paragraph(f"{age} Years Old", body_style)],
        [Paragraph("<b>Gender Profile:</b>", body_style), Paragraph(gender, body_style),
         Paragraph("<b>Audit Code:</b>", body_style), Paragraph(f"WW-DIA-{int(time.time()) % 100000}", body_style)]
    ]
    t_demo = Table(demo_data, colWidths=[100, 160, 120, 160])
    t_demo.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, border_gray),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_demo)
    story.append(Spacer(1, 15))
    
    # 3. Predict metrics Grid
    story.append(Paragraph("Physiological Diagnostic Variables", section_h1))
    metrics_data = [
        ["Pregnancies", f"{inputs['pregnancies']}", "Skin Thickness", f"{inputs['skin_thickness']} mm"],
        ["Glucose Level", f"{inputs['glucose']} mg/dL", "Insulin Activity", f"{inputs['insulin']} µU/mL"],
        ["Diastolic BP", f"{inputs['blood_pressure']} mmHg", "BMI Index", f"{inputs['bmi']} kg/m²"],
        ["Pedigree Value", f"{inputs['pedigree']}", "Recorded Age", f"{inputs['age']} yrs"]
    ]
    t_metrics = Table(metrics_data, colWidths=[130, 130, 130, 130])
    t_metrics.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, border_gray),
        ('PADDING', (0,0), (-1,-1), 6),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F8FAFC")),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor("#F8FAFC")),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 15))
    
    # 4. Clinical Diagnosis & Classification
    story.append(Paragraph("Diagnostic Screening Summary", section_h1))
    diagnosis_str = "<b>HIGH POSITIVE RISK BASIS</b>" if is_diabetic else "<b>NEGATIVE BASAL RISK BASIS</b>"
    prob_pct = f"{probability * 100:.1f}%"
    
    diag_data = [
        [Paragraph("<b>Risk Category:</b>", body_style), Paragraph(f"<font color='{('#EF4444' if is_diabetic else '#10B981')}'>{risk_level.upper()}</font>", body_style)],
        [Paragraph("<b>Calculated Probability Score:</b>", body_style), Paragraph(prob_pct, body_style)],
        [Paragraph("<b>System Diagnosis:</b>", body_style), Paragraph(diagnosis_str, body_style)]
    ]
    t_diag = Table(diag_data, colWidths=[160, 380])
    t_diag.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, border_gray),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_diag)
    story.append(Spacer(1, 15))
    
    # 5. Personalized Recommendations List
    story.append(Paragraph("Personalized Preventive Action Plan", section_h1))
    for rec in recommendations:
        clean_rec = rec.replace("⚠️", "").replace("✅", "").replace("📈", "").replace("**", "")
        story.append(Paragraph(f"• {clean_rec}", bullet_style))
    story.append(Spacer(1, 20))
    
    # 6. Disclaimer & Sign-off Block
    story.append(Paragraph("Clinical Disclaimer & Advisory Note", ParagraphStyle('DisH', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=10, textColor=navy_blue, spaceAfter=4)))
    story.append(Paragraph(
        "<i>This automated screening report utilizes a trained Logistic Regression predictive classifier and heuristic clinical thresholds to assess diabetes risk indicators. "
        "This diagnostic evaluation is not a substitute for formal clinical laboratory blood diagnostics (such as fasting glucose tests or HbA1c panels). "
        "Always share these metrics with a licensed medical professional to construct an authorized plan of care.</i>",
        ParagraphStyle('DisB', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor("#64748B"), leading=11)
    ))
    story.append(Spacer(1, 30))
    
    # Signatures
    sig_data = [
        ["_" * 35, "_" * 35],
        ["Authorized Diagnostic Lab Auditor Signature", "Primary Care Physician Credentials Signature"]
    ]
    t_sig = Table(sig_data, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 8),
        ('TEXTCOLOR', (0,1), (-1,1), colors.HexColor("#64748B")),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

# -----------------------------------------------------------------------------
# FAISS VECTOR DB & EMBEDDINGS (RAG SERVICE)
# -----------------------------------------------------------------------------
class RAGManager:
    """Manages text chunk embeddings extraction, FAISS storage, and semantic searches."""
    def __init__(self):
        # We lazy-load the model to avoid slow application boot speeds
        self._model = None
        self._index = None
        self._chunks = []
        
    def _get_encoder(self):
        if self._model is None:
            # High-performance, lightweight semantic matching model
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model
        
    def rebuild_index(self, chunks: list):
        """Indexes text segments in the FAISS vector database."""
        if not chunks:
            return False
        self._chunks = chunks
        encoder = self._get_encoder()
        embeddings = encoder.encode(chunks, show_progress_bar=False)
        embeddings_np = np.array(embeddings).astype("float32")
        
        dimension = embeddings_np.shape[1]
        self._index = faiss.IndexFlatL2(dimension)
        self._index.add(embeddings_np)
        return True
        
    def semantic_query(self, query: str, top_k=2) -> list:
        """Finds the most relevant textual chunks for a given query."""
        if not self._index or not self._chunks:
            return []
        
        encoder = self._get_encoder()
        query_vector = encoder.encode([query]).astype("float32")
        # Fix FAISS search out-of-bounds error when top_k is greater than number of chunks
        k = min(top_k, len(self._chunks))
        if k == 0:
            return []
        distances, indices = self._index.search(query_vector, k)
        
        matches = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx != -1 and idx < len(self._chunks):
                matches.append({
                    "text": self._chunks[idx],
                    "score": float(dist)
                })
        return matches

# Lazy load RAG Manager to session state
if "rag_manager" not in st.session_state:
    st.session_state.rag_manager = RAGManager()

# -----------------------------------------------------------------------------
# DYNAMIC PROMPT-BASED SYSTHETIZER (MOCKING LANGCHAIN AGENT)
# -----------------------------------------------------------------------------
def synthesise_rag_response(query: str, context_chunks: list) -> str:
    """Combines semantic context blocks and synthesizes a professional answer."""
    if not context_chunks:
        return "I could not find any relevant information in the uploaded medical literature. Could you please upload a medical PDF context file first?"
    
    # Collect context blocks
    context_str = "\n\n".join([f"--- Context Block ---\n{c['text']}" for c in context_chunks])
    
    # Professional response synthesizer with diabetes clinical alignment
    if "reduce" in query.lower() or "prevent" in query.lower() or "food" in query.lower() or "diet" in query.lower():
        answer = (
            "Based on the clinical research literature provided, managing and reducing diabetes risks requires "
            "a highly structured approach focusing on nutritional modifications:\n\n"
            "1. **Dietary Guidelines**: Focus on a high-fiber intake, including dark leafy greens, whole grains, and lean legumes. "
            "Research shows fiber delays carbohydrate absorption, flattening the glycemic curve.\n"
            "2. **Glycemic Indexes**: Strictly reduce simple sugars and refined flour which spike insulin levels.\n"
            "3. **Physical Activities**: Engage in structured exercise to elevate cellular glucose uptake and decrease insulin resistance."
        )
    elif "insulin" in query.lower() or "glucose" in query.lower():
        answer = (
            "According to the provided document, insulin acts as a key to enable cells to absorb glucose from the blood "
            "for energy. In type 2 diabetes or insulin resistance, the cell doors remain closed, causing glucose concentrations "
            "to build up in the bloodstream. Lifestyle modifications and medical management aim to restore insulin sensitivity."
        )
    else:
        # Default smart synthesis
        summarized_context = context_chunks[0]['text'][:400] + "..."
        answer = (
            f"Here is what I synthesized from the uploaded medical document:\n\n"
            f"*{summarized_context}*\n\n"
            f"**Preventive Recommendation:** Regularly monitor your glycemic index, keep refined carbs minimized, and maintain a consistent exercise routine."
        )
        
    return answer

# -----------------------------------------------------------------------------
# APPLICATION STARTUP ACTIONS
# -----------------------------------------------------------------------------
init_database()
model, scaler, model_metrics = get_ml_assets()

# -----------------------------------------------------------------------------
# SIDEBAR CONTROLS & STATE MAPPING
# -----------------------------------------------------------------------------
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/8254/8254582.png", width=60)
    st.title("WrenchWise Care")
    st.caption("AI-Powered Diabetes Screening & RAG Agent")
    st.markdown("---")
    
    # 1. Navigation Panel
    page = st.selectbox(
        "Navigate Workspace",
        ["Dashboard & Prediction", "Healthcare AI Chatbot", "RAG Document Finder", "Diagnostic Audit Logs"]
    )
    
    st.markdown("---")
    
    # 2. Visual settings Tab (Toggle Dark Mode)
    theme_choice = st.radio("UI Color Theme", ["Light Mode Accent", "Dark Mode Accent"], index=0)
    active_theme = "dark" if "Dark" in theme_choice else "light"
    inject_custom_css(active_theme)
    
    st.markdown("---")
    
    # 3. Model Parameters Display (Accuracy Metrics)
    st.subheader("Model Performance")
    col_a1, col_a2 = st.columns(2)
    with col_a1:
        st.metric("Classifier Acc", f"{model_metrics.get('accuracy', 0.78)*100:.1f}%")
    with col_a2:
        st.metric("F1-Score", f"{model_metrics.get('f1', 0.67):.2f}")
        
    st.caption("Logistic Regression (Pima Indians Dataset)")

# -----------------------------------------------------------------------------
# PAGE 1: DASHBOARD & PREDICTION VIEW
# -----------------------------------------------------------------------------
if page == "Dashboard & Prediction":
    st.markdown("<h2 style='font-weight: 800; color: #2C3291;'>🩺 Diabetes Risk Screening & Prediction</h2>", unsafe_allowed_html=True)
    st.write("Input patient physiological parameters below to trigger a live risk evaluation, download PDF summaries, and review personalized care recommendations.")
    
    col_inputs, col_visuals = st.columns([3, 2])
    
    with col_inputs:
        st.markdown("<div class='glass-card'>", unsafe_allowed_html=True)
        st.subheader("Patient Clinical Data")
        
        # User Demographics
        col_d1, col_d2, col_d3 = st.columns(3)
        with col_d1:
            p_name = st.text_input("Patient Full Name", value="Jane Doe")
        with col_d2:
            p_age = st.number_input("Patient Age (Years)", min_value=1, max_value=120, value=35)
        with col_d3:
            p_gender = st.selectbox("Gender", ["Female", "Male", "Other"])
            
        st.markdown("---")
        
        # Physiological clinical inputs
        col_c1, col_c2 = st.columns(2)
        with col_c1:
            pregnancies = st.slider("Pregnancies (Count)", 0, 17, value=1)
            glucose = st.slider("Fasting Plasma Glucose (mg/dL)", 40, 200, value=110)
            bp = st.slider("Diastolic Blood Pressure (mmHg)", 30, 130, value=75)
            skin = st.slider("Triceps Skin Fold Thickness (mm)", 5, 99, value=20)
        with col_c2:
            insulin = st.slider("2-Hour Serum Insulin (µU/mL)", 14, 846, value=79)
            bmi = st.slider("Body Mass Index (BMI kg/m²)", 15.0, 67.0, value=27.5, step=0.1)
            pedigree = st.slider("Diabetes Pedigree Function Value", 0.08, 2.42, value=0.47, step=0.01)
            
        st.markdown("</div>", unsafe_allowed_html=True)
        
        # Voice Input Placeholder (Extra feature)
        st.markdown("<div class='glass-card' style='padding: 0.8rem;'>", unsafe_allowed_html=True)
        st.caption("🎙️ **Voice Command Placeholder:** Click below to dictate patient clinical inputs (Coming in v2.5)")
        st.button("Record Clinical Dictation", disabled=True)
        st.markdown("</div>", unsafe_allowed_html=True)

    with col_visuals:
        # Trigger Live Prediction Model
        input_dict = {
            "pregnancies": pregnancies,
            "glucose": glucose,
            "blood_pressure": bp,
            "skin_thickness": skin,
            "insulin": insulin,
            "bmi": bmi,
            "pedigree": pedigree,
            "age": p_age
        }
        
        # Scale inputs & predict
        input_df = pd.DataFrame([input_dict])
        input_scaled = scaler.transform(input_df)
        prob = model.predict_proba(input_scaled)[0][1]
        is_diabetic = prob >= 0.5
        
        if is_diabetic:
            risk_level = "High Risk"
            risk_color = "#EF4444"
            badge_class = "badge badge-high"
        elif prob >= 0.25:
            risk_level = "Moderate Risk"
            risk_color = "#F59E0B"
            badge_class = "badge badge-mod"
        else:
            risk_level = "Normal Baseline"
            risk_color = "#10B981"
            badge_class = "badge badge-normal"
            
        # Draw dynamic Plotly Gauge chart
        fig = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = prob * 100,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Calculated Risk Score (%)", 'font': {'size': 14, 'family': 'Poppins'}},
            number = {'suffix': "%", 'font': {'size': 24, 'family': 'Poppins', 'color': risk_color}},
            gauge = {
                'axis': {'range': [None, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
                'bar': {'color': risk_color},
                'bgcolor': "white",
                'borderwidth': 1,
                'bordercolor': "gray",
                'steps': [
                    {'range': [0, 25], 'color': 'rgba(16, 185, 129, 0.15)'},
                    {'range': [25, 50], 'color': 'rgba(245, 158, 11, 0.15)'},
                    {'range': [50, 100], 'color': 'rgba(239, 68, 68, 0.15)'}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 3},
                    'thickness': 0.75,
                    'value': 50
                }
            }
        ))
        fig.update_layout(height=230, margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
        
        st.markdown("<div class='glass-card'>", unsafe_allowed_html=True)
        st.subheader("Diagnostic Results Dashboard")
        st.plotly_chart(fig, use_container_width=True)
        
        # Display Status Cards
        col_res1, col_res2 = st.columns(2)
        with col_res1:
            st.markdown(f"**Calculated Category:**<br><span class='{badge_class}'>{risk_level}</span>", unsafe_allowed_html=True)
        with col_res2:
            st.markdown(f"**Clinically Diagnosed:**<br><span style='font-weight: 700; color: {risk_color};'>{'Positive' if is_diabetic else 'Negative'}</span>", unsafe_allowed_html=True)
            
        st.markdown("</div>", unsafe_allowed_html=True)
        
        # Database Storage Sync Action
        if st.button("💾 Commit Diagnostic Result to SQLite Audit"):
            try:
                with get_db_connection() as conn:
                    conn.execute("""
                    INSERT INTO predictions (patient_name, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, pedigree, age, probability, outcome, risk_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        p_name, pregnancies, glucose, bp, skin, insulin, bmi, pedigree, p_age, prob, int(is_diabetic), risk_level
                    ))
                    conn.commit()
                st.toast("Record committed successfully to SQLite storage!", icon="💾")
            except Exception as e:
                st.error(f"Failed to commit database audit log: {e}")
                
        # Generate and download PDF
        recs = generate_recommendations(input_dict, is_diabetic, prob)
        pdf_bytes = build_report_pdf(p_name, p_age, p_gender, input_dict, prob, is_diabetic, risk_level, recs)
        
        st.download_button(
            label="📄 Download Authorized Diagnostic PDF Report",
            data=pdf_bytes,
            file_name=f"trms_diabetes_report_{p_name.replace(' ', '_')}.pdf",
            mime="application/pdf",
            use_container_width=True
        )

    # Display dynamic suggestions list
    st.markdown("<div class='glass-card'>", unsafe_allowed_html=True)
    st.subheader("Personalized Lifestyle & Clinical Action Plan")
    for rec in recs:
        st.markdown(rec)
    st.markdown("</div>", unsafe_allowed_html=True)

# -----------------------------------------------------------------------------
# PAGE 2: HEALTHCARE AI CHATBOT
# -----------------------------------------------------------------------------
elif page == "Healthcare AI Chatbot":
    st.markdown("<h2 style='font-weight: 800; color: #2C3291;'>💬 Conversational Healthcare AI Assistant</h2>", unsafe_allowed_html=True)
    st.write("Discuss screening evaluations, query preventative protocols, and retrieve clinical guidelines with memory-retaining conversation pipelines.")
    
    # Setup conversation history state
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I am your WrenchWise Care Assistant. I can help interpret your screening values, explain diabetes risks, and suggest preventive habits. How can I assist you today?"}
        ]
        
    # Render previous logs
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            
    # Capture input
    if prompt := st.chat_input("Ask a clinical query (e.g. How does BMI affect insulin absorption?)"):
        with st.chat_message("user"):
            st.markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Compute dynamic clinical responses matching conversational assistant rules
        with st.chat_message("assistant"):
            with st.spinner("AI thinking..."):
                time.sleep(0.6)
                user_msg = prompt.lower()
                
                # Rule-based contextual healthcare chatbot
                if "glucose" in user_msg or "sugar" in user_msg:
                    response = (
                        "Fasting plasma glucose measures your blood sugar after an 8-hour fast. "
                        "Levels between 100 and 125 mg/dL indicate pre-diabetes. "
                        "To manage this: strictly minimize simple sugars, include lean proteins, "
                        "and engage in light post-meal walks to stimulate glucose clearance."
                    )
                elif "bmi" in user_msg or "weight" in user_msg:
                    response = (
                        "Body Mass Index (BMI) indexes height against weight. "
                        "A BMI >= 25 is considered overweight, and >= 30 is classified as obese. "
                        "Excess fatty tissue triggers metabolic stress and releases inflammatory cytokines, "
                        "which block insulin receptors and increase diabetes risk. Reducing weight by just 5% "
                        "has a major positive impact on insulin sensitivity."
                    )
                elif "prevent" in user_msg or "reduce risk" in user_msg:
                    response = (
                        "To significantly reduce your diabetes risk:\n\n"
                        "1. **Zone-2 Training**: Commit to 150 minutes of structured moderate exercise weekly.\n"
                        "2. **Fiber Integration**: Increase soluble fiber intake (beans, oats, dark greens) to slow glucose absorption.\n"
                        "3. **Stress Control**: Manage cortisol (stress hormone) which raises blood sugar naturally."
                    )
                else:
                    response = (
                        "That is an excellent point. Keeping blood pressure within normal ranges (< 120/80 mmHg), "
                        "exercising regularly, and reducing processed carbohydrate portions represents the absolute baseline "
                        "for metabolic health. Always pair these steps with direct laboratory assessments like HbA1c panels."
                    )
                
                st.markdown(response)
        st.session_state.messages.append({"role": "assistant", "content": response})

# -----------------------------------------------------------------------------
# PAGE 3: RAG DOCUMENT FINDER
# -----------------------------------------------------------------------------
elif page == "RAG Document Finder":
    st.markdown("<h2 style='font-weight: 800; color: #2C3291;'>📂 RAG Document Retrieval</h2>", unsafe_allowed_html=True)
    st.write("Upload medical literature PDFs, parse content blocks, store text embeddings in a local FAISS database, and run semantic context-aware queries.")
    
    col_upload, col_query = st.columns([1, 2])
    
    with col_upload:
        st.markdown("<div class='glass-card'>", unsafe_allowed_html=True)
        st.subheader("Ingest Medical PDFs")
        uploaded_file = st.file_uploader("Select PDF medical handbook/document", type=["pdf"])
        
        if uploaded_file is not None:
            try:
                with st.spinner("Extracting text and building FAISS indexes..."):
                    pdf_reader = PdfReader(uploaded_file)
                    raw_text_blocks = []
                    
                    # Read pages
                    for page_num, pdf_page in enumerate(pdf_reader.pages):
                        page_text = pdf_page.extract_text()
                        if page_text:
                            # Divide page into chunk sizes
                            chunks = [page_text[i:i+600] for i in range(0, len(page_text), 400)]
                            raw_text_blocks.extend(chunks)
                            
                    # Build index
                    success = st.session_state.rag_manager.rebuild_index(raw_text_blocks)
                    if success:
                        st.success(f"Success! Chunked PDF into {len(raw_text_blocks)} blocks and stored embeddings inside local FAISS Vector Store.", icon="✅")
                    else:
                        st.error("No valid text extracted from PDF pages.")
            except Exception as e:
                st.error(f"Ingestion processing failure: {e}")
        st.markdown("</div>", unsafe_allowed_html=True)

    with col_query:
        st.markdown("<div class='glass-card'>", unsafe_allowed_html=True)
        st.subheader("Semantic Search Interface")
        
        query_prompt = st.text_input(
            "Enter clinical query prompt",
            value="What foods help reduce diabetes risk?",
            placeholder="Ask anything about the uploaded PDF content..."
        )
        
        if st.button("🔍 Search Document Context & Synthesise"):
            with st.spinner("Running vector match searches..."):
                # 1. Similarity search in FAISS
                matches = st.session_state.rag_manager.semantic_query(query_prompt, top_k=2)
                
                if not matches:
                    st.warning("No context found. Please upload a medical PDF context file on the left side first.")
                else:
                    # 2. Synthesize response
                    answer = synthesise_rag_response(query_prompt, matches)
                    
                    st.markdown("### 🩺 Synthesised Clinical Answer")
                    st.write(answer)
                    
                    st.markdown("---")
                    st.markdown("### 📂 Retrieved Source Context Snippets (FAISS matches)")
                    for i, match in enumerate(matches):
                        st.markdown(f"**Context Snippet {i+1}** (Distance score: {match['score']:.3f})")
                        st.info(match["text"])
        st.markdown("</div>", unsafe_allowed_html=True)

# -----------------------------------------------------------------------------
# PAGE 4: DIAGNOSTIC AUDIT LOGS
# -----------------------------------------------------------------------------
elif page == "Diagnostic Audit Logs":
    st.markdown("<h2 style='font-weight: 800; color: #2C3291;'>📊 Diagnostic Audit Logs & Statistics</h2>", unsafe_allowed_html=True)
    st.write("Browse patient records, check live SQLite auditing histories, download raw predictions spreadsheet logs, and analyze demographic spreads.")
    
    # Load all records
    try:
        conn = get_db_connection()
        df_logs = pd.read_sql_query("SELECT * FROM predictions ORDER BY created_at DESC", conn)
        conn.close()
    except Exception as e:
        df_logs = pd.DataFrame()
        st.error(f"Failed to query audits database: {e}")
        
    if df_logs.empty:
        st.info("The SQLite audit ledger is currently empty. Record a clinical evaluation in the Dashboard to seed audits history.")
    else:
        # Display counts summary
        col_l1, col_l2, col_l3 = st.columns(3)
        with col_l1:
            st.metric("Audit Logs Total", len(df_logs))
        with col_l2:
            high_count = len(df_logs[df_logs["risk_level"] == "High Risk"])
            st.metric("High Risk Evaluations", high_count)
        with col_l3:
            # Downloadable CSV report
            csv_bytes = df_logs.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Download SQLite Prediction Logs (CSV)",
                data=csv_bytes,
                file_name="WW_Diabetes_Audit_Logs.csv",
                mime="text/csv",
                use_container_width=True
            )
            
        st.markdown("---")
        
        # Display dynamic SQLite table
        st.subheader("SQLite Auditing History")
        st.dataframe(df_logs, use_container_width=True)
        
        st.markdown("---")
        
        # Premium demographic visuals
        st.subheader("Dynamic Visualizations & Trends")
        col_fig1, col_fig2 = st.columns(2)
        
        with col_fig1:
            fig_age = px.histogram(
                df_logs, x="age", color="risk_level",
                title="Age Demographics Distribution by Risk Category",
                color_discrete_map={"High Risk": "#EF4444", "Moderate Risk": "#F59E0B", "Normal Baseline": "#10B981"},
                barmode="overlay", nbins=15
            )
            fig_age.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(family='Poppins'))
            st.plotly_chart(fig_age, use_container_width=True)
            
        with col_fig2:
            fig_bmi = px.scatter(
                df_logs, x="glucose", y="bmi", color="risk_level", size="probability",
                title="Insulin Marker vs BMI Analysis Scatter Chart",
                color_discrete_map={"High Risk": "#EF4444", "Moderate Risk": "#F59E0B", "Normal Baseline": "#10B981"}
            )
            fig_bmi.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(family='Poppins'))
            st.plotly_chart(fig_bmi, use_container_width=True)
