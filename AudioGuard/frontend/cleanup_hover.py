import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content = content.replace('dark:hover:bg-white/10 bg-purple-100', 'dark:hover:bg-white/10 hover:bg-purple-100')
    content = content.replace('dark:hover:border-white/20 border-purple-300/60', 'dark:hover:border-white/20 hover:border-purple-300/60')

    # Quick manual fix for text-cyan-300
    content = content.replace('text-cyan-300', 'dark:text-cyan-300 text-cyan-700')
    
    # Also text-purple-100 in LandingPage
    content = content.replace('text-purple-100', 'dark:text-purple-100 text-purple-900')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed hover {filepath}')

components_dir = r'c:\Users\user\Downloads\FYP_2_AudioGuard\AudioGuard\frontend\src\app\components'
for root, dirs, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
