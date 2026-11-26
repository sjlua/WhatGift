import html
import json
import logging
import re
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx

logger = logging.getLogger(__name__)

# Common Australian & international retailer names
RETAILER_DOMAINS = {
    "jbhifi.com.au": "JB Hi-Fi",
    "kmart.com.au": "Kmart",
    "target.com.au": "Target",
    "amazon.com.au": "Amazon Australia",
    "amazon.com": "Amazon",
    "amzn.asia": "Amazon",
    "amzn.to": "Amazon",
    "a.co": "Amazon",
    "bunnings.com.au": "Bunnings",
    "myer.com.au": "Myer",
    "davidjones.com": "David Jones",
    "apple.com": "Apple",
    "bigw.com.au": "BIG W",
    "cottonon.com": "Cotton On",
    "officeworks.com.au": "Officeworks",
    "harveynorman.com.au": "Harvey Norman",
    "thegoodguys.com.au": "The Good Guys",
    "rebelsport.com.au": "Rebel Sport",
    "ikea.com": "IKEA",
    "woolworths.com.au": "Woolworths",
    "coles.com.au": "Coles",
    "catch.com.au": "Catch",
    "ebay.com.au": "eBay Australia",
    "ebay.com": "eBay",
    "uniqlo.com": "UNIQLO",
    "shein.com": "SHEIN",
    "aliexpress.com": "AliExpress",
    "temu.com": "Temu",
    "asos.com": "ASOS",
    "hm.com": "H&M",
    "fashionnova.com": "Fashion Nova",
    "theiconic.com.au": "THE ICONIC",
    "chemistwarehouse.com.au": "Chemist Warehouse",
    "adorebeauty.com.au": "Adore Beauty",
    "zara.com": "Zara",
    "sephora.com.au": "Sephora",
    "mecca.com": "MECCA",
    "bonds.com.au": "Bonds",
    "supercheapauto.com.au": "Supercheap Auto",
    "bcf.com.au": "BCF",
    "danmurphys.com.au": "Dan Murphy's",
    "firstchoiceliquor.com.au": "First Choice Liquor",
    "spotlightstores.com": "Spotlight",
}

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-AU,en-US;q=0.9,en;q=0.8",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}


class MetaTagParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta_tags: List[Dict[str, str]] = []
        self.title_tag: Optional[str] = None
        self._in_title = False
        self.json_ld_scripts: List[str] = []
        self._in_json_ld = False
        self._current_json_ld = ""

    def handle_starttag(self, tag: str, attrs: list):
        tag = tag.lower()
        attrs_dict = {k.lower(): v for k, v in attrs if v is not None}
        if tag == "meta":
            self.meta_tags.append(attrs_dict)
        elif tag == "title":
            self._in_title = True
        elif tag == "script" and attrs_dict.get("type") == "application/ld+json":
            self._in_json_ld = True
            self._current_json_ld = ""

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_json_ld:
            self._in_json_ld = False
            if self._current_json_ld.strip():
                self.json_ld_scripts.append(self._current_json_ld.strip())

    def handle_data(self, data: str):
        if self._in_title:
            self.title_tag = (self.title_tag or "") + data
        elif self._in_json_ld:
            self._current_json_ld += data


