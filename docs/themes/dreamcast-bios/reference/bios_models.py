"""Find and decode the Sega Ninja CHUNK models in the Dreamcast boot ROM.

Parsing is stdlib-only (struct, json, math). The boot ROM is mapped at
0x8C000000 while the BIOS menu runs, so every pointer is ROM offset + BASE.

Format references (X-Hax/sa_tools, Libraries/SAModel):
  NJS_OBJECT.cs  - u32 evalflags, model*, pos float3, ang int3 (BAMS), scl float3,
                   child*, sibling* (0x34 bytes).
  ChunkAttach.cs - NJS_CNK_MODEL: vlist*, plist*, center float3, radius.
  VertexChunk.cs - u8 type, u8 flags, u16 size (u32 words after the first
                   header word), u16 index offset, u16 count, then vertices.
                   Next chunk = addr + 4 + size * 4. 0xFF ends the list.
  PolyChunk.cs   - Bits (0x01-0x05, 2 bytes), Tiny (0x08-0x09, 4 bytes),
                   Material/Volume/Strip (u16 header, u16 size in u16 words,
                   next = addr + 4 + size * 2). Strip: u16 header2 (count:14,
                   userflags:2), then per strip s16 len (negative = reversed)
                   and per index u16 index [+UV][+colour], userflag u16s from
                   the third index on.
  VColor.cs      - material colours are ARGB8888 stored as two LE u16s, which
                   is a single LE u32 0xAARRGGBB.
  SAModel.Direct3D/Extensions.cs + MatrixFunctions.cs - object transform is
                   translate, rotate, scale (so a vertex is scaled, rotated,
                   then translated). Rotation XYZ (default) applies X, then Y,
                   then Z to the vertex; with evalflag 0x20 (NJD_EVAL_ZXY_ANG)
                   it applies Z, then X, then Y.
"""

import json
import math
import struct

BASE = 0x8C000000

# NJD_EVAL_* (Ninja) == SAModel ObjectFlags
EVAL_UNIT_POS = 0x01
EVAL_UNIT_ANG = 0x02
EVAL_UNIT_SCL = 0x04
EVAL_HIDE = 0x08
EVAL_BREAK = 0x10  # do not descend into children
EVAL_ZXY_ANG = 0x20
EVAL_SKIP = 0x40  # skip motion for this node
EVAL_SHAPE_SKIP = 0x80

VERTEX_TYPES = {
    # type: (has_normal, extra u32 words per vertex after pos/normal, extra float in pos/normal (SH))
    0x20: ("VertexSH", False, 0, True),
    0x21: ("VertexNormalSH", True, 0, True),
    0x22: ("Vertex", False, 0, False),
    0x23: ("VertexDiffuse8", False, 1, False),
    0x24: ("VertexUserFlags", False, 1, False),
    0x25: ("VertexNinjaFlags", False, 1, False),
    0x26: ("VertexDiffuseSpecular5", False, 1, False),
    0x27: ("VertexDiffuseSpecular4", False, 1, False),
    0x28: ("VertexDiffuseSpecular16", False, 1, False),
    0x29: ("VertexNormal", True, 0, False),
    0x2A: ("VertexNormalDiffuse8", True, 1, False),
    0x2B: ("VertexNormalUserFlags", True, 1, False),
    0x2C: ("VertexNormalNinjaFlags", True, 1, False),
    0x2D: ("VertexNormalDiffuseSpecular5", True, 1, False),
    0x2E: ("VertexNormalDiffuseSpecular4", True, 1, False),
    0x2F: ("VertexNormalDiffuseSpecular16", True, 1, False),
    # 0x30-0x32: 32-bit packed normal (NJD_CV_VNX*): pos float3, u32 normal [, u32]
    0x30: ("VertexNormalX", "packed", 0, False),
    0x31: ("VertexNormalXDiffuse8", "packed", 1, False),
    0x32: ("VertexNormalXUserFlags", "packed", 1, False),
}

STRIP_TYPES = {
    # type: (uv, colour, uv2) ; 0x43-0x45 carry a per-index normal (3 x s16)
    0x40: ("Strip", 0, False, False, False),
    0x41: ("StripUVN", 1, False, False, False),
    0x42: ("StripUVH", 1, False, False, False),
    0x43: ("StripNormal", 0, False, False, True),
    0x44: ("StripUVNNormal", 1, False, False, True),
    0x45: ("StripUVHNormal", 1, False, False, True),
    0x46: ("StripColor", 0, True, False, False),
    0x47: ("StripUVNColor", 1, True, False, False),
    0x48: ("StripUVHColor", 1, True, False, False),
    0x49: ("Strip2", 0, False, False, False),
    0x4A: ("StripUVN2", 1, False, True, False),
    0x4B: ("StripUVH2", 1, False, True, False),
}

BLEND = ["ZERO", "ONE", "OTHER_COLOR", "INV_OTHER_COLOR", "SRC_ALPHA",
         "INV_SRC_ALPHA", "DST_ALPHA", "INV_DST_ALPHA"]

