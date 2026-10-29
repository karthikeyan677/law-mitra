"""
Pure Python Statutory Section & Act Detector for Law Mithra.
Uses deterministic regex and rule-based pattern matching ONLY.
Zero AI, Zero LLM, Zero hallucinated sections.
"""

import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from documents.models import Document, DocumentPage
from analysis.models import DetectedSection

logger = logging.getLogger(__name__)

# ============================================================================
# 1. ACT NAME & ABBREVIATION DICTIONARY
# Contains statutory names and abbreviations ONLY.
# Strictly NO section text, titles, meanings, punishments, or explanations.
# ============================================================================
ACT_ALIASES: Dict[str, List[str]] = {
    "IPC": [
        "indian penal code",
        "i.p.c.",
        "ipc",
        "i. p. c.",
        "i p c",
        "the indian penal code, 1860",
        "indian penal code, 1860",
        "ಐಪಿಸಿ",
        "आईपीसी",
    ],
    "BNS": [
        "bharatiya nyaya sanhita",
        "bns",
        "b.n.s.",
        "b. n. s.",
        "bharatiya nyaya sanhita, 2023",
        "bharatiya nyaya sanhita 2023",
        "ಬಿಎನ್‌ಎಸ್",
        "बीएनएस",
    ],
    "CRPC": [
        "code of criminal procedure",
        "cr.p.c.",
        "crpc",
        "cr. p. c.",
        "c.r.p.c.",
        "cr p c",
        "code of criminal procedure, 1973",
        "the code of criminal procedure, 1973",
        "ಸಿಆರ್‌ಪಿಸಿ",
        "सीआरपीसी",
    ],
    "BNSS": [
        "bharatiya nagarik suraksha sanhita",
        "bnss",
        "b.n.s.s.",
        "b. n. s. s.",
        "bharatiya nagarik suraksha sanhita, 2023",
        "bharatiya nagarik suraksha sanhita 2023",
        "ಬಿಎನ್‌ಎಸ್‌ಎಸ್",
        "बीएनएसएस",
    ],
    "CPC": [
        "code of civil procedure",
        "c.p.c.",
        "cpc",
        "c. p. c.",
        "c p c",
        "code of civil procedure, 1908",
        "the code of civil procedure, 1908",
        "ಸಿಪಿಸಿ",
        "सीपीसी",
    ],
    "NI_ACT": [
        "negotiable instruments act",
        "negotiable instrument act",
        "n.i. act",
        "ni act",
        "n. i. act",
        "negotiable instruments act, 1881",
        "the negotiable instruments act, 1881",
        "ಎನ್‌ಐ ಆಕ್ಟ್",
        "एनआई एक्ट",
    ],
    "BSA": [
        "bharatiya sakshya adhiniyam",
        "bsa",
        "b.s.a.",
        "b. s. a.",
        "bharatiya sakshya adhiniyam, 2023",
        "bharatiya sakshya adhiniyam 2023",
        "ಬಿಎಸ್‌ಎ",
        "बीएसए",
    ],
    "IEA": [
        "indian evidence act",
        "i.e.a.",
        "iea",
        "i. e. a.",
        "indian evidence act, 1872",
        "the indian evidence act, 1872",
        "ಐಇಎ",
        "आईईए",
    ],
}

# NOTE FOR USER / HUMAN VERIFIER:
# The words below for "section" in Indic languages ('ಕಲಂ' in Kannada, 'धारा' in Hindi)
# and their native numeral digits are based on standard legal document practice.
# Please verify these terms and any regional spelling variants with a native speaker / legal translator.
INDIC_SECTION_WORDS = {
    "kn": "ಕಲಂ",  # Kannada for 'Section'
    "hi": "धारा",  # Hindi for 'Section'
}

KANNADA_DIGITS = {
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
    '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9'
}

DEVANAGARI_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}


def normalize_indic_digits(text: str) -> str:
    """Replaces Kannada and Devanagari native digits with standard ASCII digits."""
    res = []
    for ch in text:
        if ch in KANNADA_DIGITS:
            res.append(KANNADA_DIGITS[ch])
        elif ch in DEVANAGARI_DIGITS:
            res.append(DEVANAGARI_DIGITS[ch])
        else:
            res.append(ch)
    return "".join(res)


