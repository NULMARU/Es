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
    },
    5: {
        1: "I'll get the report done tonight.",
        2: "I clean my room when I'm stressed.",
        3: "I gave up on my diet last week.",
        4: "I'm reading a book at a café right now.",
        5: "You'll be surprised by the news tomorrow.",
        6: "I always put my plans in the calendar.",
        7: "I chatted with my friend all night yesterday.",
        8: "I'll be working late tonight.",
        9: "I visit my parents every weekend.",
        10: "I went through my old emails last week.",
        11: "I'll grab the check tonight.",
        12: "I fix my hair every time I look in the mirror.",
        13: "I just believed you back then.",
        14: "I'm redecorating my house this week.",
        15: "You'll hear good news soon.",
        16: "I usually run on the treadmill in the evening.",
        17: "I fell asleep while watching TV last night.",
        18: "I'm waiting for the bus right now.",
        19: "I'm going to get a new car next year.",
        20: "I enjoy reading books at a café.",
        21: "I took the wrong bus last week and ended up somewhere else.",
        22: "I'm watching a movie with my friend tonight.",
        23: "I'm going to spend my vacation with my family.",
        24: "I can't live without coffee in the morning.",
        25: "I kept avoiding an important call yesterday.",
        26: "I'm getting ready for the meeting now.",
        27: "I sometimes meet my friend at the bus stop.",
        28: "I lost an important document last week.",
        29: "I'm going to take a cooking class next month.",
        30: "I'm relaxing while listening to music.",
        31: "I just take a nap when I'm tired.",
        32: "I didn't answer any calls yesterday because I wasn't in the mood.",
        33: "I'll be staying up late tonight.",
        34: "I change into comfy clothes when I get home.",
        35: "I did a deep clean of my room last month.",
        36: "I'm doing my homework right now.",
        37: "I'm going to hang out at my friend's place this weekend.",
        38: "I often go to the beach with my friends.",
        39: "I completely changed my plans last week.",
        40: "I'm going to sign up for the gym next month.",
        41: "I rarely check KakaoTalk while I'm working.",
        42: "I left my phone at home last night.",
        43: "I'm getting ready for breakfast now.",
        44: "I usually take a walk at lunchtime.",
        45: "I'm going to start studying for an English test next year.",
        46: "I visit my parents every weekend.",
        47: "I went to a concert alone for the first time last month.",
        48: "I'm listening to music on the bus right now.",
        49: "I stretch in the park every morning.",
        50: "I hid my feelings back then.",
    },
    6: {
        1: "I want to check out the café you talked about.",
        2: "I'm learning how to answer without getting nervous.",
        3: "I agreed to follow the plan he suggested.",
        4: "I want to find an environment I can focus in.",
        5: "I like going to places where photos come out nice.",
        6: "I need to return that item that doesn't fit me.",
        7: "I'm thinking about quitting the job that drains me.",
        8: "I really like reading stories that change my perspective.",
        9: "I'm trying to find out what she wants.",
        10: "I want to meet the person who made this product.",
        11: "I want to resolve the issue that keeps bothering me.",
        12: "I decided to get back to the things I've been putting off.",
        13: "I organized the documents that had piled up.",
        14: "I hope to get a reply to the question I asked.",
        15: "I'm planning to move to a place with better lighting.",
        16: "I'm trying not to buy things I don't really need.",
        17: "I want to try that dessert that's trending on social media.",
        18: "He offered to buy my ticket as well.",
        19: "I like listening to music that matches my mood.",
        20: "I'm practicing making choices that match my goal.",
        21: "I want to visit a place where I can just relax.",
        22: "I need to fix the mistake I made earlier.",
        23: "I'm trying to solve the problem that keeps coming up.",
        24: "I miss spending time with the people who really understand me.",
        25: "I hope to hear from the company I applied to.",
        26: "I like watching videos that explain things clearly.",
        27: "I decided to let go of the things that were dragging me down.",
        28: "I want to buy the planner everyone is using these days.",
        29: "It's time to wrap up the project I started last month.",
        30: "I finally finished the book everyone recommended.",
        31: "I want to take the class that my friend told me about.",
        32: "I tend to avoid areas where parking is really difficult.",
        33: "My friend recommended a movie he really enjoyed.",
        34: "I learned how to stress less, and here's the thing.",
        35: "I'd like to hear the rest of the story you didn't finish yesterday.",
        36: "I decided to try the thing I've wanted to do for a long time.",
        37: "I want to go back to the place where we first met.",
        38: "I need to delete some files that are taking up a lot of space.",
        39: "I want to meet someone who has the same goals as I do.",
        40: "I'm thinking of going to see a friend who lives abroad.",
        41: "We decided to meet again at the café where we studied last time.",
        42: "I like being with people who make me feel relaxed.",
        43: "I want to learn how to cook the dish I always order.",
        44: "I'm practicing how to do my makeup nicely.",
        45: "I'm trying to make a study routine that works for me.",
        46: "I don't want to do things that don't really matter in the end.",
        47: "I like spending time in cafés where I can stay for a long time.",
        48: "I finally finished doing the work I'd been putting off.",
        49: "I finally managed to find the information I'd been looking for.",
        50: "He denied saying the comment that made everyone uncomfortable.",
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


def blank_page_like(reference: Image.Image | None) -> Image.Image:
    size = reference.size if reference is not None else (1420, 2007)
    return Image.new("RGB", size, (248, 250, 251))


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
    if "부정사" in compact or "동명사" in compact or step == 6:
        return "infinitive-gerund"
    if "시제섞" in compact or step == 5:
        return "mixed"
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
    if kind == "infinitive-gerund":
        return [
            {
                "name": "to 부정사 목적어",
                "formula": "want/hope/plan/decide/need + to + 동사원형",
                "focus": "하고 싶은 일, 계획, 결정, 필요를 말할 때",
                "signals": ["want to", "hope to", "plan to", "decide to", "need to"],
            },
            {
                "name": "동명사 목적어",
                "formula": "like/enjoy/avoid/finish/miss/practice + 동사-ing",
                "focus": "좋아하는 활동, 피하는 일, 끝낸 일을 말할 때",
                "signals": ["like going", "avoid areas", "finished doing", "miss spending"],
            },
            {
                "name": "관계절 확장",
                "formula": "명사 + who/that/where + 설명",
                "focus": "사람, 장소, 물건을 뒤에서 구체적으로 설명하기",
                "signals": ["who", "that", "where", "what"],
            },
        ]
    if kind == "mixed":
        return [
            {
                "name": "현재 시제",
                "formula": "주어 + 현재동사",
                "focus": "습관, 사실, 지금의 상태",
                "signals": ["always", "usually", "every weekend", "when"],
            },
            {
                "name": "과거 시제",
                "formula": "주어 + 과거동사",
                "focus": "이미 끝난 일과 지난 경험",
                "signals": ["yesterday", "last week", "back then", "last night"],
            },
            {
                "name": "미래/진행",
                "formula": "will / be going to / be + -ing",
                "focus": "예정, 계획, 지금 하는 일",
                "signals": ["tonight", "tomorrow", "next month", "right now"],
            },
        ]
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
    if kind == "infinitive-gerund":
        return f"Step {step} - to 부정사와 동명사"
    if kind == "mixed":
        return f"Step {step} - 시제 섞기"
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


def topic_for_step(step: int, kind: str, first_lines: list[str]) -> str:
    topic = extract_topic(first_lines)
    if kind == "infinitive-gerund" and step == 6:
        return "내가 하고 싶은 일 / 좋아하는 일"
    return topic


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
    spread_count = max(len(odd_page_indexes), len(even_page_indexes))
    spreads: list[dict[str, Any]] = []
    ocr_records: list[dict[str, Any]] = []
    step_dir = MATERIALS_DIR / f"step-{step:02d}"
    if step_dir.exists():
        for stale_image in step_dir.glob("spread-*.jpg"):
            stale_image.unlink()

    for index in range(spread_count):
        odd_target = step_dir / f"spread-{index + 1:02d}-odd.jpg"
        even_target = step_dir / f"spread-{index + 1:02d}-even.jpg"

        odd_image = (
            get_page_image(odd_reader.pages[odd_page_indexes[index]])
            if index < len(odd_page_indexes)
            else None
        )
        even_image = (
            get_page_image(even_reader.pages[even_page_indexes[index]])
            if index < len(even_page_indexes)
            else None
        )
        odd_lines: list[str] = []
        even_lines: list[str] = []

        if odd_image is not None:
            save_page_image(odd_image, odd_target)
            odd_lines = ocr_image(odd_image)
            ocr_records.append({"partLabel": "odd", "pageIndex": index + 1, "lines": odd_lines})
        else:
            save_page_image(blank_page_like(even_image), odd_target)
        if even_image is not None:
            save_page_image(even_image, even_target)
            even_lines = ocr_image(even_image)
            ocr_records.append({"partLabel": "even", "pageIndex": index + 1, "lines": even_lines})
        else:
            save_page_image(blank_page_like(odd_image), even_target)

        spreads.append(
            {
                "spreadNumber": index + 1,
                "oddPageNumber": index * 2 + 1 if index < len(odd_page_indexes) else None,
                "evenPageNumber": index * 2 + 2 if index < len(even_page_indexes) else None,
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
        "topic": topic_for_step(step, kind, first_lines),
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