STRIP_FLAG_NAMES = [(0x01, "ignore_light"), (0x02, "ignore_specular"), (0x04, "ignore_ambient"),
                    (0x08, "use_alpha"), (0x10, "double_side"), (0x20, "flat_shading"),
                    (0x40, "env_mapping"), (0x80, "no_alpha_test")]


class Rom:
    def __init__(self, data):
        self.d = data
        self.n = len(data)

    def off(self, ptr):
        """ROM offset for a pointer, or None if it does not land in the ROM."""
        if BASE <= ptr < BASE + self.n:
            return ptr - BASE
        return None

    def u8(self, o):
        return self.d[o]

    def u16(self, o):
        return struct.unpack_from("<H", self.d, o)[0]

    def s16(self, o):
        return struct.unpack_from("<h", self.d, o)[0]

    def u32(self, o):
        return struct.unpack_from("<I", self.d, o)[0]

    def s32(self, o):
        return struct.unpack_from("<i", self.d, o)[0]

    def f32(self, o):
        return struct.unpack_from("<f", self.d, o)[0]

    def f3(self, o):
        return list(struct.unpack_from("<3f", self.d, o))


def _finite(v, lim=1e6):
    return v == v and abs(v) < lim


# ---------------------------------------------------------------- vertex chunks

def parse_vertex_list(rom, off):
    """Parse a vertex chunk list. Returns list of chunks or None if invalid."""
    chunks = []
    guard = 0
    while True:
        if off + 4 > rom.n:
            return None
        t = rom.u8(off)
        if t == 0xFF:
            return chunks
        if t == 0x00:  # NJD_CN null chunk (2 bytes)? not expected in vlists
            return None
        if t not in VERTEX_TYPES:
            return None
        flags = rom.u8(off + 1)
        size = rom.u16(off + 2)
        idx_off = rom.u16(off + 4)
        count = rom.u16(off + 6)
        name, has_n, extra, sh = VERTEX_TYPES[t]
        per = 3 + (1 if sh else 0)
        if has_n is True:
            per += 3 + (1 if sh else 0)
        elif has_n == "packed":
            per += 1
        per += extra
        if count == 0 or size != 1 + count * per:
            return None
        p = off + 8
        if p + count * per * 4 > rom.n:
            return None
        verts, norms, cols = [], [], []
        for _ in range(count):
            pos = rom.f3(p)
            p += 12 + (4 if sh else 0)
            nrm = None
            if has_n is True:
                nrm = rom.f3(p)
                p += 12 + (4 if sh else 0)
            elif has_n == "packed":
                w = rom.u32(p)
                p += 4
                # NJD_CV_VNX: 10:10:10 signed fixed point (x<<20 | y<<10 | z)
                def s10(v):
                    v &= 0x3FF
                    return (v - 0x400 if v & 0x200 else v) / 511.0
                nrm = [s10(w >> 20), s10(w >> 10), s10(w)]
            col = None
            if extra:
                w = rom.u32(p)
                p += 4
                if t in (0x23, 0x2A, 0x31):
                    col = [(w >> 16) & 0xFF, (w >> 8) & 0xFF, w & 0xFF, (w >> 24) & 0xFF]
            if not all(_finite(x) for x in pos):
                return None
            if nrm is not None and not all(_finite(x, 10) for x in nrm):
                return None
            verts.append(pos)
            norms.append(nrm)
            cols.append(col)
        chunks.append({"type": t, "type_name": name, "flags": flags, "index_offset": idx_off,
                       "offset": off, "positions": verts, "normals": norms, "colors": cols})
        off = off + 4 + size * 4
        guard += 1
        if guard > 256:
            return None


# ------------------------------------------------------------------ poly chunks