def parse_price(val: Any) -> Optional[float]:
    """Parse numeric price from various formats ($49.99, AUD 129.00, 1,499.50, etc.)."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return round(float(val), 2) if val > 0 else None
    if isinstance(val, str):
        cleaned = val.strip()
        # Prefer the number immediately following a currency marker. This avoids
        # accidentally treating a product code or quantity as the price.
        match = re.search(
            r"(?:[$€£¥₹]\s*|(?:AUD|CAD|CNY|EUR|GBP|NZD|USD|RMB)\s*)"
            r"(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?)",
            cleaned,
            re.IGNORECASE,
        )
        if not match:
            match = re.search(r"(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)", cleaned)
        if match:
            num_str = match.group(1)
            # Handle both common thousands/decimal conventions.
            if "," in num_str and "." in num_str:
                num_str = num_str.replace(",", "")
            elif "," in num_str:
                chunks = num_str.split(",")
                num_str = "".join(chunks) if len(chunks[-1]) == 3 else ".".join(chunks)
            elif num_str.count(".") > 1:
                num_str = num_str.replace(".", "")
            try:
                p = float(num_str)
                return round(p, 2) if p > 0 else None
            except ValueError:
                return None
    return None


def extract_product_from_json_ld(data: Any) -> Optional[Dict[str, Any]]:
    """Recursively search Schema.org JSON-LD for a Product entity."""
    if isinstance(data, list):
        for item in data:
            found = extract_product_from_json_ld(item)
            if found:
                return found
    elif isinstance(data, dict):
        dtype = data.get("@type")
        if dtype == "Product" or (isinstance(dtype, list) and "Product" in dtype):
            return data
        if "@graph" in data:
            found = extract_product_from_json_ld(data["@graph"])
            if found:
                return found
        # Some storefronts wrap the product under a mainEntity or item field.
        for key in ("mainEntity", "mainEntityOfPage", "item", "subject"):
            if key in data:
                found = extract_product_from_json_ld(data[key])
                if found:
                    return found
    return None


def clean_title(title: Optional[str], site_name: Optional[str]) -> Optional[str]:
    """Strip repetitive site branding like '| JB Hi-Fi' from title."""
    if not title:
        return None
    t = html.unescape(title).strip()
    if site_name:
        patterns = [
            rf"\s*\|\s*{re.escape(site_name)}.*$",
            rf"\s*-\s*{re.escape(site_name)}.*$",
            rf"\s*•\s*{re.escape(site_name)}.*$",
            rf"\s*·\s*{re.escape(site_name)}.*$",
        ]
        for pat in patterns:
            t = re.sub(pat, "", t, flags=re.IGNORECASE).strip()
    # Remove generic trailing store delimiters if still present
    t = re.sub(r"\s*[\|\-•·]\s*(Official Site|Online Store|Australia).*$", "", t, flags=re.IGNORECASE).strip()

    # Strip Amazon leading "Amazon.com.au: " or "Amazon.com: "
    t = re.sub(r"^Amazon(?:\.com)?(?:\.au)?\s*:\s*", "", t, flags=re.IGNORECASE).strip()
    # Strip trailing Amazon department suffix like " : Electronics"
    t = re.sub(r"\s*:\s*(?:Electronics|Home|Kitchen|Video Games|Books|Sports|Beauty|Toys & Games|Health|Clothing|Automotive|Luggage|Office Products|Pet Supplies).*$", "", t, flags=re.IGNORECASE).strip()
    t = re.sub(r"\s*[:\|\-]\s*Amazon(?:\.com)?(?:\.au)?.*$", "", t, flags=re.IGNORECASE).strip()

    return t or title


def guess_site_name(url: str, og_site_name: Optional[str] = None) -> str:
    """Guess a clean site name from domain or og:site_name."""
    if og_site_name and og_site_name.strip():
        return html.unescape(og_site_name.strip())
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        for known_domain, brand in RETAILER_DOMAINS.items():
            if domain == known_domain or domain.endswith("." + known_domain):
                return brand
        # Fallback to domain host title
        parts = domain.split(".")
        return parts[0].capitalize() if parts else domain
    except Exception:
        return "Online Store"


def extract_price_from_html(html_content: str, domain: str = "") -> Optional[float]:
    """
    Extract product price directly from HTML content using site-specific selectors
    and common e-commerce DOM patterns (especially Amazon.com.au, eBay, etc.).
    """
    if not html_content:
        return None

    is_amazon = "amazon." in domain.lower()

    # 1. Amazon Specific Selectors
    if is_amazon:
        # A. Priority 1: Primary buybox price (.priceToPay .a-offscreen or .a-price .a-offscreen)
        patterns_amazon_offscreen = [
            r'class="[^"]*(?:priceToPay|apexPriceToPay|reinventPricePriceToPayMargin)[^"]*"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)</span>',
            r'<span class="a-price"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)</span>',
            r'<span id="priceblock_ourprice"[^>]*>([^<]+)</span>',
            r'<span id="priceblock_dealprice"[^>]*>([^<]+)</span>',
            r'<span id="priceblock_saleprice"[^>]*>([^<]+)</span>',
            r'<span id="price_inside_buybox"[^>]*>([^<]+)</span>',
            r'<span id="newBuyBoxPrice"[^>]*>([^<]+)</span>',
            r'class="[^"]*header-price[^"]*"[^>]*>([^<]+)</span>',
        ]
        for pat in patterns_amazon_offscreen:
            m = re.search(pat, html_content, re.IGNORECASE)
            if m:
                p = parse_price(m.group(1))
                if p:
                    return p

        # B. Priority 2: Amazon whole + fraction split (handles nested decimal span):
        # <span class="a-price-whole">49<span class="a-price-decimal">.</span></span><span class="a-price-fraction">95</span>
        whole_frac_pat = r'class="a-price-whole">\s*([0-9,]+)[\s\S]*?</span>\s*<span class="a-price-fraction">\s*([0-9]{2})\s*</span>'
        m_wf = re.search(whole_frac_pat, html_content, re.IGNORECASE)
        if m_wf:
            p = parse_price(f"{m_wf.group(1)}.{m_wf.group(2)}")
            if p:
                return p

        # C. Priority 3: Amazon Embedded JSON / JS config objects
        patterns_amazon_json = [
            r'"(?:priceAmount|buyingPrice|regularPrice|currentPrice)":\s*"?([0-9]+(?:\.[0-9]{1,2})?)"?',
            r'"(?:displayPrice|rawPrice)":\s*"(\$?[0-9,]+(?:\.[0-9]{1,2})?)"',
            r'data-a-price="([^"]+)"',
            r'data-asin-price="([^"]+)"',
            r'data-price="([^"]+)"',
        ]
        for pat in patterns_amazon_json:
            m = re.search(pat, html_content, re.IGNORECASE)
            if m:
                p = parse_price(m.group(1))
                if p:
                    return p

        # D. Any .a-offscreen containing a price pattern
        offscreen_matches = re.findall(r'<span class="a-offscreen">\s*(\$?\s*[0-9]+(?:\.[0-9]{2})?)\s*</span>', html_content, re.IGNORECASE)
        for val in offscreen_matches:
            p = parse_price(val)
            if p and p > 0:
                return p

    # 2. General Retailer HTML Price Fallbacks
    generic_patterns = [
        r'itemprop=["\']price["\'][^>]*content=["\']([^"\']+)["\']',
        r'content=["\']([^"\']+)["\'][^>]*itemprop=["\']price["\']',
        r'(?:class|id)=["\'][^"\']*(?:product-price|price-current|current-price|currentprice|pdp-price|offer-price|price-now|sale-price|price-sale|productprice|productPrice|salePrice|price-box)[^"\']*["\'][^>]*>[\s\S]{0,500}?([$€£¥₹]?\s*[0-9]{1,4}(?:[,.][0-9]{3})*(?:[,.][0-9]{1,2})?)',
        r'(?:data-product-price|data-sale-price|data-price|data-amount|data-final-price)=["\']([^"\']+)["\']',
        r'<meta[^>]+(?:property|name)=["\'](?:product:price:amount|og:price:amount|price)["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pat in generic_patterns:
        m = re.search(pat, html_content, re.IGNORECASE)
        if m:
            p = parse_price(m.group(1))
            if p:
                return p

    return None


def extract_image_from_html(html_content: str, domain: str = "") -> Optional[str]:
    """Fallback image extractor from HTML (Amazon landingImage, data-old-hires, etc.)."""
    if not html_content:
        return None
    is_amazon = is_amazon_url(f"https://{domain}/")
    if is_amazon:
        m = re.search(r'data-old-hires=["\'](https?://[^"\']+)["\']', html_content)
        if m:
            return m.group(1).strip()
        m2 = re.search(r'id=["\']landingImage["\'][^>]*data-a-dynamic-image=["\']\{["\'](https?://[^"\']+)["\']', html_content)
        if m2:
            return m2.group(1).strip()
        m_dynamic = re.search(
            r'data-a-dynamic-image=["\'](\{.*?\})["\']',
            html_content,
            re.IGNORECASE | re.DOTALL,
        )
        if m_dynamic:
            try:
                dynamic_images = json.loads(html.unescape(m_dynamic.group(1)))
                if isinstance(dynamic_images, dict) and dynamic_images:
                    return str(next(iter(dynamic_images))).strip()
            except Exception:
                pass
        m3 = re.search(r'src=["\'](https?://images-[^"\']+\.media-amazon\.com/images/I/[^"\']+)["\']', html_content)
        if m3:
            return m3.group(1).strip()
        m4 = re.search(
            r'(https://(?:images-[^"\'\s]+|m\.media-amazon\.com)/[^"\'\s<>]+)',
            html_content,
            re.IGNORECASE,
        )
        if m4:
            candidate = html.unescape(m4.group(1)).replace("\\/", "/")
            if "/images/I/" in candidate:
                return candidate.strip()
    return None


def is_hm_url(url: str) -> bool:
    """Recognise H&M storefronts, including the www2.hm.com product host."""
    try:
        domain = urlparse(url).netloc.lower()
    except Exception:
        domain = str(url).lower()
    return domain == "hm.com" or domain.endswith(".hm.com")


def extract_hm_article_code(url: str) -> Optional[str]:
    """Extract the numeric article code from H&M product URLs."""
    match = re.search(r"productpage[._-]?(\d+)\.html", url, re.IGNORECASE)
    if not match:
        match = re.search(r"(?:^|[/_-])(\d{8,12})(?:\.html)?(?:[/?#]|$)", url)
    return match.group(1) if match else None


def extract_hm_fallbacks(html_content: str, target_url: str) -> Dict[str, Any]:
    """Extract H&M metadata from Next.js, JSON-LD, and embedded product payloads."""
    result: Dict[str, Any] = {
        "title": None,
        "description": None,
        "image_url": None,
        "price": None,
        "currency": "AUD",
    }

    if not html_content:
        article_code = extract_hm_article_code(target_url)
        if article_code:
            result["title"] = f"H&M Product {article_code}"
        return result

    title_patterns = [
        r'"(?:productName|productTitle|name)"\s*:\s*"([^"]+)"',
        r'<h1[^>]*>([^<]+)</h1>',
        r'<meta[^>]+(?:property|name)="(?:og:)?title"[^>]+content="([^"]+)"',
    ]
    for pattern in title_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE | re.DOTALL)
        if match:
            candidate = html.unescape(match.group(1).strip())
            candidate = re.sub(r"\s*\|\s*H&M(?:\s*(?:AU|Australia))?.*$", "", candidate, flags=re.IGNORECASE)
            if candidate:
                result["title"] = candidate
                break

    description_patterns = [
        r'"(?:description|productDescription)"\s*:\s*"([^"]{20,500})"',
        r'<meta[^>]+(?:property|name)="(?:og:)?description"[^>]+content="([^"]+)"',
    ]
    for pattern in description_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE | re.DOTALL)
        if match:
            candidate = html.unescape(match.group(1).strip())
            if candidate:
                result["description"] = re.sub(r"\s+", " ", candidate)[:350]
                break

    price_patterns = [
        r'"(?:whitePrice|regularPrice|currentPrice|price|salePrice)"\s*:\s*"?(\$?\s*[0-9]+(?:[,.][0-9]{1,2})?)"',
        r'\b(?:AUD|A\$)\s*([0-9]+(?:[,.][0-9]{1,2})?)',
    ]
    for pattern in price_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            price = parse_price(match.group(1))
            if price:
                result["price"] = price
                break

    image_patterns = [
        r'https://(?:lp2|image)\.hm\.com/[^\s"<>]+',
        r'"(?:image|imageUrl|mainImage|url)"\s*:\s*"((?:https?:)?//[^"]+(?:hmgoepprod|lp2)[^"]*)"',
        r'<meta[^>]+(?:property|name)="(?:og:)?image(?::secure_url)?"[^>]+content="([^"]+)"',
    ]
    for pattern in image_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        if matches:
            candidate = html.unescape(matches[0].strip())
            if candidate.startswith("//"):
                candidate = "https:" + candidate
            candidate = candidate.replace("\\/", "/").replace("&amp;", "&")
            if candidate.startswith("http://"):
                candidate = "https://" + candidate[len("http://"):]
            if candidate.startswith("https://"):
                result["image_url"] = candidate
                break

    if not result["title"]:
        article_code = extract_hm_article_code(target_url)
        if article_code:
            result["title"] = f"H&M Product {article_code}"
    return result


def extract_hm_api_image_url(payload: Dict[str, Any], article_code: str) -> Optional[str]:
    """Get the product image from H&M's by-ID product API response."""
    if not isinstance(payload, dict) or not article_code:
        return None
    article_data = payload.get("articles")
    if not isinstance(article_data, dict):
        return None
    articles = article_data.get("productList", [])
    if not isinstance(articles, list):
        return None
    article = next(
        (
            entry
            for entry in articles
            if isinstance(entry, dict) and str(entry.get("id", "")) == article_code
        ),
        None,
    )
    if not article:
        return None

    images = article.get("images", [])
    if not isinstance(images, list):
        images = []
    descriptive_images = [
        image.get("url")
        for image in images
        if isinstance(image, dict)
        and image.get("assetType") in {"DescriptiveStillLife", "DescriptiveDetail"}
    ]
    image_candidates = [
        article.get("productImage"),
        *descriptive_images,
        article.get("modelImage"),
        *(image.get("url") for image in images if isinstance(image, dict)),
    ]

    for candidate in image_candidates:
        if not isinstance(candidate, str) or not candidate.strip():
            continue
        resolved = urljoin("https://image.hm.com/", candidate.strip())
        parsed = urlparse(resolved)
        if parsed.scheme == "https" and parsed.hostname in {"image.hm.com", "lp2.hm.com"}:
            return resolved
    return None


