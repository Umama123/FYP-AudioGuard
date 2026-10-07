import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix hover:dark: -> dark:hover:
    content = content.replace('hover:dark:', 'dark:hover:')
    
    # Fix gradients
    content = content.replace('from-[#1e1435]/90 to-[#0f172a]/90', 'dark:from-[#1e1435]/90 dark:to-[#0f172a]/90 from-white/90 to-purple-50/90')
    content = content.replace('from-[#0f0720]/80 to-[#1a0b2e]/80', 'dark:from-[#0f0720]/80 dark:to-[#1a0b2e]/80 from-white/80 to-purple-50/80')
    
    # Fix emergency background
    content = content.replace('bg-[#2d1a1f]/90', 'dark:bg-[#2d1a1f]/90 bg-red-50/90')
    
    # Fix buttons / badges with strong gradients that got dark:text-white text-[#2d1b4e]
    def fix_gradient_text(match):
        cls = match.group(0)
        if any(kw in cls for kw in ['from-purple', 'from-pink', 'from-orange', 'from-red', 'from-blue', 'from-cyan', 'bg-purple', 'bg-pink', 'bg-red', 'bg-green', 'bg-blue', 'bg-orange', 'bg-cyan']):
            cls = cls.replace('dark:text-white text-[#2d1b4e]', 'text-white')
        return cls

    content = re.sub(r'className="[^"]*"', fix_gradient_text, content)
    content = re.sub(r'className={`[^`]*`}', fix_gradient_text, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Cleaned up {filepath}')

components_dir = r'c:\Users\user\Downloads\FYP_2_AudioGuard\AudioGuard\frontend\src\app\components'
for root, dirs, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.tsx') and file != 'TopBar.tsx':
            process_file(os.path.join(root, file))