def parse_poly_list(rom, off):
    """Parse a poly chunk list. Returns list of chunk dicts or None if invalid."""
    out = []
    guard = 0
    while True:
        guard += 1
        if guard > 4096 or off + 2 > rom.n:
            return None
        hdr = rom.u16(off)
        t = hdr & 0xFF
        fl = hdr >> 8
        if t == 0xFF:
            return out
        if t == 0x00:  # NJD_CN null
            off += 2
            continue
        if 0x01 <= t <= 0x05:  # bits
            c = {"kind": "bits", "type": t, "flags": fl, "offset": off}
            if t == 0x01:
                c["src"] = BLEND[(fl >> 3) & 7]
                c["dst"] = BLEND[fl & 7]
            elif t == 0x03:
                c["exponent"] = fl & 0x1F
            elif t in (0x04, 0x05):
                c["list"] = fl
            out.append(c)
            off += 2
            continue
        if t in (0x08, 0x09):  # tiny: texture id
            data = rom.u16(off + 2)
            out.append({"kind": "texture", "type": t, "flags": fl, "texid": data & 0x1FFF,
                        "offset": off})
            off += 4
            continue
        if off + 4 > rom.n:
            return None
        size = rom.u16(off + 2)
        end = off + 4 + size * 2
        if end > rom.n:
            return None
        if 0x11 <= t <= 0x1F:
            if t == 0x18:  # bump
                out.append({"kind": "bump", "offset": off})
                off = end
                continue
            p = off + 4
            m = {"kind": "material", "type": t, "flags": fl, "offset": off,
                 "src": BLEND[(fl >> 3) & 7], "dst": BLEND[fl & 7]}
            sub = t & 0x7
            if sub & 1:
                m["diffuse"] = rom.u32(p)
                p += 4
            if sub & 2:
                m["ambient"] = rom.u32(p)
                p += 4
            if sub & 4:
                w = rom.u32(p)
                m["specular"] = w & 0x00FFFFFF
                m["exponent"] = w >> 24
                p += 4
            if p > end:
                return None
            out.append(m)
            off = end
            continue
        if 0x38 <= t <= 0x3A:
            out.append({"kind": "volume", "type": t, "offset": off})
            off = end
            continue
        if t in STRIP_TYPES:
            name, uvn, has_col, uv2, has_n = STRIP_TYPES[t]
            h2 = rom.u16(off + 4)
            nstrips = h2 & 0x3FFF
            uf = h2 >> 14
            p = off + 6
            strips = []
            for _ in range(nstrips):
                if p + 2 > end:
                    return None
                ln = rom.s16(p)
                p += 2
                rev = ln < 0
                ln = abs(ln)
                idx, uvs, cols = [], [], []
                for i in range(ln):
                    if p + 2 > end:
                        return None
                    idx.append(rom.u16(p))
                    p += 2
                    if uvn:
                        uvs.append((rom.s16(p), rom.s16(p + 2)))
                        p += 4
                    if has_n:
                        p += 6
                    if has_col:
                        w = rom.u32(p)
                        cols.append([(w >> 16) & 0xFF, (w >> 8) & 0xFF, w & 0xFF, w >> 24])
                        p += 4
                    if uv2:
                        p += 4
                    if i > 1:
                        p += 2 * uf
                strips.append({"reversed": rev, "indices": idx, "uvs": uvs or None,
                               "colors": cols or None})
            if p > end:
                return None
            out.append({"kind": "strip", "type": t, "type_name": name, "flags": fl,
                        "userflags": uf, "strips": strips, "offset": off})
            off = end
            continue
        return None


# --------------------------------------------------------------- model / object

def parse_model(rom, off):
    """NJS_CNK_MODEL at off, or None."""
    if off is None or off + 24 > rom.n or off % 4:
        return None
    vptr, pptr = rom.u32(off), rom.u32(off + 4)
    center = rom.f3(off + 8)
    radius = rom.f32(off + 20)
    if not (all(_finite(x) for x in center) and _finite(radius) and radius >= 0):
        return None
    if vptr == 0 and pptr == 0:
        return None
    vl = pl = None
    if vptr:
        vo = rom.off(vptr)
        if vo is None or vo % 4:
            return None
        vl = parse_vertex_list(rom, vo)
        if not vl:
            return None
    if pptr:
        po = rom.off(pptr)
        if po is None or po % 2:
            return None
        pl = parse_poly_list(rom, po)
        if pl is None:
            return None
    return {"offset": off, "vlist": vptr, "plist": pptr, "center": center, "radius": radius,
            "vertex_chunks": vl or [], "poly_chunks": pl or []}


def parse_object_fields(rom, off):
    if off is None or off % 4 or off + 0x34 > rom.n:
        return None
    flags = rom.u32(off)
    if flags & ~0xFFFF:
        return None
    mptr = rom.u32(off + 4)
    pos = rom.f3(off + 8)
    ang = [rom.s32(off + 0x14), rom.s32(off + 0x18), rom.s32(off + 0x1C)]
    scl = rom.f3(off + 0x20)
    child = rom.u32(off + 0x2C)
    sib = rom.u32(off + 0x30)
    if not all(_finite(x) for x in pos + scl):
        return None
    # a zero scale only makes sense when the scale is not evaluated at all;
    # this rejects zero-filled table rows that otherwise look like nodes
    if not flags & EVAL_UNIT_SCL and any(abs(x) < 1e-6 for x in scl):
        return None
    if any(abs(a) > 0x100000 for a in ang):
        return None
    for p in (mptr, child, sib):
        if p and rom.off(p) is None:
            return None
    return {"offset": off, "evalflags": flags, "model": mptr, "pos": pos, "ang": ang,
            "scl": scl, "child": child, "sibling": sib}