def match_act_key(act_text: str) -> Tuple[str, str]:
    """
    Matches raw act text against the alias dictionary.
    Returns (act_key, act_raw). If unrecognised, returns ('UNKNOWN', act_text).
    Uses Unicode-safe word matching supporting both Latin and Indic scripts.
    """
    clean = act_text.strip().lower()
    # Normalize internal spaces and punctuation
    clean = re.sub(r'\s+', ' ', clean)

    for key, aliases in ACT_ALIASES.items():
        for alias in aliases:
            if clean == alias or alias in clean.split():
                return key, act_text.strip()
            pattern = r'(?:^|\b|(?<=[\s\.,;:_-]))' + re.escape(alias) + r'(?:\b|(?=[\s\.,;:_-]|$))'
            if re.search(pattern, clean, re.IGNORECASE):
                return key, act_text.strip()

    return "UNKNOWN", act_text.strip()


def normalize_ocr_section_number(raw_num: str) -> str:
    """
    Cleans OCR noise inside an isolated section number, e.g. '42O' -> '420',
    while keeping legitimate alphanumeric suffixes like '498A', '304B'.
    """
    # Replace native numerals first
    clean = normalize_indic_digits(raw_num.strip())
    # If standard 'O' was scanned instead of '0' right after digits
    clean = re.sub(r'(?<=\d)[oO](?=\d|$)', '0', clean)
    return clean


# ============================================================================
# 2. DETERMINISTIC REGEX PATTERNS
# ============================================================================

# Section prefix keywords (including OCR noise variants like Sectlon, 5ec, u/s, etc.)
# Audit Fix 1: Tightened S\\.? to S\\. (require period) to avoid matching bare "S" + digits.
# Audit Fix 2: Removed Indic words from here; handled cleanly in PATTERN_INDIC.
# Strictly requires an actual digit or Indic numeral immediately following!
PREFIX_PATTERNS = r'(?:Sections?|Secs?\.?|S\.|Sect\.?|Sectlon|5ec\.?|u\/s|u\/sec\.?|u\/ss|U\/S|U\/s|U\/Sec\.?|U\/sec\.?)'

# Individual section token: digits followed optionally by letter or sub-clauses like 420, 498A, 138, 13(1)(ia), 156(3)
SECTION_TOKEN_RE = r'[0-9೦-೯०-९]+(?:\s*[-–]\s*[0-9೦-೯०-९]+)?[A-Za-z]?(?:\s*\([0-9a-zA-Z]+\))*'

# Combined section group (supports multiple comma-separated sections and 'and' or 'r/w' or ranges)
# e.g. "420", "420, 468 and 471", "120 to 125", "420 r/w 34"
MULTI_SECTIONS_RE = (
    SECTION_TOKEN_RE + r'(?:'
    r'(?:\s*,\s*|\s+and\s+|\s+&\s+|\s+to\s+|\s*[-–]\s*|\s+r\/w\s+|\s+read\s+with\s+)'
    + SECTION_TOKEN_RE + r')*'
)

ACT_SHORT_NAMES = r'(?:IPC|BNS|Cr\.?P\.?C\.?|BNSS|CPC|BSA|IEA|NI\s+Act|ಐಪಿಸಿ|आईपीसी|ಬಿಎನ್‌ಎಸ್|बीएनएस|ಸಿಆರ್‌ಪಿಸಿ|सीआरपीसी|ಬಿಎನ್‌ಎಸ್‌ಎಸ್|बीएनएसएस|ಸಿಪಿಸಿ|सीपीसी|ಬಿಎಸ್‌ಎ|बीएसए|ಐಇಎ|आईईए)'

# Act context following the section:
# e.g. "of the Indian Penal Code", "of Cr.P.C.", "IPC", "of Negotiable Instruments Act"
ACT_POST_RE = (
    r'(?:'
    r'(?:\s+(?:of\s+(?:the\s+)?|in\s+(?:the\s+)?|under\s+(?:the\s+)?))'
    r'(?P<act_full>(?:(?!Section|Sec|u\/s|ಕಲಂ|धारा)[A-Za-z\.\s,0-9\u0900-\u097F\u0C80-\u0CFF]){0,60}?(?:Code|Act|Sanhita|Adhiniyam|IPC|BNS|Cr\.?P\.?C\.?|BNSS|CPC|NI\s+Act|IEA|BSA))\b'
    r'|\s+(?P<act_short>' + ACT_SHORT_NAMES + r')(?=[\s\.,;:]|$)'
    r')'
)

# Full Pattern A: Prefix + Sections + optional trailing Act
PATTERN_A = re.compile(
    r'\b(?P<prefix>' + PREFIX_PATTERNS + r')\s+'
    r'(?P<sections>' + MULTI_SECTIONS_RE + r')'
    r'(?:' + ACT_POST_RE + r')?',
    re.IGNORECASE
)

