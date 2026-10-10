#!/usr/bin/env python3
# BFS check for SPEC_v2 section 2 (map + objects + spots). Run: python spec2_map.py
from collections import deque

MAP = [
 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',  # r0
 'bfffzzzfffbfrrrrrrrrrrrfbfrrrrrrrrrrrrrb',  # r1
 'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',  # r2
 'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',  # r3
 'bfzzzpppppDsssssssssssssDssssssssssssssb',  # r4
 'bffzzzzzffbfssssssssssssbxxxxxxxxxxxxxxb',  # r5
 'b################D#######xxxxxxxxxxxxxxb',  # r6
 'b#tttt#...#tttt#...#tttt#xxxxxxxxxxxxxxb',  # r7
 'b#ttttD...#ttttD...Dtttt#ffffffpppfffffb',  # r8
 'b#tttt#...#tttt#...#tttt#ggggggpppgggggb',  # r9
 'b######...######...######p######p######b',  # r10
 'b#tttt#...#tttt#...#tttt#p#tttt#p#tttt#b',  # r11
 'b#ttttD...#ttttD...Dtttt#pDtttt#pDtttt#b',  # r12
 'b#tttt#...#tttt#...#tttt#p#tttt#p#tttt#b',  # r13
 'b######...######...######p######p######b',  # r14
 'b#tttt#...#tttt#...#tttt#pgoooogpggggggb',  # r15
 'b#ttttD...#ttttD...Dtttt#pgoooogpzzzzzzb',  # r16
 'b#tttt#...#tttt#...#tttt#pgoooogpzzzzzzb',  # r17
 'b#######D#######...######pggggggpggggggb',  # r18
 'b#kkkkmmmm#tttt#...#tttt#p######p######b',  # r19
 'b#kkkkmmmm#ttttD...Dtttt#p#tttt#p#tttt#b',  # r20
 'b#mmmmmmmm#tttt#...#tttt#pDtttt#pDtttt#b',  # r21
 'b#mmmmmmmm######...######p#tttt#p#tttt#b',  # r22
 'b#mmmmmmmm#lllllllllllll#p######p######b',  # r23
 'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',  # r24
 'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',  # r25
 'b#mmmmmmmmDlllllllllllllDppppppppggggggb',  # r26
 'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',  # r27
 'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',  # r28
 'b###############EEE######Dfffffffffffffb',  # r29
 'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',  # r30
 'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',  # r31
 'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',  # r32
 'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',  # r33
 'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',  # r34
 'bbbbbbbbbbbbbbbpppppbbbbbbbbbbbbbbbbbbbb',  # r35
]
MW, MH = 40, 36
assert len(MAP) == MH and all(len(r) == MW for r in MAP), [len(r) for r in MAP]
WALK = set('stl.Egpkmzxq')
AREAS = {'shop': (1, 30, 9, 34), 'garden': (25, 9, 38, 28), 'roten': (25, 1, 38, 8), 'shrine': (1, 1, 9, 5), 'plaza': (25, 30, 38, 34)}
DOORS = {(17, 6): 'onsen', (8, 18): 'w1', (10, 26): 'dining', (24, 26): 'garden', (24, 4): 'roten', (10, 4): 'shrine', (25, 29): 'plaza',
  (15, 20): 'room1', (19, 20): 'room2', (15, 16): 'room3', (19, 16): 'room4', (15, 12): 'room5', (19, 12): 'room6', (15, 8): 'room7', (19, 8): 'room8',
  (6, 16): 'w1', (6, 12): 'w2', (6, 8): 'w3', (26, 21): 'garden', (33, 21): 'c2', (26, 12): 'garden', (33, 12): 'suiteB'}
for (x, y) in DOORS: assert MAP[y][x] == 'D', (x, y, MAP[y][x])
for y in range(MH):
  for x in range(MW):
    if MAP[y][x] == 'D': assert (x, y) in DOORS, ('door without table entry', x, y)
