#!/usr/bin/env python3
"""
Calculate CSP hashes for inline scripts and styles in HTML files.
This script extracts all inline <script> and <style> tags and calculates SHA-256 hashes.
"""
import os
import re
import hashlib
import base64
from pathlib import Path

def calculate_hash(content):
    """Calculate SHA-256 hash and return base64 encoded string."""
    sha256 = hashlib.sha256(content.encode('utf-8')).digest()
    return base64.b64encode(sha256).decode('utf-8')

def process_html_file(file_path):
    """Extract and hash inline scripts and styles from an HTML file."""
    hashes = {'scripts': [], 'styles': []}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return hashes
    
    # Extract inline scripts (not external scripts with src=)
    script_pattern = r'<script[^>]*>([\s\S]*?)</script>'
    for match in re.finditer(script_pattern, content, re.IGNORECASE):
        script_tag = match.group(0)
        script_content = match.group(1).strip()
        
        # Skip external scripts (those with src= attribute)
        if script_content and 'src=' not in script_tag:
            hash_value = calculate_hash(script_content)
            hash_string = f"'sha256-{hash_value}'"
            if hash_string not in hashes['scripts']:
                hashes['scripts'].append(hash_string)
                print(f"Script hash for {file_path}: sha256-{hash_value}")
    
    # Extract inline styles
    style_pattern = r'<style[^>]*>([\s\S]*?)</style>'
    for match in re.finditer(style_pattern, content, re.IGNORECASE):
        style_content = match.group(1).strip()
        if style_content:
            hash_value = calculate_hash(style_content)
            hash_string = f"'sha256-{hash_value}'"
            if hash_string not in hashes['styles']:
                hashes['styles'].append(hash_string)
                print(f"Style hash for {file_path}: sha256-{hash_value}")
    
    return hashes

def find_html_files(directory):
    """Recursively find all HTML files in a directory."""
    html_files = []
    for root, dirs, files in os.walk(directory):
        # Skip hidden directories and node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    return html_files

def main():
    """Main execution."""
    # Start from current directory
    base_dir = os.path.dirname(os.path.abspath(__file__)) or '.'
    
    print('Calculating CSP hashes for inline scripts and styles...\n')
    
    html_files = find_html_files(base_dir)
    all_script_hashes = set()
    all_style_hashes = set()
    
    for file_path in html_files:
        hashes = process_html_file(file_path)
        all_script_hashes.update(hashes['scripts'])
        all_style_hashes.update(hashes['styles'])
    
    print('\n=== CSP Configuration ===')
    print('\nscript-src hashes:')
    print(' '.join(sorted(all_script_hashes)))
    print('\nstyle-src hashes:')
    print(' '.join(sorted(all_style_hashes)))
    print()

if __name__ == '__main__':
    main()

