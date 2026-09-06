#!/usr/bin/env python3
import os
import re
import zipfile
import html

def markdown_to_html(md_text: str, title: str, download_filename: str) -> str:
    lines = md_text.splitlines()
    html_lines = []
    in_code_block = False
    code_lang = ""
    code_buffer = []
    in_table = False
    table_header = True
    in_list = False
    list_type = "ul"

    def close_table():
        nonlocal in_table, table_header
        if in_table:
            html_lines.append("</tbody></table></div>")
            in_table = False
            table_header = True

    def close_list():
        nonlocal in_list, list_type
        if in_list:
            html_lines.append(f"</{list_type}>")
            in_list = False

    def inline_format(text: str) -> str:
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*([^\*]+?)\*', r'<em>\1</em>', text)
        text = re.sub(r'`([^`]+?)`', r'<code>\1</code>', text)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', text)
        text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1" class="inline-img" />', text)
        return text

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Fenced code block check
        if stripped.startswith("```"):
            close_table()
            close_list()
            if not in_code_block:
                in_code_block = True
                code_lang = stripped[3:].strip()
                code_buffer = []
            else:
                in_code_block = False
                escaped_code = html.escape("\n".join(code_buffer))
                html_lines.append(f'<div class="code-container"><div class="code-header"><span>{code_lang or "code"}</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div><pre><code class="language-{code_lang}">{escaped_code}</code></pre></div>')
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        # HTML Center / Divs
        if stripped.startswith("<div") or stripped.startswith("</div"):
            close_table()
            close_list()
            html_lines.append(line)
            i += 1
            continue

        # Empty lines
        if not stripped:
            close_table()
            close_list()
            i += 1
            continue

        # Horizontal rule
        if stripped in ("---", "***", "___"):
            close_table()
            close_list()
            html_lines.append("<hr />")
            i += 1
            continue

        # Headings
        heading_match = re.match(r'^(#{1,6})\s+(.*)', stripped)
        if heading_match:
            close_table()
            close_list()
            level = len(heading_match.group(1))
            heading_text = heading_match.group(2)
            slug = re.sub(r'[^\w\- ]', '', heading_text).strip().lower().replace(' ', '-')
            formatted_heading = inline_format(heading_text)
            html_lines.append(f'<h{level} id="{slug}">{formatted_heading} <a class="anchor-link" href="#{slug}">#</a></h{level}>')
            i += 1
            continue

        # Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            close_list()
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            
            if all(re.match(r'^:?-+:?$', c) for c in cells):
                table_header = False
                i += 1
                continue

            if not in_table:
                in_table = True
                html_lines.append('<div class="table-responsive"><table>')
                html_lines.append('<thead><tr>')
                for cell in cells:
                    html_lines.append(f'<th>{inline_format(cell)}</th>')
                html_lines.append('</tr></thead><tbody>')
                table_header = False
            else:
                html_lines.append('<tr>')
                for cell in cells:
                    html_lines.append(f'<td>{inline_format(cell)}</td>')
                html_lines.append('</tr>')
            i += 1
            continue
        else:
            close_table()

        # Unordered list item
        ul_match = re.match(r'^[-*+]\s+(.*)', stripped)
        if ul_match:
            if not in_list or list_type != "ul":
                close_list()
                in_list = True
                list_type = "ul"
                html_lines.append("<ul>")
            content = inline_format(ul_match.group(1))
            html_lines.append(f"<li>{content}</li>")
            i += 1
            continue

        # Ordered list item
        ol_match = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if ol_match:
            if not in_list or list_type != "ol":
                close_list()
                in_list = True
                list_type = "ol"
                html_lines.append("<ol>")
            content = inline_format(ol_match.group(2))
            html_lines.append(f"<li>{content}</li>")
            i += 1
            continue

        close_list()

        # Paragraph
        html_lines.append(f"<p>{inline_format(stripped)}</p>")
        i += 1

    close_table()
    close_list()

    body_content = "\n".join(html_lines)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{html.escape(title)} — InterviewX Documentation</title>
  <style>
    :root {{
      --bg-canvas: #0B0F19;
      --bg-surface: #111827;
      --bg-card: #1F2937;
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --accent-indigo: #6366F1;
      --accent-violet: #8B5CF6;
      --accent-emerald: #34D399;
      --accent-cyan: #06B6D4;
      --border-color: #334155;
      --code-bg: #0F172A;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      line-height: 1.65;
      padding: 0;
      margin: 0;
    }}

    /* Header Nav Bar */
    .top-bar {{
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      background: rgba(11, 15, 25, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
    }}

    .brand-logo {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.1rem;
      text-decoration: none;
      color: #fff;
    }}

    .brand-badge {{
      background: linear-gradient(135deg, #4F46E5, #9333EA);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: monospace;
      font-weight: 700;
    }}

    .action-group {{
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }}

    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
    }}

    .btn:hover {{
      background: var(--bg-card);
      border-color: #475569;
    }}

    .btn-primary {{
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      border: none;
      color: #fff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }}

    .btn-primary:hover {{
      background: linear-gradient(135deg, #4338CA, #6D28D9);
      transform: translateY(-1px);
    }}

    .btn-emerald {{
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-emerald);
      border: 1px solid rgba(16, 185, 129, 0.4);
    }}

    .btn-emerald:hover {{
      background: rgba(16, 185, 129, 0.25);
    }}

    /* Main Container */
    .container {{
      max-width: 960px;
      margin: 40px auto;
      padding: 0 24px;
    }}

    h1, h2, h3, h4, h5, h6 {{
      color: #FFFFFF;
      font-weight: 700;
      margin-top: 1.8em;
      margin-bottom: 0.6em;
      line-height: 1.3;
      position: relative;
    }}

    h1 {{
      font-size: 2.2rem;
      margin-top: 0.5em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 14px;
    }}

    h2 {{
      font-size: 1.5rem;
      border-bottom: 1px solid rgba(51, 65, 85, 0.5);
      padding-bottom: 8px;
    }}

    h3 {{
      font-size: 1.25rem;
      color: #E2E8F0;
    }}

    p {{
      margin-bottom: 1.2em;
      color: #CBD5E1;
    }}

    a {{
      color: var(--accent-cyan);
      text-decoration: none;
    }}

    a:hover {{
      text-decoration: underline;
    }}

    .anchor-link {{
      opacity: 0;
      margin-left: 6px;
      color: var(--text-muted);
      text-decoration: none;
    }}

    h1:hover .anchor-link,
    h2:hover .anchor-link,
    h3:hover .anchor-link {{
      opacity: 0.6;
    }}

    ul, ol {{
      margin-left: 24px;
      margin-bottom: 1.2em;
      color: #CBD5E1;
    }}

    li {{
      margin-bottom: 6px;
    }}

    code {{
      font-family: "JetBrains Mono", Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: var(--code-bg);
      color: #F472B6;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }}

    .code-container {{
      background: #090D16;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      margin: 1.5em 0;
    }}

    .code-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #131A2A;
      border-bottom: 1px solid var(--border-color);
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }}

    .copy-btn {{
      background: transparent;
      border: 1px solid #334155;
      color: #94A3B8;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
    }}

    .copy-btn:hover {{
      background: #1E293B;
      color: #fff;
    }}

    pre {{
      padding: 16px;
      overflow-x: auto;
      margin: 0;
    }}

    pre code {{
      background: transparent;
      padding: 0;
      border: none;
      color: #E2E8F0;
      font-size: 0.88rem;
      display: block;
      line-height: 1.5;
    }}

    .table-responsive {{
      overflow-x: auto;
      margin: 1.5em 0;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-surface);
      text-align: left;
    }}

    th {{
      background: #131A2A;
      padding: 12px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #E2E8F0;
      border-bottom: 1px solid var(--border-color);
    }}

    td {{
      padding: 10px 16px;
      font-size: 0.85rem;
      color: #CBD5E1;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
    }}

    tr:last-child td {{
      border-bottom: none;
    }}

    tr:hover td {{
      background: rgba(255, 255, 255, 0.02);
    }}

    hr {{
      border: 0;
      height: 1px;
      background: var(--border-color);
      margin: 2.5em 0;
    }}

    .inline-img {{
      margin: 4px 4px 4px 0;
      vertical-align: middle;
      display: inline-block;
    }}

    footer {{
      margin-top: 60px;
      padding: 30px 0;
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }}

    @media print {{
      .top-bar, .copy-btn, .anchor-link {{
        display: none !important;
      }}
      body {{
        background: #FFFFFF !important;
        color: #000000 !important;
      }}
      .container {{
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }}
      h1, h2, h3, h4 {{
        color: #000000 !important;
      }}
      p, li, td {{
        color: #333333 !important;
      }}
      .code-container {{
        background: #F8FAFC !important;
        border: 1px solid #CBD5E1 !important;
      }}
      pre code {{
        color: #0F172A !important;
      }}
      th {{
        background: #F1F5F9 !important;
        color: #000000 !important;
        border-bottom: 1px solid #CBD5E1 !important;
      }}
      td {{
        border-bottom: 1px solid #E2E8F0 !important;
      }}
      code {{
        background: #F1F5F9 !important;
        color: #B91C1C !important;
        border: 1px solid #E2E8F0 !important;
      }}
    }}
  </style>
</head>
<body>

  <header class="top-bar">
    <a href="/" class="brand-logo">
      <span class="brand-badge">IX</span>
      <span>InterviewX Documentation</span>
    </a>
    <div class="action-group">
      <a href="{download_filename}" download class="btn btn-emerald">
        <span>⬇️ Download Markdown (.md)</span>
      </a>
      <button onclick="window.print()" class="btn btn-primary">
        <span>🖨️ Print / Save as PDF</span>
      </button>
      <a href="/downloads/InterviewX_Documentation_Bundle.zip" download class="btn">
        <span>📦 Download All (.zip)</span>
      </a>
      <a href="/docs" class="btn">
        <span>📚 Docs Hub</span>
      </a>
      <a href="/" class="btn">
        <span>🏠 Home</span>
      </a>
    </div>
  </header>

  <main class="container">
    {body_content}
  </main>

  <footer>
    <p>InterviewX — Autonomous Multimodal Technical Interview Platform &bull; Powered by Google Gemini 2.5 Flash, Next.js 14, and FastAPI</p>
  </footer>

  <script>
    function copyCode(button) {{
      const pre = button.parentElement.nextElementSibling;
      const code = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(() => {{
        const oldText = button.innerText;
        button.innerText = "Copied!";
        setTimeout(() => {{ button.innerText = oldText; }}, 2000);
      }});
    }}
  </script>
</body>
</html>
"""
    return full_html


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    readme_path = os.path.join(base_dir, "README.md")
    tech_stack_path = os.path.join(base_dir, "TECH_STACK.md")
    public_downloads_dir = os.path.join(base_dir, "client", "public", "downloads")
    
    os.makedirs(public_downloads_dir, exist_ok=True)

    with open(readme_path, "r", encoding="utf-8") as f:
        readme_md = f.read()

    with open(tech_stack_path, "r", encoding="utf-8") as f:
        tech_stack_md = f.read()

    # Convert to styled HTML
    readme_html = markdown_to_html(readme_md, "README — Platform Manual", "/downloads/README.md")
    tech_stack_html = markdown_to_html(tech_stack_md, "Technology Stack & Architecture Specification", "/downloads/TECH_STACK.md")

    # Write root HTML files for local offline opening
    with open(os.path.join(base_dir, "README.html"), "w", encoding="utf-8") as f:
        f.write(readme_html)
    with open(os.path.join(base_dir, "TECH_STACK.html"), "w", encoding="utf-8") as f:
        f.write(tech_stack_html)

    # Copy files to client/public/downloads
    with open(os.path.join(public_downloads_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_md)
    with open(os.path.join(public_downloads_dir, "TECH_STACK.md"), "w", encoding="utf-8") as f:
        f.write(tech_stack_md)
    with open(os.path.join(public_downloads_dir, "README.html"), "w", encoding="utf-8") as f:
        f.write(readme_html)
    with open(os.path.join(public_downloads_dir, "TECH_STACK.html"), "w", encoding="utf-8") as f:
        f.write(tech_stack_html)

    # Generate ZIP bundle
    zip_path = os.path.join(public_downloads_dir, "InterviewX_Documentation_Bundle.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(os.path.join(public_downloads_dir, "README.md"), arcname="README.md")
        zipf.write(os.path.join(public_downloads_dir, "README.html"), arcname="README.html")
        zipf.write(os.path.join(public_downloads_dir, "TECH_STACK.md"), arcname="TECH_STACK.md")
        zipf.write(os.path.join(public_downloads_dir, "TECH_STACK.html"), arcname="TECH_STACK.html")

    print("Successfully generated all documentation files:")
    print(f" - {os.path.join(public_downloads_dir, 'README.md')}")
    print(f" - {os.path.join(public_downloads_dir, 'README.html')}")
    print(f" - {os.path.join(public_downloads_dir, 'TECH_STACK.md')}")
    print(f" - {os.path.join(public_downloads_dir, 'TECH_STACK.html')}")
    print(f" - {zip_path}")

if __name__ == "__main__":
    main()