def room_main(n):
  left = n % 2 == 1; y0 = 19 - 4 * ((n - 1) // 2); m = (lambda x: x) if left else (lambda x: 34 - x)
  return dict(id='room%d' % n, y0=y0, andon=(m(11), y0), futon=(m(12), y0), table=(m(13), y0), stand=(m(13), y0 + 1), pile=(m(13), y0 + 2), slotA=(m(14), y0), slotB=(m(12), y0 + 2))
def room_west(i):
  y0 = {1: 15, 2: 11, 3: 7}[i]
  return dict(id='w%d' % i, y0=y0, andon=(2, y0), futon=(3, y0), table=(4, y0), stand=(4, y0 + 1), pile=(4, y0 + 2), slotA=(5, y0), slotB=(3, y0 + 2))
def cottage(cid, x0, y0, suite):
  d = dict(id=cid, andon=(x0, y0), table=(x0 + 1, y0), futon=(x0 + 2, y0), stand=(x0 + 1, y0 + 1), pile=(x0, y0 + 2))
  if suite: d.update(tub=(x0 + 3, y0 + 2), tap=(x0 + 2, y0 + 2))
  else: d.update(futonB=(x0 + 3, y0), slotA=(x0 + 3, y0 + 2), slotB=(x0 + 2, y0 + 2))
  return d
ROOMS = [room_main(n) for n in range(1, 9)] + [room_west(i) for i in (1, 2, 3)]
COTS = [cottage('c1', 27, 20, False), cottage('c2', 34, 20, False), cottage('c3', 27, 11, True), cottage('c4', 34, 11, True)]
for r in ROOMS + COTS:
  for k in ('andon', 'table', 'futon', 'stand', 'pile'):
    x, y = r[k]; assert MAP[y][x] == 't', (r['id'], k, MAP[y][x])
ORN = [(29, 24), (30, 28), (34, 24), (36, 26), (37, 24), (38, 15), (36, 18), (38, 28)]
def objects(U, v21=False):
  O = []; add = lambda *c: O.extend(c)
  add((12, 25), (13, 25), (14, 25), (11, 23), (19, 23), (20, 23), (23, 28), (13, 31), (21, 32), (20, 30), (21, 30))
  if U.get('star5'): add((11, 33), (12, 33), (11, 34), (12, 34), (1, 33))
  if U.get('onsen'): add((22, 23), (23, 23), (15, 5))
  if U.get('milk'): add((22, 4))
  if U.get('tea'): add((11, 24))
  if U.get('shop'): add((1, 30), (2, 30), (3, 30), (4, 30), (6, 31), (7, 31))
  for r in ROOMS:
    if U.get(r['id']): add(r['andon'], r['table'])
  for c in COTS:
    if (U.get('garden') if c['id'] in ('c1', 'c3') else U.get({'c2': 'c2', 'c4': 'suiteB'}[c['id']])):
      add(c['andon'], c['table'])
      if 'tub' in c: add(c['tub'])
  if U.get('dining'): add((2, 19), (3, 19), (4, 19), (2, 21), (3, 21), (4, 21), (3, 23), (7, 23))
  if U.get('table3'): add((3, 26))
  if U.get('table4'): add((7, 26))
  if U.get('garden'): add((26, 16), (31, 17), (27, 24), (37, 18), (38, 9), (35, 16), (37, 17), (33, 18), (26, 27), (33, 24), (26, 25))
  if U.get('roten'): add((25, 7), (38, 7))
  if v21:
    add((4, 1), (5, 1), (6, 1), (4, 3), (6, 3), (3, 2), (7, 2), (2, 2), (8, 2))
    add((27, 30), (28, 30), (30, 30), (31, 30), (33, 30), (34, 30), (36, 30), (37, 30), (35, 33), (36, 33), (37, 33))
    for p in ORN: add(p)
    add((28, 6), (29, 6))
  return O
def block_grid(U, v21=False):
  B = [[1] * MW for _ in range(MH)]
  for y in range(MH):
    for x in range(MW):
      c = MAP[y][x]
      B[y][x] = (0 if U.get(DOORS[(x, y)]) else 1) if c == 'D' else (0 if c in WALK else 1)
  for a, (x0, y0, x1, y1) in AREAS.items():
    if not U.get(a):
      for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): B[y][x] = 1
  for (x, y) in objects(U, v21): B[y][x] = 1
  return B