class Scanner:
    def __init__(self, data):
        self.rom = Rom(data)
        self._models = {}
        self._objs = {}

    def model(self, off):
        if off not in self._models:
            self._models[off] = parse_model(self.rom, off)
        return self._models[off]

    def obj(self, off, depth=0):
        """Validated object tree (memoised). None if any node is invalid."""
        if off in self._objs:
            return self._objs[off]
        self._objs[off] = None  # cycle guard
        if depth > 64:
            return None
        o = parse_object_fields(self.rom, off)
        if o is None:
            return None
        if o["model"]:
            m = self.model(self.rom.off(o["model"]))
            if m is None:
                return None
            o["model_data"] = m
        else:
            o["model_data"] = None
        for k in ("child", "sibling"):
            if o[k]:
                sub = self.obj(self.rom.off(o[k]), depth + 1)
                if sub is None:
                    return None
                o[k + "_data"] = sub
            else:
                o[k + "_data"] = None
        # a node with neither a model nor children carries nothing
        if o["model_data"] is None and o["child_data"] is None and o["sibling_data"] is None:
            return None
        self._objs[off] = o
        return o

    def find_objects(self):
        """All valid object trees whose model pointer hits a valid model, plus
        model-less parent nodes of those."""
        rom = self.rom
        objs = {}
        for o in range(0, rom.n - 0x34, 4):
            mo = rom.off(rom.u32(o + 4))
            if mo is not None and mo % 4 == 0 and self.model(mo) is not None:
                t = self.obj(o)
                if t is not None:
                    objs[o] = t
        for o in range(0, rom.n - 0x34, 4):
            if rom.u32(o + 4) != 0:
                continue
            c = rom.off(rom.u32(o + 0x2C))
            if c is not None and c in objs:
                t = self.obj(o)
                if t is not None:
                    objs[o] = t
        return objs

    def find_tables(self, objs, min_entries=3):
        """Runs of words that are each NULL or a pointer to an object root.
        The BIOS keeps its scene objects in such a table (0x6f3c0 in v1.01d)."""
        rom = self.rom
        tables = []
        o = 0
        while o < rom.n - 4:
            run = []
            p = o
            while p < rom.n - 4:
                w = rom.u32(p)
                t = rom.off(w) if w else None
                if w == 0 or (t is not None and t in objs):
                    run.append(t)
                    p += 4
                else:
                    break
            hits = [t for t in run if t is not None]
            if len(hits) >= min_entries:
                lead = next(i for i, t in enumerate(run) if t is not None)
                while run[-1] is None:
                    run.pop()
                tables.append({"offset": o + 4 * lead, "entries": run[lead:]})
                o = p
            else:
                o += 4
        return tables

    def find_roots(self):
        """Roots: objects listed in a pointer table, plus objects that no other
        object references as child or sibling."""
        objs = self.find_objects()
        referenced = set()

        def mark(t):
            for k in ("child_data", "sibling_data"):
                s = t.get(k)
                if s is not None and s["offset"] not in referenced:
                    referenced.add(s["offset"])
                    mark(s)
        for t in objs.values():
            mark(t)
        tables = self.find_tables(objs)
        self.tables = tables
        listed = {}
        for tb in tables:
            for i, t in enumerate(tb["entries"]):
                if t is not None and t not in listed:
                    listed[t] = (tb["offset"], i)
        self.listed = listed
        roots = set(listed) | {o for o in objs if o not in referenced}
        return [objs[o] for o in sorted(roots)]

    def count_nodes(self, o):
        n = 0
        stack = [o]
        while stack:
            x = stack.pop()
            n += 1
            for k in ("sibling_data", "child_data"):
                if x.get(k) is not None:
                    stack.append(x[k])
        return n


# ------------------------------------------------------------------ motions

MOTION_BITS = [(0x1, "pos"), (0x2, "ang"), (0x4, "scl"), (0x8, "vec"), (0x10, "vert"),
               (0x20, "norm"), (0x40, "target"), (0x80, "roll"), (0x100, "angle"),
               (0x200, "color"), (0x400, "intensity"), (0x800, "spot"), (0x1000, "point"),
               (0x2000, "quat")]


def parse_motion(rom, off, nodes):
    """NJS_MOTION (sa_tools Animation.cs): mdata*, u32 nbFrame, u16 type, u16 inp_fn.
    mdata holds, per node, one pointer per type bit then one u32 key count per bit.
    pos/scl keys: s32 frame, float3; ang keys: s32 frame, s32 x3 (BAMS)."""
    if off is None or off % 4 or off + 12 > rom.n:
        return None
    md = rom.off(rom.u32(off))
    frames = rom.u32(off + 4)
    mtype = rom.u16(off + 8)
    inp = rom.u16(off + 10)
    if md is None or not (0 < frames < 100000) or mtype == 0 or mtype & ~0x3FFF:
        return None
    bits = [(b, n) for b, n in MOTION_BITS if mtype & b]
    if len(bits) != (inp & 0xF):
        return None
    interp = {0: "linear", 0x40: "spline", 0x80: "user"}.get(inp & 0xC0, "?")
    out = {"offset": "0x%x" % off, "frames": frames, "type": "0x%x" % mtype,
           "interp": interp, "nodes": []}
    p = md
    for i in range(nodes):
        ptrs = [rom.u32(p + 4 * k) for k in range(len(bits))]
        cnts = [rom.u32(p + 4 * (len(bits) + k)) for k in range(len(bits))]
        p += 8 * len(bits)
        node = {}
        for (b, name), ptr, cnt in zip(bits, ptrs, cnts):
            if not ptr or not cnt:
                continue
            ko = rom.off(ptr)
            if ko is None or cnt > 10000:
                return None
            keys = []
            for k in range(cnt):
                fr = rom.u32(ko + 16 * k)
                if name == "ang":
                    v = [rom.s32(ko + 16 * k + 4 + 4 * j) for j in range(3)]
                else:
                    v = [round(x, 5) for x in rom.f3(ko + 16 * k + 4)]
                keys.append([fr] + v)
            node[name] = keys
        out["nodes"].append(node)
    return out