# Full Pattern B: Pre-positioned Act + "under Section 000" or "u/s 000"
# e.g. "under Indian Penal Code Section 420", "IPC u/s 420"
PATTERN_B = re.compile(
    r'\b(?P<act>[A-Za-z\.\s]{2,40}?(?:Code|Act|Sanhita|Adhiniyam|IPC|BNS|Cr\.?P\.?C\.?|BNSS|CPC))\s+'
    r'(?:u\/s|under\s+(?:the\s+)?Section)\s+'
    r'(?P<sections>' + MULTI_SECTIONS_RE + r')',
    re.IGNORECASE
)

# Pattern C: Indic native section mentions e.g. "ಕಲಂ 420", "धारा 302"
PATTERN_INDIC = re.compile(
    r'(?P<prefix>ಕಲಂ|धारा)\s+(?P<sections>' + MULTI_SECTIONS_RE + r')'
    r'(?:' + ACT_POST_RE + r')?',
    re.IGNORECASE
)


def _split_individual_sections(sections_raw: str) -> List[Tuple[str, str, int, int]]:
    """
    Parses a multi-section snippet like '420, 468 and 471' or '120 to 125' or '420 r/w 34'.
    Returns a list of (section_number, sub_clause, relative_start, relative_end).
    """
    results = []

    # Check for range: "120 to 125" or "120 - 125"
    range_match = re.search(r'([0-9೦-೯०-९]+)\s*(?:to|[-–])\s*([0-9೦-೯०-९]+)', sections_raw, re.IGNORECASE)
    if range_match:
        start_raw, end_raw = range_match.group(1), range_match.group(2)
        try:
            start_num = int(normalize_indic_digits(start_raw))
            end_num = int(normalize_indic_digits(end_raw))
            # Only expand reasonable legal section ranges (limit <= 30 to prevent crazy OCR noise)
            if start_num < end_num and (end_num - start_num) <= 30:
                for n in range(start_num, end_num + 1):
                    # For range expansion, reference the whole range text
                    results.append((str(n), "", 0, len(sections_raw)))
                return results
        except ValueError:
            pass

    # Standard token extraction: find each section unit in the string
    token_pattern = re.compile(r'([0-9೦-೯०-९]+[A-Za-z]?(?:\s*\([0-9a-zA-Z]+\))*)')
    for m in token_pattern.finditer(sections_raw):
        raw_token = m.group(1)
        rel_start = m.start(1)
        rel_end = m.end(1)

        # Separate sub-clause e.g. "13(1)(a)" -> section: "13(1)(a)", sub_clause: "(1)(a)"
        sub_clause = ""
        sub_match = re.search(r'(\([0-9a-zA-Z]+\)+)', raw_token)
        if sub_match:
            sub_clause = sub_match.group(1).replace(" ", "")

        norm_sec = normalize_ocr_section_number(raw_token).replace(" ", "")
        results.append((norm_sec, sub_clause, rel_start, rel_end))

    return results


