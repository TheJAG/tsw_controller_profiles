import sys, os, zipfile
src, out = sys.argv[1], sys.argv[2]
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    ct = os.path.join(src, '[Content_Types].xml')
    z.write(ct, '[Content_Types].xml')
    for root, dirs, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, src).replace(os.sep, '/')
            if rel == '[Content_Types].xml': continue
            z.write(p, rel)
print('zipped', out)