def bfs(B, s):
  D = {s: 0}; q = deque([s])
  while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
      n = (x + dx, y + dy)
      if 0 <= n[0] < MW and 0 <= n[1] < MH and not B[n[1]][n[0]] and n not in D: D[n] = D[(x, y)] + 1; q.append(n)
  return D
DESK = (13, 24)
ALL20 = dict(room1=1, room2=1, room3=1, room4=1, room5=1, room6=1, room7=1, room8=1, onsen=1, milk=1, tea=1, shop=1, dining=1, table3=1, table4=1,
             w1=1, w2=1, w3=1, garden=1, c2=1, suiteB=1, roten=1, star5=1)
def pts(U, v21=False):
  P = {}
  def p(n, xy): P[n] = xy
  p('desk', DESK); p('chest', (15, 24)); p('carpet', (17, 26)); p('exit', (17, 35))
  for i, q in enumerate([(13, 26), (13, 27), (13, 28), (14, 28), (15, 28)]): p('queue%d' % i, q)
  for i, q in enumerate([(21, 25), (22, 25), (23, 25)]): p('rest%d' % i, q)
  for k, v in dict(padA=(19, 25), padB=(20, 25), padShoes=(19, 28), padBasket=(20, 28), padMagnet=(21, 28), padDining=(11, 26), padGarden=(22, 26), padShop=(11, 31)).items(): p(k, v)
  if U.get('star5'): p('padStatue', (13, 33))
  p('padTea' if not U.get('tea') else 'teaPick', (12, 24))
  for r in ROOMS:
    if r['id'] == 'room1' or U.get(r['id']):
      for k in ('stand', 'pile', 'slotA', 'slotB'): p(r['id'] + '.' + k, r[k])
  if U.get('onsen'):
    for k, v in dict(shelfSpot=(22, 24), basketSpot=(14, 5), towelSpot=(16, 5), waitSpot=(17, 5), onsenPile=(18, 5), milkSpot=(22, 5), milkPile=(21, 5),
                     padMilk=(20, 5), padBigbath=(13, 5), padRoten=(23, 4)).items(): p(k, v)
    for x in (15, 17, 19, 13, 21): p('slot%d' % x, (x, 4))
  if U.get('shop'):
    for k, v in dict(decorPadA=(2, 32), decorPadB=(4, 32), browse=(7, 32), shopPile=(9, 32), owner=(6, 30), hatPad=(5, 33), petPad=(7, 33), mirrorSpot=(2, 33)).items(): p(k, v)
  if U.get('dining'):
    for k, v in dict(stoveA=(2, 20), stoveB=(3, 20), passA=(2, 22), passB=(3, 22), passC=(4, 22), diningPile=(9, 27), waiterIdle0=(9, 20), waiterIdle1=(9, 21),
                     padWaiter=(9, 22), padTray=(6, 21), padChef=(6, 20), padW1=(8, 19)).items(): p(k, v)
    for s in [(2, 23), (4, 23), (6, 23), (8, 23)] + ([(2, 26), (4, 26)] if U.get('table3') else []) + ([(6, 26), (8, 26)] if U.get('table4') else []): p('seat%d_%d' % s, s)
  if U.get('w1'): p('padW2', (7, 12)); p('padW3', (7, 8)); p('maid3Home', (8, 17))
  if U.get('garden'):
    p('urn2Pick', (26, 26)); p('padC2', (32, 21)); p('padSuiteB', (32, 12)); p('maid4Home', (31, 26))
    for c in COTS:
      if c['id'] in ('c1', 'c3') or U.get({'c2': 'c2', 'c4': 'suiteB'}[c['id']]):
        for k in ('stand', 'pile', 'slotA', 'slotB', 'tap'):
          if k in c: p(c['id'] + '.' + k, c[k])
  if U.get('roten'):
    for x in (27, 29, 31, 33, 35, 37): p('rslot%d' % x, (x, 4))
    p('rotenPile', (32, 5))
  if v21:
    p('offerPad', (5, 2)); p('fwPad', (32, 33)); p('plazaPile', (31, 34)); p('padPlaza', (23, 32)); p('padShrine', (11, 4))
    for s in ((27, 31), (30, 31), (33, 31), (36, 31)): p('stallPad%d' % s[0], s)
    for i, o in enumerate(ORN): p('ornStand%d' % i, (o[0], o[1] + 1) if MAP[o[1] + 1][o[0]] in WALK else (o[0] - 1, o[1]))
    p('pongR', (30, 6)); p('pongL', (27, 6))
    p('outfitPad', (3, 34)); p('uniformPad', (5, 34)); p('ornPad', (34, 26)); p('gardenChainPad', (27, 27)); p('koiPad', (31, 16))
  return P