async def fetch_hm_product_image(article_code: str) -> Optional[str]:
    """Fetch H&M product images when Akamai blocks the product page scraper."""
    if not article_code or not article_code.isdigit():
        return None

    endpoint = "https://api.hm.com/search-services/v1/en_au/search/byids"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en-AU,en-US;q=0.9,en;q=0.8",
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Referer": "https://www2.hm.com/",
        "Origin": "https://www2.hm.com",
    }

    try:
        async with httpx.AsyncClient(
            headers=headers,
            follow_redirects=True,
            timeout=8.0,
        ) as client:
            response = await client.get(
                endpoint,
                params={
                    "ids": article_code,
                    "touchPoint": "DESKTOP",
                    "pageSource": "pdp",
                },
            )
            response.raise_for_status()
            return extract_hm_api_image_url(response.json(), article_code)
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as exc:
        logger.warning("H&M image API lookup failed for article %s: %s", article_code, exc)
        return None


def is_amazon_url(url: str) -> bool:
    """Recognise Amazon storefronts and common Amazon app/share short domains."""
    try:
        domain = urlparse(url).netloc.lower()
    except Exception:
        domain = str(url).lower()
    if domain.startswith("www.") or domain.startswith("smile."):
        domain = domain.split(".", 1)[1]
    return (
        domain == "amazon.com"
        or domain.endswith(".amazon.com")
        or domain == "amazon.com.au"
        or domain.endswith(".amazon.com.au")
        or domain in {"amzn.asia", "amzn.to", "a.co"}
        or domain.endswith(".amzn.asia")
    )


