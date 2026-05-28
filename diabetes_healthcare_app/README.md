# 🩺 WrenchWise Care - Diabetes Screening & RAG Chatbot

An end-to-end clinical screening dashboard and conversational Retrieval-Augmented Generation (RAG) medical assistant. It combines a Logistic Regression classifier trained on zero-corrected Pima Indians Diabetes records, dynamic threshold recommendation engines, memory-retaining chatbots, local FAISS vector databases, reportlab patient PDF builders, and audit ledgers in SQLite.

---

## 📂 Project Folder Structure

```text
K:\trm_wrenchwise\diabetes_healthcare_app\
├── requirements.txt                   # Standard project pip dependencies list
├── app.py                             # Clean, modular Streamlit portal source code
├── diabetes_prediction_assistant.ipynb # Full Google Colab Notebook with all 14 sections
└── README.md                          # This setup, documentation, and sample output manual
```

---

## 🛠️ Installation & Execution Guide

### Option A: Running in Google Colab (Recommended for Instant Deploy)
1. Open [Google Colab](https://colab.research.google.com/).
2. Click **File -> Upload Notebook** and select `diabetes_prediction_assistant.ipynb`.
3. In **SECTION 13**, optionally insert your free [Ngrok Auth Token](https://dashboard.ngrok.com/get-started/your-authtoken):
   ```python
   ngrok.set_auth_token("YOUR_AUTHTOKEN_HERE")
   ```
4. Click **Runtime -> Run All** from the top menu.
5. Once running, Colab will print out your secure public tunnel link:
   `🎉 Streamlit App is Live! Public Link: https://xxxx.ngrok-free.app`

### Option B: Local Streamlit Bootup
1. Open a console in your local directory `K:\trm_wrenchwise\diabetes_healthcare_app\`.
2. Install the target dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the application:
   ```bash
   streamlit run app.py
   ```
4. Open the local link in your browser: `http://localhost:8501`.

---

## 🧬 RAG & Machine Learning Mechanics

* **Preprocessing & Model Training**: On start, `app.py` checks for `model.pkl` and `scaler.pkl`. If not found, it dynamically downloads the standard diabetes data, cleans invalid `0` measurements (replacing them with the positive median to preserve distribution metrics), splits data with stratification, and trains a **Logistic Regression** classifier.
* **Vector Document Storage (RAG)**: The PDF parser extracts text strings, chunks pages into 600-character segments, encodes them into high-performance semantic vectors using `sentence-transformers/all-MiniLM-L6-v2`, and mounts a local memory-resident **FAISS** index. Similarity searches run on L2 euclidean distances.
* **Database Syncer**: Diagnostic histories are logged inside an `predictions` table in **SQLite** (`healthcare_audit.db`), allowing real-time audits and downloadable CSV logs.

---

## 📈 Sample Diagnostic Outputs & Mockups

### 1. Diabetic Diagnostic Prediction Card
```text
==================================================
        DIAGNOSTIC SCREENING EVALUATION
==================================================
Patient Name           : Jane Doe
Recorded Age           : 35 Years
Fasting Glucose        : 142 mg/dL   [High Baseline]
BMI Index              : 31.2 kg/m²  [Obese Category]
Diastolic BP           : 85 mmHg     [Pre-hypertension]

--------------------------------------------------
Risk Category          : HIGH RISK
Diabetes Probability   : 73.4%
Recommended Diagnostic : HbA1c Lab Panel Consultation
==================================================
```

### 2. Conversational Chatbot Memory Sync
```text
User     : Why does my high BMI affect my diabetes risk profile?
Assistant: Body Mass Index (BMI) represents weight relative to height. Adipose (fatty) tissue releases inflammatory cytokines that block cellular insulin receptors. In type 2 diabetes, the insulin keys are present, but the lock is obstructed. Reducing systemic weight by just 5% significantly lowers cellular resistance, allowing glucose doors to open cleanly.
```

### 3. RAG Semantic Match Log
```text
Query    : What foods help reduce diabetes risk?
Context  : [FAISS Block 3: Soluble dietary fiber slows carb digestion, flattens insulin spikes, and improves glycemic curve responses...]
Synthesized Answer: According to the clinical literature uploaded, integrating soluble dietary fiber (found in oats, legumes, and dark greens) slows carbohydrate breakdown. This delays glucose entry into the bloodstream, flattening insulin curves and lowering metabolic risks.
```