def find_motions(rom, min_entries=3):
    """Pointer tables whose entries parse as NJS_MOTIONs (node count unknown
    here, so each is parsed for one node to validate)."""
    found = {}
    for o in range(0, rom.n - 4, 4):
        mo = rom.off(rom.u32(o))
        if mo is None or mo in found:
            continue
        m = parse_motion(rom, mo, 1)
        if m is not None:
            found[mo] = m
    return found


# -------------------------------------------------------------------- math

def njsincos(bams):
    a = (bams & 0xFFFF) * (2 * math.pi / 65536.0)
    return math.sin(a), math.cos(a)


def mat_identity():
    return [[1.0, 0, 0, 0], [0, 1.0, 0, 0], [0, 0, 1.0, 0], [0, 0, 0, 1.0]]


def mat_mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def rot_x(b):
    s, c = njsincos(b)
    return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]


def rot_y(b):
    s, c = njsincos(b)
    return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]


def rot_z(b):
    s, c = njsincos(b)
    return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]


def local_matrix(o, ang=None, pos=None, scl=None):
    """Column-vector matrix for v' = M v (translate * rotate * scale).

    The UNIT flags only say the object's own value is the identity; a channel a motion keys still
    applies - the Music buttons' icons are UNIT_SCL and their motion scales them."""
    f = o["evalflags"]
    keyed = {"pos": pos is not None, "ang": ang is not None, "scl": scl is not None}
    pos = pos or o["pos"]
    ang = ang or o["ang"]
    scl = scl or o["scl"]
    m = mat_identity()
    if keyed["pos"] or not f & EVAL_UNIT_POS:
        m = mat_mul(m, [[1, 0, 0, pos[0]], [0, 1, 0, pos[1]], [0, 0, 1, pos[2]], [0, 0, 0, 1]])
    if keyed["ang"] or not f & EVAL_UNIT_ANG:
        if f & EVAL_ZXY_ANG:  # vertex gets Z, then X, then Y
            m = mat_mul(m, mat_mul(rot_y(ang[1]), mat_mul(rot_x(ang[0]), rot_z(ang[2]))))
        else:  # vertex gets X, then Y, then Z
            m = mat_mul(m, mat_mul(rot_z(ang[2]), mat_mul(rot_y(ang[1]), rot_x(ang[0]))))
    if keyed["scl"] or not f & EVAL_UNIT_SCL:
        m = mat_mul(m, [[scl[0], 0, 0, 0], [0, scl[1], 0, 0], [0, 0, scl[2], 0], [0, 0, 0, 1]])
    return m


def xform_point(m, v):
    return [m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] + m[i][3] for i in range(3)]


def xform_normal(m, n):
    # rotation + (possibly non-uniform) scale: use inverse-transpose of the 3x3
    a = [[m[i][j] for j in range(3)] for i in range(3)]
    det = (a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
           - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
           + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]))
    if abs(det) < 1e-12:
        r = [sum(a[i][j] * n[j] for j in range(3)) for i in range(3)]
    else:
        cof = [[(a[(i + 1) % 3][(j + 1) % 3] * a[(i + 2) % 3][(j + 2) % 3]
                 - a[(i + 1) % 3][(j + 2) % 3] * a[(i + 2) % 3][(j + 1) % 3]) for j in range(3)]
               for i in range(3)]
        r = [sum(cof[i][j] * n[j] for j in range(3)) for i in range(3)]
    ln = math.sqrt(sum(x * x for x in r)) or 1.0
    return [x / ln for x in r]


def _hex(c):
    return "#%06x" % (c & 0xFFFFFF)


# ------------------------------------------------------------------- flatten

