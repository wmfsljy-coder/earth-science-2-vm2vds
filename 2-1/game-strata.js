/* =========================================================================
   지층 순서 퍼즐 — earth-science-2/2-1 (응용 실험실 게임 · 2026-11)
   레벨형 상대연령 퍼즐. 공용 엔진 K.iso 블록 모형(밝은 스튜디오·흰 판정 카드)으로 새로 그린다.
   단면 계산: 사건 목록(퇴적·침식·기울어짐·습곡·단층·관입·융기·침강)을 시간 거꾸로 되짚어
   단면의 한 점이 어떤 암석인지 정한다. 판정 규칙 전문은 _review/esslab/e1/game.md.
   ========================================================================= */
(function () {
  "use strict";
  var K = window.sthKit;
  if (!K) return;
  var LT = K.LT, KEY = "sth-game-eshs-2-1-strata";
  var L = 560, D = 130, ZT = 320, LW = 610;
  function $(id) { return document.getElementById(id); }
  var cv = $("g-cv"), ctx = window.setupCanvas(cv), W = cv._w, H = cv._h;
  var I = K.iso({ ox: 268, oy: 296, s: 0.68, L: L, D: D, cv: cv });

  var ROCK = {
    sand: { n: "사암", c: [214, 182, 122] }, shale: { n: "셰일", c: [120, 124, 136] }, lime: { n: "석회암", c: [224, 218, 198] },
    mud: { n: "이암", c: [170, 118, 86] }, congl: { n: "역암", c: [178, 152, 118] },
    granite: { n: "화강암", c: [228, 164, 156] }, dike: { n: "화성암", c: [186, 84, 78] }
  };
  var PEB0 = [[230, 220, 203], [154, 160, 168], [201, 143, 106]];
  function rgb(c, f) { f = f || 1; return "rgb(" + Math.min(255, Math.round(c[0] * f)) + "," + Math.min(255, Math.round(c[1] * f)) + "," + Math.min(255, Math.round(c[2] * f)) + ")"; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function bat(s) { var c = String(s).slice(-1), n = c.charCodeAt(0); if (n >= 0xAC00 && n <= 0xD7A3) return (n - 0xAC00) % 28 !== 0; return /[LMNRlmnr013678]/.test(c); }
  function j(s, t) { var b = bat(s), m = { "은": b ? "은" : "는", "이": b ? "이" : "가", "을": b ? "을" : "를" }; return s + m[t]; }
  function circ(i) { return "①②③④⑤⑥⑦⑧⑨⑩"[i] || String(i + 1); }

  /* ---------- 암석 단위와 순서 카드 ---------- */
  function bed(letter, rock, peb) { return { kind: "bed", key: letter, rock: rock, n: letter + "층", lab: letter + "층 · " + ROCK[rock].n, peb: peb ? peb.map(function (r) { return ROCK[r].c; }).concat([[154, 160, 168]]) : null }; }
  function ign(letter, rock) { return { kind: "int", key: letter, rock: rock, n: (rock === "granite" ? "화강암 " : "화성암 ") + letter, lab: letter + " · " + ROCK[rock].n + " 관입" }; }
  function evItem(kind, key) {
    if (kind === "fault") return { kind: "fault", key: key, n: "단층 " + key, lab: key + " · 단층" };
    return { kind: "unc", key: key, n: "부정합면 " + key, lab: key + " · 부정합(융기·침식)" };
  }
  function dep(k, th) { return { t: "dep", unit: k, th: th }; }

  /* ---------- 단면 계산 ---------- */
  function eroZ(e, u) { return e.lv + e.amp * (0.6 * Math.sin(u / 23 + e.sd) + 0.4 * Math.sin(u / 9.7 + e.sd * 2.3)); }
  function planeU(e, z) { return e.u0 - e.dir * z * e.ct; }
  function intM(e, u, z) {
    if (e.shape === "dike") { var c = e.u + z * e.sl, hw = e.w / 2 * (1 + 0.14 * Math.sin(z / 15 + e.u)); return Math.abs(u - c) - hw; }
    var du = u - e.u, tz = e.top - du * du / e.k, sl = 2 * du / e.k;
    return (z - tz) / Math.sqrt(1 + sl * sl);
  }
  /* Q: 사건 n개가 일어난 뒤 (u, z) 의 암석. 없으면 null(공기·물) */
  function Q(ev, u, z, n) {
    if (n <= 0) return null;
    var e = ev[n - 1], r, d;
    switch (e.t) {
      case "dep":
        r = Q(ev, u, z, n - 1);
        if (r) return r;
        return z <= e.level ? { k: e.unit, u0: u, z0: z, f: 0 } : null;
      case "ero":
        d = eroZ(e, u);
        if (z > d) return null;
        r = Q(ev, u, z, n - 1);
        if (r && z > d - 1.8) r.f |= 2;
        return r;
      case "tilt": return Q(ev, u, z - (u - L / 2) * e.tn, n - 1);
      case "fold": return Q(ev, u, z - e.A * Math.sin((u + e.ph) * 6.2832 / e.lam), n - 1);
      case "fault":
        d = (u - planeU(e, z)) * e.dir;
        r = d > 0 ? Q(ev, u - e.s * e.cu, z - e.s * e.cz, n - 1) : Q(ev, u, z, n - 1);
        if (r && Math.abs(d) * e.sn < 1.4) r.f |= 1;
        return r;
      case "int":
        r = Q(ev, u, z, n - 1);
        if (!r) return null;
        d = intM(e, u, z);
        if (d < 0) {
          if (e.xeno) for (var i = 0; i < e.xeno.length; i++) {
            var x = e.xeno[i], a = (u - x[0]) / x[2], b = (z - x[1]) / x[3];
            if (a * a + b * b < 1) return { k: x[4], u0: u + 500, z0: z, f: 0 };
          }
          return { k: e.unit, u0: u, z0: z, f: 0 };
        }
        if (e.bw && d < e.bw) r.f |= 8;
        return r;
    }
    return Q(ev, u, z, n - 1);
  }
  function topAt(ev, u, n) { for (var z = ZT + 220; z > -80; z -= 3) if (Q(ev, u, z, n)) return z; return 0; }
  function meanTop(ev, n) { var s = 0, c = 0; for (var u = 10; u < L; u += 45) { s += topAt(ev, u, n); c++; } return s / c; }
  function build(evs) {
    var ev = clone(evs), any = false;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.t === "fault") { var a = e.dip * Math.PI / 180; e.ct = 1 / Math.tan(a); e.sn = Math.sin(a); e.cu = e.dir * Math.cos(a); e.cz = -Math.sin(a); }
      if (e.t === "tilt") e.tn = Math.tan(e.ang * Math.PI / 180);
      if (e.t === "dep") { e.level = (any ? meanTop(ev, i) : 0) + e.th; any = true; }
    }
    return ev;
  }

  /* ---------- 단면 그림(앞면·오른쪽 면 텍스처) ---------- */
  function hash(a, b) { var h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function paint(U, u0, z0, f, px, q) {
    var cc = ROCK[U.rock].c, ui = Math.floor(u0), zi = Math.floor(z0), h = hash(ui, zi), m = 0.94 + 0.09 * h;
    switch (U.rock) {
      case "sand": if (h > 0.93) m *= 0.74; else if (h < 0.05) m *= 1.13; break;
      case "shale": if (((zi % 5) + 5) % 5 === 0) m *= 0.8; break;
      case "lime":
        var row = Math.floor(z0 / 13), zm = z0 - row * 13;
        if (zm < 1.1) m *= 0.8; else if ((((ui + (row & 1) * 17) % 34) + 34) % 34 < 1.2) m *= 0.84; break;
      case "mud": if (((zi % 9) + 9) % 9 === 0) m *= 0.9; if (h > 0.96) m *= 0.85; break;
      case "congl":
        var cx = Math.floor(u0 / 10), cz = Math.floor(z0 / 10), rr = 2.3 + 2.6 * hash(cx + 5, cz + 9);
        var dx = u0 - (cx * 10 + 2.5 + hash(cx, cz + 77) * 5), dz = z0 - (cz * 10 + 2.5 + hash(cx + 31, cz) * 5), dd = Math.sqrt(dx * dx + dz * dz);
        if (dd < rr) { var pal = U.peb || PEB0; cc = pal[Math.floor(hash(cx + 3, cz + 1) * pal.length)]; m = dd > rr - 0.9 ? 0.55 : 1.04 + (dz - dx) * 0.02; }
        break;
      case "granite": case "dike":
        var lx = ((u0 % 12) + 12) % 12 - 6, lz = ((z0 % 12) + 12) % 12 - 6;
        if ((Math.abs(lx) < 0.9 && Math.abs(lz) < 3.6) || (Math.abs(lz) < 0.9 && Math.abs(lx) < 3.6)) m *= 0.6;
        else if (h > 0.92) m *= 0.7; else if (h < 0.05) m *= 1.15;
        break;
    }
    var r = cc[0] * m, g = cc[1] * m, b = cc[2] * m;
    if (f & 8) { r *= 0.8; g *= 0.66; b *= 0.62; }
    if (f & 2) { r *= 0.6; g *= 0.6; b *= 0.6; }
    if (f & 1) { r = 40; g = 34; b = 44; }
    px[q] = r; px[q + 1] = g; px[q + 2] = b; px[q + 3] = 255;
  }
  function edgePass(kk, px, w, h) {
    for (var z = 0; z < h; z++) for (var u = 0; u < w; u++) {
      var o = z * w + u, k = kk[o]; if (k < 0) continue;
      var a = z + 1 < h ? kk[o + w] : k, b = u + 1 < w ? kk[o + 1] : k;
      if ((a >= 0 && a !== k) || (b >= 0 && b !== k)) { var q = o * 4; px[q] *= 0.55; px[q + 1] *= 0.55; px[q + 2] *= 0.55; }
    }
  }
  function render(units, ev) {
    var n = ev.length, kk = new Int16Array(L * ZT).fill(-1), ff = new Uint8Array(L * ZT), top = new Float32Array(L), u, z, o, r, any = false;
    var cF = document.createElement("canvas"); cF.width = L; cF.height = ZT;
    var gF = cF.getContext("2d"), im = gF.createImageData(L, ZT), px = im.data;
    for (z = 0; z < ZT; z++) for (u = 0; u < L; u++) {
      r = Q(ev, u + 0.5, z + 0.5, n); if (!r) continue;
      o = z * L + u; kk[o] = r.k; ff[o] = r.f; top[u] = z + 1; any = true;
      paint(units[r.k], r.u0, r.z0, r.f, px, o * 4);
    }
    edgePass(kk, px, L, ZT); gF.putImageData(im, 0, 0);
    var cR = document.createElement("canvas"); cR.width = D; cR.height = ZT;
    var gR = cR.getContext("2d"), im2 = gR.createImageData(D, ZT), p2 = im2.data, k2 = new Int16Array(D * ZT).fill(-1), y;
    for (z = 0; z < ZT; z++) {
      r = Q(ev, L - 0.5, z + 0.5, n); if (!r) continue;
      for (y = 0; y < D; y++) { o = z * D + y; k2[o] = r.k; paint(units[r.k], r.u0 + (D - y), r.z0, r.f & 10, p2, o * 4); }
    }
    edgePass(k2, p2, D, ZT); gR.putImageData(im2, 0, 0);
    return { cF: cF, cR: cR, kk: kk, ff: ff, top: top, units: units, any: any };
  }
  function anchors(G) {
    var kk = G.kk, ff = G.ff, out = {}, u, z, o;
    G.units.forEach(function (U, k) {
      if (U.kind === "bed") {
        for (u = 4; u < L; u += 8) {
          var best = null, s = -1;
          for (z = 0; z <= ZT; z++) {
            var on = z < ZT && kk[z * L + u] === k;
            if (on) { if (s < 0) s = z; } else if (s >= 0) { if (z - s >= 12 && (!best || z - s > best[1] - best[0])) best = [s, z]; s = -1; }
          }
          if (best) { out[k] = { u: u, z: (best[0] + best[1]) / 2 }; break; }
        }
      } else {
        var su = 0, sz = 0, c = 0;
        for (o = 0; o < kk.length; o += 2) if (kk[o] === k) { su += o % L; sz += Math.floor(o / L); c++; }
        if (!c) return;
        var cu = Math.round(su / c), cz = sz / c, bz = -1, bd = 1e9;
        for (z = 0; z < ZT; z++) if (kk[z * L + cu] === k && Math.abs(z - cz) < bd) { bd = Math.abs(z - cz); bz = z; }
        if (bz >= 0) out[k] = { u: cu, z: bz };
      }
    });
    var fc = [], uc = [];
    for (o = 0; o < ff.length; o += 2) {
      u = o % L; z = Math.floor(o / L);
      if (ff[o] & 1) fc.push([u, z]);
      if ((ff[o] & 2) && z < G.top[u] - 4) uc.push([u, z]);
    }
    if (fc.length) { fc.sort(function (a, b) { return a[1] - b[1]; }); var fp = fc[Math.floor(fc.length * 0.42)]; out.fault = { u: fp[0], z: fp[1] }; }
    if (uc.length) { uc.sort(function (a, b) { return Math.abs(a[0] - L * 0.86) - Math.abs(b[0] - L * 0.86); }); out.unc = { u: uc[0][0], z: uc[0][1] }; }
    return out;
  }

  /* ---------- 상태 ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 막힘 */ } }
  function fresh() { return { lv: 1, open: 1, done: {}, rd: {}, free: 0 }; }
  var S = load() || fresh();
  ["lv", "open", "free"].forEach(function (k) { if (typeof S[k] !== "number") S[k] = fresh()[k]; });
  S.done = S.done || {}; S.rd = S.rd || {};
  var TEACHER = !!window.STH_TEACHER;
  function isOpen(n) { return TEACHER || (n === 5 ? S.open >= 3 : n <= S.open); }
  var R = null, UI = null;

  var LVN = { 1: "지층 누중", 2: "사건 끼워 넣기", 3: "이야기로 쌓기", 4: "틀린 곳 찾기", 5: "자유 단면" };
  var TOT = { 1: 2, 2: 3, 3: 2, 4: 4 };
  var SUM = {
    1: "지층이 뒤집히지 않았다면 아래 층일수록 먼저 쌓였습니다(지층 누중의 법칙). 기울어진 지층도 층리를 따라 아래부터 읽습니다.",
    2: "뚫거나 끊은 쪽(관입암·단층)이 나중, 깎인 면 위가 나중(부정합), 조각으로 들어간 암석이 먼저(포획암·기저 역암)입니다.",
    3: "지층은 바다 밑에서 수평으로 쌓이고, 휘거나 끊긴 뒤, 솟아 깎이고, 다시 가라앉아 쌓입니다. 부정합 하나에는 융기·침식·침강이 모두 들어 있습니다.",
    4: "복원한 순서는 이웃한 두 단계마다 ‘어떤 법칙으로 앞뒤가 정해지는가’를 하나씩 확인해야 틀린 곳을 찾을 수 있습니다."
  };
  var PRN = {
    sup: { n: "지층 누중의 법칙", d: "뒤집히지 않았다면 아래 층이 먼저" },
    hor: { n: "수평 퇴적의 법칙", d: "지층은 처음에 수평으로 쌓인다" },
    cut: { n: "관입의 법칙", d: "뚫거나 끊은 쪽(관입암·단층)이 나중" },
    unc: { n: "부정합의 법칙", d: "깎인 면 위의 지층은 침식 뒤에 쌓였다" },
    inc: { n: "포획암·기저 역암", d: "조각으로 들어간 암석이 먼저" }
  };
  var PRL = ["sup", "hor", "cut", "unc", "inc"];

  function base(lv, idx, kind) {
    return {
      lv: lv, idx: idx, total: TOT[lv] || 0, kind: kind, xeno: {}, clast: {}, items: [], truth: [], labItems: [],
      big1: (lv === 5 ? "자유" : "레벨 " + lv) + " · " + LVN[lv],
      big2: lv === 5 ? "단면 " + (S.free + 1) + "번" : "문제 " + (idx + 1) + " / " + TOT[lv],
      cardTitle: lv === 5 ? "자유 단면 · 푼 단면 " + S.free + "개" : "레벨 " + lv + " · 문제 " + (idx + 1) + "/" + TOT[lv],
      head: "순서를 맞춰 보세요"
    };
  }
  function finishOrder(R0) {
    R0.truth = R0.items.map(function (it) { return it.key; });
    if (!R0.labItems.length) R0.labItems = R0.items.slice();
    var t; do { t = shuffle(R0.truth); } while (t.join() === R0.truth.join());
    R0.tray = t;
    return R0;
  }
  function lets(n) { var a = "ABCDEF".split("").slice(0, n), s; do { s = shuffle(a); } while (s.join() === a.join()); return s; }

  /* ---------- 레벨 1: 지층 누중 ---------- */
  function lv1(idx) {
    var R0 = base(1, idx, "order"), rocks = shuffle(["sand", "shale", "lime", "mud", "congl"]), nb = idx ? 4 : 5, lt = lets(nb), ev = [], units = [], i;
    for (i = 0; i < nb; i++) units.push(bed(lt[i], rocks[i]));
    if (!idx) { ev.push(dep(0, 66)); for (i = 1; i < nb; i++) ev.push(dep(i, ri(46, 56))); }
    else { [110, 70, 70, 90].forEach(function (t, k) { ev.push(dep(k, t)); }); ev.push({ t: "tilt", ang: 15 }); ev.push({ t: "ero", lv: 245, amp: 4, sd: 2 }); }
    R0.units = units; R0.ev = build(ev); R0.items = units.slice();
    R0.goal = idx ? "지각 변동으로 <b>기울어진</b> 지층입니다. 가장 먼저 쌓인 층부터 가장 나중에 쌓인 층까지 차례로 놓으세요."
      : "가로로 쌓인 지층 다섯 장입니다. <b>가장 먼저 쌓인 층</b>부터 <b>가장 나중에 쌓인 층</b>까지 차례로 놓으세요.";
    R0.cardGoal = idx ? "기울어진 지층 4장을 먼저 쌓인 것부터 차례로" : "지층 5장을 먼저 쌓인 것부터 차례로";
    R0.tip = "어느 층이 맨 아래에 있나요?";
    R0.win = idx ? "기울어져 있어도 층리를 따라 아래에 놓인 층이 먼저입니다. 지층은 수평으로 쌓인 뒤 나중에 기울어졌습니다(수평 퇴적의 법칙)." : "아래에서 위로 갈수록 젊어집니다(지층 누중의 법칙).";
    return finishOrder(R0);
  }
  /* ---------- 레벨 2: 사건 끼워 넣기 ---------- */
  function lv2(idx) {
    var R0 = base(2, idx, "order"), lt = lets(5), units, ev;
    if (idx === 0) {
      units = [bed(lt[0], "sand"), bed(lt[1], "shale"), bed(lt[2], "lime"), ign("P", "dike"), bed(lt[3], "congl", ["dike", "lime"]), bed(lt[4], "mud")];
      ev = [dep(0, 80), dep(1, 55), dep(2, 75), { t: "int", shape: "dike", unit: 3, u: 300, w: 30, sl: 0.12, bw: 3 }, { t: "ero", lv: 178, amp: 6, sd: 1 }, dep(4, 32), dep(5, 70)];
      R0.items = [units[0], units[1], units[2], units[3], evItem("unc", "U"), units[4], units[5]];
      R0.clast[lt[3]] = ["P"];
      R0.goal = "지층 다섯 장, 화성암 P, 부정합면 U가 있습니다. <b>일어난 순서대로</b> 모두 놓으세요. (U 카드는 ‘땅이 솟아 깎인 일’입니다.)";
      R0.cardGoal = "지층·관입·부정합을 일어난 순서대로";
      R0.win = "P는 " + lt[2] + "층까지 뚫었지만 부정합면 U에서 잘렸고, 그 위 " + lt[3] + "층(역암)에는 P의 자갈이 들어 있습니다.";
    } else if (idx === 1) {
      units = [bed(lt[0], "mud"), bed(lt[1], "sand"), bed(lt[2], "shale"), bed(lt[3], "lime"), ign("P", "dike")];
      ev = [dep(0, 80), dep(1, 60), dep(2, 60), dep(3, 70), { t: "fault", u0: 360, dip: 60, dir: 1, s: 45 }, { t: "int", shape: "dike", unit: 4, u: 290, w: 28, sl: -0.05, bw: 3 }];
      R0.items = [units[0], units[1], units[2], units[3], evItem("fault", "F"), units[4]];
      R0.goal = "단층 F와 화성암 P가 있습니다. P가 단층에서 <b>어긋났는지</b> 잘 보고, 일어난 순서대로 놓으세요.";
      R0.cardGoal = "지층·단층·관입을 일어난 순서대로";
      R0.win = "P는 단층 F를 가로지르는데도 어긋나지 않았으므로 단층이 먼저, 관입이 나중입니다.";
    } else {
      units = [bed(lt[0], "sand"), bed(lt[1], "shale"), bed(lt[2], "lime"), ign("G", "granite"), bed(lt[3], "congl", ["granite", "granite", "lime"]), bed(lt[4], "mud")];
      ev = [dep(0, 90), dep(1, 60), dep(2, 70), { t: "int", shape: "stock", unit: 3, u: 330, top: 215, k: 420, bw: 7, xeno: [[330, 168, 13, 6, 2], [296, 150, 9, 5, 2], [372, 146, 9, 5, 2], [282, 118, 9, 5, 1]] },
        { t: "ero", lv: 188, amp: 5, sd: 3 }, dep(4, 30), dep(5, 65)];
      R0.items = [units[0], units[1], units[2], units[3], evItem("unc", "U"), units[4], units[5]];
      R0.xeno.G = [lt[2], lt[1]]; R0.clast[lt[3]] = ["G"];
      R0.goal = "화강암 G 속의 <b>조각</b>, G 둘레의 <b>열을 받아 변한 부분</b>, 위 역암 속 <b>자갈</b>을 단서로 일어난 순서대로 놓으세요.";
      R0.cardGoal = "포획암·변성 부분·자갈을 단서로 순서대로";
      R0.win = "G 속에 " + lt[2] + "·" + lt[1] + "층 조각(포획암)이 있으니 G가 나중이고, " + lt[3] + "층 바닥 자갈에 G 조각이 있으니 G가 먼저 깎였습니다.";
    }
    R0.units = units; R0.ev = build(ev);
    R0.tip = "자른 쪽이 나중, 덮은 쪽이 나중";
    return finishOrder(R0);
  }
  /* ---------- 레벨 3: 이야기로 쌓기 ---------- */
  function card(id, t, lab, name, e) { return { id: id, t: t, lab: lab, name: name, e: e }; }
  function lv3(idx) {
    var R0 = base(3, idx, "build");
    R0.head = "사건 카드를 놓으세요";
    if (idx === 0) {
      R0.units = [bed("A", "sand"), bed("B", "shale"), bed("C", "lime"), bed("D", "congl", ["lime", "shale"]), ign("P", "dike")];
      R0.cards = [
        card("dA", "dep", "퇴적 · 사암 A", "A층", dep(0, 100)), card("dB", "dep", "퇴적 · 셰일 B", "B층", dep(1, 60)), card("dC", "dep", "퇴적 · 석회암 C", "C층", dep(2, 70)),
        card("fold", "fold", "습곡 (휘어짐)", "습곡", { t: "fold", A: 42, lam: 380, ph: 40 }), card("up", "up", "융기 (솟아오름)", "융기", { t: "up" }),
        card("ero", "ero", "침식 (깎임)", "침식", { t: "ero", lv: 168, amp: 4, sd: 1 }), card("sub", "sub", "침강 (가라앉음)", "침강", { t: "sub" }),
        card("dD", "dep", "퇴적 · 역암 D", "D층", dep(3, 70)),
        card("flt", "fault", "단층 (끊어짐)", "단층", { t: "fault", u0: 390, dip: 60, dir: 1, s: 40 }),
        card("int", "int", "관입 (마그마)", "관입", { t: "int", shape: "dike", unit: 4, u: 420, w: 28, sl: 0.06, bw: 3 })];
      R0.target = ["dA", "dB", "dC", "fold", "up", "ero", "sub", "dD"];
      R0.story = [["dA", "얕은 바다 밑에 모래가 쌓여 사암층 A가 되었습니다."], ["dB", "그 위에 고운 진흙이 쌓여 셰일층 B가 되었습니다."], ["dC", "이어서 석회질 물질이 쌓여 석회암층 C가 되었습니다."],
        ["fold", "양쪽에서 미는 힘을 오랫동안 받아 지층이 물결처럼 휘었습니다."], ["up", "땅이 솟아올라 바다 위로 드러났습니다."], ["ero", "비와 바람, 강물이 윗부분을 깎아 냈습니다."],
        ["sub", "땅이 다시 바다 밑으로 가라앉았습니다."], ["dD", "깎인 면 위에 자갈이 쌓여 역암층 D가 되었습니다."]];
      R0.goal = "이야기를 읽고 <b>사건 카드를 일어난 순서대로</b> 놓아 단면을 만드세요. 놓을 때마다 단면이 쌓입니다. 이야기에 없는 카드도 섞여 있습니다.";
      R0.cardGoal = "이야기대로 카드를 놓아 목표 단면 만들기";
      R0.win = "습곡 → 융기 → 침식 → 침강 → 퇴적. 휘어진 지층 위에 수평 지층이 놓인 경사 부정합이 이렇게 만들어집니다.";
    } else {
      R0.units = [bed("A", "sand"), bed("B", "mud"), bed("C", "lime"), bed("D", "shale"), ign("P", "dike")];
      R0.cards = [
        card("dA", "dep", "퇴적 · 사암 A", "A층", dep(0, 95)), card("dB", "dep", "퇴적 · 이암 B", "B층", dep(1, 65)), card("dC", "dep", "퇴적 · 석회암 C", "C층", dep(2, 85)),
        card("flt", "fault", "단층 (끊어짐)", "단층", { t: "fault", u0: 400, dip: 60, dir: 1, s: 36 }), card("up", "up", "융기 (솟아오름)", "융기", { t: "up" }),
        card("ero", "ero", "침식 (깎임)", "침식", { t: "ero", lv: 190, amp: 5, sd: 2 }), card("sub", "sub", "침강 (가라앉음)", "침강", { t: "sub" }),
        card("dD", "dep", "퇴적 · 셰일 D", "D층", dep(3, 70)),
        card("int", "int", "관입 (마그마)", "관입", { t: "int", shape: "dike", unit: 4, u: 150, w: 26, sl: 0.08, bw: 3 }),
        card("fold", "fold", "습곡 (휘어짐)", "습곡", { t: "fold", A: 40, lam: 360, ph: 0 })];
      R0.target = ["dA", "dB", "dC", "flt", "up", "ero", "sub", "dD", "int"];
      R0.story = shuffle([["dA", "바다 밑에 모래가 쌓여 사암층 A가 되었습니다."], ["dB", "진흙이 쌓여 이암층 B가 되었습니다."], ["dC", "석회질 물질이 쌓여 석회암층 C가 되었습니다."],
        ["flt", "잡아당기는 힘에 지층이 끊어지며 한쪽이 미끄러져 내려앉았습니다."], ["up", "땅이 솟아 물 밖으로 드러났습니다."], ["ero", "드러난 땅의 윗부분이 깎여 평평해졌습니다."],
        ["sub", "땅이 다시 바다 밑으로 가라앉았습니다."], ["dD", "고운 진흙이 쌓여 셰일층 D가 되었습니다."], ["int", "마그마가 모든 지층을 뚫고 올라와 굳었습니다."]]);
      R0.shuffled = true;
      R0.goal = "이야기 조각의 <b>순서가 뒤섞였습니다</b>. 오른쪽 카드의 <b>목표 단면</b>을 보고, 똑같은 단면이 되도록 카드를 순서대로 놓으세요.";
      R0.cardGoal = "목표 단면과 똑같이 되도록 카드 놓기";
      R0.win = "단층이 생긴 뒤 융기·침식·침강으로 부정합이 생기고, 마지막 관입이 D층까지 모두 뚫었습니다.";
    }
    R0.cardMap = {}; R0.cards.forEach(function (c) { R0.cardMap[c.id] = c; });
    R0.tray = shuffle(R0.cards.map(function (c) { return c.id; }));
    R0.targetEv = build(cardsToEv(R0, R0.target)); R0.tsea = rules(R0, R0.target).sea;
    R0.labItems = R0.units.slice();
    R0.tip = "바다에서 쌓이고, 물 밖에서 깎입니다";
    return R0;
  }
  function cardsToEv(R0, ids) { return ids.map(function (id) { return clone(R0.cardMap[id].e); }); }
  function rules(R0, seq) {
    var sea = true;
    for (var i = 0; i < seq.length; i++) {
      var c = R0.cardMap[seq[i]];
      if (c.t === "dep" && !sea) return { bad: i, sea: sea, s: "육지에서는 바다 퇴적층이 쌓이지 않아요", m: "‘" + c.lab + "’: 지금은 땅이 물 밖에 드러나 있습니다. 이 지층은 바다 밑에서 쌓이므로 먼저 <b>침강</b>으로 땅이 가라앉아야 합니다." };
      if (c.t === "ero" && sea) return { bad: i, sea: sea, s: "바다 밑에서는 깎이지 않아요", m: "‘침식’: 지금은 바다 밑입니다. 비·바람·강물에 깎이려면 먼저 <b>융기</b>로 물 밖에 드러나야 합니다." };
      if (c.t === "up") { if (!sea) return { bad: i, sea: sea, s: "이미 육지예요", m: "‘융기’: 땅은 이미 물 밖에 드러나 있습니다." }; sea = false; }
      if (c.t === "sub") { if (sea) return { bad: i, sea: sea, s: "이미 바다 밑이에요", m: "‘침강’: 땅은 이미 바다 밑에 있습니다. 가라앉으려면 먼저 솟아 있어야 합니다." }; sea = true; }
    }
    return { sea: sea };
  }
  /* ---------- 레벨 4: 틀린 곳 찾기 ---------- */
  var CASES4 = [
    function () {
      var u = [bed("A", "sand"), bed("B", "shale"), bed("C", "lime"), bed("D", "mud"), ign("P", "dike")];
      return { units: u, ev: [dep(0, 75), dep(1, 55), dep(2, 60), dep(3, 65), { t: "int", shape: "dike", unit: 4, u: 380, w: 30, sl: -0.08, bw: 3 }], lab: u.slice(),
        steps: ["A층이 쌓였다", "C층이 쌓였다", "B층이 쌓였다", "D층이 쌓였다", "P가 관입했다"], pair: [1, 2], ok: ["sup"], hl: ["B", "C"],
        explain: "B층이 C층보다 <b>아래</b>에 있으므로 B층이 먼저 쌓였습니다. 지층이 뒤집히지 않았다면 아래에 놓인 층일수록 먼저 쌓였습니다(<b>지층 누중의 법칙</b>).",
        fixed: ["A층", "B층", "C층", "D층", "P 관입"], hint: "B층과 C층 가운데 어느 층이 아래에 있는지 보세요." };
    },
    function () {
      var u = [bed("A", "mud"), bed("B", "sand"), bed("C", "shale"), bed("D", "lime"), ign("P", "dike")];
      return { units: u, ev: [dep(0, 80), dep(1, 60), dep(2, 60), dep(3, 65), { t: "int", shape: "dike", unit: 4, u: 300, w: 28, sl: 0.05, bw: 3 }, { t: "fault", u0: 420, dip: 60, dir: 1, s: 45 }],
        lab: u.concat([evItem("fault", "F")]),
        steps: ["A층이 쌓였다", "B층이 쌓였다", "C층이 쌓였다", "D층이 쌓였다", "단층 F가 생겼다", "P가 관입했다"], pair: [4, 5], ok: ["cut"], hl: ["P", "F"],
        explain: "화성암 P가 단층 F를 따라 <b>어긋나 있습니다</b>. 끊긴 쪽이 먼저, 끊은 쪽이 나중이므로 P가 먼저 관입하고 그 뒤에 단층 F가 생겼습니다(<b>관입의 법칙</b> — 자르는 관계). 단층이 먼저였다면 P는 단층면을 끊김 없이 가로질렀을 것입니다.",
        fixed: ["A층", "B층", "C층", "D층", "P 관입", "단층 F"], hint: "P를 따라 위아래로 훑어보세요. 단층 F를 지나는 곳에서 P가 끊겨 있나요?" };
    },
    function () {
      var u = [bed("A", "sand"), bed("B", "shale"), bed("C", "lime"), bed("D", "congl", ["lime", "shale", "sand"]), bed("E", "mud")];
      return { units: u, ev: [dep(0, 110), dep(1, 70), dep(2, 80), { t: "tilt", ang: 20 }, { t: "ero", lv: 200, amp: 5, sd: 2 }, dep(3, 30), dep(4, 60)],
        lab: [u[0], u[1], u[2], evItem("unc", "U"), u[3], u[4]],
        steps: ["A층이 쌓였다", "B층이 쌓였다", "지층이 기울어졌다", "C층이 쌓였다", "땅이 솟아 깎였다 (부정합 U)", "D층이 쌓였다", "E층이 쌓였다"], pair: [2, 3], ok: ["hor"], hl: ["C"],
        explain: "C층도 A·B층과 <b>나란히 기울어져</b> 있습니다. 지층은 처음에 수평으로 쌓이므로(<b>수평 퇴적의 법칙</b>), C층까지 수평으로 쌓인 다음에 셋이 함께 기울어졌습니다. 기울어진 뒤에 C층이 쌓였다면 C층은 D·E층처럼 수평으로 놓였을 것입니다.",
        fixed: ["A층", "B층", "C층", "기울어짐", "부정합 U", "D층", "E층"], hint: "C층의 기울기를 A·B층, 그리고 D·E층과 비교해 보세요." };
    },
    function () {
      var u = [bed("A", "shale"), bed("B", "sand"), ign("G", "granite"), bed("C", "congl", ["granite", "granite", "sand"]), bed("D", "mud")];
      return { units: u, ev: [dep(0, 100), dep(1, 90), { t: "int", shape: "stock", unit: 2, u: 300, top: 205, k: 380, bw: 8, xeno: [[300, 150, 10, 6, 1], [255, 120, 8, 5, 0]] },
        { t: "ero", lv: 172, amp: 5, sd: 4 }, dep(3, 32), dep(4, 70)],
        lab: [u[0], u[1], u[2], evItem("unc", "U"), u[3], u[4]],
        steps: ["A층이 쌓였다", "B층이 쌓였다", "땅이 솟아 깎였다 (부정합 U)", "화강암 G가 관입했다", "C층이 쌓였다", "D층이 쌓였다"], pair: [2, 3], ok: ["inc", "unc"], hl: ["G", "C", "U"],
        explain: "C층 바닥의 역암 속에 <b>화강암 G의 자갈</b>이 들어 있고, 부정합면 U가 G의 윗부분을 깎아 냈습니다. G가 먼저 관입해 굳은 뒤 땅이 솟아 깎이면서, G의 부스러기가 C층의 자갈(<b>기저 역암</b>)이 되었습니다. G 둘레의 A·B층에만 열을 받아 변한 부분이 있고 C층에는 없는 것은 G가 C층보다 먼저라는 증거입니다. 다만 이것만으로는 G와 침식(U)의 앞뒤를 정할 수 없고, 그 앞뒤는 G 윗부분이 깎인 모습과 C층 바닥의 G 자갈로 정합니다.",
        fixed: ["A층", "B층", "G 관입", "부정합 U", "C층", "D층"], hint: "C층 바닥의 자갈 색을 보세요. 분홍색 자갈은 어디에서 왔을까요?" };
    }
  ];
  function lv4(idx) {
    var R0 = base(4, idx, "error"), c = CASES4[idx]();
    R0.units = c.units; R0.ev = build(c.ev); R0.labItems = c.lab;
    ["steps", "pair", "ok", "hl", "explain", "fixed", "hint"].forEach(function (k) { R0[k] = c[k]; });
    R0.head = "틀린 단계를 찾으세요";
    R0.goal = "친구가 이 단면의 순서를 복원했는데 <b>한 군데가 틀렸습니다</b>. 틀린 단계를 누르고, 근거가 되는 법칙을 고른 뒤 판정하세요.";
    R0.cardGoal = "틀린 단계 하나와 그 까닭(법칙) 고르기";
    R0.tip = "이웃한 두 단계를 하나씩 확인";
    return R0;
  }
  /* ---------- 자유 단면: 무작위 ---------- */
  function genFree() {
    var R0 = base(5, 0, "order"), units = [], ev = [], items = [], lt = shuffle("ABCDEG".split(""))   /* F·P·U 는 사건 카드 글자라 지층 글자에서 뺀다 */, li = 0;
    var pats = [["P"], ["F"], ["U"], ["P", "U"], ["F", "U"], ["P", "F"], ["F", "P"], ["U", "P"], ["U", "F"], ["P", "U", "F"], ["F", "U", "P"]];
    var pat = pats[ri(0, pats.length - 1)], pool = ["sand", "shale", "lime", "mud"], last = "";
    var top = 0, low = 0, lastTh = 0, dike = null, dikeTop = 0, flt = null, fltTop = null, hasU = pat.indexOf("U") >= 0, nb = hasU ? 3 : ri(3, 4), i;
    function pick() { var r; do { r = pool[ri(0, pool.length - 1)]; } while (r === last); last = r; return r; }
    function addBed(th, rock, peb) { var U = bed(lt[li++], rock || pick(), peb); units.push(U); ev.push(dep(units.length - 1, th)); items.push(U); lastTh = th; top += th; low = top; return U; }
    function planeOK(u0, dir, ct) { var a = u0, b = u0 - dir * top * ct; return a > 60 && a < 500 && b > 60 && b < 500; }
    addBed(ri(70, 82)); for (i = 1; i < nb; i++) addBed(ri(46, 56));
    pat.forEach(function (p) {
      if (p === "P") {
        var sl = rnd(-0.1, 0.1), u, tries = 0;
        do {
          if (flt) { var zc = rnd(40, Math.max(50, (fltTop != null ? Math.min(low, fltTop) : low) - 40)); u = planeU(flt, zc) - zc * sl; } /* 단층이 부정합에 잘렸으면 부정합면 아래에서 만나게 */ else u = rnd(130, 430);
          tries++;
        } while (tries < 30 && (u < 70 || u > 490 || u + ZT * sl < 60 || u + ZT * sl > 500));
        var P = ign("P", "dike"); units.push(P);
        dike = { t: "int", shape: "dike", unit: units.length - 1, u: u, w: ri(24, 32), sl: sl, bw: 3 }; dikeTop = low;
        ev.push(dike); items.push(P);
      } else if (p === "F") {
        var dir = Math.random() < 0.5 ? 1 : -1, dip = ri(55, 68), ct = 1 / Math.tan(dip * Math.PI / 180), s = ri(36, 48) * (Math.random() < 0.3 ? -1 : 1), u0, t2 = 0;
        if (s < 0 && top + Math.abs(s) * Math.sin(dip * Math.PI / 180) > ZT - 12) s = -s;
        do {
          if (dike) { var z2 = rnd(40, Math.max(50, dikeTop - 35)); u0 = dike.u + z2 * dike.sl + dir * z2 * ct; }
          else u0 = 280 + dir * (top / 2) * ct + rnd(-50, 50);
          t2++;
        } while (t2 < 40 && !planeOK(u0, dir, ct));
        flt = { t: "fault", u0: u0, dip: dip, dir: dir, s: s, ct: ct };
        ev.push(flt); items.push(evItem("fault", "F"));
        var tv = s * Math.sin(dip * Math.PI / 180); low = Math.min(top, top - tv); top = Math.max(top, top - tv);
      } else {
        var lv = low - ri(10, Math.max(12, Math.min(24, lastTh - 16)));
        ev.push({ t: "ero", lv: lv, amp: 5, sd: rnd(0, 6) }); items.push(evItem("unc", "U"));
        if (dike) dikeTop = Math.min(dikeTop, lv);
        if (flt) fltTop = lv;   /* 단층은 부정합면 아래에만 남는다 */
        top = low = lv;
        var cg = addBed(ri(28, 36), "congl", dike ? ["dike", "dike", "lime"] : ["sand", "lime"]);
        if (dike) R0.clast[cg.key] = ["P"];
        if (top + 50 <= ZT - 20) addBed(ri(40, 50));
      }
    });
    R0.units = units; R0.ev = build(ev); R0.items = items;
    R0.goal = "새로 만든 단면입니다. 지층과 사건을 <b>일어난 순서대로</b> 놓으세요.";
    R0.cardGoal = "지층과 사건을 일어난 순서대로";
    R0.tip = "법칙 다섯 가지를 모두 써 보세요";
    R0.win = "새 단면을 또 풀어 보세요. 단면은 풀 때마다 새로 만들어집니다.";
    return finishOrder(R0);
  }
  var LEVELS = { 1: lv1, 2: lv2, 3: lv3, 4: lv4 };

  /* ---------- 판정 설명 ---------- */
  function item(key) { for (var i = 0; i < R.items.length; i++) if (R.items[i].key === key) return R.items[i]; return null; }
  function CARD(id) { return R.cardMap[id]; }
  function evIdx(t) { for (var i = 0; i < R.ev.length; i++) if (R.ev[i].t === t) return i; return -1; }
  function unitIdx(it) { var k = R.units.indexOf(it); if (k >= 0) return k; for (var i = 0; i < R.units.length; i++) if (R.units[i].key === it.key) return i; return -1; }
  /* 설명용(판정에는 쓰지 않음): 지층이 부정합면(침식 직후의 깎인 면)에 실제로 닿는지 — 깎인 면 바로 아래를 훑는다 */
  function touchesUnc(it) {
    var ne = evIdx("ero"), k = unitIdx(it), u, r;
    if (ne < 0 || k < 0) return true;
    for (u = 4; u < L; u += 6) { r = Q(R.ev, u, eroZ(R.ev[ne], u) - 2.5, ne + 1); if (r && r.k === k && r.u0 < u + 250) return true; }
    return false;
  }
  /* 설명용: 암맥과 단층이 그림에서 실제로 만나는지 — 관입 직전 단면에서 단층면이 남아 있는 높이에 암맥이 걸치는지 본다 */
  function dikeCrossesFault() {
    var nf = evIdx("fault"), ni = evIdx("int"), z, u, r;
    if (nf < 0 || ni < nf) return true;
    for (z = 2; z < ZT; z += 2) { u = planeU(R.ev[nf], z); r = Q(R.ev, u, z, ni); if (r && (r.f & 1) && intM(R.ev[ni], u, z) < 0) return true; }
    return false;
  }
  function why(x, y) {
    var a = x.kind, b = y.kind, X = x.n, Y = y.n;
    if (a === "bed" && b === "bed") return [j(X, "이") + " " + Y + "보다 아래 → " + X + " 먼저 (지층 누중)", j(X, "은") + " " + Y + "보다 아래에 있습니다. 지층이 뒤집히지 않았다면 아래에 있는 층이 먼저 쌓였습니다(<b>지층 누중의 법칙</b>)."];
    if (b === "int") {
      if (a === "bed") { var xe = (R.xeno[y.key] || []).indexOf(x.key) >= 0; return [j(Y, "이") + " " + j(X, "을") + " 뚫음 → " + X + " 먼저", j(Y, "이") + " " + j(X, "을") + " 뚫고 들어가 있습니다" + (xe ? ". 게다가 " + Y + " 속에 " + X + " 조각(<b>포획암</b>)이 박혀 있습니다" : "") + ". 뚫린 쪽이 먼저, 뚫은 쪽이 나중입니다(<b>관입의 법칙</b>)."]; }
      if (a === "fault") {
        if (evIdx("ero") >= 0 && !dikeCrossesFault()) return [Y + ": 부정합면 위 지층까지 뚫음 → 단층 먼저", j(X, "은") + " 부정합면에서 끊겨 그 위로 이어지지 않는데, " + j(Y, "은") + " 부정합면 위에 쌓인 지층까지 뚫었습니다. 그러므로 단층 → 융기·침식(부정합) → 관입 순서입니다(<b>부정합의 법칙</b>·<b>관입의 법칙</b>)."];
        return [Y + ": 단층에서 어긋나지 않음 → 단층 먼저", j(Y, "은") + " " + j(X, "을") + " 가로지르는데도 끊기거나 어긋나지 않았습니다. 단층이 먼저 생기고, 그 뒤에 마그마가 단층면을 뚫고 올라왔습니다(<b>관입의 법칙</b> — 자른 쪽이 나중)."];
      }
      if (a === "unc") return [Y + ": 부정합면 위 지층까지 뚫음", j(Y, "은") + " 부정합면 위에 쌓인 지층까지 뚫고 있습니다. 그러므로 침식(부정합)이 먼저이고 관입이 나중입니다(<b>관입의 법칙</b>)."];
    }
    if (b === "fault") {
      if (a === "bed") return [j(Y, "이") + " " + j(X, "을") + " 끊음 → " + X + " 먼저", j(Y, "이") + " " + j(X, "을") + " 끊어 어긋나게 했습니다. 끊긴 쪽이 먼저, 끊은 쪽이 나중입니다(<b>관입의 법칙</b>과 같은 ‘자르는 관계’)."];
      if (a === "int") return [X + "도 단층에서 어긋남 → " + X + " 먼저", X + "도 " + j(Y, "을") + " 따라 끊겨 어긋나 있습니다. 끊긴 쪽이 먼저이므로 " + j(X, "이") + " 먼저 생기고 단층이 나중입니다(<b>관입의 법칙</b> — 자르는 관계)."];
      if (a === "unc") return ["단층이 부정합면까지 끊음 → 부정합 먼저", j(Y, "이") + " 부정합면과 그 위 지층까지 끊었습니다. 그러므로 부정합(침식)이 먼저, 단층이 나중입니다."];
    }
    if (b === "unc") {
      if (a === "fault") return [X + ": 부정합면에서 끊김 → 단층 먼저", j(X, "은") + " 부정합면에서 끊겨 그 위 지층까지 이어지지 않습니다. 단층이 먼저 생기고, 그 뒤에 땅이 솟아 깎였습니다(<b>부정합의 법칙</b>)."];
      if (a === "int") { var cl0 = false; for (var kk in R.clast) if (R.clast[kk].indexOf(x.key) >= 0) cl0 = true; return ["부정합면이 " + j(X, "을") + " 깎음 → " + X + " 먼저", "부정합면이 " + X + "의 윗부분을 깎아 잘랐습니다" + (cl0 ? ". 그 위 역암 속에는 " + X + "의 자갈까지 들어 있습니다" : "") + ". 깎인 쪽이 먼저이고, 융기·침식은 그 뒤입니다."]; }
      if (!touchesUnc(x)) return [j(X, "은") + " 부정합면 아래 → " + X + " 먼저", j(X, "은") + " 부정합면 아래에 있습니다. 부정합면 아래의 지층은 모두 땅이 솟아 깎이기 전에 쌓였습니다(<b>부정합의 법칙</b>·<b>지층 누중의 법칙</b>)."];
      return ["부정합면이 " + j(X, "을") + " 깎음 → " + X + " 먼저", "부정합면이 " + X + "의 윗부분을 깎아 잘랐습니다. 깎인 쪽이 먼저이고, 융기·침식은 그 뒤입니다(<b>부정합의 법칙</b>)."];
    }
    if (a === "unc") return [Y + ": 부정합면 위 → 침식 먼저", j(Y, "은") + " 부정합면 위에 쌓였습니다" + (R.clast[y.key] ? "(바닥의 역암에 아래 암석의 자갈이 들어 있습니다)" : "") + ". 깎인 면 위의 지층은 침식이 끝나고 다시 가라앉은 뒤에 쌓였습니다(<b>부정합의 법칙</b>)."];
    if (a === "int" && b === "bed") { var cl = (R.clast[y.key] || []).indexOf(x.key) >= 0; return [Y + ": " + X + "에 뚫리지 않음 → " + X + " 먼저", j(Y, "은") + " " + X + "에 뚫리지 않고 그 위를 덮고 있습니다" + (cl ? ". 게다가 " + Y + " 바닥 자갈에 " + X + " 조각이 들어 있습니다(<b>기저 역암</b>)" : "") + ". 그러므로 " + j(X, "이") + " 먼저입니다(<b>관입의 법칙</b>)."]; }
    if (a === "fault" && b === "bed") return [Y + ": 단층에 끊기지 않음 → 단층 먼저", j(Y, "은") + " " + X + "에 끊기지 않았습니다. 단층이 먼저 생긴 뒤에 쌓인 지층입니다(<b>관입의 법칙</b> — 자른 쪽이 나중)."];
    return [j(X, "이") + " " + Y + "보다 먼저", j(X, "이") + " " + Y + "보다 먼저 일어났습니다."];
  }
  var DEF = { fold: "휘어져", fault: "끊어져", tilt: "기울어져" }, DEF2 = { fold: "휘어진", fault: "끊어진", tilt: "기울어진" };
  var NOTNEED = { fold: "목표 단면에는 물결처럼 휘어진 지층이 없습니다.", fault: "목표 단면에는 끊어져 어긋난 지층이 없습니다.", int: "목표 단면에는 지층을 뚫은 화성암이 없습니다.", tilt: "목표 단면에는 기울어진 지층이 없습니다." };
  function cn(c) { return c.name; }
  function whyB(x, y) {
    var a = x.t, b = y.t, X = cn(x), Y = cn(y);
    if (a === "dep" && b === "dep") return [X + "이 아래 → 먼저 (지층 누중)", "목표 단면에서 " + j(X, "은") + " " + Y + "보다 아래에 있습니다. 아래 층이 먼저 쌓였습니다(<b>지층 누중의 법칙</b>)."];
    if (a === "dep" && DEF[b]) return [X + "도 " + DEF[b] + " 있음 → " + X + " 먼저", "목표 단면에서는 " + X + "도 " + DEF[b] + " 있습니다. 그러므로 " + j(X, "이") + " 쌓인 다음에 " + j(Y, "이") + " 일어났습니다."];
    if (DEF[a] && b === "dep") return [Y + "은 수평 → " + X + " 먼저", "목표 단면에서 " + j(Y, "은") + " 수평으로 놓여 있습니다. 지층은 처음에 수평으로 쌓이므로(<b>수평 퇴적의 법칙</b>), " + j(X, "은") + " " + j(Y, "이") + " 쌓이기 전에 일어났습니다."];
    if (a === "dep" && b === "ero") return [X + " 윗부분이 깎임 → 쌓인 뒤 침식", "목표 단면에서 " + X + "의 윗부분이 깎여 있습니다. 먼저 쌓이고, 나중에 깎였습니다."];
    if (a === "ero" && b === "dep") return [Y + "은 깎인 면 위 → 침식 먼저", "목표 단면에서 " + j(Y, "은") + " 울퉁불퉁한 깎인 면(부정합면) 위에 놓여 있습니다. 침식이 먼저, 그 위의 퇴적이 나중입니다(<b>부정합의 법칙</b>)."];
    if (DEF[a] && b === "ero") return [DEF2[a] + " 지층 윗면이 깎임 → " + X + " 먼저", "목표 단면에서는 " + DEF2[a] + " 지층의 윗면이 깎여 있고, 깎인 면 자체는 " + DEF[a].replace("져", "지") + "지 않았습니다. 그러므로 " + j(X, "이") + " 먼저, 침식이 나중입니다."];
    if (a === "ero" && DEF[b]) return ["깎인 면도 " + DEF[b] + " 있음 → 침식 먼저", "목표 단면에서는 깎인 면(부정합면)까지 " + DEF[b] + " 있습니다. 침식이 먼저, " + j(Y, "이") + " 나중입니다."];
    if (b === "int") return ["관입이 " + (a === "dep" ? X + "까지" : "모든 지층을") + " 뚫음", "목표 단면에서 화성암 P는 " + (a === "dep" ? X + "까지" : "가장 위 지층까지 모두") + " 뚫고 있습니다. 뚫린 쪽이 먼저, 뚫은 쪽이 나중입니다(<b>관입의 법칙</b>)."];
    if (a === "int") return [Y + "은 P에 뚫리지 않음", "목표 단면에서 " + j(Y, "은") + " 화성암 P에 뚫리지 않았습니다. 그러므로 관입이 먼저입니다(<b>관입의 법칙</b>)."];
    return ["‘" + X + "’ 다음에 ‘" + Y + "’", "목표 단면을 만들려면 ‘" + X + "’ 다음에 ‘" + Y + "’가 와야 합니다. 퇴적은 바다 밑에서, 침식은 물 밖에서 일어난다는 것도 함께 생각해 보세요."];
  }
  function commute(a, b) { var s = { up: 1, sub: 1 }, g = { fold: 1, fault: 1, tilt: 1, int: 1 }; return !!((s[a.t] && g[b.t]) || (s[b.t] && g[a.t])); }
  function inversion(seq) {
    var T = R.target, pos = {};
    seq.forEach(function (id, i) { pos[id] = i; });
    for (var i = 0; i < T.length; i++) for (var k = i + 1; k < T.length; k++) {
      var a = CARD(T[i]), b = CARD(T[k]);
      if (pos[T[k]] < pos[T[i]] && !commute(a, b)) return [a, b];
    }
    return null;
  }
  function sameSection(evA, evB) {
    var same = 0, tot = 0;
    for (var u = 5; u < L; u += 10) for (var z = 5; z < ZT; z += 10) {
      var a = Q(evA, u, z, evA.length), b = Q(evB, u, z, evB.length); tot++;
      if ((a ? a.k : -1) === (b ? b.k : -1)) same++;
    }
    return same / tot;
  }
  function firstDiff(seq) { for (var i = 0; i < R.target.length; i++) if (seq[i] !== R.target[i]) return i; return -1; }
  function hintB(seq) {
    if (UI.wrong < 3) return "";
    var i = firstDiff(seq); if (i < 0) return "";
    var st = ""; (R.story || []).forEach(function (p) { if (p[0] === R.target[i]) st = p[1]; });
    return "<br>💡 <b>힌트</b>: " + (i + 1) + "번째 카드는 ‘" + CARD(R.target[i]).lab + "’입니다" + (st ? " — “" + st + "”" : ".");
  }

  /* ---------- 판정 ---------- */
  function setFb(ok, html, short) { UI.verdict = ok === null ? { ok: undefined, short: short } : { ok: ok, short: short }; UI.fb = html; UI.fbOk = ok; refresh(); }
  function judgeOrder() {
    var N = R.items.length, i;
    if (UI.seq.length < N) return setFb(null, "카드를 모두 놓아 주세요. (" + UI.seq.length + " / " + N + ")", "아직 " + (N - UI.seq.length) + "장 남았어요");
    for (i = 0; i < N; i++) if (UI.seq[i] !== R.truth[i]) break;
    if (i === N) return win(false);
    UI.wrong++;
    var x = item(R.truth[i]), y = item(UI.seq[i]), w = why(x, y);
    UI.marks = { good: i, bad: i }; UI.hl = [x.key, y.key];
    var msg = "<b>" + (i + 1) + "번째 자리</b>가 맞지 않습니다. " + w[1];
    if (UI.wrong >= 3) msg += "<br>💡 <b>힌트</b>: " + (i + 1) + "번째 자리에는 <b>" + x.lab + "</b> 카드가 들어갑니다.";
    setFb(false, msg, w[0]);
  }
  function judgeBuild() {
    var seq = UI.seq;
    if (!seq.length) return setFb(null, "카드를 눌러(또는 끌어다) 타임라인에 놓으세요.", "카드를 놓아 보세요");
    var rr = rules(R, seq);
    if (rr.bad != null) { UI.wrong++; UI.marks = { bad: rr.bad }; return setFb(false, rr.m + hintB(seq), rr.s); }
    var extra = seq.filter(function (id) { return R.target.indexOf(id) < 0; });
    if (extra.length) {
      UI.wrong++; var c = CARD(extra[0]); UI.marks = { bad: seq.indexOf(extra[0]) };
      return setFb(false, "‘" + c.lab + "’ 카드는 이 이야기에 없는 사건입니다. " + (NOTNEED[c.t] || "") + hintB(seq), "필요 없는 카드: " + c.name);
    }
    var miss = R.target.filter(function (id) { return seq.indexOf(id) < 0; });
    if (miss.length) return setFb(null, "아직 놓아야 할 사건 카드가 <b>" + miss.length + "장</b> 더 있습니다." + (UI.wrong >= 3 ? " 💡 빠진 카드 하나: ‘" + CARD(miss[0]).lab + "’" : ""), "사건 카드가 " + miss.length + "장 더 필요해요");
    if (rr.sea === R.tsea && sameSection(build(cardsToEv(R, seq)), R.targetEv) >= 0.99) return win(false);
    UI.wrong++;
    var p = inversion(seq);
    if (!p) return setFb(false, "목표 단면과 다릅니다. 두 단면을 다시 비교해 보세요." + hintB(seq), "목표 단면과 달라요");
    UI.marks = { bad: seq.indexOf(p[1].id) };
    var w = whyB(p[0], p[1]);
    setFb(false, "‘" + p[1].lab + "’ 카드가 너무 앞에 있습니다. " + w[1] + hintB(seq), w[0]);
  }
  function judgeErr() {
    if (UI.pick < 0) return setFb(null, "먼저 틀린 단계를 눌러 고르세요.", "틀린 단계를 고르세요");
    if (!UI.pr) return setFb(null, "근거가 되는 법칙도 골라 주세요.", "까닭(법칙)을 고르세요");
    var inPair = R.pair.indexOf(UI.pick) >= 0, okP = R.ok.indexOf(UI.pr) >= 0;
    if (inPair && okP) return win(false);
    UI.wrong++;
    var msg = !inPair ? "‘" + R.steps[UI.pick] + "’ 단계는 단면과 맞습니다. 다른 단계를 살펴보세요."
      : "틀린 곳은 잘 찾았습니다! 그런데 까닭이 다릅니다. ‘" + PRN[UI.pr].n + "’(" + PRN[UI.pr].d + ")으로는 이 두 단계의 앞뒤가 정해지지 않습니다.";
    if (UI.wrong >= 3) { msg += "<br>💡 <b>힌트</b>: " + R.hint; UI.hl = R.hl.slice(); }
    setFb(false, msg, !inPair ? "다른 단계를 살펴보세요" : "까닭을 다시 골라 보세요");
  }
  function chain() { return R.truth.map(function (k) { return item(k).n; }).join(" → "); }
  function win(helped) {
    UI.solved = true; UI.marks = null; UI.hl = [];
    var last = R.lv !== 5 && R.idx + 1 >= R.total, msg, short;
    if (R.kind === "error") { msg = R.explain + "<br><b>바른 순서</b>: " + R.fixed.join(" → "); short = "바른 순서: " + R.fixed.join("→"); }
    else if (R.kind === "build") { msg = "목표와 똑같은 단면이 만들어졌습니다. " + R.win; short = "목표와 같은 단면 완성"; }
    else { msg = "<b>순서</b>: " + chain() + "<br>" + R.win; short = "먼저 → 나중 순서 완성"; }
    msg = (helped ? "📖 정답을 확인했습니다. " : "✅ <b>정답입니다!</b> ") + msg;
    if (R.lv === 5) { if (!helped) S.free++; }
    else if (last) { S.done[R.lv] = 1; S.open = Math.max(S.open, R.lv + 1); S.rd[R.lv] = 0; UI.levelDone = true; msg += "<div class='g-sum'>🏁 <b>레벨 " + R.lv + " 정리</b> — " + SUM[R.lv] + "</div>"; }
    else S.rd[R.lv] = R.idx + 1;
    save();
    setFb(true, msg, short);
  }
  function showAnswer() {
    if (R.kind === "order") UI.seq = R.truth.slice();
    else if (R.kind === "build") { UI.seq = R.target.slice(); rebuild(); }
    else { UI.pick = R.pair[1]; UI.pr = R.ok[0]; }
    win(true);
  }

  /* ---------- 그리기 ---------- */
  var TREES = [[40, 30], [130, 95], [230, 40], [340, 100], [470, 35], [520, 100], [90, 62], [300, 66]];
  function block(G) {
    var top = G.top, sea = R.kind === "build" && UI.sea;
    function zf(u) { var i = Math.max(0, Math.min(L - 1, Math.round(u))); return Math.min(ZT, top[i]); }
    I.face(ctx, "front", function () { ctx.drawImage(G.cF, 0, 0, L, ZT); });
    I.face(ctx, "right", function () { ctx.drawImage(G.cR, 0, 0, D, ZT); });
    I.shade(ctx, "right", function () { return zf(L - 1); });
    I.shade(ctx, "front", zf);
    I.top(ctx, zf, function (i, u) {
      var ui = Math.max(0, Math.min(L - 1, Math.round(u))), t = top[ui];
      if (!sea && t < ZT) return i % 2 ? "#74a84b" : "#79ad4f";
      var k = G.kk[Math.max(0, Math.min(ZT, Math.round(t)) - 1) * L + ui];
      return k >= 0 ? rgb(ROCK[G.units[k].rock].c, 1.06) : "#cdb07a";
    }, 70);
    if (!sea) {
      var Rg = K.rng(7), i, q, x;
      for (i = 0; i < 240; i++) { x = Rg() * L; var yy = Rg() * D; if (zf(x) >= ZT) continue; q = I.P(x, yy, zf(x)); ctx.fillStyle = Rg() > 0.5 ? "rgba(40,90,30,.35)" : "rgba(190,235,150,.35)"; ctx.fillRect(q.x, q.y, 2, 1.2); }
      TREES.forEach(function (t, k) { if (zf(t[0]) < ZT - 2) I.tree(ctx, t[0], t[1], zf(t[0]), 0.8 + (k % 3) * 0.12); });
    } else {
      var mx = 0; for (var u = 0; u < L; u++) mx = Math.max(mx, zf(u));
      I.water(ctx, Math.min(ZT + 30, mx + 24), function (uu, side) { return side === "front" ? zf(uu) : zf(L - 1); }, {});
    }
    I.edges(ctx, zf(L - 1), zf(L - 1));
  }
  function emptyBlock() {
    I.box(ctx, 0, 0, -14, L, D, 0, "#d9c79f", "#bfae88", "#9c8e70");
    I.water(ctx, 70, function () { return 0; }, {});
    var p = I.P(L / 2, D / 2, 150);
    K.pill(ctx, "카드를 놓으면 여기에 지층이 쌓입니다", p.x, p.y, { s: 14, a: "center", c: "#ffffff", box: [0, LW] });
  }
  function labels(G) {
    if (!G.anch) G.anch = anchors(G);
    var A = G.anch, box = [0, LW], hl = UI.hlTemp || UI.hl, list = [];
    (R.labItems || []).forEach(function (it) {
      var k = G.units.indexOf(it), a = it.kind === "fault" ? A.fault : it.kind === "unc" ? A.unc : A[k];
      if (!a) return;
      var p = I.P(a.u, D, a.z), dx = 30, dy = 0;
      if (it.kind === "bed") dx = a.u < L * 0.5 ? Math.min(-18, 172 - p.x) : 30;
      else if (it.kind === "int") { dx = 34; dy = -22; }
      else if (it.kind === "fault") { dx = 30; dy = 18; }
      else { dx = 22; dy = 34; }
      list.push({ it: it, a: a, p: p, dx: dx, dy: dy, left: it.kind === "bed" && dx < 0 });
    });
    /* 왼쪽 이름표끼리 겹치지 않게 위아래로 벌린다 */
    var lefts = list.filter(function (o) { return o.left; }).sort(function (a, b) { return a.p.y - b.p.y; }), prev = -1e9;
    lefts.forEach(function (o) { var y = Math.max(o.p.y, prev + 24); o.dy = y - o.p.y; prev = y; });
    list.forEach(function (o) {
      var it = o.it, a = o.a, p = o.p, dx = o.dx, dy = o.dy;
      var on = hl.indexOf(it.key) >= 0, col = on ? "#ffd35a" : it.kind === "bed" ? "#ffffff" : it.kind === "int" ? "#ffc9c4" : it.kind === "fault" ? "#d6e4ff" : "#ffcf99";
      var txt = it.kind === "bed" ? it.lab : it.kind === "int" ? it.key + " · " + ROCK[it.rock].n : it.kind === "fault" ? "F 단층" : it.key + " 부정합면";
      if (on) { ctx.save(); ctx.strokeStyle = "#ffd35a"; ctx.lineWidth = 3; ctx.shadowColor = "#ffb000"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 6.2832); ctx.stroke(); ctx.restore(); }
      I.label(ctx, a.u, D, a.z, txt, dx, dy, col, box);
    });
  }
  function wrapT(s, x, y, w, lh, o) {
    ctx.font = (o.w || "700") + " " + o.s + "px " + K.FONT;
    var words = String(s).split(" "), line = "", lines = [];
    words.forEach(function (wd) { var t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > w && line) { lines.push(line); line = wd; } else line = t; });
    if (line) lines.push(line);
    lines.forEach(function (ln, i) { K.t(ctx, ln, x, y + i * lh, o); });
    return y + lines.length * lh;
  }
  function cut(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function cardPanel() {
    var RX = LW + 10, px = RX + 18, x1 = W - 18, cw = x1 - px, v = UI.verdict, bad = v && v.ok === false;
    K.card(ctx, RX, 0, W - RX, H, R.cardTitle);
    var head = UI.levelDone ? "레벨 완료!" : UI.solved ? "정답입니다!" : bad ? "다시 생각해 봐요" : R.head;
    K.t(ctx, head, px, 64, { s: 22, w: "900", c: UI.solved ? LT.green : bad ? LT.orange : LT.ink });
    var y = wrapT(R.cardGoal, px, 94, cw, 19, { s: 13, w: "700", c: LT.mute }) + 8;
    if (R.kind !== "error") {
      var nn = UI.seq.length, NN = R.kind === "order" ? R.items.length : R.target.length;
      K.row(ctx, R.kind === "order" ? "놓은 카드" : "놓은 사건 카드", nn + " / " + NN, px, x1, y + 8);
      K.bar(ctx, px, y + 18, cw, Math.min(1, nn / NN), UI.solved ? LT.green : LT.yellow);
      y += 46;
    }
    if (R.kind === "build") {
      K.row(ctx, "지금 이 땅은", UI.sea ? "바다 밑" : "물 밖(육지)", px, x1, y, UI.sea ? LT.blue : LT.green); y += 22;
      var th = cw * ZT / L;
      K.t(ctx, "목표 단면 (앞면)", px, y + 6, { s: 12, w: "800", c: LT.mute }); y += 16;
      ctx.save(); ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(px - 4, y - 4, cw + 8, th + 8, 8); ctx.fill();
      ctx.translate(px, y + th); ctx.scale(cw / L, -th / ZT); ctx.drawImage(R.timg.cF, 0, 0); ctx.restore();
      y += th + 12;
    }
    if (R.kind === "error") {
      K.row(ctx, "고른 단계", UI.pick >= 0 ? circ(UI.pick) + " " + cut(R.steps[UI.pick], 10) : "—", px, x1, y + 8);
      K.row(ctx, "고른 까닭", UI.pr ? cut(PRN[UI.pr].n, 11) : "—", px, x1, y + 36);
      y += 58;
    }
    if (v && v.short) wrapT(v.short, px, y + 12, cw, 18, { s: 12.5, w: "800", c: v.ok ? "#0f766e" : (bad ? "#b4400c" : LT.mute) });
    var tip = UI.tip || R.tip;
    K.tip(ctx, cut(tip, 22), px, H - 50, cw, UI.tip ? false : (UI.solved ? true : undefined));
  }
  function draw() {
    if (!R) return;
    ctx.clearRect(0, 0, W, H);
    var P0 = I.P(L, D, 0), G = UI.img;
    K.studio(ctx, 0, 0, LW, H, { x: P0.x - 110, y: P0.y - 30, rx: 320, ry: 56 });
    ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
    if (G && G.any) { block(G); labels(G); } else emptyBlock();
    ctx.restore();
    K.bigText(ctx, R.big1, 18, 48, 25, "#ffffff");
    K.bigText(ctx, UI.levelDone ? "레벨 완료!" : UI.solved ? "정답!" : R.big2, 18, 82, 18, UI.solved ? "#7ef0b8" : "#ffd35a");
    K.warn(ctx, 14, H - 14, "⚠ 두께·기울기는 보기 쉽게 과장");
    cardPanel();
  }
  cv._redraw = draw;

  /* ---------- 화면(카드·타임라인) ---------- */
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var ICON = { fold: "〰", fault: "⟋", up: "⬆", sub: "⬇", ero: "⛏", int: "🔥", tilt: "⤢" };
  function sw(c) { return "<i class='g-sw' style='background:" + rgb(c) + "'></i>"; }
  function chipHTML(key) {
    if (R.kind === "build") { var c = CARD(key); return (c.t === "dep" ? sw(ROCK[R.units[c.e.unit].rock].c) : "<i class='g-ic'>" + ICON[c.t] + "</i>") + "<span>" + c.lab + "</span>"; }
    var it = item(key);
    return (it.kind === "bed" || it.kind === "int" ? sw(ROCK[it.rock].c) : "<i class='g-ic'>" + (it.kind === "fault" ? "⟋" : "〰") + "</i>") + "<span>" + it.lab + "</span>";
  }
  function maxLen() { return R.kind === "order" ? R.items.length : R.cards.length; }
  function chip(key, where) {
    var b = mk("button", "g-chip", chipHTML(key));
    b.type = "button"; b.setAttribute("data-key", key);
    b.addEventListener("click", function () { if (b._drag) { b._drag = false; return; } tap(key, where); });
    b.addEventListener("pointerdown", function (e) { startDrag(e, b, key, where); });
    if (R.kind === "order") {
      var on = function () { UI.hlTemp = [key]; draw(); }, off = function () { UI.hlTemp = null; draw(); };
      b.addEventListener("pointerenter", on); b.addEventListener("pointerleave", off); b.addEventListener("focus", on); b.addEventListener("blur", off);
    }
    return b;
  }
  function tap(key, where) {
    if (UI.solved) return;
    var seq = UI.seq.slice(), i = seq.indexOf(key);
    if (where === "line") { if (i >= 0) seq.splice(i, 1); }
    else if (i < 0 && seq.length < maxLen()) seq.push(key);
    setSeq(seq);
  }
  function dropOn(key, where, t) {
    if (UI.solved) return;
    var seq = UI.seq.slice(), cur = seq.indexOf(key);
    if (t.id === "g-tray") { if (cur >= 0) { seq.splice(cur, 1); setSeq(seq); } return; }
    var idx = +t.getAttribute("data-slot");
    if (cur >= 0) seq.splice(cur, 1);
    else if (seq.length >= maxLen()) return;
    seq.splice(Math.min(idx, seq.length), 0, key);
    setSeq(seq);
  }
  function startDrag(e, el, key, where) {
    if (UI.solved || (e.pointerType === "mouse" && e.button !== 0)) return;
    var sx = e.clientX, sy = e.clientY, gh = null, over = null;
    function find(ev) { var t = document.elementFromPoint(ev.clientX, ev.clientY); return t ? t.closest("[data-slot], #g-tray") : null; }
    function mv(ev) {
      if (!gh) { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 8) return; gh = el.cloneNode(true); gh.className += " g-ghost"; document.body.appendChild(gh); el.classList.add("g-lift"); }
      gh.style.left = ev.clientX + "px"; gh.style.top = ev.clientY + "px";
      var t = find(ev); if (over !== t) { if (over) over.classList.remove("g-over"); over = t; if (t) t.classList.add("g-over"); }
      if (ev.cancelable) ev.preventDefault();
    }
    function done() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); if (gh) { gh.remove(); el.classList.remove("g-lift"); } if (over) over.classList.remove("g-over"); }
    function up(ev) { var had = !!gh, t = had ? find(ev) : null; done(); if (!had) return; el._drag = true; setTimeout(function () { el._drag = false; }, 0); if (t) dropOn(key, where, t); }
    function cancel() { done(); }
    window.addEventListener("pointermove", mv, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
  }
  function rebuild() {
    UI.img = render(R.units, build(cardsToEv(R, UI.seq)));
    var rr = rules(R, UI.seq); UI.sea = rr.bad != null ? seaAt(UI.seq) : rr.sea;
    UI.tip = rr.bad != null ? "⚠ " + rr.s : "";
  }
  function seaAt(seq) { var sea = true; seq.forEach(function (id) { var t = CARD(id).t; if (t === "up") sea = false; if (t === "sub") sea = true; }); return sea; }
  function setSeq(seq) {
    UI.seq = seq; UI.marks = null; UI.verdict = null; UI.fb = ""; UI.hl = [];
    if (R.kind === "build") rebuild();
    refresh();
  }
  function refresh() { panel(); draw(); }
  function panel() {
    var lvBox = $("g-levels"); lvBox.innerHTML = "";
    [1, 2, 3, 4, 5].forEach(function (n) {
      var open = isOpen(n), b = mk("button", "g-lv", (n === 5 ? "자유" : "레벨 " + n) + (S.done[n] ? " ✓" : open ? "" : " 🔒") + "<small>" + LVN[n] + "</small>");
      b.type = "button"; b.setAttribute("aria-pressed", String(S.lv === n)); b.disabled = !open;
      if (!open) b.title = n === 5 ? "레벨 2를 마치면 열립니다" : "레벨 " + (n - 1) + "을 마치면 열립니다";
      b.onclick = function () { if (!isOpen(n)) return; S.lv = n; save(); startRound(); };
      lvBox.appendChild(b);
    });
    $("g-goal").innerHTML = "🎯 " + R.goal;
    var st = $("g-story");
    if (R.kind === "build") {
      st.hidden = false;
      st.innerHTML = "<b>" + (R.shuffled ? "📜 뒤섞인 이야기 조각" : "📜 이야기") + "</b>" + (R.shuffled ? "<ul>" : "<ol>") + R.story.map(function (p) { return "<li>" + p[1] + "</li>"; }).join("") + (R.shuffled ? "</ul>" : "</ol>");
    } else st.hidden = true;
    var isErr = R.kind === "error";
    $("g-seqbox").hidden = isErr; $("g-errbox").hidden = !isErr;
    if (!isErr) {
      $("g-cap1").textContent = R.kind === "build" ? "일어난 순서 (먼저 → 나중) · 놓은 카드를 누르면 빠집니다" : "먼저 → 나중 (가장 오래된 것부터) · 카드를 눌러 놓거나 끌어다 놓으세요";
      $("g-cap2").textContent = R.kind === "build" ? "사건 카드 (필요 없는 카드도 섞여 있습니다)" : "카드";
      var line = $("g-line"); line.innerHTML = "";
      var nS = R.kind === "order" ? R.items.length : Math.min(R.cards.length, UI.seq.length + 1);
      for (var i = 0; i < nS; i++) {
        var s = mk("div", "g-slot"); s.setAttribute("data-slot", i);
        s.appendChild(mk("span", "g-num", String(i + 1)));
        var key = UI.seq[i];
        if (key) { s.classList.add("filled"); s.appendChild(chip(key, "line")); }
        else s.appendChild(mk("span", "g-ph", R.kind === "build" ? "여기에 놓기" : "빈자리"));
        if (UI.marks) { if (UI.marks.good != null && i < UI.marks.good) s.classList.add("good"); if (i === UI.marks.bad) s.classList.add("bad"); }
        if (UI.solved) s.classList.add("good");
        line.appendChild(s);
        if (i < nS - 1) line.appendChild(mk("span", "g-arr", "→"));
      }
      var tray = $("g-tray"); tray.innerHTML = "";
      R.tray.forEach(function (k) { if (UI.seq.indexOf(k) < 0) tray.appendChild(chip(k, "tray")); });
      if (!tray.children.length) tray.appendChild(mk("span", "g-ph", R.kind === "build" ? "남은 카드가 없습니다" : "모든 카드를 놓았습니다. ‘판정하기’를 누르세요."));
    } else {
      var ol = $("g-steps"); ol.innerHTML = "";
      R.steps.forEach(function (t, i) {
        var li = mk("li"), b = mk("button", "g-step" + (UI.pick === i ? " sel" : "") + (UI.solved && R.pair.indexOf(i) >= 0 ? " fix" : ""), "<b>" + circ(i) + "</b> " + t);
        b.type = "button"; b.onclick = function () { if (UI.solved) return; UI.pick = i; UI.verdict = null; UI.fb = ""; refresh(); };
        li.appendChild(b); ol.appendChild(li);
      });
      var pb = $("g-prs"); pb.innerHTML = "";
      PRL.forEach(function (id) {
        var b = mk("button", "g-pr" + (UI.pr === id ? " sel" : ""), "<b>" + PRN[id].n + "</b><small>" + PRN[id].d + "</small>");
        b.type = "button"; b.onclick = function () { if (UI.solved) return; UI.pr = id; UI.verdict = null; UI.fb = ""; refresh(); };
        pb.appendChild(b);
      });
    }
    $("g-check").hidden = UI.solved;
    $("g-clear").hidden = UI.solved || isErr;
    $("g-show").hidden = UI.solved || UI.wrong < 5;
    var nx = $("g-next"); nx.hidden = !UI.solved;
    nx.textContent = R.lv === 5 ? "새 단면 ▶" : UI.levelDone ? (R.lv < 4 ? "레벨 " + (R.lv + 1) + " ▶" : "자유 단면 ▶") : "다음 문제 ▶";
    var fb = $("g-fb"); fb.innerHTML = UI.fb || ""; fb.className = "g-fb" + (UI.fbOk === true ? " ok" : UI.fbOk === false ? " bad" : "");
  }
  function startRound() {
    if (!isOpen(S.lv)) S.lv = 1;
    var lv = S.lv, idx = Math.min(S.rd[lv] || 0, (TOT[lv] || 1) - 1);
    R = lv === 5 ? genFree() : LEVELS[lv](idx);
    UI = { seq: [], wrong: 0, solved: false, verdict: null, fb: "", fbOk: null, hl: [], hlTemp: null, marks: null, pick: -1, pr: null, sea: true, tip: "", levelDone: false, img: null };
    if (R.kind === "build") { R.timg = render(R.units, R.targetEv); UI.img = render(R.units, []); }
    else UI.img = render(R.units, R.ev);
    save(); refresh();
  }
  $("g-check").onclick = function () { if (R.kind === "order") judgeOrder(); else if (R.kind === "build") judgeBuild(); else judgeErr(); };
  $("g-clear").onclick = function () { setSeq([]); };
  $("g-show").onclick = showAnswer;
  $("g-next").onclick = function () { if (R.lv !== 5 && UI.levelDone) S.lv = Math.min(5, R.lv + 1); startRound(); };
  $("g-reset").onclick = function () { S.rd[S.lv] = 0; startRound(); };
  var wipeT = 0;
  $("g-wipe").onclick = function () {
    var b = $("g-wipe");
    if (!wipeT) { b.textContent = "한 번 더 누르면 모든 기록이 지워집니다"; wipeT = setTimeout(function () { wipeT = 0; b.textContent = "기록 지우기"; }, 4000); return; }
    clearTimeout(wipeT); wipeT = 0; b.textContent = "기록 지우기";
    try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
    S = fresh(); startRound();
  };
  window.sthStrata = { R: function () { return R; }, UI: function () { return UI; }, S: function () { return S; } };
  startRound();
})();
