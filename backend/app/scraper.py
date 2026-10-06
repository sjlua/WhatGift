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
    "zara.com": "Zara",
    "sephora.com.au": "Sephora",
    "mecca.com": "MECCA",
    "bonds.com.au": "Bonds",
    "supercheapauto.com.au": "Supercheap Auto",
    "bcf.com.au": "BCF",
    "danmurphys.com.au": "Dan Murphy's",
    "firstchoiceliquor.com.au": "First Choice Liquor",
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
        # Find first valid currency/number pattern
        match = re.search(r"(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)", cleaned)
        if match:
            num_str = match.group(1).replace(",", "")
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
            return extract_product_from_json_ld(data["@graph"])
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
        r'class="[^"]*(?:product-price|price-current|current-price|pdp-price|offer-price|price-now)[^"]*"[^>]*>[\s\S]*?(\$?\s*[0-9]{1,4}(?:,[0-9]{3})*(?:\.[0-9]{2})?)',
        r'data-product-price=["\']([^"\']+)["\']',
        r'data-price=["\']([^"\']+)["\']',
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
    is_amazon = "amazon." in domain.lower()
    if is_amazon:
        m = re.search(r'data-old-hires=["\'](https?://[^"\']+)["\']', html_content)
        if m:
            return m.group(1).strip()
        m2 = re.search(r'id=["\']landingImage["\'][^>]*data-a-dynamic-image=["\']\{["\'](https?://[^"\']+)["\']', html_content)
        if m2:
            return m2.group(1).strip()
        m3 = re.search(r'src=["\'](https?://images-[^"\']+\.media-amazon\.com/images/I/[^"\']+)["\']', html_content)
        if m3:
            return m3.group(1).strip()
    return None


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
    is_amazon = "amazon." in domain_lower

    req_headers = dict(DEFAULT_HEADERS)
    if is_amazon:
        req_headers["Accept-Language"] = "en-AU,en-US;q=0.9,en;q=0.8"
        req_headers["Cookie"] = "i18n-prefs=AUD; lc-acbau=en_AU"

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
        final_price = extract_price_from_html(html_content, domain_lower)

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
        final_image_url = extract_image_from_html(html_content, domain_lower)

    # Clean description (trim to 350 chars)
    final_description: Optional[str] = None
    if og_desc:
        clean_d = html.unescape(og_desc).strip()
        clean_d = re.sub(r"\s+", " ", clean_d)
        if len(clean_d) > 350:
            clean_d = clean_d[:347] + "..."
        final_description = clean_d

    # If title is still missing, fallback to URL slug
    if not final_title:
        path = parsed_url.path.strip("/")
        if path:
            slug = path.split("/")[-1]
            slug = re.sub(r"[\-_]+", " ", slug)
            slug = re.sub(r"\.[a-zA-Z0-9]+$", "", slug)
            if len(slug) > 3 and not slug.isdigit():
                final_title = slug.title()

    return {
        "url": clean_url,
        "title": final_title,
        "description": final_description,
        "image_url": final_image_url,
        "price": final_price,
        "site_name": site_name,
        "currency": ld_currency or "AUD",
    }