def flatten(root, name=None, include_siblings=False, apply_root_transform=False, motion=None, only=None):
    """Flatten one root tree to a triangle mesh in model space.

    With `only`, an object's offset, the mesh is that one node's own geometry, in its own space: the
    rest of the tree is still walked, because chunk material state carries on in draw order, but only
    that node's triangles are kept.


    The root's own siblings are separate roots in the ROM layout we have seen,
    so by default only root + its children are walked; children's siblings are
    always walked.
    """
    positions, normals, colors, indices, uvs = [], [], [], [], []
    # Runs of triangles that draw alike: a texture or none, and the strip's own flags.
    parts = []
    materials = []
    flags = {"strip_flags": {}, "blend": set(), "textured": False, "vertex_colors": False,
             "eval_flags": set(), "cached_lists": 0}
    vbuf = {}  # Ninja vertex buffer: index -> (pos, normal, col) in model space
    cache = {}  # NJD_CB_CP polygon list cache
    nodes = []
    winding = {"agree": 0, "disagree": 0}

    def emit_polys(chunks, mat_state):
        state = mat_state
        i = 0
        while i < len(chunks):
            c = chunks[i]
            i += 1
            k = c["kind"]
            if k == "bits" and c["type"] == 0x04:  # cache the rest of this list
                cache[c["list"]] = chunks[i:]
                flags["cached_lists"] += 1
                return state
            if k == "bits" and c["type"] == 0x05:
                state = emit_polys(cache.get(c["list"], []), state)
                continue
            if k == "bits" and c["type"] == 0x01:
                flags["blend"].add("%s/%s" % (c["src"], c["dst"]))
                continue
            if k == "bits" and c["type"] == 0x03:
                state = dict(state, exponent=c["exponent"])
                continue
            if k == "texture":
                flags["textured"] = True
                state = dict(state, texid=c["texid"])
                continue
            if k == "material":
                state = dict(state)
                for key in ("diffuse", "ambient", "specular", "exponent"):
                    if key in c:
                        state[key] = c[key]
                state["blend"] = "%s/%s" % (c["src"], c["dst"])
                flags["blend"].add(state["blend"])
                mat = {"diffuse": _hex(state.get("diffuse", 0xFFFFFFFF)),
                       "alpha": (state.get("diffuse", 0xFFFFFFFF) >> 24) & 0xFF,
                       "ambient": _hex(state["ambient"]) if "ambient" in state else None,
                       "specular": _hex(state["specular"]) if "specular" in state else None,
                       "exponent": state.get("exponent"),
                       "blend": state["blend"], "offset": "0x%x" % c["offset"]}
                materials.append(mat)
                state["mat_index"] = len(materials) - 1
                continue
            if k == "strip":
                sf = c["flags"]
                for bit, nm in STRIP_FLAG_NAMES:
                    if sf & bit:
                        flags["strip_flags"][nm] = flags["strip_flags"].get(nm, 0) + 1
                if c["strips"] and c["strips"][0]["uvs"]:
                    flags["textured"] = True
                d = state.get("diffuse", 0xFFFFFFFF)
                mcol = [(d >> 16) & 0xFF, (d >> 8) & 0xFF, d & 0xFF, (d >> 24) & 0xFF]
                # UVN coordinates are 1/256ths, UVH 1/1024ths (sa_tools PolyChunk.cs).
                uv_scale = 1024.0 if c["type"] in (0x42, 0x45, 0x48, 0x4B) else 256.0
                textured = bool(c["strips"] and c["strips"][0]["uvs"])
                part = {"start": len(indices), "count": 0,
                        "texid": state.get("texid") if textured or sf & 0x40 else None,
                        "flags": [nm for bit, nm in STRIP_FLAG_NAMES if sf & bit]}
                for s in c["strips"]:
                    base = len(positions) // 3
                    for j, vi in enumerate(s["indices"]):
                        p, n, vc = vbuf[vi]
                        positions.extend(p)
                        normals.extend(n if n else [0.0, 0.0, 0.0])
                        if s["colors"]:
                            col = s["colors"][j]
                            flags["vertex_colors"] = True
                        elif vc:
                            col = vc
                            flags["vertex_colors"] = True
                        else:
                            col = mcol
                        colors.extend(col)
                        if s["uvs"]:
                            u, v = s["uvs"][j]
                            uvs.extend([u / uv_scale, v / uv_scale])
                        else:
                            uvs.extend([0.0, 0.0])
                    ln = len(s["indices"])
                    # sa_tools VertexData.cs: first triangle (0,1,2) unless the
                    # strip is reversed, then alternate. Checked against the
                    # stored vertex normals (flags.winding_check): this order is
                    # already counter-clockwise for outward normals in Ninja's
                    # right-handed model space, so no swap is needed.
                    for t in range(ln - 2):
                        odd = (t & 1) == 1
                        if odd != s["reversed"]:
                            tri = (base + t + 1, base + t, base + t + 2)
                        else:
                            tri = (base + t, base + t + 1, base + t + 2)
                        # degenerate triangles are strip stitches
                        if len({tuple(positions[3 * x:3 * x + 3]) for x in tri}) < 3:
                            continue
                        _check_winding(positions, normals, tri, winding)
                        indices.extend(tri)
                part["count"] = len(indices) - part["start"]
                if part["count"]:
                    parts.append(part)
                continue
        return state

    gstate = {"s": {}}  # Ninja's chunk material state is global, in draw order

    def walk(o, parent, is_root):
        # model space: the root's own placement is reported, not applied
        if is_root and not apply_root_transform:
            m = parent
        else:
            m = mat_mul(parent, local_matrix(o))
        flags["eval_flags"].add("0x%x" % o["evalflags"])
        md = o["model_data"]
        nodes.append({"object": "0x%x" % o["offset"], "model": "0x%x" % md["offset"] if md else None,
                      "evalflags": "0x%x" % o["evalflags"], "pos": o["pos"], "ang": o["ang"],
                      "scl": o["scl"]})
        if md is not None and not o["evalflags"] & EVAL_HIDE:
            keep = only is None or o["offset"] == only
            vm = mat_identity() if only is not None and keep else m
            for vc in md["vertex_chunks"]:
                for j, p in enumerate(vc["positions"]):
                    n = vc["normals"][j]
                    vbuf[vc["index_offset"] + j] = (
                        xform_point(vm, p), xform_normal(vm, n) if n else None, vc["colors"][j])
            marks = [len(x) for x in (positions, normals, colors, indices, uvs, parts)]
            gstate["s"] = emit_polys(md["poly_chunks"], gstate["s"])
            if not keep:
                for x, n in zip((positions, normals, colors, indices, uvs, parts), marks):
                    del x[n:]
        if o["child_data"] is not None and not o["evalflags"] & EVAL_BREAK:
            walk(o["child_data"], m, False)
        if o["sibling_data"] is not None and (include_siblings or not is_root):
            walk(o["sibling_data"], parent, False)

    walk(root, mat_identity(), True)
    if positions:
        mn = [min(positions[i::3]) for i in range(3)]
        mx = [max(positions[i::3]) for i in range(3)]
    else:
        mn = mx = [0, 0, 0]
    flags["blend"] = sorted(flags["blend"])
    flags["eval_flags"] = sorted(flags["eval_flags"])
    flags["winding_check"] = winding
    flags["root_transform"] = {"evalflags": "0x%x" % root["evalflags"], "pos": root["pos"],
                               "ang_bams": root["ang"],
                               "ang_deg": [round(a * 360.0 / 65536, 3) for a in root["ang"]],
                               "scl": root["scl"], "applied": apply_root_transform}
    flags["nodes"] = nodes
    if motion is not None:
        flags["motion"] = motion
    return {"name": name or "obj_%x" % root["offset"], "root": "0x%x" % root["offset"],
            "positions": [round(x, 5) for x in positions],
            "normals": [round(x, 5) for x in normals],
            "colors": colors, "indices": indices, "uvs": [round(x, 5) for x in uvs], "parts": parts,
            "bounds": {"min": mn, "max": mx}, "materials": materials, "flags": flags}