def extract_amazon_asin(url: str) -> Optional[str]:
    """Extract an ASIN from Amazon product URLs and app-share links."""
    matches = re.findall(
        r"(?:/dp/|/gp/product/|/ASIN/|%2Fdp%2F)([A-Z0-9]{10})(?:[/?&#]|$)",
        url,
        re.IGNORECASE,
    )
    if matches:
        return matches[0].upper()
    query_match = re.search(r"(?:^|[?&])(?:asin|ASIN)=([A-Z0-9]{10})(?:[&#]|$)", url)
    return query_match.group(1).upper() if query_match else None


def sanitize_url(raw_url: Optional[str]) -> Optional[str]:
    """
    Sanitizes and cleans URLs, preventing duplication (e.g. <url><url>)
    and fixing common malformed URL patterns like doubled protocols.
    """
    if not raw_url:
        return None
    url = str(raw_url).strip()
    if not url:
        return None

    # Fix doubled scheme e.g. https://https:// or http://https://
    url = re.sub(r'^(?:https?://)+(https?://)', r'\1', url, flags=re.IGNORECASE)

    # Handle whitespace-separated duplicates e.g. "https://a.com https://a.com"
    tokens = url.split()
    if len(tokens) >= 2 and tokens[0] == tokens[1]:
        url = tokens[0]

    # Exact duplication where string is repeated twice: A + A
    if len(url) % 2 == 0:
        half = len(url) // 2
        if url[:half] == url[half:]:
            url = url[:half]

    # Concatenated duplicate URLs: https://...https://... or http://...http://...
    match = re.search(r'.(https?://)', url, flags=re.IGNORECASE)
    if match:
        split_idx = match.start() + 1
        part1 = url[:split_idx].strip()
        part2 = url[split_idx:].strip()
        if part1 == part2 or part1.rstrip('/') == part2.rstrip('/'):
            url = part1

    return url


