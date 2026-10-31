"""Export the public portfolio to docs/ for GitHub Pages (standard library only)."""
import json
import re
import shutil
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from backend.storage import load_portfolio


def main():
    output = ROOT / 'docs'
    output.mkdir(exist_ok=True)
    data = load_portfolio()
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'frontend/js/app.js').read_text(encoding='utf-8')
    # Only copy public assets actually referenced by the page or content.
    combined = html + js + json.dumps(data, ensure_ascii=False)
    assets = set(re.findall(r'/assets/[\w./-]+', combined))
    for url in assets:
        source = (ROOT / 'frontend' / url.lstrip('/')).resolve()
        if not source.is_relative_to((ROOT / 'frontend/assets').resolve()) or not source.is_file():
            raise ValueError(f'Missing or invalid public asset: {url}')
    for folder in ('assets', 'css', 'js'):
        target = output / folder
        if target.exists():
            shutil.rmtree(target)
    for url in assets:
        target = output / url.lstrip('/')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / 'frontend' / url.lstrip('/'), target)

    def relative(value):
        if isinstance(value, dict):
            return {key: relative(child) for key, child in value.items()}
        if isinstance(value, list):
            return [relative(child) for child in value]
        if isinstance(value, str) and value.startswith('/assets/'):
            return '.' + value
        return value

    data = relative(data)
    favicon = (data['favicon_path'] or data['logo_dark_path'] or data['logo_path']
               or data['logo_light_path'] or './assets/favicon.svg')
    replacements = {
        '__PAGE_TITLE__': f"{data['display_name']} | {data['role']}",
        '__PAGE_DESCRIPTION__': data['introduction'],
        '__FAVICON_URL__': favicon,
        '__OG_IMAGE_URL__': data['og_image_path'],
    }
    for key, value in replacements.items():
        html = html.replace(key, escape(value, quote=True))
    html = html.replace('/static/', './').replace('/assets/', './assets/')
    # Avoid adding a second dot to already-relative metadata URLs.
    html = html.replace('../assets/', './assets/')
    html = re.sub(r'\s*<!-- start the fastAPI.*?-->', '', html, flags=re.S)
    html = re.sub(r'\s*<!-- cd /home/.*?-->', '', html, flags=re.S)
    js = js.replace('fetch("/api/portfolio")', 'fetch("./portfolio.json")')
    js = js.replace('"/assets/', '"./assets/')
    js = js.replace('new URL(data.og_image_path, window.location.origin)',
                    'new URL(data.og_image_path, document.baseURI)')
    js = js.replace('window.location.assign("/myterminal");\n      return "Opening the private portfolio panel...";',
                    'return "Admin access is unavailable in this public demo.";')
    (output / 'index.html').write_text(html, encoding='utf-8')
    (output / 'portfolio.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shutil.copytree(ROOT / 'frontend/css', output / 'css')
    (output / 'js').mkdir()
    for name in ('theme.js', 'translations.js'):
        shutil.copy2(ROOT / 'frontend/js' / name, output / 'js' / name)
    (output / 'js/app.js').write_text(js, encoding='utf-8')
    (output / '.nojekyll').touch()
    print(f'Exported public demo to {output} ({len(assets)} public assets).')


if __name__ == '__main__':
    main()