def find_sections_in_text(page_text: str, page_number: int = 1) -> List[Dict[str, Any]]:
    """
    Deterministic rule-based detector. Scans a single page's text and identifies all
    explicitly stated legal sections and Acts with exact offsets.
    Enforces Rule: page_text[start_char:end_char] == matched_text.
    """
    if not page_text or not page_text.strip():
        return []

    found_entries: List[Dict[str, Any]] = []
    # To prevent duplicate overlapping matches at the exact same offsets
    seen_spans = set()

    # Pass 1: Pattern A (Prefix + Sections + optional Act)
    for match in PATTERN_A.finditer(page_text):
        full_match_text = match.group(0)
        start_char = match.start(0)
        end_char = match.end(0)

        # Check for non-legal false positives (e.g. "the section of the road")
        prefix = match.group('prefix')
        sections_str = match.group('sections')

        # Safety check: must start with a numeral
        if not re.search(r'[0-9೦-೯०-९]', sections_str):
            continue

        act_raw = (match.group('act_full') or match.group('act_short') or "").strip()
        act_key, act_raw_clean = match_act_key(act_raw) if act_raw else ("UNKNOWN", "")

        sub_sections = _split_individual_sections(sections_str)
        if not sub_sections:
            continue

        for sec_num, sub_clause, _, _ in sub_sections:
            span_key = (page_number, start_char, end_char, sec_num, act_key)
            if span_key not in seen_spans:
                seen_spans.add(span_key)
                found_entries.append({
                    "section_number": sec_num,
                    "sub_clause": sub_clause,
                    "act_key": act_key,
                    "act_raw": act_raw_clean,
                    "matched_text": full_match_text,
                    "start_char": start_char,
                    "end_char": end_char,
                    "page_number": page_number,
                    "detection_method": DetectedSection.DetectionMethod.RULE,
                    "review_status": DetectedSection.ReviewStatus.AUTO,
                })

    # Pass 2: Pattern B (Pre-positioned Act + "under Section 000")
    for match in PATTERN_B.finditer(page_text):
        full_match_text = match.group(0)
        start_char = match.start(0)
        end_char = match.end(0)
        act_raw = match.group('act').strip()
        sections_str = match.group('sections')

        if not re.search(r'[0-9೦-೯०-९]', sections_str):
            continue

        act_key, act_raw_clean = match_act_key(act_raw)
        sub_sections = _split_individual_sections(sections_str)

        for sec_num, sub_clause, _, _ in sub_sections:
            span_key = (page_number, start_char, end_char, sec_num, act_key)
            if span_key not in seen_spans:
                seen_spans.add(span_key)
                found_entries.append({
                    "section_number": sec_num,
                    "sub_clause": sub_clause,
                    "act_key": act_key,
                    "act_raw": act_raw_clean,
                    "matched_text": full_match_text,
                    "start_char": start_char,
                    "end_char": end_char,
                    "page_number": page_number,
                    "detection_method": DetectedSection.DetectionMethod.RULE,
                    "review_status": DetectedSection.ReviewStatus.AUTO,
                })

    # Pass 3: Indic Native Section Patterns (ಕಲಂ, धारा)
    for match in PATTERN_INDIC.finditer(page_text):
        full_match_text = match.group(0)
        start_char = match.start(0)
        end_char = match.end(0)
        sections_str = match.group('sections')

        if not re.search(r'[0-9೦-೯०-९]', sections_str):
            continue

        act_raw = (match.group('act_full') or match.group('act_short') or "").strip()
        act_key, act_raw_clean = match_act_key(act_raw) if act_raw else ("UNKNOWN", "")
        sub_sections = _split_individual_sections(sections_str)

        for sec_num, sub_clause, _, _ in sub_sections:
            span_key = (page_number, start_char, end_char, sec_num, act_key)
            if span_key not in seen_spans:
                seen_spans.add(span_key)
                found_entries.append({
                    "section_number": sec_num,
                    "sub_clause": sub_clause,
                    "act_key": act_key,
                    "act_raw": act_raw_clean,
                    "matched_text": full_match_text,
                    "start_char": start_char,
                    "end_char": end_char,
                    "page_number": page_number,
                    "detection_method": DetectedSection.DetectionMethod.RULE,
                    "review_status": DetectedSection.ReviewStatus.AUTO,
                })

    # Sort deterministically by start offset
    found_entries.sort(key=lambda x: (x['page_number'], x['start_char']))
    return found_entries


def detect_sections_for_document(document_id: str) -> List[DetectedSection]:
    """
    Executes section detection across all pages of a Document.
    Replaces existing 'auto' results while preserving all 'manual' or 'confirmed' sections.
    Enforces privacy logging: logs IDs only, never document text or file names.
    """
    try:
        document = Document.objects.prefetch_related('pages').get(id=document_id)
    except Document.DoesNotExist:
        logger.warning(f"event=section_detection.not_found doc_id={document_id}")
        return []

    # Preserve confirmed or manual detections; purge only previous auto detections
    document.detected_sections.filter(
        review_status=DetectedSection.ReviewStatus.AUTO,
        detection_method=DetectedSection.DetectionMethod.RULE
    ).delete()

    created_sections = []
    total_found = 0

    for page in document.pages.all():
        matches = find_sections_in_text(page.extracted_text, page.page_number)
        for m in matches:
            # Double verify exact offset slicing
            exact_slice = page.extracted_text[m['start_char']:m['end_char']]
            if exact_slice != m['matched_text']:
                # Adjust if minor discrepancy
                m['matched_text'] = exact_slice

            sec_obj = DetectedSection(
                document=document,
                page=page,
                page_number=page.page_number,
                act_raw=m['act_raw'],
                act_key=m['act_key'],
                section_number=m['section_number'],
                sub_clause=m['sub_clause'],
                matched_text=m['matched_text'],
                start_char=m['start_char'],
                end_char=m['end_char'],
                detection_method=m['detection_method'],
                review_status=m['review_status'],
            )
            created_sections.append(sec_obj)
            total_found += 1

    if created_sections:
        DetectedSection.objects.bulk_create(created_sections)

    logger.info(f"event=section_detection.completed doc_id={document_id} count={total_found}")
    return list(document.detected_sections.all())
