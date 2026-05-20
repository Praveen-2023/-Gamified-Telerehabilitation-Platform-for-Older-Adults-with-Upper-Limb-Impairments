import sys
import subprocess
try:
    import fitz
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyMuPDF"])
    import fitz
import os

pdfs = ["HCI Group-12 .pdf", "HCI_final_project.pdf", "evalution_data.pdf"]
for pdf in pdfs:
    try:
        doc = fitz.open(pdf)
        text = ""
        for page in doc:
            text += page.get_text()
        with open(pdf + ".txt", "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Successfully extracted {pdf}")
    except Exception as e:
        print(f"Failed to extract {pdf}: {e}")
