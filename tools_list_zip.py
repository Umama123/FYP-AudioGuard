import zipfile, os
z='deepfake_intel_v2.zip'
print('exists', os.path.exists(z))
with zipfile.ZipFile(z,'r') as zipf:
    names=zipf.namelist()
    print('count', len(names))
    for name in names[:400]:
        print(name)
