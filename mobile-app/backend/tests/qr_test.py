# ==========================================
# Test QR Generator
# ==========================================

import sys
import os

# Fix import path (important if running from tests/)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from utils.qr_generator import generate_and_upload_qr


def test_qr():

    patient_id = "PT0001"  # change to existing patient

    qr_url = generate_and_upload_qr(patient_id)

    if qr_url:
        print("✅ QR Generated Successfully")
        print("URL:", qr_url)
    else:
        print("❌ Failed to generate QR")


if __name__ == "__main__":
    test_qr()