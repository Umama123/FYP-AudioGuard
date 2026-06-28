import zipfile, os
src='deepfake_intel_v2.zip'
target='AudioGuard_flask 4_new/backend'
print('extracting from', src, 'to', target)
with zipfile.ZipFile(src,'r') as z:
    for member in z.namelist():
        if member.startswith('__MACOSX'):
            continue
        if '/data/' in member or member.endswith('.pyc') or member.endswith('.DS_Store'):
            continue
        # only extract files under deepfake_intel_v2/
        if not member.startswith('deepfake_intel_v2/'):
            continue
        rel = os.path.relpath(member, 'deepfake_intel_v2')
        outpath = os.path.join(target, 'deepfake_intel_v2', rel)
        if member.endswith('/'):
            os.makedirs(outpath, exist_ok=True)
            continue
        os.makedirs(os.path.dirname(outpath), exist_ok=True)
        with z.open(member) as srcf, open(outpath,'wb') as dstf:
            data = srcf.read()
            dstf.write(data)
        print('wrote', outpath)
print('done')