def _check_winding(pos, nrm, tri, acc):
    a, b, c = [pos[3 * i:3 * i + 3] for i in tri]
    u = [b[k] - a[k] for k in range(3)]
    v = [c[k] - a[k] for k in range(3)]
    fn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    vn = [sum(nrm[3 * i + k] for i in tri) for k in range(3)]
    d = sum(fn[k] * vn[k] for k in range(3))
    if d > 0:
        acc["agree"] += 1
    elif d < 0:
        acc["disagree"] += 1


def extract(data, names=None, apply_root_transform=False):
    """Return (meshes, info): one flattened mesh per root object found in data,
    and the object/motion pointer tables found alongside them."""
    sc = Scanner(data)
    roots = sc.find_roots()
    names = names or {}
    motions = find_motion_tables(sc, roots)
    meshes = []
    for r in roots:
        mesh = flatten(r, names.get(r["offset"]), apply_root_transform=apply_root_transform,
                       motion=motions.get(r["offset"]))
        if r["offset"] in sc.listed:
            t, i = sc.listed[r["offset"]]
            mesh["flags"]["table"] = {"table": "0x%x" % t, "index": i}
        meshes.append(mesh)
    info = {"object_tables": [{"offset": "0x%x" % t["offset"],
                               "entries": [("0x%x" % e) if e is not None else None
                                           for e in t["entries"]]} for t in sc.tables],
            "unassigned_motions": sc.unassigned_motions}
    return meshes, info


def motion_node_count(rom, off):
    """NJS_MOTIONs here store mdata directly before the motion struct, so the
    node count is the gap divided by the per-node mdata size."""
    md = rom.off(rom.u32(off))
    nbits = rom.u16(off + 10) & 0xF
    gap = off - md
    if md is None or nbits == 0 or gap <= 0 or gap % (8 * nbits):
        return None
    return gap // (8 * nbits)


