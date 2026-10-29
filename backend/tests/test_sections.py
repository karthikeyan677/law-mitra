import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from documents.models import Document, DocumentPage
from analysis.models import DetectedSection, LawMapping
from analysis.services.section_detector import detect_sections_for_document, find_sections_in_text


@pytest.fixture
def user_a():
    return User.objects.create_user(
        username='law_citizen_a@example.com',
        email='law_citizen_a@example.com',
        password='Password123!'
    )


@pytest.fixture
def user_b():
    return User.objects.create_user(
        username='law_citizen_b@example.com',
        email='law_citizen_b@example.com',
        password='Password123!'
    )


@pytest.fixture
def client_a(user_a):
    client = APIClient()
    token = RefreshToken.for_user(user_a)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return client


@pytest.fixture
def client_b(user_b):
    client = APIClient()
    token = RefreshToken.for_user(user_b)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return client


@pytest.fixture
def sample_document(user_a):
    doc = Document.objects.create(
        owner=user_a,
        title="Sample Police Notice",
        file="documents/sample_notice.txt",
        status=Document.Status.COMPLETED,
        page_count=1,
    )
    return doc


# ============================================================================
# 1. LAW MAPPING EMPTY AUDIT TEST
# ============================================================================

@pytest.mark.django_db
def test_law_mapping_table_is_empty():
    """Verify that LawMapping table is completely empty and unseeded."""
    assert LawMapping.objects.count() == 0


# ============================================================================
# 2. DETERMINISTIC REGEX PATTERN TESTS (Service Level)
# ============================================================================

def test_pattern_section_of_act():
    """Test: 'Section 420 of the Indian Penal Code'"""
    text = "The accused is charged under Section 420 of the Indian Penal Code for alleged misrepresentation."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 1
    assert res[0]['section_number'] == '420'
    assert res[0]['act_key'] == 'IPC'
    assert text[res[0]['start_char']:res[0]['end_char']] == res[0]['matched_text']


def test_pattern_multiple_sections_with_and():
    """Test: 'Sections 420, 468 and 471 of IPC'"""
    text = "Charges framed under Sections 420, 468 and 471 of IPC before the magistrate."
    res = find_sections_in_text(text, page_number=1)
    sec_nums = [r['section_number'] for r in res]
    assert '420' in sec_nums
    assert '468' in sec_nums
    assert '471' in sec_nums
    for r in res:
        assert r['act_key'] == 'IPC'
        assert text[r['start_char']:r['end_char']] == r['matched_text']


def test_pattern_us_ipc():
    """Test: 'u/s 420 IPC'"""
    text = "Case registered u/s 420 IPC at the central police station."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) >= 1
    match = next(r for r in res if r['section_number'] == '420')
    assert match['act_key'] == 'IPC'
    assert text[match['start_char']:match['end_char']] == match['matched_text']


def test_pattern_u_sec():
    """Test: 'U/Sec. 302'"""
    text = "Proceedings initiated U/Sec. 302 against unknown persons."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) >= 1
    match = next(r for r in res if r['section_number'] == '302')
    assert text[match['start_char']:match['end_char']] == match['matched_text']


def test_pattern_s_dot_with_act():
    """Test: 'S. 138 NI Act'"""
    text = "Complaint filed under S. 138 NI Act regarding cheque bounce."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 1
    assert res[0]['section_number'] == '138'
    assert res[0]['act_key'] == 'NI_ACT'
    assert text[res[0]['start_char']:res[0]['end_char']] == res[0]['matched_text']


def test_pattern_subclause():
    """Test: 'Sec 13(1)(a)'"""
    text = "Application moved under Sec 13(1)(a) of the Hindu Marriage Act."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) >= 1
    match = res[0]
    assert '13' in match['section_number']
    assert '(1)(a)' in match['sub_clause'] or '(1)(a)' in match['section_number']
    assert text[match['start_char']:match['end_char']] == match['matched_text']


def test_pattern_read_with_combinations():
    """Test: 'Section 420 r/w 34 of IPC'"""
    text = "Arrest made under Section 420 r/w 34 of IPC yesterday."
    res = find_sections_in_text(text, page_number=1)
    sec_nums = [r['section_number'] for r in res]
    assert '420' in sec_nums
    assert '34' in sec_nums


def test_pattern_ranges():
    """Test: 'Sections 120 to 125'"""
    text = "Please examine Sections 120 to 125 of the Code."
    res = find_sections_in_text(text, page_number=1)
    sec_nums = [r['section_number'] for r in res]
    for n in ['120', '121', '122', '123', '124', '125']:
        assert n in sec_nums