async def scrape_opengraph_metadata(target_url: str) -> Dict[str, Any]:
    """
    Scrapes Open Graph, Twitter Cards, Schema.org JSON-LD and standard HTML metadata
    from a given product URL.
    """
    sanitized = sanitize_url(target_url)
    clean_url = (sanitized or target_url).strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url

    parsed_url = urlparse(clean_url)
    default_site_name = guess_site_name(clean_url)
    domain_lower = parsed_url.netloc.lower()
    is_amazon = is_amazon_url(clean_url)
    is_hm = is_hm_url(clean_url)

    req_headers = dict(DEFAULT_HEADERS)
    if is_amazon:
        req_headers["Accept-Language"] = "en-AU,en-US;q=0.9,en;q=0.8"
        req_headers["Cookie"] = "i18n-prefs=AUD; lc-acbau=en_AU"
    if is_hm:
        req_headers["Accept-Language"] = "en-AU,en-US;q=0.9,en;q=0.8"
        req_headers["Referer"] = "https://www.google.com/"
        req_headers["Cookie"] = "market=au; language=en-AU"

    html_content = ""
    effective_url = clean_url

    try:
        async with httpx.AsyncClient(
            headers=req_headers,
            follow_redirects=True,
            timeout=8.0,
            verify=False,
        ) as client:
            resp = await client.get(clean_url)
            effective_url = str(resp.url)
            if resp.status_code < 400:
                html_content = resp.text
            else:
                logger.warning("Scrape received status %d for %s", resp.status_code, clean_url)
    except Exception as exc:
        logger.warning("Scrape error fetching %s: %s", clean_url, exc)

    effective_domain_lower = urlparse(effective_url).netloc.lower()
    is_amazon = is_amazon_url(effective_url) or is_amazon
    is_hm = is_hm_url(effective_url) or is_hm

    # H&M sometimes returns a locale/interstitial page or blocks the www2 host.
    # Retry the direct page with the Australian locale and mobile-style headers.
    if is_hm:
        article_code = extract_hm_article_code(effective_url) or extract_hm_article_code(clean_url)
        if article_code:
            canonical_hm_url = f"https://www2.hm.com/en_au/productpage.{article_code}.html"
            if effective_url.rstrip("/") != canonical_hm_url:
                try:
                    hm_headers = dict(req_headers)
                    hm_headers["Sec-Ch-Ua-Mobile"] = "?1"
                    hm_headers["User-Agent"] = (
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                        "Version/17.0 Mobile/15E148 Safari/604.1"
                    )
                    async with httpx.AsyncClient(
                        headers=hm_headers,
                        follow_redirects=True,
                        timeout=8.0,
                        verify=False,
                    ) as client:
                        hm_resp = await client.get(canonical_hm_url)
                        if hm_resp.status_code < 400 and hm_resp.text:
                            if not html_content or len(hm_resp.text) > len(html_content):
                                html_content = hm_resp.text
                                effective_url = str(hm_resp.url)
                                effective_domain_lower = urlparse(effective_url).netloc.lower()
                except Exception as exc:
                    logger.warning("H&M locale retry error for %s: %s", canonical_hm_url, exc)

    # Amazon app links and amzn.asia redirects often resolve to a locale,
    # but the resolved page may be an interstitial or remain missing metadata.
    # Retry the resolved ASIN on the Australian storefront for a stable product page.
    if is_amazon:
        asin = extract_amazon_asin(effective_url) or extract_amazon_asin(clean_url)
        if asin:
            canonical_url = f"https://www.amazon.com.au/dp/{asin}"
            if effective_url.rstrip("/") != canonical_url:
                try:
                    async with httpx.AsyncClient(
                        headers=req_headers,
                        follow_redirects=True,
                        timeout=8.0,
                        verify=False,
                    ) as client:
                        canonical_resp = await client.get(canonical_url)
                        if canonical_resp.status_code < 400:
                            canonical_html = canonical_resp.text
                            if canonical_html:
                                if not html_content or len(canonical_html) > len(html_content):
                                    html_content = canonical_html
                                    effective_url = str(canonical_resp.url)
                                    effective_domain_lower = urlparse(effective_url).netloc.lower()
                except Exception as exc:
                    logger.warning("Amazon ASIN retry error for %s: %s", canonical_url, exc)

    meta_map: Dict[str, str] = {}
    title_tag: Optional[str] = None
    json_ld_list: List[str] = []

    if html_content:
        parser = MetaTagParser()
        try:
            parser.feed(html_content)
            title_tag = parser.title_tag
            json_ld_list = parser.json_ld_scripts
            for m in parser.meta_tags:
                key = m.get("property") or m.get("name") or m.get("itemprop")
                content = m.get("content")
                if key and content:
                    meta_map[key.lower().strip()] = content.strip()
        except Exception as e:
            logger.warning("HTML parsing error on %s: %s", clean_url, e)

    # 1. Extract from Schema.org JSON-LD first (highest fidelity for e-commerce)
    ld_title: Optional[str] = None
    ld_desc: Optional[str] = None
    ld_image: Optional[str] = None
    ld_price: Optional[float] = None
    ld_currency: Optional[str] = None

    for script_raw in json_ld_list:
        try:
            parsed_json = json.loads(script_raw)
            product = extract_product_from_json_ld(parsed_json)
            if product:
                if not ld_title and product.get("name"):
                    ld_title = str(product["name"]).strip()
                if not ld_desc and product.get("description"):
                    ld_desc = str(product["description"]).strip()
                if not ld_image:
                    img = product.get("image")
                    if isinstance(img, str):
                        ld_image = img.strip()
                    elif isinstance(img, list) and img:
                        ld_image = str(img[0]).strip()
                    elif isinstance(img, dict) and img.get("url"):
                        ld_image = str(img["url"]).strip()
                if ld_price is None and product.get("offers"):
                    offers = product["offers"]
                    if isinstance(offers, list) and offers:
                        offers = offers[0]
                    if isinstance(offers, dict):
                        ld_price = parse_price(offers.get("price") or offers.get("lowPrice"))
                        ld_currency = offers.get("priceCurrency")
                break
        except Exception:
            continue

    # 2. Extract Open Graph & Twitter meta tags
    og_title = (
        meta_map.get("og:title")
        or meta_map.get("twitter:title")
        or ld_title
        or title_tag
    )
    og_desc = (
        meta_map.get("og:description")
        or meta_map.get("twitter:description")
        or ld_desc
        or meta_map.get("description")
    )
    og_image = (
        meta_map.get("og:image")
        or meta_map.get("og:image:secure_url")
        or meta_map.get("og:image:url")
        or meta_map.get("twitter:image")
        or meta_map.get("twitter:image:src")
        or ld_image
    )
    og_site = (
        meta_map.get("og:site_name")
        or meta_map.get("twitter:site")
        or default_site_name
    )

    # 3. Extract Price
    final_price = ld_price
    if final_price is None:
        raw_price = (
            meta_map.get("product:price:amount")
            or meta_map.get("og:price:amount")
            or meta_map.get("product:sale_price:amount")
            or meta_map.get("price")
        )
        final_price = parse_price(raw_price)

    # 3b. HTML Body price extraction (crucial for Amazon.com.au and retailers without OG price meta)
    if final_price is None and html_content:
        final_price = extract_price_from_html(html_content, effective_domain_lower or domain_lower)

    # 4. Clean & Format Attributes
    site_name = guess_site_name(effective_url, og_site)
    final_title = clean_title(og_title, site_name)

    # Resolve relative image URL or fallback to HTML body image
    final_image_url: Optional[str] = None
    if og_image:
        resolved = urljoin(effective_url, html.unescape(og_image.strip()))
        if resolved.startswith("http://") or resolved.startswith("https://"):
            final_image_url = resolved
    if not final_image_url and html_content:
        final_image_url = extract_image_from_html(html_content, effective_domain_lower or domain_lower)

    # Clean description (trim to 350 chars)
    final_description: Optional[str] = None
    if og_desc:
        clean_d = html.unescape(og_desc).strip()
        clean_d = re.sub(r"\s+", " ", clean_d)
        if len(clean_d) > 350:
            clean_d = clean_d[:347] + "..."
        final_description = clean_d

    # If title is still missing, fallback to URL slug
    if not final_title and not is_hm:
        path = parsed_url.path.strip("/")
        if path:
            slug = path.split("/")[-1]
            slug = re.sub(r"[\-_]+", " ", slug)
            slug = re.sub(r"\.[a-zA-Z0-9]+$", "", slug)
            if len(slug) > 3 and not slug.isdigit():
                final_title = slug.title()

    if is_hm:
        hm_fallbacks = extract_hm_fallbacks(html_content, effective_url)
        if not final_title:
            final_title = hm_fallbacks["title"]
        elif hm_fallbacks["title"] and final_title.lower().startswith("h&m product"):
            final_title = hm_fallbacks["title"]
        if not final_description:
            final_description = hm_fallbacks["description"]
        if final_price is None:
            final_price = hm_fallbacks["price"]
        if not final_image_url:
            final_image_url = hm_fallbacks["image_url"]
        if not final_image_url:
            article_code = extract_hm_article_code(effective_url) or extract_hm_article_code(clean_url)
            if article_code:
                final_image_url = await fetch_hm_product_image(article_code)

    return {
        "url": clean_url,
        "title": final_title,
        "description": final_description,
        "image_url": final_image_url,
        "price": final_price,
        "site_name": site_name,
        "currency": ld_currency or "AUD",
    }