def find_motion_tables(sc, roots):
    """Parse every NJS_MOTION found in the ROM and pair it with a root when
    the evidence is in the data: same node count and its pos keys start at
    the root's pos, or its ang keys hold the root's X/Y tilt. Scale-only
    motions cannot be paired by value; they are returned unassigned."""
    rom = sc.rom
    out, unassigned = {}, []
    for mo in sorted(find_motions(rom)):
        n = motion_node_count(rom, mo)
        if n is None:
            continue
        m = parse_motion(rom, mo, n)
        if m is None:
            continue
        m["node_count"] = n
        cands = []
        for r in roots:
            if sc.count_nodes(r) != n and n != 1:
                continue
            k = m["nodes"][0]
            score = 0
            if "pos" in k:
                if all(abs(k["pos"][0][1 + j] - r["pos"][j]) < 1e-3 for j in range(3)):
                    score += 2
                else:
                    continue
            if "ang" in k:
                if k["ang"][0][1] == r["ang"][0] and r["ang"][0] != 0:
                    score += 1
                else:
                    continue
            if score:
                cands.append((score, r["offset"]))
        cands.sort(reverse=True)
        if cands and (len(cands) == 1 or cands[0][0] > cands[1][0]):
            k = m["nodes"][0]
            m["paired_by"] = "+".join(x for x in ("pos", "ang") if x in k) + " keys match root"
            out.setdefault(cands[0][1], []).append(m)
        else:
            m["candidates"] = ["0x%x" % c[1] for c in cands]
            unassigned.append(m)
    # second pass: an ang-only motion with several candidates goes to the one
    # root left without a motion of its own (recorded as by elimination)
    for m in list(unassigned):
        left = [c for c in m.get("candidates", []) if int(c, 16) not in out]
        if len(left) == 1:
            m["paired_by"] = "ang keys, by elimination"
            out.setdefault(int(left[0], 16), []).append(m)
            unassigned.remove(m)
    sc.unassigned_motions = unassigned
    return out


if __name__ == "__main__":
    import sys
    rom = open(sys.argv[1], "rb").read()
    outdir = sys.argv[2] if len(sys.argv) > 2 else "."
    names = {}
    if len(sys.argv) > 3:
        names = {int(k, 16): v for k, v in json.load(open(sys.argv[3])).items()}
    meshes, info = extract(rom, names)
    for mesh in meshes:
        nt = len(mesh["indices"]) // 3
        print(mesh["root"], mesh["name"], mesh["flags"].get("table"), "verts",
              len(mesh["positions"]) // 3, "tris", nt,
              "mats", [(m["diffuse"], m["alpha"]) for m in mesh["materials"]][:4],
              "winding", mesh["flags"]["winding_check"],
              "motions", [(m["offset"], m["frames"], m["type"]) for m in mesh["flags"].get("motion", [])])
        with open("%s/%s.json" % (outdir, mesh["name"]), "w") as f:
            json.dump(mesh, f)
    with open("%s/_tables.json" % outdir, "w") as f:
        json.dump(info, f, indent=1)


def tree_nodes(root):
    """Every object in a root's tree, in Ninja's draw order - the order motions key their nodes in."""
    out = []

    def walk(o, is_root):
        out.append(o)
        if o["child_data"] is not None:
            walk(o["child_data"], False)
        if o["sibling_data"] is not None and not is_root:
            walk(o["sibling_data"], False)

    walk(root, True)
    return out


def node_world(root, frame_keys=None):
    """Each node's world matrix, root at the origin, with its pos/ang/scl taken from `frame_keys`
    ({node index: {"pos": [...], "ang": [...], "scl": [...]}}) where given."""
    nodes = tree_nodes(root)
    index = {o["offset"]: i for i, o in enumerate(nodes)}
    out = {}

    def walk(o, parent, is_root):
        k = (frame_keys or {}).get(index[o["offset"]], {})
        m = mat_mul(parent, local_matrix(o, ang=k.get("ang"), pos=k.get("pos"), scl=k.get("scl")))
        out[o["offset"]] = m
        if o["child_data"] is not None and not o["evalflags"] & EVAL_BREAK:
            walk(o["child_data"], m, False)
        if o["sibling_data"] is not None and not is_root:
            walk(o["sibling_data"], parent, False)

    walk(root, mat_identity(), True)
    return out


def keys_at(motion, frame):
    """A motion's keys for every node at one frame, holding the last key before it."""
    out = {}
    for i, node in enumerate(motion["nodes"]):
        k = {}
        for ch, keys in node.items():
            got = [x for x in keys if x[0] <= frame]
            if got:
                k[ch] = got[-1][1:]
        out[i] = k
    return out


def motion_at(rom_bytes, table, index, root):
    """The motion a motion table lists at `index`, for the tree under `root`, or None."""
    rom = Rom(rom_bytes)
    off = rom.off(rom.u32(table + 4 * index))
    if off is None:
        return None
    return parse_motion(rom, off, len(tree_nodes(root)))


def texlist(rom_bytes, table, index, texture_names):
    """The texture list a texlist table gives the object at `index`: NJS_TEXLIST is (NJS_TEXNAME*,
    count), each NJS_TEXNAME (filename*, attr, texaddr); here a filename points at a record whose
    first word is the texture's GBIX header, 16 bytes before its PVRT chunk."""
    rom = Rom(rom_bytes)
    tl = rom.off(rom.u32(table + 4 * index))
    if tl is None:
        return []
    names_at, n = rom.off(rom.u32(tl)), rom.u32(tl + 4)
    out = []
    for j in range(n):
        rec = rom.off(rom.u32(names_at + 12 * j))
        gbix = rom.off(rom.u32(rec)) if rec is not None else None
        out.append(texture_names.get(gbix + 16) if gbix is not None else None)
    return out