def test_pattern_alphanumeric():
    """Test: 'Section 498A IPC'"""
    text = "Allegations under Section 498A IPC were noted in the report."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 1
    assert res[0]['section_number'] == '498A'
    assert res[0]['act_key'] == 'IPC'
    assert text[res[0]['start_char']:res[0]['end_char']] == res[0]['matched_text']


def test_pattern_kannada_with_native_and_latin_digits():
    """Test Kannada: 'ಕಲಂ 420' and 'ಕಲಂ ೪೨೦'"""
    text_latin = "ಪ್ರಕರಣವು ಕಲಂ 420 ಅಡಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ."
    res1 = find_sections_in_text(text_latin, page_number=1)
    assert len(res1) >= 1
    assert res1[0]['section_number'] == '420'

    text_indic = "ದೂರು ಕಲಂ ೪೨೦ ಐಪಿಸಿ ಪ್ರಕಾರ ಇದೆ."
    res2 = find_sections_in_text(text_indic, page_number=1)
    assert len(res2) >= 1
    assert res2[0]['section_number'] == '420'
    assert res2[0]['act_key'] == 'IPC'


def test_pattern_hindi_with_native_and_latin_digits():
    """Test Hindi: 'धारा 302' and 'धारा ३०२'"""
    text_latin = "मामला धारा 302 आईपीसी के तहत दर्ज हुआ।"
    res1 = find_sections_in_text(text_latin, page_number=1)
    assert len(res1) >= 1
    assert res1[0]['section_number'] == '302'

    text_indic = "प्राथमिकी धारा ३०२ आईपीसी में है।"
    res2 = find_sections_in_text(text_indic, page_number=1)
    assert len(res2) >= 1
    assert res2[0]['section_number'] == '302'


def test_unknown_act_stored_as_unknown():
    """Test: Section without recognizable Act is tagged UNKNOWN"""
    text = "The officer referred to Section 45 during the proceedings."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 1
    assert res[0]['section_number'] == '45'
    assert res[0]['act_key'] == 'UNKNOWN'


def test_ordinary_use_of_section_not_detected():
    """Test: 'the section of the road was closed' does not match"""
    text = "The northern section of the road was closed for repair works. No vehicles were allowed."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 0


def test_document_with_no_sections_returns_empty():
    """Test: Generic text returns empty list"""
    text = "This is a regular commercial agreement between two parties regarding furniture delivery."
    res = find_sections_in_text(text, page_number=1)
    assert len(res) == 0


# ============================================================================
# 3. ENDPOINT INTEGRATION & SECURITY TESTS
# ============================================================================

@pytest.mark.django_db
def test_detect_sections_endpoint_and_rerun_idempotency(client_a, sample_document):
    """
    Test POST /api/documents/<id>/detect-sections/
    - Runs detection, creates DetectedSection records
    - Verifies re-run replaces auto results but preserves confirmed/manual
    """
    page_text = "Accused is prosecuted under Section 420 IPC and Section 498A IPC."
    page = DocumentPage.objects.create(
        document=sample_document,
        page_number=1,
        extracted_text=page_text
    )

    detect_url = f"/api/documents/{sample_document.id}/detect-sections/"
    res = client_a.post(detect_url)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) == 2
    sec_420 = next(s for s in data if s['section_number'] == '420')
    sec_498a = next(s for s in data if s['section_number'] == '498A')

    # Confirm section 420
    patch_url = f"/api/documents/{sample_document.id}/sections/{sec_420['id']}/"
    patch_res = client_a.patch(patch_url, {'review_status': 'confirmed'}, format='json')
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.json()['review_status'] == 'confirmed'

    # Manually add a section
    manual_url = f"/api/documents/{sample_document.id}/sections/"
    manual_res = client_a.post(manual_url, {
        'page_number': 1,
        'start_char': 0,
        'end_char': 7,
        'section_number': '999',
        'act_key': 'CUSTOM'
    }, format='json')
    assert manual_res.status_code == status.HTTP_201_CREATED
    manual_id = manual_res.json()['id']
    assert manual_res.json()['matched_text'] == page_text[0:7]

    # Re-run detection
    res2 = client_a.post(detect_url)
    assert res2.status_code == status.HTTP_200_OK
    new_data = res2.json()

    # Confirmed 420 and Manual 999 must still exist!
    ids = [s['id'] for s in new_data]
    assert sec_420['id'] in ids
    assert manual_id in ids
    reloaded_420 = next(s for s in new_data if s['id'] == sec_420['id'])
    assert reloaded_420['review_status'] == 'confirmed'


