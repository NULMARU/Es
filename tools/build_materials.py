from __future__ import annotations

import io
import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps
from pypdf import PdfReader

try:
    import pytesseract
except Exception:  # pragma: no cover - handled at runtime
    pytesseract = None


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
MATERIALS_DIR = PUBLIC_DIR / "materials"
DATA_DIR = PUBLIC_DIR / "data"
PDF_RE = re.compile(r"스텝\s*(\d+)_([12])\.pdf$", re.IGNORECASE)
HANGUL_RE = re.compile(r"[가-힣]")
NUMBERED_RE = re.compile(r"^\s*(\d{1,3})\s*[\.\),，]\s*(.+)$")
HINT_RE = re.compile(r"\(([^()]*)\)\s*$")


@dataclass
class SourcePdf:
    step: int
    part: int
    path: Path


def clean_line(text: str) -> str:
    value = unicodedata.normalize("NFKC", text)
    value = value.replace("ㆍ", " ").replace("•", " ").replace("·", " ")
    value = value.replace("’", "'").replace("“", '"').replace("”", '"')
    value = re.sub(r"\s+", " ", value).strip()
    return value


def clean_english(text: str) -> str:
    value = clean_line(text)
    value = re.sub(r"^\s*[ᆞㆍ•·\-–—*+«»]+\s*", "", value)
    value = re.sub(r"^\s*\|\s+", "I ", value)
    value = re.sub(r"(?<=\s)\|(?=\s|[A-Za-z])", "I", value)
    value = re.sub(r"\s*/\s*", " ", value)
    value = value.replace("I'mm", "I'm").replace("|'m", "I'm")
    value = value.replace("|'ve", "I've").replace("|'ll", "I'll")
    value = value.replace(" Iogking ", " looking ")
    value = value.replace("iogking", "looking")
    value = value.replace("I.travel", "I travel")
    value = re.sub(r"\b15\b(?=\s+(messy|stuffy|ready|bad|good|hard|easy)\b)", "is", value, flags=re.I)
    value = re.sub(r"\s+\|\s*$", "", value)
    value = re.sub(r"\s+([?.!,])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def answer_key(text: str) -> str:
    value = clean_english(text).lower()
    value = re.sub(r"[^a-z0-9']+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def looks_like_english_sentence(text: str) -> bool:
    value = clean_english(text)
    if HANGUL_RE.search(value):
        return False
    if len(value) < 10:
        return False
    letters = sum(ch.isalpha() for ch in value)
    if letters < 8:
        return False
    tokens = re.findall(r"[A-Za-z']+", value)
    if len(tokens) < 3:
        return False
    if re.fullmatch(r"[\w\s/]+", value) and "/" in value and len(tokens) < 6:
        return False
    start_ok = re.match(
        r"^(I|I'm|I've|I'll|She|She's|He|He's|We|We're|They|They're|You|You're|"
        r"Do|Does|Did|Who|What|When|Where|Why|How|It|It's|There|My|The)\b",
        value,
        re.IGNORECASE,
    )
    return bool(start_ok or re.search(r"\b(am|is|are|was|were|do|does|don't|doesn't|when|before|after)\b", value, re.I))


def looks_like_target_english(text: str) -> bool:
    value = clean_english(text)
    if HANGUL_RE.search(value):
        return False
    tokens = re.findall(r"[A-Za-z']+", value)
    if len(tokens) < 3:
        return False
    letters = sum(ch.isalpha() for ch in value)
    if letters < 8:
        return False
    if re.search(r"[가-힣ᄀ-ᇿ]", value):
        return False
    if len(re.findall(r"\d", value)) > 2:
        return False
    return bool(re.search(r"[.?!]$", value) or re.search(r"\b(am|is|are|was|were|do|does|don't|when|because|after|before|for|to)\b", value, re.I))


def preprocess_for_ocr(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    gray = ImageOps.autocontrast(gray)
    return gray


def ocr_image(image: Image.Image) -> list[str]:
    if pytesseract is None:
        return []
    text = pytesseract.image_to_string(preprocess_for_ocr(image), lang="eng+kor", config="--psm 6")
    return [clean_line(line) for line in text.splitlines() if clean_line(line)]


def get_page_image(page: Any) -> Image.Image | None:
    images = list(page.images)
    if not images:
        return None
    return Image.open(io.BytesIO(images[0].data)).convert("RGB")


def save_page_image(image: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    max_width = 1420
    if image.width > max_width:
        ratio = max_width / image.width
        image = image.resize((max_width, int(image.height * ratio)), Image.Resampling.LANCZOS)
    image.save(target, format="JPEG", quality=86, optimize=True)


def discover_pdfs() -> dict[int, dict[int, SourcePdf]]:
    found: dict[int, dict[int, SourcePdf]] = {}
    for path in ROOT.glob("*.pdf"):
        match = PDF_RE.match(path.name)
        if not match:
            continue
        step = int(match.group(1))
        part = int(match.group(2))
        found.setdefault(step, {})[part] = SourcePdf(step=step, part=part, path=path)
    return found


def extract_topic(lines: list[str]) -> str:
    for line in lines:
        match = re.search(r"주제\s*[:：]\s*(.+)", line)
        if match:
            return clean_line(match.group(1))
    return "초급 회화 기본기"


def detect_pattern_kind(step: int, text: str) -> str:
    compact = re.sub(r"\s+", "", text)
    if "진행" in compact:
        return "progressive"
    if "현재" in compact or step == 1:
        return "present-simple"
    return "pattern"


def build_patterns(kind: str) -> list[dict[str, Any]]:
    if kind == "present-simple":
        return [
            {
                "name": "현재 시제",
                "formula": "I/You/We/They + 동사원형",
                "focus": "평소 반복하는 습관과 사실",
                "signals": ["always", "usually", "often", "sometimes", "every day", "on weekends"],
            },
            {
                "name": "3인칭 단수",
                "formula": "He/She/It + 동사-s/es",
                "focus": "다른 사람의 반복 행동",
                "signals": ["plays", "works", "watches", "goes"],
            },
            {
                "name": "조건/시간 연결",
                "formula": "주절 + when/before/after/as soon as + 절",
                "focus": "상황이 생길 때 반복되는 행동",
                "signals": ["when", "before", "after", "as soon as"],
            },
        ]
    if kind == "progressive":
        return [
            {
                "name": "현재 진행형",
                "formula": "am/is/are + 동사-ing",
                "focus": "지금 또는 요즘 진행 중인 행동",
                "signals": ["now", "these days", "still", "lately"],
            },
            {
                "name": "과거 진행형",
                "formula": "was/were + 동사-ing",
                "focus": "그때 진행 중이던 행동",
                "signals": ["when", "earlier", "all morning", "at 10 p.m."],
            },
            {
                "name": "완료 진행 느낌",
                "formula": "have/has been + 동사-ing",
                "focus": "전부터 계속 이어지는 행동",
                "signals": ["since", "for", "lately"],
            },
        ]
    return [
        {
            "name": "문장 패턴",
            "formula": "주어 + 동사 + 핵심 표현",
            "focus": "기본 문장 뼈대 반복",
            "signals": [],
        }
    ]


def title_for_step(step: int, kind: str, first_lines: list[str]) -> str:
    if kind == "present-simple":
        return "Step 1 - 현재 시제"
    if kind == "progressive":
        return "Step 2 - 진행형"
    for line in first_lines[:5]:
        if "STEP" in line.upper() or "스텝" in line:
            return clean_line(line)
    return f"Step {step}"


def parse_prompt(line: str) -> tuple[str, list[str]]:
    value = clean_line(line)
    match = NUMBERED_RE.match(value)
    if match:
        value = match.group(2)
    hints: list[str] = []
    hint_match = HINT_RE.search(value)
    if hint_match:
        hints = [clean_line(item) for item in hint_match.group(1).split(",") if clean_line(item)]
        value = clean_line(value[: hint_match.start()])
    return value, hints


def extract_sentences(
    ocr_records: list[dict[str, Any]],
    step: int,
) -> list[dict[str, Any]]:
    sentences: dict[str, dict[str, Any]] = {}
    pending_prompt: dict[str, Any] | None = None

    for record in ocr_records:
        page_label = f"{record['partLabel']} {record['pageIndex']}"
        for raw_line in record["lines"]:
            line = clean_line(raw_line)
            numbered = NUMBERED_RE.match(line)
            body = numbered.group(2) if numbered else line
            has_hangul = bool(HANGUL_RE.search(body))

            if has_hangul and numbered:
                prompt, hints = parse_prompt(line)
                pending_prompt = {
                    "promptKo": prompt,
                    "hints": hints,
                    "sourcePage": page_label,
                }
                continue

            candidate = clean_english(body)
            if not looks_like_english_sentence(candidate):
                continue

            key = answer_key(candidate)
            if not key or len(key.split()) < 3:
                continue

            item = sentences.get(key)
            if item is None:
                item = {
                    "id": f"step-{step}-s{len(sentences) + 1:03d}",
                    "text": candidate,
                    "promptKo": "",
                    "hints": [],
                    "sourcePages": [],
                }
                sentences[key] = item

            if page_label not in item["sourcePages"]:
                item["sourcePages"].append(page_label)

            if pending_prompt and not item["promptKo"]:
                item["promptKo"] = pending_prompt["promptKo"]
                item["hints"] = pending_prompt["hints"]
                pending_prompt = None

    return list(sentences.values())


def text_quality(text: str, has_prompt: bool) -> int:
    value = clean_english(text)
    score = len(re.findall(r"[A-Za-z']+", value)) * 3
    if has_prompt:
        score += 40
    if value.endswith((".", "?", "!")):
        score += 8
    score -= len(re.findall(r"[^A-Za-z0-9\s'.,?!\[\]-]", value)) * 8
    score -= len(re.findall(r"\d", value)) * 5
    if re.search(r"\b(SAting|S\|)\b", value):
        score -= 30
    return score


def extract_target_sentences(
    ocr_records: list[dict[str, Any]],
    step: int,
) -> list[dict[str, Any]]:
    by_number: dict[int, dict[str, Any]] = {}
    pending: dict[str, Any] | None = None

    def upsert(number: int, text: str, source_page: str, prompt: dict[str, Any] | None = None) -> None:
        if not 1 <= number <= 50:
            return
        candidate = clean_english(text)
        if not looks_like_target_english(candidate):
            return
        incoming = {
            "id": f"step-{step}-s{number:03d}",
            "exerciseNumber": number,
            "text": candidate,
            "promptKo": prompt.get("promptKo", "") if prompt else "",
            "hints": prompt.get("hints", []) if prompt else [],
            "sourcePages": [source_page],
            "_quality": text_quality(candidate, bool(prompt)),
        }
        existing = by_number.get(number)
        if existing is None or incoming["_quality"] > existing.get("_quality", 0):
            if existing:
                incoming["sourcePages"] = sorted(set(existing.get("sourcePages", []) + [source_page]))
            by_number[number] = incoming
        elif existing and source_page not in existing["sourcePages"]:
            existing["sourcePages"].append(source_page)
            if prompt and not existing.get("promptKo"):
                existing["promptKo"] = prompt.get("promptKo", "")
                existing["hints"] = prompt.get("hints", [])

    for record in ocr_records:
        page_label = f"{record['partLabel']} {record['pageIndex']}"
        pending = None
        for raw_line in record["lines"]:
            line = clean_line(raw_line)
            numbered = NUMBERED_RE.match(line)
            if numbered:
                number = int(numbered.group(1))
                body = clean_line(numbered.group(2))
                if HANGUL_RE.search(body):
                    prompt, hints = parse_prompt(line)
                    pending = {
                        "number": number,
                        "promptKo": prompt,
                        "hints": hints,
                        "sourcePage": page_label,
                    }
                    continue
                upsert(number, body, page_label)
                pending = None
                continue

            if pending:
                candidate = clean_english(line)
                if looks_like_target_english(candidate):
                    upsert(pending["number"], candidate, page_label, pending)
                    pending = None

    targets = [by_number[number] for number in sorted(by_number)]
    for item in targets:
        item.pop("_quality", None)
    if len(targets) >= 45:
        return targets

    # Keep the app usable if a future PDF has a different layout.
    return extract_sentences(ocr_records, step)


def build_step(step: int, parts: dict[int, SourcePdf]) -> dict[str, Any]:
    odd_reader = PdfReader(str(parts[1].path))
    even_reader = PdfReader(str(parts[2].path))
    spread_count = min(len(odd_reader.pages), len(even_reader.pages))
    spreads: list[dict[str, Any]] = []
    ocr_records: list[dict[str, Any]] = []

    for index in range(spread_count):
        step_dir = MATERIALS_DIR / f"step-{step:02d}"
        odd_target = step_dir / f"spread-{index + 1:02d}-odd.jpg"
        even_target = step_dir / f"spread-{index + 1:02d}-even.jpg"

        odd_image = get_page_image(odd_reader.pages[index])
        even_image = get_page_image(even_reader.pages[index])
        odd_lines: list[str] = []
        even_lines: list[str] = []

        if odd_image is not None:
            save_page_image(odd_image, odd_target)
            odd_lines = ocr_image(odd_image)
            ocr_records.append({"partLabel": "odd", "pageIndex": index + 1, "lines": odd_lines})
        if even_image is not None:
            save_page_image(even_image, even_target)
            even_lines = ocr_image(even_image)
            ocr_records.append({"partLabel": "even", "pageIndex": index + 1, "lines": even_lines})

        spreads.append(
            {
                "spreadNumber": index + 1,
                "oddPageNumber": index * 2 + 1,
                "evenPageNumber": index * 2 + 2,
                "oddImage": f"/materials/step-{step:02d}/{odd_target.name}",
                "evenImage": f"/materials/step-{step:02d}/{even_target.name}",
                "oddText": "\n".join(odd_lines),
                "evenText": "\n".join(even_lines),
            }
        )

    first_lines = ocr_records[0]["lines"] if ocr_records else []
    raw_text = "\n".join(line for record in ocr_records for line in record["lines"])
    kind = detect_pattern_kind(step, raw_text)
    sentences = extract_target_sentences(ocr_records, step)

    return {
        "id": f"step-{step}",
        "stepNumber": step,
        "title": title_for_step(step, kind, first_lines),
        "topic": extract_topic(first_lines),
        "patternKind": kind,
        "patterns": build_patterns(kind),
        "sourceFiles": {
            "oddPages": parts[1].path.name,
            "evenPages": parts[2].path.name,
        },
        "spreads": spreads,
        "sentences": sentences,
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    discovered = discover_pdfs()
    steps: list[dict[str, Any]] = []
    warnings: list[str] = []

    for step in sorted(discovered):
        parts = discovered[step]
        if 1 not in parts or 2 not in parts:
            warnings.append(f"Step {step} is missing one PDF pair.")
            continue
        steps.append(build_step(step, parts))

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "handwritingPolicy": "필기체/손글씨 OCR은 학습 데이터 후보에서 제외하고 원본 페이지 이미지로만 보존합니다.",
        "expectedFilePattern": "스텝{n}_1.pdf + 스텝{n}_2.pdf",
        "steps": steps,
        "warnings": warnings,
    }

    target = DATA_DIR / "materials.json"
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {target.relative_to(ROOT)}")
    for step_data in steps:
        print(
            f"Step {step_data['stepNumber']}: "
            f"{len(step_data['spreads'])} spreads, {len(step_data['sentences'])} sentence candidates"
        )
    for warning in warnings:
        print(f"Warning: {warning}")


if __name__ == "__main__":
    main()
