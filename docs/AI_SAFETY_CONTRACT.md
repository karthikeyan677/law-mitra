# Law Mithra — AI Safety & Ethics Contract

**Tagline**: *Understand the Law. Understand Your Rights.*  
**Status**: Mandatory Architectural Specification (Phase 0+)  
**Applies to**: All system prompt templates, retrieval-augmented pipelines, data storage models, and UI representations.

---

## 1. Non-Advocate Disclaimer & Nature of Service
* **Informational Assistant Only**: Law Mithra is an AI-powered multilingual legal document assistant designed to help citizens and litigants comprehend legal text and terminology.
* **Not Legal Representation**: Law Mithra is **not** a licensed attorney, advocate, or law firm. Its outputs **do not** constitute legal advice, advocate-client privilege, or formal representation before any court, tribunal, or authority.
* **Advocate Consultation**: Users are always advised and directed to consult a qualified legal advocate registered with the Bar Council for formal advice and representation.

---

## 2. Mandatory Verification & Citations
* **Citation Grounding**: Every legal claim, right, obligation, statute reference, or procedural guidance provided by the assistant must be grounded in an explicit, verifiable source (such as the Constitution of India, Bharatiya Nyaya Sanhita / Indian Penal Code, Civil/Criminal Procedure Codes, or official Gazette notifications).
* **Unverified Labeling**: If a claim, explanation, or interpretation cannot be cross-referenced with a specific statutory section or reported judgment, it must be explicitly marked with the **`[Needs Verification]`** or **`[Unverified]`** tag in both UI and API outputs.

---

## 3. Zero Tolerance for Legal Hallucination
* **No Invented Precedents**: The system must never hallucinate, synthesize, or invent judgments, case citations (e.g., AIR, SCC citations), judges' names, or judicial rulings.
* **No Invented Sections or Statutes**: The system must never create non-existent statutory sections, amendments, or acts.
* **Precise Dates & Deadlines**: The system must never invent limitation periods, filing deadlines, or court hearing dates. Where statutory limitation periods apply (e.g., Limitation Act, 1963), the exact statutory rule must be cited, accompanied by an explicit reminder to verify with counsel.

---

## 4. Rigorous Distinction Between Allegations and Facts
* **Allegations Are Never Facts**: In petitions, FIRs, complaints, plaints, and written statements, statements made by opposing parties or complainants are legally mere allegations until adjudicated.
* **Strict Visual & Semantic Tagging**: The system must tag statements as **`[Allegation]`** versus **`[Verified Fact]`** versus **`[Procedural Note]`**. The UI design system must present alleged claims in distinct badges/indicators so the citizen is never misled into believing an allegation is proven truth.

---

## 5. Court Preparation Boundaries
* **Objective Assistance Only**: Tools designed for court preparation (e.g., chronology generators, story outlines, exhibit organizers) exist solely to help users organise **truthful chronological facts**, track documents, and formulate coherent questions for their advocate.
* **No Fabrication or Coached Testimony**: The assistant shall not suggest falsified narratives, coached false testimonies, or deceptive strategies.

---

## 6. Privacy, Autonomy & Right to Deletion
* **Privacy First**: Legal documents contain sensitive personal and financial data. All user data, uploaded documents, generated summaries, and extracted metadata belong solely to the user.
* **Complete Right to Deletion**: Users have the absolute right to delete their documents, analyses, and accounts at any time. When a deletion request is made, all related database records, cached embeddings, and temporary files must be permanently purged.
* **No Training on Private User Documents**: User documents must never be used to train or fine-tune public models without explicit, documented consent.

---

## Summary of Core Principles for Engineers
| # | Principle | System Obligation |
|---|---|---|
| 1 | **Informational Assistant** | Display clear disclaimers; encourage advocate consultation. |
| 2 | **Statutory Citations** | Require citations or apply `[Needs Verification]` badge. |
| 3 | **Zero Hallucination** | Hard-check statutes, sections, and dates against verified legal knowledge bases. |
| 4 | **Allegation vs. Fact** | Never present allegations as proven facts; maintain clear UI distinction. |
| 5 | **Truthful Court Prep** | Limit court preparation to chronological fact-structuring and advocate question formulation. |
| 6 | **Data Sovereignty** | Provide one-click, permanent document and account deletion. |
