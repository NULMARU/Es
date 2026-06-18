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
SINGLE_PDF_RE = re.compile(r"스텝\s*(\d+)\.pdf$", re.IGNORECASE)
HANGUL_RE = re.compile(r"[가-힣ᄀ-ᇿ]")
NUMBERED_RE = re.compile(r"^\s*(\d{1,3})\s*[\.\),,，]\s*(.+)$")
HINT_RE = re.compile(r"\(([^()]*)\)\s*$")

CANONICAL_SENTENCES: dict[int, dict[int, str]] = {
    4: {
        1: "I'll get the report done tonight so I can relax tomorrow.",
        2: "I'm hanging out at my friend's place to catch up.",
        3: "You'll be surprised when you hear the news.",
        4: "I'm going to sign up for the gym to start working out.",
        5: "I'll grab the check since you covered it last time.",
        6: "I'm going to get a new car since my car keeps breaking down.",
        7: "He's going to show up late because the traffic is bad.",
        8: "We're having a team dinner for the new employees.",
        9: "I'll hear you out no matter how long it is.",
        10: "I'm traveling abroad during my long vacation.",
        11: "The delivery's here. I'll get the door.",
        12: "I'm going to clean up the house. I haven't done it in a while.",
        13: "It's going to warm up soon so we can finally go hiking.",
        14: "I'm going to go back to the academy I used to go to.",
        15: "You must be having a hard time. I'll help you out.",
        16: "I'm seeing my parents for my mom's birthday.",
        17: "The presentation is going to go well since we prepared well.",
        18: "I'm going to look for a new job that pays better.",
        19: "You must be tired. I'll grab some coffee for you.",
        20: "You're going to hear good news soon. I have a good feeling.",
        21: "I'm going to hit the gym right after work.",
        22: "I'm going to study English to build my resume.",
        23: "I'm going to stay up late to finish this show.",
        24: "I'm going to get my hair done because it looks too messy now.",
        25: "I'll go with a salad because I'm trying to eat healthier.",
        26: "I'm going to lounge around at home over this vacation.",
        27: "People will be here soon, so we need to hurry up.",
        28: "I'm going to sort my papers so I can find them easily later.",
        29: "I'll get back to you later.",
        30: "I'm going to start saving money because there's something I want to buy.",
        31: "I'll keep it a secret. I won't tell anyone.",
        32: "I'm going to head to Jeju to see the ocean.",
        33: "You'll feel better soon if you get some rest.",
        34: "I'm going to move because my place is too far from work.",
        35: "I'm going to cook dinner tonight. You just relax.",
        36: "I'm moving to a bigger house next year.",
        37: "She's going to give you a call soon because her meeting just ended.",
        38: "I'm going to a get-together this weekend.",
        39: "I'll note it down before I forget.",
        40: "I'm going to read more books to get new ideas.",
        41: "I'm going to crash early because I'm completely drained.",
        42: "I'm going to join a new team to take on a new role.",
        43: "That movie is going to be really fun. I saw great reviews.",
        44: "I'm going to attend a dinner gathering right after work.",
        45: "I'll take care of it. I can handle it.",
        46: "I was late today, so I'm going to go to work early tomorrow.",
        47: "I'm going to work late tonight because the deadline is approaching.",
        48: "I'm going to work there on a two-year contract.",
        49: "I'll check the details and let you know in a bit.",
        50: "I'm going to open my own shop someday after I save enough money.",
    }
}


@dataclass
class SourcePdf:
    step: int
    part: int
    path: Path
    page_indexes: list[int] | None = None


def clean_line(text: str) -> str:
    value = unicodedata.normalize("NFKC", text)
    value = value.replace("ㆍ", " ").replace("•", " ").replace("·", " ")
    value = value.replace("’", "'").replace("“", '"').replace("”", '"')
    value = re.sub(r"\s+", " ", value).strip()
    return value


