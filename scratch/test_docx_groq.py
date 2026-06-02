"""Test script to verify DOCX text extraction and Groq-based resume parsing."""

import os
from app.utils.config import get_settings, load_env
from app.services.docx_extractor import DocxTextExtractor
from app.services.groq_parser import GroqResumeParser

def main():
    print("Initializing test...")
    load_env()
    settings = get_settings()
    
    if not settings.groq_api_key:
        print("ERROR: GROQ_API_KEY environment variable is not set!")
        return

    print("GROQ_API_KEY is configured.")
    print(f"Using model: {settings.groq_model}")

    # Initialize extractor & parser
    extractor = DocxTextExtractor()
    parser = GroqResumeParser(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
    )

    # Search for any test .docx files in backups or direct downloads
    test_docx_path = None
    
    # Try looking for a docx file in downloads or let's create a mock docx bytes structure
    # Wait, we can test with a real docx file if one exists, or create a simple zip archive in memory that simulates a docx!
    # Let's create a simulated docx byte string in memory!
    import io
    import zipfile

    # Build standard word/document.xml content
    xml_content = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
            <w:p>
                <w:r>
                    <w:t>HARIVARSHAN NALLASAMY</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>Email: harivarshan@example.com | Phone: +91 9876543210</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>GitHub: github.com/harivarshan | LinkedIn: linkedin.com/in/harivarshan</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>TECHNICAL SKILLS</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>Python, FastAPI, Next.js, PostgreSQL, Docker, AWS, Groq LLM API</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>PROFESSIONAL EXPERIENCE</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>Lead AI Engineer | Wrenchwise Inc. (June 2024 - Present)</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>- Designed and integrated the recruitment pipeline, adding status modals and custom favicon.</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>- Developed robust resume parsing algorithms with LLM refinement.</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>EDUCATION</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>Master of Science in Computer Science | oregon University (2022 - 2024)</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>CERTIFICATIONS</w:t>
                </w:r>
            </w:p>
            <w:p>
                <w:r>
                    <w:t>AWS Certified Solutions Architect, Google Cloud Professional Data Engineer</w:t>
                </w:r>
            </w:p>
        </w:body>
    </w:document>
    """

    docx_io = io.BytesIO()
    with zipfile.ZipFile(docx_io, 'w') as docx_zip:
        docx_zip.writestr('word/document.xml', xml_content)
    
    mock_docx_bytes = docx_io.getvalue()
    print("Mock DOCX bytes created in memory successfully.")

    # 1. Test Text Extraction
    print("\n--- 1. Testing Text Extraction ---")
    extracted_text = extractor.extract_text(mock_docx_bytes)
    print("Extracted Text:")
    print(extracted_text)
    
    if "HARIVARSHAN NALLASAMY" in extracted_text and "FastAPI" in extracted_text:
        print("SUCCESS: Text extracted perfectly!")
    else:
        print("WARNING: Extracted text doesn't contain expected words.")

    # 2. Test Groq Parsing
    print("\n--- 2. Testing Groq Llama 3.3 70B Parsing ---")
    try:
        parsed_resume = parser.parse(extracted_text)
        print("SUCCESS: Parsed resume successfully using Llama 3.3!")
        print(f"Name: {parsed_resume.name}")
        print(f"Email: {parsed_resume.email}")
        print(f"Phone: {parsed_resume.phone}")
        print(f"Skills: {parsed_resume.skills}")
        print(f"Education: {parsed_resume.education}")
        print(f"Experience: {parsed_resume.experience}")
        print(f"Certifications: {parsed_resume.certifications}")
        print(f"LinkedIn: {parsed_resume.linkedin_url}")
        print(f"GitHub: {parsed_resume.github_url}")
    except Exception as e:
        print(f"ERROR: Groq parsing failed: {e}")

if __name__ == "__main__":
    main()
