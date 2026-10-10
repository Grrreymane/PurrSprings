import importlib.util, sys
spec = importlib.util.spec_from_file_location('m', __import__('os').path.join(__import__('os').path.dirname(__file__), 'spec2_map_check.py')); m = importlib.util.module_from_spec(spec)
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(m)
G = [list(r) for r in m.MAP]
def put(xy, c):
    x, y = xy; G[y][x] = c
U = m.ALL20
for xy in m.objects(U): put(xy, 'O')
P = m.pts(U)
for k, xy in P.items():
    c = None
    if k.startswith('pad') or k.startswith('decorPad') or k in ('hatPad', 'petPad'): c = '$'
    elif 'ile' in k or k == 'chest': c = '%'
    elif k.startswith('queue'): c = str(int(k[-1]) + 1)
    elif k.startswith('seat'): c = 'S'
    elif k.endswith('slotA'): c = 'A'
    elif k.endswith('slotB'): c = 'B'
    elif k.endswith('.stand') : c = '*'
    elif k.startswith('slot') or k.startswith('rslot'): c = 'w'
    elif k.startswith('rest') or k.endswith('Home') or k.startswith('waiterIdle'): c = 'r'
    elif k == 'carpet': c = 'V'
    elif k == 'desk': c = '@'
    elif k.endswith('.tap'): c = 'T'
    elif k in ('teaPick', 'urn2Pick', 'milkSpot', 'stoveA', 'stoveB', 'passA', 'passB', 'passC', 'shelfSpot', 'basketSpot', 'towelSpot', 'waitSpot', 'browse', 'mirrorSpot', 'owner'): c = '+'
    elif k == 'exit': c = 'X'
    if c: put(xy, c)
print('      ' + ''.join(str(i // 10) for i in range(40)))
print('      ' + ''.join(str(i % 10) for i in range(40)))
for y, r in enumerate(G): print('r%-3d  %s' % (y, ''.join(r)))