@pytest.mark.django_db
def test_get_sections_grouped_by_act(client_a, sample_document):
    """Test GET /api/documents/<id>/sections/ returns grouped format."""
    page = DocumentPage.objects.create(
        document=sample_document,
        page_number=1,
        extracted_text="Notice under Section 138 of Negotiable Instruments Act and Section 420 IPC."
    )
    detect_sections_for_document(str(sample_document.id))

    url = f"/api/documents/{sample_document.id}/sections/"
    res = client_a.get(url)
    assert res.status_code == status.HTTP_200_OK
    payload = res.json()
    assert 'total_count' in payload
    assert payload['total_count'] == 2
    assert 'groups' in payload
    act_keys = [g['act_key'] for g in payload['groups']]
    assert 'NI_ACT' in act_keys
    assert 'IPC' in act_keys


@pytest.mark.django_db
def test_patch_and_delete_manual_section(client_a, sample_document):
    """
    Test editing section via PATCH, and DELETE only allowed for manual items.
    """
    page = DocumentPage.objects.create(
        document=sample_document,
        page_number=1,
        extracted_text="Under Section 302 IPC investigations are ongoing."
    )
    detect_sections_for_document(str(sample_document.id))
    auto_sec = sample_document.detected_sections.first()

    # Attempt to DELETE auto section -> 400 Bad Request
    del_auto_url = f"/api/documents/{sample_document.id}/sections/{auto_sec.id}/"
    del_auto_res = client_a.delete(del_auto_url)
    assert del_auto_res.status_code == status.HTTP_400_BAD_REQUEST

    # Reject auto section via PATCH -> OK
    patch_res = client_a.patch(del_auto_url, {'review_status': 'rejected'}, format='json')
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.json()['review_status'] == 'rejected'

    # Create manual section
    post_res = client_a.post(f"/api/documents/{sample_document.id}/sections/", {
        'page_number': 1,
        'start_char': 6,
        'end_char': 17,
        'section_number': '302',
        'act_key': 'IPC'
    }, format='json')
    assert post_res.status_code == status.HTTP_201_CREATED
    man_id = post_res.json()['id']

    # Delete manual section -> 204
    del_man_res = client_a.delete(f"/api/documents/{sample_document.id}/sections/{man_id}/")
    assert del_man_res.status_code == status.HTTP_204_NO_CONTENT
    assert not DetectedSection.objects.filter(id=man_id).exists()


@pytest.mark.django_db
def test_ownership_isolation_and_unauthenticated_access(client_a, client_b, sample_document):
    """
    Test other user gets 404 on every section endpoint; unauthenticated gets 401.
    """
    DocumentPage.objects.create(
        document=sample_document,
        page_number=1,
        extracted_text="Section 420 IPC."
    )
    detect_sections_for_document(str(sample_document.id))
    sec = sample_document.detected_sections.first()

    urls = [
        ('POST', f"/api/documents/{sample_document.id}/detect-sections/"),
        ('GET', f"/api/documents/{sample_document.id}/sections/"),
        ('POST', f"/api/documents/{sample_document.id}/sections/"),
        ('PATCH', f"/api/documents/{sample_document.id}/sections/{sec.id}/"),
        ('DELETE', f"/api/documents/{sample_document.id}/sections/{sec.id}/"),
    ]

    unauth_client = APIClient()

    for method, url in urls:
        # 1. Unauthenticated gets 401
        if method == 'GET':
            assert unauth_client.get(url).status_code == status.HTTP_401_UNAUTHORIZED
        elif method == 'POST':
            assert unauth_client.post(url, {}).status_code == status.HTTP_401_UNAUTHORIZED
        elif method == 'PATCH':
            assert unauth_client.patch(url, {}).status_code == status.HTTP_401_UNAUTHORIZED
        elif method == 'DELETE':
            assert unauth_client.delete(url).status_code == status.HTTP_401_UNAUTHORIZED

        # 2. User B (different user) gets 404 (Not Found, privacy preservation)
        if method == 'GET':
            assert client_b.get(url).status_code == status.HTTP_404_NOT_FOUND
        elif method == 'POST':
            assert client_b.post(url, {'page_number': 1, 'start_char': 0, 'end_char': 2, 'section_number': '1'}).status_code == status.HTTP_404_NOT_FOUND
        elif method == 'PATCH':
            assert client_b.patch(url, {'review_status': 'confirmed'}).status_code == status.HTTP_404_NOT_FOUND
        elif method == 'DELETE':
            assert client_b.delete(url).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_deleting_document_cascades_and_deletes_sections(client_a, sample_document):
    """
    Test deleting a Document automatically deletes its DetectedSection rows (CASCADE).
    """
    DocumentPage.objects.create(
        document=sample_document,
        page_number=1,
        extracted_text="Section 420 IPC."
    )
    detect_sections_for_document(str(sample_document.id))
    assert sample_document.detected_sections.count() == 1

    doc_id = sample_document.id
    sample_document.delete()

    assert not Document.objects.filter(id=doc_id).exists()
    assert DetectedSection.objects.filter(document_id=doc_id).count() == 0