def clean_english(text: str) -> str:
    value = clean_line(text)
    value = re.sub(r"^\s*[ᆞㆍ•·\-–—*+«»]+\s*", "", value)
    value = re.sub(r"^\s*111\b", "I'll", value)
    value = re.sub(r"^\s*110\b(?=\s+going\b)", "I'm", value, flags=re.I)
    value = re.sub(r"\b111\b(?=\s+(get|grab|go|hear|help|note|take|check)\b)", "I'll", value, flags=re.I)
    value = re.sub(r"\b110\b(?=\s+going\b)", "I'm", value, flags=re.I)
    value = re.sub(r"^\s*\|\s+", "I ", value)
    value = re.sub(r"(?<=\s)\|(?=\s|[A-Za-z])", "I", value)
    value = re.sub(r"\s*/\s*", " ", value)
    value = value.replace("I'mm", "I'm").replace("|'m", "I'm")
    value = value.replace("|'ve", "I've").replace("|'ll", "I'll")
    value = value.replace(" Iogking ", " looking ")
    value = value.replace("iogking", "looking")
    value = value.replace("I.travel", "I travel")
    value = value.replace("hurryup", "hurry up")
    value = value.replace("because.the. deadline. is approaching", "because the deadline is approaching")
    value = re.sub(r"\b15\b(?=\s+(messy|stuffy|ready|bad|good|hard|easy)\b)", "is", value, flags=re.I)
    value = re.sub(r"\s+\|\s*$", "", value)
    value = re.sub(r"\s+[\"'“”‘’]*[-–—]+\s*$", "", value)
    value = re.sub(r"\s+(ee|인|다|>)\s*[-~.]*\s*$", "", value, flags=re.I)
    value = re.sub(r"\s*;\s*[-–—]*\s*$", "", value)
    value = re.sub(r",$", ".", value)
    value = re.sub(r"\s+([?.!,])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip()
    if (
        not re.search(r"[.?!]$", value)
        and len(re.findall(r"[A-Za-z']+", value)) >= 4
        and re.match(
            r"^(I|I'm|I've|I'll|She|She's|He|He's|We|We're|They|They're|You|You're|"
            r"It|It's|There|My|The|What|Who|When|Where|Why|How|Did|Do|Does)\b",
            value,
            re.IGNORECASE,
        )
    ):
        value += "."
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
    prepared = preprocess_for_ocr(image)
    try:
        text = pytesseract.image_to_string(prepared, lang="eng+kor", config="--psm 6")
    except Exception:
        text = pytesseract.image_to_string(prepared, lang="eng", config="--psm 6")
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
    singles: dict[int, Path] = {}
    for path in ROOT.glob("*.pdf"):
        normalized = unicodedata.normalize("NFC", path.name)
        match = PDF_RE.match(normalized)
        if match:
            step = int(match.group(1))
            part = int(match.group(2))
            found.setdefault(step, {})[part] = SourcePdf(step=step, part=part, path=path)
            continue

        single_match = SINGLE_PDF_RE.match(normalized)
        if single_match:
            singles[int(single_match.group(1))] = path

    for step, path in singles.items():
        parts = found.setdefault(step, {})
        if 1 in parts and 2 in parts:
            continue
        reader = PdfReader(str(path))
        odd_pages = list(range(0, len(reader.pages), 2))
        even_pages = list(range(1, len(reader.pages), 2))
        if odd_pages and even_pages:
            found[step] = {
                1: SourcePdf(step=step, part=1, path=path, page_indexes=odd_pages),
                2: SourcePdf(step=step, part=2, path=path, page_indexes=even_pages),
            }
    return found


def extract_topic(lines: list[str]) -> str:
    for line in lines:
        match = re.search(r"주제\s*[:：]\s*(.+)", line)
        if match:
            return clean_line(match.group(1))
    return "초급 회화 기본기"


def detect_pattern_kind(step: int, text: str) -> str:
    compact = re.sub(r"\s+", "", text)
    if "미래" in compact or "begoingto" in compact.lower() or step == 4:
        return "future"
    if "진행" in compact:
        return "progressive"
    if "과거시제" in compact or "과거형" in compact or step == 3:
        return "past-simple"
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
    if kind == "past-simple":
        return [
            {
                "name": "과거 시제",
                "formula": "주어 + 동사 과거형",
                "focus": "이미 끝난 일과 경험",
                "signals": ["yesterday", "last night", "ago", "when I was young"],
            },
            {
                "name": "과거 부정문",
                "formula": "주어 + didn't + 동사원형",
                "focus": "하지 않았던 일",
                "signals": ["didn't answer", "didn't stick to", "couldn't"],
            },
            {
                "name": "be동사 과거",
                "formula": "was/were + 상태",
                "focus": "그때의 감정과 상태",
                "signals": ["was tired", "were ready", "was shocked", "was happy"],
            },
        ]
    if kind == "future":
        return [
            {
                "name": "will",
                "formula": "will + 동사원형",
                "focus": "순간의 결심, 약속, 추측",
                "signals": ["probably", "later", "tonight", "soon"],
            },
            {
                "name": "be going to",
                "formula": "am/is/are going to + 동사원형",
                "focus": "계획, 예정, 의도",
                "signals": ["going to", "next week", "because", "plan"],
            },
            {
                "name": "be -ing 미래",
                "formula": "am/is/are + 동사-ing",
                "focus": "이미 정해진 일정과 약속",
                "signals": ["tomorrow", "at 10", "meeting", "traveling"],
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
    if kind == "past-simple":
        return "Step 3 - 과거 시제"
    if kind == "future":
        return f"Step {step} - 미래 표현"
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
            line = re.sub(r"^\s*[Aa](\d)\s*([.)])", r"4\1\2", line)
            numbered = NUMBERED_RE.match(line)
            if numbered:
                number = int(numbered.group(1))
                body = clean_line(numbered.group(2))
                candidate = clean_english(body)
                if looks_like_target_english(candidate):
                    upsert(number, body, page_label)
                    pending = None
                else:
                    prompt, hints = parse_prompt(line)
                    pending = {
                        "number": number,
                        "promptKo": prompt,
                        "hints": hints,
                        "sourcePage": page_label,
                    }
                continue

            if pending:
                candidate = clean_english(line)
                if looks_like_target_english(candidate):
                    upsert(pending["number"], candidate, page_label, pending)
                    pending = None

    targets = [by_number[number] for number in sorted(by_number)]
    for item in targets:
        item.pop("_quality", None)
        canonical = CANONICAL_SENTENCES.get(step, {}).get(item.get("exerciseNumber"))
        if canonical:
            item["text"] = canonical
    if len(targets) >= 45:
        return targets

    # Keep the app usable if a future PDF has a different layout.
    return extract_sentences(ocr_records, step)


def part_pages(source: SourcePdf) -> tuple[PdfReader, list[int]]:
    reader = PdfReader(str(source.path))
    page_indexes = source.page_indexes if source.page_indexes is not None else list(range(len(reader.pages)))
    return reader, page_indexes


def source_file_label(source: SourcePdf, fallback: str) -> str:
    if source.page_indexes is None:
        return source.path.name
    return f"{source.path.name} ({fallback})"


def build_step(step: int, parts: dict[int, SourcePdf]) -> dict[str, Any]:
    odd_reader, odd_page_indexes = part_pages(parts[1])
    even_reader, even_page_indexes = part_pages(parts[2])
    spread_count = min(len(odd_page_indexes), len(even_page_indexes))
    spreads: list[dict[str, Any]] = []
    ocr_records: list[dict[str, Any]] = []

    for index in range(spread_count):
        step_dir = MATERIALS_DIR / f"step-{step:02d}"
        odd_target = step_dir / f"spread-{index + 1:02d}-odd.jpg"
        even_target = step_dir / f"spread-{index + 1:02d}-even.jpg"

        odd_image = get_page_image(odd_reader.pages[odd_page_indexes[index]])
        even_image = get_page_image(even_reader.pages[even_page_indexes[index]])
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
            "oddPages": source_file_label(parts[1], "홀수 페이지"),
            "evenPages": source_file_label(parts[2], "짝수 페이지"),
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
        "expectedFilePattern": "스텝{n}.pdf 또는 스텝{n}_1.pdf + 스텝{n}_2.pdf",
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
