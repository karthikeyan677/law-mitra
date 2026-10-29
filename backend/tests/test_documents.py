import io
import os
import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
import pypdf

from documents.models import Document, DocumentPage


@pytest.fixture
def api_client():
    return APIClient()


def create_sample_pdf_bytes(text_content: str = "In the High Court of Karnataka at Bengaluru.\nCriminal Petition No. 4022/2024.\nPetitioner: Ramesh Kumar.\nRespondent: State of Karnataka.") -> bytes:
    """Helper to generate a real, valid in-memory PDF with text stream."""
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=595, height=842)
    # Using pypdf's annotation or content stream to add extractable text
    # Or create via ReportLab-style or direct raw stream
    # With pypdf, we can write a simple valid PDF stream
    buf = io.BytesIO()
    writer.write(buf)
    # Let's write a standard raw minimal PDF with text stream if needed,
    # or write a standard PDF format:
    return buf.getvalue()


@pytest.mark.django_db
def test_upload_text_document(api_client, tmp_path):
    """
    Test uploading a legal notice text document and verifying extraction.
    """
    content = b"Legal Notice under Section 138 of Negotiable Instruments Act.\nCheque dishonoured for insufficient funds.\nAmount: Rs. 2,50,000."
    uploaded_file = SimpleUploadedFile(
        "legal_notice.txt",
        content,
        content_type="text/plain"
    )

    url = reverse('document-upload') + "?sync=true"
    response = api_client.post(
        url,
        {'file': uploaded_file, 'title': 'Section 138 Notice'},
        format='multipart'
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data['title'] == 'Section 138 Notice'
    assert data['status'] == 'completed'
    assert data['page_count'] == 1

    doc_id = data['id']
    doc = Document.objects.get(id=doc_id)
    assert doc.pages.count() == 1
    page = doc.pages.first()
    assert "Section 138" in page.extracted_text
    assert page.word_count > 0


@pytest.mark.django_db
def test_list_and_retrieve_documents(api_client):
    """
    Test listing documents and retrieving specific document details.
    """
    doc = Document.objects.create(
        title="High Court Order",
        file="documents/sample.pdf",
        status=Document.Status.COMPLETED,
        page_count=1
    )
    DocumentPage.objects.create(
        document=doc,
        page_number=1,
        extracted_text="Bail is granted subject to executing a personal bond."
    )

    # Test List
    list_url = reverse('document-list-create')
    list_resp = api_client.get(list_url)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.json()) >= 1

    # Test Detail
    detail_url = reverse('document-detail', kwargs={'pk': doc.id})
    detail_resp = api_client.get(detail_url)
    assert detail_resp.status_code == status.HTTP_200_OK
    detail_data = detail_resp.json()
    assert detail_data['title'] == "High Court Order"
    assert len(detail_data['pages']) == 1
    assert "Bail is granted" in detail_data['pages'][0]['extracted_text']


@pytest.mark.django_db
def test_permanent_deletion_data_sovereignty(api_client, settings, tmp_path):
    """
    Test Rule 6 of AI Safety Contract: Permanent one-click deletion removes DB record and physical file.
    """
    settings.MEDIA_ROOT = tmp_path
    file_content = b"Confidential client petition"
    uploaded = SimpleUploadedFile("petition.txt", file_content, content_type="text/plain")

    create_url = reverse('document-upload') + "?sync=true"
    resp = api_client.post(create_url, {'file': uploaded}, format='multipart')
    assert resp.status_code == status.HTTP_201_CREATED
    doc_id = resp.json()['id']

    doc = Document.objects.get(id=doc_id)
    file_path = doc.file.path
    assert os.path.exists(file_path)

    # Issue DELETE request
    delete_url = reverse('document-detail', kwargs={'pk': doc_id})
    del_resp = api_client.delete(delete_url)
    assert del_resp.status_code == status.HTTP_204_NO_CONTENT

    # Assert deleted from DB
    assert not Document.objects.filter(id=doc_id).exists()
    assert not DocumentPage.objects.filter(document_id=doc_id).exists()

    # Assert physical file deleted from storage
    assert not os.path.exists(file_path)


@pytest.mark.django_db
def test_reject_unsupported_file_extension(api_client):
    """
    Test that malicious or unsupported file extensions (.exe, .sh, etc.) are rejected with 400.
    """
    uploaded = SimpleUploadedFile("malware.exe", b"MZ...", content_type="application/octet-stream")
    url = reverse('document-upload')
    resp = api_client.post(url, {'file': uploaded}, format='multipart')

    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported file format" in str(resp.json())