def check(name, U, v21=False):
  B = block_grid(U, v21); D = bfs(B, DESK); bad = []
  for k, (x, y) in pts(U, v21).items():
    if (x, y) not in D: bad.append((k, (x, y), MAP[y][x], 'blocked' if B[y][x] else 'unreached'))
  walk = [(x, y) for y in range(MH) for x in range(MW) if not B[y][x]]
  dead = [w for w in walk if w not in D]
  print('%-12s walkable %4d reached %4d dead %d  bad %s' % (name, len(walk), len(D), len(dead), bad if bad else '-'))
  if dead: print('   dead cells:', dead[:40])
STATES = [
  ('start', dict(room1=1)),
  ('onsen', dict(room1=1, room2=1, room3=1, onsen=1)),
  ('shop', dict(room1=1, room2=1, room3=1, onsen=1, tea=1, shop=1, milk=1, room4=1)),
  ('dining', dict(room1=1, room2=1, room3=1, room4=1, room5=1, onsen=1, tea=1, shop=1, milk=1, dining=1)),
  ('west', dict(room1=1, room2=1, room3=1, room4=1, room5=1, room6=1, onsen=1, tea=1, shop=1, milk=1, dining=1, w1=1, w2=1, w3=1, table3=1)),
  ('garden', dict(ALL20, c2=0, suiteB=0, roten=0, star5=0)),
  ('v2.0 final', ALL20),
]
for n, U in STATES: check(n, U)
check('v2.1 final', dict(ALL20, shrine=1, plaza=1), v21=True)
B = block_grid(ALL20)
def d(a, b): return bfs(B, a).get(b)
print('\nwalk distances (tiles), v2.0 final:')
for name, a, b in [
  ('desk -> R1 stand', DESK, (13, 20)), ('desk -> R8 stand', DESK, (21, 8)), ('desk -> basket spot', DESK, (14, 5)),
  ('desk -> tea pickup', DESK, (12, 24)), ('desk -> stove', DESK, (3, 20)), ('desk -> pass', DESK, (3, 22)), ('pass -> far seat', (3, 22), (8, 26)),
  ('desk -> W1 stand', DESK, (4, 16)), ('desk -> W3 stand', DESK, (4, 8)), ('desk -> shop decor pad', DESK, (2, 32)),
  ('carpet -> C3 stand', (17, 26), (28, 12)), ('carpet -> C4 stand', (17, 26), (35, 12)), ('C3 stand -> urn2', (28, 12), (26, 26)),
  ('C3 stand -> stove', (28, 12), (3, 20)), ('C3 stand -> urn1', (28, 12), (12, 24)), ('desk -> C1 stand', DESK, (28, 21)),
  ('desk -> C2 stand', DESK, (35, 21)), ('desk -> roten slot37', DESK, (37, 4)), ('desk -> exit', DESK, (17, 35)),
  ('towel -> roten slot37', (16, 5), (37, 4)), ('R7 stand -> milk spot', (13, 8), (22, 5)), ('shop pad -> R1 slotA', (2, 32), (14, 19)),
  ('desk -> mirror spot', DESK, (2, 33)), ('desk -> statue pad', DESK, (13, 33)), ('desk -> garden gate pad', DESK, (22, 26)),
  ('desk -> dining gate pad', DESK, (11, 26)), ('desk -> roten gate pad', DESK, (23, 4)),
]:
  print('  %-24s %s' % (name, d(a, b)))
