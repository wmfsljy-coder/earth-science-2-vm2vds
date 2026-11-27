/* =========================================================================
   천구 좌표 조준 미션 — earth-science-2/3-1 (응용 실험실 게임 · 2026-11)
   1인칭으로 밤하늘을 둘러보며 지평 좌표(방위각·고도)·일주 운동·적도 좌표(적경·적위)로 별을 조준한다.
   별 위치: 실제 밝은 별의 J2000 적경·적위 → 위도 37.5°N, 동경 127°E 의 지방 항성시로
   sin h = sinφ sinδ + cosφ cosδ cosH 등 정확한 식으로 고도·방위각을 계산한다(세차·대기 굴절 무시).
   그림: 중심 투영(시야 가로 90°). 판정 규칙 전문은 _review/esslab/e2/game.md.
   ========================================================================= */
(function () {
  "use strict";
  var K = window.sthKit;
  if (!K) return;
  var LT = K.LT, KEY = "sth-game-eshs-3-1-sky";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, PHI = 37.5, LON = 127.0;
  function $(id) { return document.getElementById(id); }
  var cv = $("g-cv");
  var NARROW = (window.innerWidth || 900) < 700;
  if (NARROW) { cv.width = 600; cv.height = 940; }
  var ctx = window.setupCanvas(cv), W = cv._w, H = cv._h;
  var SKY = NARROW ? { x: 0, y: 0, w: 600, h: 540 } : { x: 0, y: 0, w: 612, h: 560 };
  var CARD = NARROW ? { x: 0, y: 552, w: 600, h: 388 } : { x: 622, y: 0, w: 278, h: 560 };
  var F = SKY.w / 2, CX = SKY.x + SKY.w / 2, CY = SKY.y + SKY.h / 2;   /* 가로 시야 90° */

  /* 좁은 화면(휴대폰)에서는 그림 속 글자를 1.3배로 */
  var FS = NARROW ? 1.3 : 1;
  function sz(o) { var q = {}; for (var k in o) q[k] = o[k]; q.s = (o.s || 12) * FS; return q; }
  function pill(c, s, x, y, o) { return K.pill(c, s, x, y, sz(o || {})); }
  function tx(c, s, x, y, o) { return K.t(c, s, x, y, sz(o || {})); }
  function row(c, name, val, x0, x1, y, col) { tx(c, name, x0, y, { s: 12, w: "700", c: LT.mute }); tx(c, val, x1, y, { s: 14, w: "900", a: "right", c: col || LT.ink }); }
  function tip(c, s, x, y, w, good) {
    var h = 32 * FS; c.fillStyle = good ? "#e7f7f0" : (good === false ? "#fdeee4" : "#eef1f5"); c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill();
    tx(c, s, x + 10, y + h * 0.66, { s: 12, w: "800", c: good ? "#0f766e" : (good === false ? "#b4400c" : LT.mute) });
  }
  /* ---------- 별 목록: 이름, 적경(시), 적위(°), 등급, 별자리, 색 (J2000) ---------- */
  var CAT = [
    ["북극성", 2.5303, 89.264, 2.0, "작은곰자리", "#fff3d6"], ["시리우스", 6.7525, -16.716, -1.46, "큰개자리", "#eef4ff"],
    ["카노푸스", 6.3992, -52.696, -0.74, "용골자리", "#fffbee"], ["아르크투루스", 14.2610, 19.182, -0.05, "목동자리", "#ffcf8f"],
    ["베가", 18.6156, 38.784, 0.03, "거문고자리", "#e8f0ff"], ["카펠라", 5.2782, 45.998, 0.08, "마차부자리", "#fff1c8"],
    ["리겔", 5.2423, -8.202, 0.13, "오리온자리", "#d6e4ff"], ["프로키온", 7.6550, 5.225, 0.34, "작은개자리", "#fffaf0"],
    ["베텔게우스", 5.9195, 7.407, 0.5, "오리온자리", "#ffad73"], ["알타이르", 19.8464, 8.868, 0.77, "독수리자리", "#f4f7ff"],
    ["알데바란", 4.5987, 16.509, 0.85, "황소자리", "#ffbe82"], ["안타레스", 16.4901, -26.432, 1.0, "전갈자리", "#ff9466"],
    ["스피카", 13.4199, -11.161, 0.97, "처녀자리", "#d4e2ff"], ["폴룩스", 7.7553, 28.026, 1.14, "쌍둥이자리", "#ffd9a6"],
    ["포말하우트", 22.9608, -29.622, 1.16, "남쪽물고기자리", "#f4f7ff"], ["데네브", 20.6905, 45.280, 1.25, "백조자리", "#f4f7ff"],
    ["레굴루스", 10.1395, 11.967, 1.35, "사자자리", "#dfe9ff"], ["카스토르", 7.5767, 31.888, 1.58, "쌍둥이자리", "#f4f7ff"],
    ["벨라트릭스", 5.4189, 6.350, 1.64, "오리온자리", "#d9e6ff"], ["알닐람", 5.6036, -1.202, 1.69, "오리온자리", "#d9e6ff"],
    ["알니탁", 5.6793, -1.943, 1.74, "오리온자리", "#d9e6ff"], ["민타카", 5.5334, -0.299, 2.23, "오리온자리", "#d9e6ff"],
    ["사이프", 5.7959, -9.670, 2.06, "오리온자리", "#d9e6ff"], ["두베", 11.0621, 61.751, 1.79, "큰곰자리(북두칠성)", "#ffd9a0"],
    ["메라크", 11.0307, 56.382, 2.37, "큰곰자리(북두칠성)", "#f4f7ff"], ["페크다", 11.8972, 53.695, 2.44, "큰곰자리(북두칠성)", "#f4f7ff"],
    ["메그레즈", 12.2571, 57.033, 3.31, "큰곰자리(북두칠성)", "#f4f7ff"], ["알리오스", 12.9005, 55.960, 1.77, "큰곰자리(북두칠성)", "#f4f7ff"],
    ["미자르", 13.3988, 54.925, 2.27, "큰곰자리(북두칠성)", "#f4f7ff"], ["알카이드", 13.7923, 49.313, 1.86, "큰곰자리(북두칠성)", "#dfe9ff"],
    ["카프", 0.1530, 59.150, 2.27, "카시오페이아자리", "#fff6e0"], ["셰다르", 0.6751, 56.537, 2.24, "카시오페이아자리", "#ffd6a3"],
    ["카시오페이아 γ", 0.9451, 60.717, 2.47, "카시오페이아자리", "#dfe9ff"], ["루크바", 1.4303, 60.235, 2.68, "카시오페이아자리", "#f4f7ff"],
    ["세긴", 1.9066, 63.670, 3.37, "카시오페이아자리", "#dfe9ff"], ["코카브", 14.8451, 74.156, 2.08, "작은곰자리", "#ffcf95"],
    ["미르파크", 3.4054, 49.861, 1.79, "페르세우스자리", "#fff3d8"], ["알골", 3.1361, 40.956, 2.12, "페르세우스자리", "#e8f0ff"],
    ["알파르드", 9.4598, -8.659, 1.98, "바다뱀자리", "#ffc890"], ["하말", 2.1195, 23.462, 2.0, "양자리", "#ffd9a8"],
    ["데네볼라", 11.8177, 14.572, 2.13, "사자자리", "#f4f7ff"], ["알기에바", 10.3329, 19.84, 2.08, "사자자리", "#ffd6a3"],
    ["엘나트", 5.4382, 28.608, 1.65, "황소자리", "#e8f0ff"], ["아드하라", 6.9771, -28.972, 1.5, "큰개자리", "#d9e6ff"],
    ["웨젠", 7.1399, -26.393, 1.83, "큰개자리", "#fff6e0"], ["미르잠", 6.3783, -17.956, 1.98, "큰개자리", "#d9e6ff"],
    ["알헤나", 6.6285, 16.399, 1.93, "쌍둥이자리", "#f4f7ff"], ["멘칼리난", 5.9921, 44.947, 1.9, "마차부자리", "#f4f7ff"],
    ["알페라츠", 0.1398, 29.09, 2.06, "안드로메다자리", "#e8f0ff"], ["미라크", 1.1622, 35.62, 2.05, "안드로메다자리", "#ffc58a"],
    ["알마크", 2.065, 42.33, 2.1, "안드로메다자리", "#ffd6a3"], ["멘카르", 3.038, 4.09, 2.53, "고래자리", "#ffbf8a"],
    ["알페카", 15.5781, 26.71, 2.23, "북쪽왕관자리", "#f4f7ff"], ["무프리드", 13.9114, 18.398, 2.68, "목동자리", "#fff6e0"],
    ["코르 카롤리", 12.9338, 38.318, 2.9, "사냥개자리", "#f4f7ff"], ["플레이아데스", 3.7914, 24.105, 2.87, "황소자리(좀생이별)", "#dfe9ff"]
  ].map(function (a) { return { n: a[0], ra: a[1], dec: a[2], mag: a[3], con: a[4], col: a[5] }; });
  var BY = {}; CAT.forEach(function (s) { BY[s.n] = s; });
  var LINES = [["베텔게우스", "벨라트릭스"], ["벨라트릭스", "민타카"], ["민타카", "알닐람"], ["알닐람", "알니탁"], ["알니탁", "베텔게우스"],
    ["알니탁", "사이프"], ["사이프", "리겔"], ["리겔", "민타카"], ["두베", "메라크"], ["메라크", "페크다"], ["페크다", "메그레즈"],
    ["메그레즈", "두베"], ["메그레즈", "알리오스"], ["알리오스", "미자르"], ["미자르", "알카이드"], ["카프", "셰다르"],
    ["셰다르", "카시오페이아 γ"], ["카시오페이아 γ", "루크바"], ["루크바", "세긴"], ["카스토르", "폴룩스"],
    ["시리우스", "미르잠"], ["시리우스", "아드하라"], ["아드하라", "웨젠"], ["레굴루스", "알기에바"], ["레굴루스", "데네볼라"]];
  var BG = (function () { var r = K.rng(37), a = []; for (var i = 0; i < 300; i++) a.push({ ra: r() * 24, dec: Math.asin(2 * r() - 1) * R2D, b: .22 + r() * .5, s: r() > .85 ? 1.6 : 1.05 }); return a; })();

  /* ---------- 천문 계산 ---------- */
  function wrap360(a) { return (a % 360 + 360) % 360; }
  function wrap180(a) { a = wrap360(a); return a > 180 ? a - 360 : a; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /* t = 2027년 2월 24일 0시(한국 표준시)부터 잰 시각(시). 21 = 밤 9시, 24 = 자정 */
  function lstDeg(t) {
    var J = Date.UTC(2027, 1, 24) / 86400000 + 2440587.5 + (t - 9) / 24, d = J - 2451545, T = d / 36525;
    return wrap360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - T * T * T / 38710000 + LON);
  }
  function hd2hor(Hd, dec) {
    var Hr = Hd * D2R, d = dec * D2R, f = PHI * D2R;
    var sh = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(Hr);
    var az = Math.atan2(-Math.cos(d) * Math.sin(Hr), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(Hr)) * R2D;
    return { alt: Math.asin(clamp(sh, -1, 1)) * R2D, az: wrap360(az) };
  }
  function eq2hor(raH, dec, L) { return hd2hor(L - raH * 15, dec); }
  function hor2eq(alt, az, L) {
    var h = alt * D2R, A = az * D2R, f = PHI * D2R;
    var sd = Math.sin(f) * Math.sin(h) + Math.cos(f) * Math.cos(h) * Math.cos(A);
    var Hd = Math.atan2(-Math.sin(A) * Math.cos(h), Math.cos(f) * Math.sin(h) - Math.sin(f) * Math.cos(h) * Math.cos(A)) * R2D;
    return { dec: Math.asin(clamp(sd, -1, 1)) * R2D, H: wrap180(Hd) / 15, ra: wrap360(L - Hd) / 15 };
  }
  function vec(alt, az) { var a = alt * D2R, A = az * D2R; return [Math.cos(a) * Math.sin(A), Math.cos(a) * Math.cos(A), Math.sin(a)]; }
  function sep(a1, z1, a2, z2) { var u = vec(a1, z1), v = vec(a2, z2); return Math.acos(clamp(u[0] * v[0] + u[1] * v[1] + u[2] * v[2], -1, 1)) * R2D; }
  function starAt(s, L) { var Hd = L - s.ra * 15, p = hd2hor(Hd, s.dec); p.H = wrap180(Hd) / 15; p.s = s; return p; }

  /* ---------- 글자 도우미 ---------- */
  var DIR16 = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
  function dirName(az) { return DIR16[Math.round(wrap360(az) / 22.5) % 16]; }
  function relDir(az) {
    var c = Math.round(wrap360(az) / 90) % 4, base = [0, 90, 180, 270][c], d = Math.round(wrap180(az - base)), nm = ["정북", "정동", "정남", "정서"][c];
    if (!d) return nm + "(" + base + "°)";
    var side = [["서", "동"], ["북", "남"], ["동", "서"], ["남", "북"]][c][d > 0 ? 1 : 0];
    return nm + "(" + base + "°)에서 " + side + "쪽으로 " + Math.abs(d) + "°";
  }
  function sg(x) { return (x < 0 ? "−" : "") + Math.abs(x).toFixed(1); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fRA(h) { var m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return Math.floor(m / 60) + "h " + pad(m % 60) + "m"; }
  function fDec(d) { return (d >= 0 ? "+" : "−") + Math.abs(d).toFixed(1) + "°"; }
  function fH(h) { return Math.abs(h) < 0.05 ? "0.0시간" : (h > 0 ? "+" : "−") + Math.abs(h).toFixed(1) + "시간"; }
  function clock(t) { var m = Math.round(t * 60), hh = Math.floor(m / 60); return (hh >= 24 ? "2월 25일 " : "2월 24일 ") + pad(hh % 24) + ":" + pad(m % 60); }
  function ko(t) { var hh = Math.floor(t) % 24, m = Math.round((t - Math.floor(t)) * 60); return (hh === 0 ? "자정" : (hh < 12 ? "새벽 " + hh + "시" : "밤 " + (hh - 12) + "시")) + (m ? " " + m + "분" : ""); }
  function bat(s) { var c = String(s).slice(-1), n = c.charCodeAt(0); if (n >= 0xAC00 && n <= 0xD7A3) return (n - 0xAC00) % 28 !== 0; return /[0-9]$/.test(c) ? /[013678]$/.test(c) : false; }
  function j(s, t) { var b = bat(s), m = { "은": b ? "은" : "는", "이": b ? "이" : "가", "을": b ? "을" : "를", "와": b ? "과" : "와" }; return s + m[t]; }

  /* ---------- 상태 ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 막힘 */ } }
  function fresh() { return { lv: 1, open: 1, done: {}, rd: {}, free: 0 }; }
  var S = load() || fresh();
  ["lv", "open", "free"].forEach(function (k) { if (typeof S[k] !== "number") S[k] = fresh()[k]; });
  S.done = S.done || {}; S.rd = S.rd || {};
  var TEACHER = !!window.STH_TEACHER;
  function isOpen(n) { return TEACHER || (n === 5 ? S.open >= 4 : n <= S.open); }

  var LVN = { 1: "지평 좌표", 2: "일주 운동", 3: "적도 좌표", 4: "오늘 밤 미션", 5: "자유" };
  var TOT = { 1: 3, 2: 3, 3: 3, 4: 5 };
  var SUM = {
    1: "고도는 지평선에서 천정 쪽으로(0°~90°), 방위각은 북점(0°)에서 동(90°)·남(180°)·서(270°) 차례로 잽니다(땅을 위에서 내려다보면 시계 방향, 북쪽을 보고 서서 오른쪽으로 도는 방향). 지평 좌표는 ‘지금, 여기서’ 어디를 볼지 알려 주는 좌표라 관측 장소와 시각이 바뀌면 값이 바뀝니다.",
    2: "별은 천구 북극(위도 37.5°에서는 정북 고도 37.5°)을 중심으로 1시간에 15°씩 동에서 서로 돕니다. 북쪽 하늘에서는 시계 반대 방향(북쪽을 바라볼 때), 동쪽 하늘에서는 남쪽(오른쪽) 위로 비스듬히, 남쪽 하늘에서는 왼쪽(동)에서 오른쪽(서)으로 움직이며, 천구 북극까지의 각(90° − 적위)은 바뀌지 않습니다.",
    3: "적경·적위는 천구에 붙은 좌표라 하늘과 함께 돌고, 시각·장소가 바뀌어도 그대로입니다. 고도·방위각은 관측자에게 붙은 좌표라 계속 바뀝니다. 그래서 별의 ‘주소’는 적도 좌표로 적고, ‘지금 어디를 볼지’는 지평 좌표로 말합니다(시간각 = 지방 항성시 − 적경).",
    4: "천구 북극의 고도 = 위도(37.5°), 주극성은 적위가 90° − 위도 = 52.5°보다 큰 별, 남중은 자오선 위, 천구 적도는 정동과 정서에서 지평선과 만나고 정남 쪽 고도 52.5°를 지나는 큰 원입니다. 주극성이 아닌 별은 동쪽 지평선(고도 0°)에서 떠서 서쪽 지평선으로 집니다."
  };

  /* ---------- 오늘 밤 미션 단서 ---------- */
  var CLUES = [
    { s: "하루 내내 고도가 이곳의 위도(37.5°)와 거의 같게 유지되는 별 — 하늘이 도는 중심에 거의 붙어 있는 별", t: "하루 내내 고도 = 위도인 별",
      /* 하루 동안 고도는 위도 ± (90° − 적위) 사이를 오간다. 그 순간의 고도가 아니라 적위로 판정: 적위 > 88°(늘 위도 ±2° 안) → 북극성(89.3°, ±0.7°)뿐 */
      ok: function (p) { return p.s.dec > 88; }, ans: "북극성", aid: "pole",
      why: function (p) {
        if (Math.abs(p.alt - PHI) < 1.5) return "이 별도 지금은 고도가 " + p.alt.toFixed(1) + "°로 위도와 비슷합니다. 하지만 이 별은 일주 운동으로 계속 움직여 몇십 분만 지나도 고도가 바뀝니다. 단서의 별은 천구 북극 바로 옆에 있어 <b>언제 보아도</b> 고도가 위도(37.5°)와 같습니다. <b>정북(방위각 0°) 쪽 고도 37.5°</b>를 보세요.";
        return "조준한 별의 고도는 " + p.alt.toFixed(1) + "°입니다. 천구 북극의 고도는 관측자의 위도와 같아 여기서는 <b>37.5°</b>이고, 북극성은 천구 북극에서 1°도 떨어져 있지 않습니다. <b>정북(방위각 0°) 쪽 고도 37.5°</b>를 보세요.";
      },
      hint: "고도 37.5° 점선 위에는 다른 별도 지나갑니다. 정북(방위각 0°) 세로 점선과 고도 37.5° 점선이 만나는 곳, 곧 천구 북극 바로 옆의 별을 찾으세요." },
    { s: "북극성이 아닌 주극성 — 하루 내내 지평선 아래로 지지 않는 별", t: "북극성 말고 주극성",
      ok: function (p) { return p.s.dec > 90 - PHI && p.s.n !== "북극성"; }, ans: "두베", aid: "circ",
      why: function (p) {
        if (p.s.n === "북극성") return "북극성도 주극성이지만, 이번 단서는 <b>북극성이 아닌</b> 주극성입니다. 북극성 둘레를 도는 다른 별을 찾아보세요.";
        return "이 별의 적위는 " + fDec(p.s.dec) + "입니다. 위도 37.5°에서 지지 않으려면 천구 북극에서 37.5° 안에 있어야, 곧 <b>적위가 90° − 37.5° = 52.5°보다 커야</b> 합니다. 이 별은 북극에서 " + (90 - p.s.dec).toFixed(1) + "° 떨어져 있어 가장 낮을 때 고도가 " + sg(p.s.dec - (90 - PHI)) + "°, 곧 지평선 아래로 내려갑니다.";
      },
      hint: "하늘색 점선이 주극성의 경계(적위 52.5°)입니다. 이 원 안쪽 별은 하루 내내 지지 않습니다. 북두칠성이나 카시오페이아자리를 찾아보세요." },
    { s: "지금 자오선 위에서 남중한 가장 밝은 별", t: "남중한 가장 밝은 별",
      ok: function (p) { return p.s.n === "시리우스"; }, ans: "시리우스", aid: "mer",
      why: function (p) {
        if (Math.abs(p.H) <= 0.25 && p.alt > 0 && p.az > 90 && p.az < 270) return "이 별도 자오선 근처에 남중해 있습니다(시간각 " + fH(p.H) + "). 하지만 단서는 <b>가장 밝은</b> 별입니다. 자오선 위나 그 바로 곁에서 더 밝은 별을 찾아보세요.";
        return "이 별의 시간각은 " + fH(p.H) + "입니다(" + (p.H < 0 ? "아직 남중 전, 동쪽" : "남중 뒤, 서쪽") + "). 남중은 별이 <b>자오선(정남 방위각 180°에서 천정으로 오르는 선)</b> 위에 올 때이고, 그때 시간각은 0시간입니다.";
      },
      hint: "노란 점선이 자오선입니다. 정남(방위각 180°)을 보고 자오선 위에 있는 별 가운데 가장 밝은 별을 고르세요." },
    { s: "천구 적도 위(적위 0° 가까이)에 있는 별", t: "천구 적도 위의 별",
      ok: function (p) { return Math.abs(p.s.dec) < 3; }, ans: "민타카", aid: "equ",
      why: function (p) { return "이 별의 적위는 " + fDec(p.s.dec) + "라 천구 적도에서 " + Math.abs(p.s.dec).toFixed(1) + "° " + (p.s.dec > 0 ? "북쪽" : "남쪽") + "에 있습니다. 위도 37.5°에서 천구 적도는 <b>정동(90°)과 정서(270°)에서 지평선과 만나고, 정남 쪽 고도 52.5°(= 90° − 위도)를 지나는 큰 원</b>입니다. 천구 적도 위의 별은 정동에서 떠서 정서로 집니다."; },
      hint: "하늘색 실선이 천구 적도입니다. 오리온자리의 허리띠(세 별)가 이 선 위에 있습니다." },
    { s: "곧 서쪽 지평선(고도 0°)으로 질 별 — 서쪽 하늘 고도 15° 아래", t: "곧 질 별(서쪽, 15° 아래)",
      ok: function (p) { return p.alt < 15 && p.alt > 0 && p.H > 0 && p.az > 180 && p.az < 360 && p.s.dec < 90 - PHI; }, ans: "알페라츠", aid: "west",
      why: function (p) {
        if (p.H < 0 || p.az < 180) return "이 별은 " + dirName(p.az) + "쪽, 아직 남중 전인 별입니다. 별은 <b>동쪽에서 떠서 서쪽으로 집니다</b>. 곧 질 별은 서쪽 하늘(방위각 180°~360°) 낮은 곳에 있습니다.";
        if (p.s.dec >= 90 - PHI) return "이 별은 적위가 " + fDec(p.s.dec) + "로 52.5°보다 큰 주극성이라, 서쪽 하늘에 낮게 있어도 지평선 아래로 지지 않고 다시 북쪽으로 올라갑니다.";
        return "이 별은 서쪽 하늘에 있지만 고도가 " + p.alt.toFixed(1) + "°라 15°보다 높습니다. 지평선(고도 0°) 바로 위를 찾아보세요.";
      },
      hint: "서쪽 지평선 위 연한 띠(고도 0°~15°, 방위각 180°~360°) 안에 있는 별을 찾으세요." }
  ];

  /* ---------- 문제 만들기 ---------- */
  var R = null, V = { az: 180, alt: 25 }, G = { hz: true, eq: false };
  function base(lv, idx) {
    return { lv: lv, idx: idx, total: TOT[lv] || 0, wrong: 0, solved: false, t: 21, shift: 0, tol: 4, readout: true, eqRead: false,
      hint: false, reveal: {}, miss: null, shown: false, quiz: false };
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mkRound(lv, idx) {
    var R0 = base(lv, idx), L, p, st;
    if (lv === 5) return mkFree(R0);
    L = lstDeg(21);
    if (lv === 1) {
      st = BY[["알파르드", "하말", "카펠라"][idx]]; p = starAt(st, L);
      R0.kind = "aa"; R0.tol = 3; R0.star = st; R0.tA = Math.round(p.az) % 360; R0.th = Math.round(p.alt); R0.readout = false;
    } else if (lv === 2) {
      var q = [["두베", 3], ["레굴루스", 3], ["시리우스", 4]][idx];
      R0.kind = "dm"; R0.tol = 5; R0.star = BY[q[0]]; R0.N = q[1]; R0.reveal[q[0]] = 1;
    } else if (lv === 3) {
      var e = [["베텔게우스", 21], ["레굴루스", 21], ["베텔게우스", 24]][idx];
      R0.kind = "eq"; R0.star = BY[e[0]]; R0.t = e[1]; R0.eqDef = true; R0.quizAfter = idx === 2;
    } else {
      R0.kind = "clue"; R0.clue = CLUES[idx];
      for (var i = 0; i < idx; i++) R0.reveal[(S.foundBy && S.foundBy[i]) || CLUES[i].ans] = 1;
    }
    return R0;
  }
  var lastFree = "";
  function mkFree(R0) {
    var type = pick(["aa", "eq", "dm"]), t, L, list, p, tries = 0;
    R0.total = 0;
    do {
      t = 19 + Math.floor(Math.random() * 15) / 2; L = lstDeg(t); tries++;
      list = CAT.map(function (s) { return starAt(s, L); }).filter(function (q) { return q.alt > 14 && q.alt < 78 && q.s.mag < 2.5 && q.s.n !== "북극성" && q.s.n !== lastFree; });
      if (type === "dm") {
        R0.N = 1 + Math.floor(Math.random() * Math.min(4, 29 - t));   /* 새벽 5시 넘게는 묻지 않는다 */
        list = list.filter(function (q) { var f = hd2hor(q.H * 15 + 15 * R0.N, q.s.dec); return f.alt > 10 && f.alt < 78; });
      }
    } while (!list.length && tries < 20);
    p = pick(list); R0.t = t; R0.star = p.s; R0.kind = type; lastFree = p.s.n;
    if (type === "aa") { R0.tol = 3; R0.tA = Math.round(p.az) % 360; R0.th = Math.round(p.alt); R0.readout = false; }
    if (type === "eq") { R0.eqDef = true; }
    if (type === "dm") { R0.tol = 5; R0.reveal[p.s.n] = 1; }
    return R0;
  }
  function curL() { return lstDeg(R.t) + 15 * R.shift; }
  /* 일주 운동 문제: N시간 뒤 자리(규칙대로 1시간 = 15°) */
  function dmPos() { var L = lstDeg(R.t), Hd = L - R.star.ra * 15; return hd2hor(Hd + 15 * R.N, R.star.dec); }
  function answerPos() {
    var L = curL();
    if (R.kind === "aa") return { alt: R.th, az: R.tA };
    if (R.kind === "dm") return dmPos();
    if (R.kind === "eq") return starAt(R.star, L);
    return starAt(BY[R.clue.ans], L);
  }

  /* ---------- 카메라(중심 투영) ---------- */
  var CF, CR, CU;
  function setCam() {
    var A = V.az * D2R, h = V.alt * D2R;
    CF = [Math.cos(h) * Math.sin(A), Math.cos(h) * Math.cos(A), Math.sin(h)];
    CR = [Math.cos(A), -Math.sin(A), 0];
    CU = [CR[1] * CF[2] - CR[2] * CF[1], CR[2] * CF[0] - CR[0] * CF[2], CR[0] * CF[1] - CR[1] * CF[0]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function proj(alt, az) {
    var v = vec(alt, az), df = dot(v, CF);
    if (df < 0.1) return null;
    return { x: CX + F * dot(v, CR) / df, y: CY - F * dot(v, CU) / df };
  }
  function unproj(x, y) {
    var dx = (x - CX) / F, dy = -(y - CY) / F, d = [CF[0] + dx * CR[0] + dy * CU[0], CF[1] + dx * CR[1] + dy * CU[1], CF[2] + dx * CR[2] + dy * CU[2]];
    var n = Math.hypot(d[0], d[1], d[2]);
    return { alt: Math.asin(d[2] / n) * R2D, az: wrap360(Math.atan2(d[0], d[1]) * R2D) };
  }
  function inSky(p) { return p && p.x > SKY.x - 2 && p.x < SKY.x + SKY.w + 2 && p.y > SKY.y - 2 && p.y < SKY.y + SKY.h + 2; }
  function poly(pts, col, w, dash) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 1; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); var on = false, last = null;
    for (var i = 0; i < pts.length; i++) {
      var p = proj(pts[i][0], pts[i][1]);
      if (!p || Math.abs(p.x - CX) > 4000 || Math.abs(p.y - CY) > 4000 || (last && Math.hypot(p.x - last.x, p.y - last.y) > 500)) { on = false; last = null; continue; }
      if (on) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      on = true; last = p;
    }
    ctx.stroke(); ctx.restore();
  }
  function eqCircle(dec, L) { var a = []; for (var r = 0; r <= 24.001; r += 0.1) { var p = eq2hor(r, dec, L); a.push([p.alt, p.az]); } return a; }
  function hourCircle(ra, L) { var a = []; for (var d = -80; d <= 89.6; d += 3) { var p = eq2hor(ra, d, L); a.push([p.alt, p.az]); } return a; }
  function hzCircle(alt, a0, a1) { var a = []; for (var z = a0; z <= a1 + 0.01; z += 2) a.push([alt, z]); return a; }
  function vertLine(az) { var a = []; for (var h = 0; h <= 90; h += 2) a.push([h, az]); return a; }

  /* ---------- 그리기 ---------- */
  function ring(p, r, col, w, dash) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 2; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.stroke(); ctx.restore(); }
  var SB = [SKY.x, SKY.x + SKY.w];
  function label(s, p, dy, col, sz) { pill(ctx, s, p.x, p.y + dy, { s: sz || 12, a: "center", c: col || "#fff", box: SB }); }
  function starR(m) { return clamp(4.4 - 0.85 * m, 1.3, 6.2); }
  function drawStar(p, s, hi) {
    var r = starR(s.mag);
    if (s.mag < 1.7) {
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.6);
      g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.6, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    if (s.n === "플레이아데스") { ctx.fillStyle = "rgba(220,230,255,.8)"; [[-4, -3], [4, -2], [2, 4], [-3, 3], [6, 2]].forEach(function (o) { ctx.fillRect(p.x + o[0], p.y + o[1], 1.4, 1.4); }); }
    if (hi) ring(p, r + 7, hi, 2);
  }

  function draw() {
    var L = curL(), i, p, q;
    setCam();
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.roundRect(SKY.x, SKY.y, SKY.w, SKY.h, 14); ctx.clip();
    /* 밤하늘 바탕: 천정은 짙고 지평선 쪽은 밝게 */
    var th = Math.tan(V.alt * D2R), yh = V.alt < 88 ? CY + F * th : CY + 40 * F, yz = V.alt > 1 ? CY - F / th : CY - 60 * F;
    var sg = ctx.createLinearGradient(0, clamp(yz, -30000, 30000), 0, clamp(yh, -30000, 30000));
    sg.addColorStop(0, "#0c1a4b"); sg.addColorStop(.62, "#1d3874"); sg.addColorStop(.9, "#3b5b9e"); sg.addColorStop(1, "#6d86bf");
    ctx.fillStyle = sg; ctx.fillRect(SKY.x, SKY.y, SKY.w, SKY.h);
    /* 어두운 별 */
    for (i = 0; i < BG.length; i++) {
      q = eq2hor(BG[i].ra, BG[i].dec, L); if (q.alt < 0) continue;
      p = proj(q.alt, q.az); if (!inSky(p)) continue;
      ctx.globalAlpha = BG[i].b; ctx.fillStyle = "#e6eeff"; ctx.fillRect(p.x, p.y, BG[i].s, BG[i].s);
    }
    ctx.globalAlpha = 1;
    /* 적도 좌표 격자(하늘과 함께 돈다) */
    var eqOn = G.eq;
    if (eqOn) {
      for (i = 0; i < 24; i++) poly(hourCircle(i, L), i % 6 ? "rgba(127,211,255,.26)" : "rgba(127,211,255,.42)", i % 6 ? 1 : 1.4);
      [-60, -45, -30, -15, 15, 30, 45, 60, 75].forEach(function (d) { poly(eqCircle(d, L), "rgba(127,211,255,.26)", 1); });
      poly(eqCircle(0, L), "rgba(127,211,255,.8)", 2.2);
    }
    /* 지평 좌표 격자(관측자에게 붙어 있다) */
    if (G.hz) {
      for (i = 10; i < 90; i += 10) poly(hzCircle(i, 0, 360), i % 30 ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.27)", i % 30 ? 1 : 1.3);
      for (i = 0; i < 360; i += 15) poly(vertLine(i), i % 45 ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.3)", i % 45 ? 1 : 1.3);
    }
    drawAids(L);
    /* 별자리 선 */
    ctx.save(); ctx.strokeStyle = "rgba(170,190,255,.3)"; ctx.lineWidth = 1.1;
    LINES.forEach(function (ln) {
      var a = starAt(BY[ln[0]], L), b = starAt(BY[ln[1]], L); if (a.alt < -2 && b.alt < -2) return;
      var pa = proj(a.alt, a.az), pb = proj(b.alt, b.az); if (!pa || !pb) return;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    });
    ctx.restore();
    /* 밝은 별 */
    var near = nearestStar(L), lab = [];
    CAT.forEach(function (s) {
      var a = starAt(s, L); if (a.alt < 0) return;
      var pp = proj(a.alt, a.az); if (!inSky(pp)) return;
      var hi = null;
      if (R.kind === "dm" && s === R.star) hi = "#ffb35c";
      if (R.reveal[s.n]) { hi = hi || "#3fd3a3"; lab.push([s.n, pp, hi]); }
      drawStar(pp, s, hi);
    });
    /* 일주 운동: 지금 자리 표시와 지나온 길 */
    if (R.kind === "dm") {
      var c0 = hd2hor(lstDeg(R.t) - R.star.ra * 15, R.star.dec), p0 = proj(c0.alt, c0.az);
      if (R.shift > 0) {
        var tr = []; for (var hh = 0; hh <= R.shift + 0.001; hh += 0.05) { var w = hd2hor(lstDeg(R.t) - R.star.ra * 15 + 15 * hh, R.star.dec); tr.push([w.alt, w.az]); }
        poly(tr, "rgba(255,179,92,.95)", 2.6, [7, 5]);
        if (p0) { ring(p0, 8, "rgba(255,179,92,.8)", 1.6, [3, 3]); label("지금(" + ko(R.t) + ") 자리", p0, 26, "#ffcf95", 11); }
      }
    }
    lab.forEach(function (l) { label(l[0], l[1], -14, l[2] === "#ffb35c" ? "#ffcf95" : "#a7f3d0", 12); });
    /* 땅 */
    if (yh < SKY.y + SKY.h) {
      var gg = ctx.createLinearGradient(0, yh, 0, yh + 220);
      gg.addColorStop(0, "#2c4a35"); gg.addColorStop(1, "#13251a");
      ctx.fillStyle = gg; ctx.fillRect(SKY.x, Math.max(SKY.y, yh), SKY.w, SKY.y + SKY.h - Math.max(SKY.y, yh));
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(SKY.x, yh); ctx.lineTo(SKY.x + SKY.w, yh); ctx.stroke();
      for (i = 0; i < 360; i += 15) {
        p = proj(0, i); if (!p || p.x < SKY.x + 10 || p.x > SKY.x + SKY.w - 10) continue;
        ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(p.x - 1, p.y, 2, 7);
        if (i % 45 === 0) pill(ctx, DIR16[i / 22.5] + " " + i + "°", p.x, p.y + 26, { s: i % 90 ? 13 : 15, a: "center", c: i === 180 ? "#ffd35a" : (i % 90 ? "#e8ecff" : "#ffffff"), box: SB });
        else tx(ctx, i + "°", p.x, p.y + 20, { s: 11, a: "center", c: "rgba(232,236,255,.85)" });
      }
    }
    /* 고도 눈금: 화면 가운데 세로줄이 지나는 고도 */
    for (i = 0; i <= 90; i += 10) {
      if (i === 0 && yh < SKY.y + SKY.h) continue;
      var yy = CY - F * Math.tan((i - V.alt) * D2R);
      if (Math.abs(i - V.alt) > 80 || yy < SKY.y + 70 || yy > SKY.y + SKY.h - 40 || Math.abs(yy - CY) < 30) continue;
      pill(ctx, (i === 90 ? "천정 " : "고도 ") + i + "°", CX + 10, yy + 4, { s: 11, c: "#e8ecff", box: SB });
    }
    /* 지평선이 화면 밖이면 아래에 방위 띠 */
    if (yh > SKY.y + SKY.h - 26) compassTape();
    drawMarks(L);
    /* 조준선 */
    var rr = F * Math.tan(R.tol * D2R), inside = (R.kind === "eq" || R.kind === "clue") && near;
    ctx.save(); ctx.strokeStyle = inside ? "#ffd35a" : "#ffffff"; ctx.lineWidth = 2.2; ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(CX, CY, rr, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX - rr - 14, CY); ctx.lineTo(CX - rr + 4, CY); ctx.moveTo(CX + rr - 4, CY); ctx.lineTo(CX + rr + 14, CY);
    ctx.moveTo(CX, CY - rr - 14); ctx.lineTo(CX, CY - rr + 4); ctx.moveTo(CX, CY + rr - 4); ctx.lineTo(CX, CY + rr + 14); ctx.stroke();
    ctx.fillStyle = inside ? "#ffd35a" : "#ffffff"; ctx.beginPath(); ctx.arc(CX, CY, 1.8, 0, 6.2832); ctx.fill(); ctx.restore();
    /* 큰 글씨 */
    K.bigText(ctx, (R.lv === 5 ? "자유" : "레벨 " + R.lv) + " · " + (R.lv === 5 ? { aa: "지평 좌표", eq: "적도 좌표", dm: "일주 운동" }[R.kind] : LVN[R.lv]), SKY.x + 16, SKY.y + 38, NARROW ? 26 : 23, "#ffffff");
    var rd = R.readout ? "방위각 " + Math.round(V.az) % 360 + "°(" + dirName(V.az) + ") · 고도 " + Math.round(V.alt) + "°" : "격자를 읽어 자리를 찾으세요";
    K.bigText(ctx, rd, SKY.x + 16, SKY.y + 66, NARROW ? 19 : 17, R.readout ? "#ffd35a" : "#c7d2fe");
    K.warn(ctx, SKY.x + 12, SKY.y + SKY.h - (yh > SKY.y + SKY.h - 26 ? 40 : 12), "⚠ 별의 크기는 밝기를 나타내려고 키웠습니다(실제로는 모두 점)");
    ctx.restore();
    drawCard(L, near);
  }
  function compassTape() {
    var y0 = SKY.y + SKY.h - 26, x, prev = null, a;
    ctx.fillStyle = "rgba(9,12,34,.72)"; ctx.fillRect(SKY.x, y0, SKY.w, 26);
    for (x = SKY.x; x <= SKY.x + SKY.w; x += 1) {
      a = unproj(x, y0 + 13).az;
      if (prev !== null) {
        var df = wrap180(a - prev), k1 = Math.floor(prev / 5), k2 = Math.floor((prev + df) / 5);
        if (k1 !== k2 && Math.abs(df) < 30) {
          var m = wrap360(Math.max(k1, k2) * 5);
          ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x, y0, 1.2, m % 15 ? 5 : 9);
          if (m % 45 === 0) tx(ctx, DIR16[m / 22.5] + " " + m + "°", x, y0 + 22, { s: 12, w: "900", a: "center", c: m === 180 ? "#ffd35a" : "#ffffff" });
          else if (m % 15 === 0) tx(ctx, m + "°", x, y0 + 21, { s: 10, a: "center", c: "rgba(232,236,255,.8)" });
        }
      }
      prev = a;
    }
  }
  /* 힌트·보조선 */
  function drawAids(L) {
    var aid = R.kind === "clue" ? R.clue.aid : null, show = R.hint || R.solved;
    /* 천구 북극은 늘 표시(레벨 2~4, 자유) */
    if (R.lv >= 2) {
      var pp = proj(PHI, 0);
      if (inSky(pp)) {
        ctx.save(); ctx.strokeStyle = "#7fd3ff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pp.x - 9, pp.y); ctx.lineTo(pp.x + 9, pp.y); ctx.moveTo(pp.x, pp.y - 9); ctx.lineTo(pp.x, pp.y + 9); ctx.stroke(); ctx.restore();
        if (R.kind !== "clue" || R.idx > 0 || show) label("천구 북극", pp, 26, "#7fd3ff", 11);
      }
    }
    if (G.eq) {
      for (var hR = 0; hR < 24; hR++) { var q = eq2hor(hR, 0, L); if (q.alt < 2) continue; var p = proj(q.alt, q.az); if (inSky(p) && p.y > SKY.y + 80) pill(ctx, hR + "h", p.x, p.y - 6, { s: 11, a: "center", c: "#7fd3ff", box: SB }); }
      var rc = hor2eq(V.alt, V.az, L), rh = Math.round(rc.ra) % 24;
      [-45, -30, -15, 0, 15, 30, 45, 60, 75].forEach(function (d) {
        var q2 = eq2hor(rh, d, L); if (q2.alt < 2) return; var p2 = proj(q2.alt, q2.az);
        if (inSky(p2) && p2.y > SKY.y + 80 && Math.hypot(p2.x - CX, p2.y - CY) > 34) pill(ctx, "적위 " + (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) + "°", p2.x + 6, p2.y + 16, { s: 10.5, c: "#bfe6ff", box: SB });
      });
      var qe = eq2hor(wrap360(L / 15 * 15 + 30) / 15, 0, L), pe = proj(qe.alt, qe.az);
      if (inSky(pe) && pe.y > SKY.y + 90) pill(ctx, "천구 적도", pe.x, pe.y + 18, { s: 11.5, a: "center", c: "#7fd3ff", box: SB });
    }
    if (R.kind === "dm" && R.hint && !R.solved) {
      var Hn = lstDeg(R.t) - R.star.ra * 15, a = [];
      for (var k = 0; k <= 360; k += 2) { var w = hd2hor(Hn + k, R.star.dec); a.push([w.alt, w.az]); }
      poly(a, "rgba(255,211,107,.75)", 1.6, [5, 5]);
      for (var hh = 1; hh < 24; hh++) { var w2 = hd2hor(Hn + 15 * hh, R.star.dec); if (w2.alt < 0) continue; var p3 = proj(w2.alt, w2.az); if (inSky(p3)) { ctx.fillStyle = "#ffd35a"; ctx.beginPath(); ctx.arc(p3.x, p3.y, 3, 0, 6.2832); ctx.fill(); } }
    }
    if (!aid || !show) return;
    if (aid === "pole") { poly(hzCircle(PHI, 0, 360), "rgba(255,211,107,.8)", 1.6, [6, 5]); poly(vertLine(0), "rgba(255,211,107,.6)", 1.4, [6, 5]); var pl = proj(PHI, 20); if (inSky(pl)) label("고도 37.5°", pl, -8, "#ffd35a", 11); }
    if (aid === "circ") { poly(eqCircle(90 - PHI, L), "rgba(127,211,255,.9)", 1.8, [6, 5]); var pc = proj(4, 0); if (inSky(pc)) label("주극성 경계 · 적위 52.5°", pc, -8, "#7fd3ff", 11); }
    if (aid === "mer") { poly(vertLine(180), "rgba(255,211,107,.9)", 1.8, [6, 5]); poly(vertLine(0), "rgba(255,211,107,.5)", 1.4, [6, 5]); var pm = proj(12, 180); if (inSky(pm)) label("자오선", pm, 0, "#ffd35a", 12); }
    if (aid === "equ") { poly(eqCircle(0, L), "rgba(127,211,255,.95)", 2.4); var pq = proj(8, 100); if (inSky(pq)) label("천구 적도", pq, 0, "#7fd3ff", 12); }
    if (aid === "west") {
      ctx.save(); ctx.fillStyle = "rgba(255,179,92,.16)"; ctx.beginPath(); var on = false;
      var pts = hzCircle(0, 180, 360).concat(hzCircle(15, 180, 360).reverse());
      pts.forEach(function (t) { var pw = proj(t[0], t[1]); if (!pw) return; if (on) ctx.lineTo(pw.x, pw.y); else { ctx.moveTo(pw.x, pw.y); on = true; } });
      ctx.fill(); ctx.restore();
    }
  }
  function drawMarks(L) {
    if (R.miss) { var m = proj(R.miss.alt, R.miss.az); if (inSky(m)) { ctx.save(); ctx.strokeStyle = "#ff8a3d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m.x - 7, m.y - 7); ctx.lineTo(m.x + 7, m.y + 7); ctx.moveTo(m.x + 7, m.y - 7); ctx.lineTo(m.x - 7, m.y + 7); ctx.stroke(); ctx.restore(); if (Math.hypot(m.x - CX, m.y - CY) > 40) label("앞서 조준한 곳", m, 24, "#ffb35c", 11); } }
    if (R.shown || (R.solved && R.kind === "aa")) {
      var a = answerPos(), p = proj(a.alt, a.az);
      if (inSky(p)) { ring(p, F * Math.tan(R.tol * D2R) + 4, "#3fd3a3", 2.4, R.solved ? null : [5, 4]); }
      if (R.solved && R.kind === "aa" && inSky(p)) label(R.star.n + " · 방위각 " + R.tA + "° · 고도 " + R.th + "°", p, 40, "#a7f3d0", 12);
    }
  }
  function nearestStar(L) {
    var best = null, bd = 1e9;
    CAT.forEach(function (s) { var a = starAt(s, L); if (a.alt < 0) return; var d = sep(a.alt, a.az, V.alt, V.az); if (d < bd) { bd = d; best = a; } });
    return bd <= R.tol ? best : null;
  }

  /* ---------- 흰 판정 카드 ---------- */
  function wrapText(s, x, y, mw, lh, o) {
    ctx.font = (o.w || "700") + " " + (o.s || 13) + "px " + K.FONT; ctx.fillStyle = o.c || LT.ink; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    var words = String(s).split(" "), line = "";
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(t).width > mw && line) { ctx.fillText(line, x, y); y += lh; line = words[i]; } else line = t;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }
  function targetLines() {
    if (R.kind === "aa") return { big: ["방위각 " + R.tA + "°", "고도 " + R.th + "°"], sub: "숨은 별 조준 · 조준 범위 " + R.tol + "°" };
    if (R.kind === "dm") return { big: [R.star.n + "의", R.N + "시간 뒤 자리"], sub: ko(R.t) + " → " + ko(R.t + R.N) + " · 1시간에 15°" };
    if (R.kind === "eq") return { big: ["적경 " + fRA(R.star.ra), "적위 " + fDec(R.star.dec)], sub: "이 좌표의 밝은 별 조준" };
    return { big: ["단서 " + (R.idx + 1) + " / 5"], sub: R.clue.t };
  }
  function drawCard(L, near) {
    var c = CARD, two = c.w > 400, x0 = c.x + 18, x1 = two ? c.x + 330 : c.x + c.w - 18, y, st = 25 * FS;
    var title = R.lv === 5 ? "자유 · 맞힌 문제 " + S.free + "개" : "레벨 " + R.lv + " · 문제 " + (R.idx + 1) + " / " + R.total;
    K.card(ctx, c.x, c.y, c.w, c.h, title);
    var tg = targetLines();
    y = c.y + 62;
    tg.big.forEach(function (s) { tx(ctx, s, x0, y, { s: 23, w: "900", c: LT.ink }); y += 30 * FS; });
    tx(ctx, tg.sub, x0, y - 6, { s: 12.5, w: "800", c: LT.blue }); y += 20 * FS;
    row(ctx, "관측 장소", "위도 37.5°N · 동경 127°", x0, x1, y); y += st;
    row(ctx, "시각", clock(R.t + R.shift), x0, x1, y); y += st;
    row(ctx, "지방 항성시", fRA(L / 15), x0, x1, y); y += st;
    if (R.readout) row(ctx, "조준", "방위각 " + Math.round(V.az) % 360 + "° · 고도 " + Math.round(V.alt) + "°", x0, x1, y, LT.orange);
    else row(ctx, "조준", "격자를 읽어 보세요", x0, x1, y, LT.dim);
    y += st;
    if (R.eqRead || R.kind === "clue" && G.eq) { var e = hor2eq(V.alt, V.az, L); row(ctx, "조준 적경·적위", fRA(e.ra) + " · " + fDec(e.dec), x0, x1, y, LT.teal); y += st; }
    else if (R.kind === "clue") { row(ctx, "원 안의 별", near ? (R.reveal[near.s.n] ? near.s.n : "밝은 별 1개") : "없음", x0, x1, y, near ? LT.ink : LT.dim); y += st; }
    /* 전천 지도(천정이 가운데, 북이 위·동이 왼쪽) */
    var mr = two ? 100 : 90, mx = two ? c.x + c.w - 28 - mr : c.x + c.w / 2, my = two ? c.y + 60 + mr : y + mr + 26;
    miniMap(mx, my, mr, L);
    var ty = c.y + c.h - 18 - 32 * FS;
    tip(ctx, R.tip ? R.tip[0] : "조준하고 ‘조준 판정’을 누르세요", x0 - 4, ty, (two ? 330 : c.w) - 2 * (x0 - c.x) + 8, R.tip ? R.tip[1] : null);
    if (!two) tx(ctx, "작은 지도: 가운데 천정 · 위 북 · 왼쪽 동", c.x + c.w / 2, ty - 10, { s: 10.5, a: "center", c: LT.mute });
  }
  function miniMap(mx, my, mr, L) {
    function P(alt, az) { var rr = (90 - Math.max(alt, 0)) / 90 * mr; return { x: mx - rr * Math.sin(az * D2R), y: my - rr * Math.cos(az * D2R) }; }
    ctx.save();
    ctx.fillStyle = "#14275e"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
    [30, 60].forEach(function (a) { ctx.beginPath(); ctx.arc(mx, my, (90 - a) / 90 * mr, 0, 6.2832); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(mx - mr, my); ctx.lineTo(mx + mr, my); ctx.moveTo(mx, my - mr); ctx.lineTo(mx, my + mr); ctx.stroke();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.clip();
    CAT.forEach(function (s) { var a = starAt(s, L); if (a.alt < 0) return; var p = P(a.alt, a.az); ctx.fillStyle = (R.kind === "dm" && s === R.star) ? "#ffb35c" : "rgba(235,240,255,.9)"; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.9, 2.4 - 0.5 * s.mag), 0, 6.2832); ctx.fill(); });
    var pp = P(PHI, 0); ctx.strokeStyle = "#7fd3ff"; ctx.beginPath(); ctx.moveTo(pp.x - 4, pp.y); ctx.lineTo(pp.x + 4, pp.y); ctx.moveTo(pp.x, pp.y - 4); ctx.lineTo(pp.x, pp.y + 4); ctx.stroke();
    /* 지금 보는 범위 */
    var e = [], k, sx = SKY.x, sy = SKY.y, sw = SKY.w, sh = SKY.h;
    for (k = 0; k <= 12; k++) e.push([sx + sw * k / 12, sy]);
    for (k = 0; k <= 12; k++) e.push([sx + sw, sy + sh * k / 12]);
    for (k = 12; k >= 0; k--) e.push([sx + sw * k / 12, sy + sh]);
    for (k = 12; k >= 0; k--) e.push([sx, sy + sh * k / 12]);
    ctx.fillStyle = "rgba(255,211,90,.18)"; ctx.strokeStyle = "#ffd35a"; ctx.lineWidth = 1.6; ctx.beginPath();
    e.forEach(function (q, i) { var u = unproj(q[0], q[1]), p = P(u.alt, u.az); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    var pc = P(V.alt, V.az); ctx.fillStyle = "#ffd35a"; ctx.beginPath(); ctx.arc(pc.x, pc.y, 3, 0, 6.2832); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#0f1d48"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.stroke();
    tx(ctx, "북", mx, my - mr - 5, { s: 12, w: "900", a: "center", c: LT.ink });
    tx(ctx, "남", mx, my + mr + 15, { s: 12, w: "900", a: "center", c: LT.ink });
    tx(ctx, "동", mx - mr - 5, my + 4, { s: 12, w: "900", a: "right", c: LT.ink });
    tx(ctx, "서", mx + mr + 5, my + 4, { s: 12, w: "900", c: LT.ink });
  }

  /* ---------- 판정 ---------- */
  function fb(html, cls) { var el = $("g-fb"); el.className = "g-fb" + (cls ? " " + cls : ""); el.innerHTML = html; }
  function wrongCommon(msg, tip, hintTxt) {
    R.wrong++; R.miss = { alt: V.alt, az: V.az }; R.tip = [tip, false];
    var extra = "";
    if (R.wrong >= 3) { R.hint = true; if (R.kind === "aa") R.readout = true; if (R.kind === "eq") R.eqRead = true; extra = "<br><br>💡 <b>힌트</b> — " + hintTxt; }
    if (R.wrong >= 5) $("g-show").hidden = false;
    fb("❌ " + msg + extra, "bad");
    draw();
  }
  function hintFor() {
    if (R.kind === "aa") return "흰 세로선은 15°마다 방위각, 가로로 휜 선은 10°마다 고도입니다. 먼저 지평선에서 방위각 " + R.tA + "°(" + dirName(R.tA) + "쪽)를 찾고, 그 세로선을 따라 고도 " + R.th + "°까지 올라가세요. 이제 위쪽에 지금 조준한 방위각·고도가 숫자로 나옵니다.";
    if (R.kind === "dm") return "노란 점선이 " + j(R.star.n, "이") + " 하루 동안 그리는 길이고, 점 하나가 1시간(15°)입니다. 지금 자리에서 <b>동→서 방향</b>(" + (R.star.dec > PHI ? "북쪽 하늘에서는 북쪽을 바라볼 때 시계 반대 방향" : "남쪽을 볼 때 왼쪽→오른쪽") + ")으로 점 " + R.N + "개만큼 가세요.";
    if (R.kind === "eq") { var L = curL(), Hh = wrap180(L - R.star.ra * 15) / 15; return "시간각 = 지방 항성시 − 적경 = " + fRA(L / 15) + " − " + fRA(R.star.ra) + " ≈ " + fH(Hh) + ". 시간각이 " + (Hh >= 0 ? "+이면 자오선보다 서쪽(남쪽을 볼 때 오른쪽)" : "−이면 자오선보다 동쪽(남쪽을 볼 때 왼쪽)") + "입니다. 이제 카드에 조준한 곳의 적경·적위가 나옵니다."; }
    return R.clue.hint;
  }
  function check() {
    if (!R || R.solved || anim) return;
    var L = curL(), a, d;
    if (R.kind === "aa") {
      d = sep(V.alt, V.az, R.th, R.tA);
      if (d <= R.tol) {
        R.reveal[R.star.n] = 1; R.tip = ["✔ 찾았습니다 · " + R.star.n, true];
        return solved("✅ <b>찾았습니다!</b> 방위각 " + R.tA + "°, 고도 " + R.th + "°에는 " + R.star.con + "의 <b>" + R.star.n + "</b>" + (bat(R.star.n) ? "이" : "가") + " 있었습니다. 방위각 " + R.tA + "°는 " + relDir(R.tA) + " 돌아간 곳(" + dirName(R.tA) + "쪽)이고, 고도 " + R.th + "°는 지평선에서 " + R.th + "° 올려다본 곳입니다.");
      }
      var A = V.az, h = V.alt, msg;
      /* 오개념 점이 목표에서 12° 넘게 떨어져 있고, 조준한 곳이 목표보다 그 점에 더 가까울 때만 그 실수로 진단 */
      function misAt(alt2, az2) { var dm2 = sep(h, A, alt2, az2); return sep(alt2, az2, R.th, R.tA) > 12 && dm2 < 6 && dm2 < d; }
      if (misAt(R.th, R.tA + 180)) msg = "방위각을 <b>남점에서</b> 잰 것 같습니다. 이 게임은 방위각을 <b>북점(0°)</b>에서 잽니다. 북 0° → 동 90° → 남 180° → 서 270°.";
      else if (misAt(R.th, 360 - R.tA)) msg = "방위각을 북에서 <b>서쪽</b>으로 잰 것 같습니다. 방위각은 북에서 <b>동쪽</b>으로, 곧 북→동→남→서 차례(북쪽을 보고 오른쪽으로 도는 방향)로 잽니다.";
      else if (misAt(90 - R.th, R.tA)) msg = "고도를 <b>천정에서</b> 내려 잰 것 같습니다. 고도는 <b>지평선(0°)</b>에서 위로 잽니다. 천정에서 잰 값(90° − 고도)은 천정 거리입니다.";
      else {
        var dA = Math.round(wrap180(A - R.tA)), dh = Math.round(h - R.th), parts = [];
        if (Math.abs(dA) > 2 && R.th < 80) parts.push("방위각이 " + Math.abs(dA) + "° " + (dA > 0 ? "큽니다(동→남→서 쪽으로 더 돌았습니다)" : "작습니다(덜 돌았습니다)"));
        if (Math.abs(dh) > 2) parts.push("고도가 " + Math.abs(dh) + "° " + (dh > 0 ? "높습니다" : "낮습니다"));
        msg = "조준한 곳은 방위각 " + Math.round(A) % 360 + "°, 고도 " + Math.round(h) + "°입니다. " + (parts.length ? parts.join(", ") + "." : "조금만 더 가까이 맞춰 보세요.");
      }
      return wrongCommon(msg, "✘ 목표에서 " + d.toFixed(0) + "° 벗어남", hintFor());
    }
    if (R.kind === "dm") {
      var tp = dmPos(); d = sep(V.alt, V.az, tp.alt, tp.az);
      var Hn = lstDeg(R.t) - R.star.ra * 15, cur = hd2hor(Hn, R.star.dec);
      if (d <= R.tol) {
        R.tip = ["✔ " + R.N + "시간 = " + 15 * R.N + "° 회전", true];
        /* 적위 > 위도인 별은 천정의 북쪽에서 남중 → 동·서 문구 대신 북극 둘레 회전으로 설명 */
        var dir = R.star.dec > PHI ? "북쪽 하늘의 별은 천구 북극을 중심으로 <b>시계 반대 방향</b>(북쪽을 바라볼 때)으로 돕니다." :
          (cur.az < 150 ? "동쪽 하늘의 별은 <b>남쪽(오른쪽) 위로 비스듬히</b> 떠오릅니다. 천구 적도와 나란한 길이라 지평선과 90° − 37.5° = 52.5°의 각을 이룹니다." : cur.az <= 210 ? "남쪽 하늘의 별은 <b>왼쪽(동)에서 오른쪽(서)으로</b> 움직입니다. 남중할 때 가장 높고, 남중한 뒤에는 고도가 낮아집니다." : "서쪽 하늘의 별은 <b>오른쪽(북쪽) 아래로 비스듬히</b> 내려가 서쪽 지평선으로 집니다.");
        startAnim();
        return solved("✅ <b>맞습니다!</b> " + j(R.star.n, "은") + " " + R.N + "시간 동안 천구 북극을 중심으로 " + 15 * R.N + "° 돌아 고도 " + cur.alt.toFixed(0) + "° → " + tp.alt.toFixed(0) + "°, 방위각 " + cur.az.toFixed(0) + "° → " + tp.az.toFixed(0) + "°가 됩니다(시간각 " + fH(wrap180(Hn) / 15) + " → " + fH(wrap180(Hn + 15 * R.N) / 15) + "). " + dir);
      }
      var best = 1e9, bH = 0;
      for (var k = 0; k < 360; k += 0.5) { var w = hd2hor(Hn + k, R.star.dec); var dd = sep(V.alt, V.az, w.alt, w.az); if (dd < best) { best = dd; bH = k; } }
      var dl = wrap180(bH), m2;
      if (sep(V.alt, V.az, cur.alt, cur.az) < 5) m2 = "지금 별이 있는 자리를 조준했습니다. 별은 그 자리에 머물지 않고 " + R.N + "시간 동안 " + 15 * R.N + "° 돌아갑니다.";
      else if (best < 6 && Math.abs(dl + 15 * R.N) < 8) m2 = "길은 맞지만 <b>반대 방향</b>으로 돌렸습니다. 지구가 서→동으로 자전하므로 별은 <b>동→서</b>로 움직입니다" + (R.star.dec > PHI ? "(북쪽 하늘에서는 천구 북극을 중심으로, 북쪽을 바라볼 때 시계 반대 방향)." : "(남쪽을 볼 때 왼쪽에서 오른쪽).");
      else if (best < 6) m2 = "별이 도는 길 위는 맞지만, 조준한 곳은 " + (dl > 0 ? "" : "반대 방향으로 ") + Math.abs(dl / 15).toFixed(1) + "시간(" + Math.abs(Math.round(dl)) + "°)만큼 돈 자리입니다. 규칙은 <b>1시간에 15°</b>이므로 " + R.N + "시간이면 " + 15 * R.N + "°입니다.";
      else if (Math.abs(V.alt - cur.alt) < 4 && Math.abs(Math.abs(wrap180(V.az - cur.az)) - 15 * R.N) < 8) m2 = "고도는 그대로 두고 방위각만 " + 15 * R.N + "° 돌렸습니다. 그러면 <b>천정</b>을 중심으로 돈 것입니다. 별은 <b>천구 북극(정북 고도 37.5°)</b>을 중심으로 돌기 때문에 고도도 함께 바뀝니다.";
      else { var ce = hor2eq(V.alt, V.az, lstDeg(R.t)); m2 = j(R.star.n, "은") + " 천구 북극에서 늘 " + (90 - R.star.dec).toFixed(0) + "°(90° − 적위) 떨어진 원을 돕니다. 조준한 곳은 천구 북극에서 " + (90 - ce.dec).toFixed(0) + "° 떨어져 있어 이 별이 지나갈 수 없는 자리입니다."; }
      return wrongCommon(m2, "✘ 정답 자리에서 " + d.toFixed(0) + "° 벗어남", hintFor());
    }
    var p = nearestStar(L);
    if (!p) { R.tip = ["원 안에 밝은 별이 없습니다", null]; fb("조준선 원 안에 밝은 별이 없습니다. 별을 원 가운데에 놓고 다시 판정해 주세요(틀린 것으로 세지 않습니다).", ""); draw(); return; }
    if (R.kind === "eq") {
      if (p.s === R.star) {
        R.reveal[p.s.n] = 1; R.tip = ["✔ " + p.s.n + " · " + fRA(p.s.ra) + " " + fDec(p.s.dec), true];
        var msg3 = "✅ <b>" + p.s.con + "의 " + p.s.n + "</b>입니다. 적경 " + fRA(p.s.ra) + ", 적위 " + fDec(p.s.dec) + ". 지금 지방 항성시가 " + fRA(L / 15) + "이므로 시간각은 " + fH(p.H) + ", 그래서 " + (Math.abs(p.H) < 0.2 ? "거의 자오선 위" : p.H > 0 ? "자오선보다 서쪽(오른쪽)" : "자오선보다 동쪽(왼쪽)") + "에 있습니다(고도 " + p.alt.toFixed(0) + "°, 방위각 " + p.az.toFixed(0) + "°).";
        if (R.quizAfter) { R.quiz = true; R.solved = true; draw(); showQuiz(msg3); return; }
        return solved(msg3);
      }
      var dRA = wrap180((p.s.ra - R.star.ra) * 15) / 15, dD = p.s.dec - R.star.dec, sx = [], m3;
      var mir = wrap180((p.s.ra - wrap360(2 * L - R.star.ra * 15) / 15) * 15) / 15;
      if (Math.abs(dRA) > 0.6 && Math.abs(mir) < 0.5 && Math.abs(dD) < 6) m3 = "적경을 <b>반대 방향</b>으로 센 것 같습니다. 적경은 춘분점에서 천구 적도를 따라 <b>동쪽으로</b> 커집니다. 남쪽 하늘을 볼 때 왼쪽(동)으로 갈수록 적경이 큽니다.";
      else if (Math.abs(R.star.dec) > 5 && Math.abs(p.s.dec + R.star.dec) < 4 && Math.abs(dRA) < 0.6) m3 = "적위의 부호가 거꾸로입니다. 적위 +는 천구 적도의 <b>북쪽</b>, −는 <b>남쪽</b>입니다.";
      else {
        if (Math.abs(dRA) > 0.15) sx.push("적경이 " + fRA(Math.abs(dRA)).replace(/^0h /, "") + " " + (dRA > 0 ? "큽니다 → 목표는 그보다 서쪽(남쪽을 볼 때 오른쪽)" : "작습니다 → 목표는 그보다 동쪽(남쪽을 볼 때 왼쪽)"));
        if (Math.abs(dD) > 2) sx.push("적위가 " + Math.abs(dD).toFixed(1) + "° " + (dD > 0 ? "큽니다 → 목표는 더 남쪽" : "작습니다 → 목표는 더 북쪽"));
        m3 = sx.length ? "조준한 별은 적경 " + fRA(p.s.ra) + ", 적위 " + fDec(p.s.dec) + "입니다. " + sx.join(", ") + ". 적경 1시간은 천구 적도에서 15°입니다."
          : "조준한 별은 적경 " + fRA(p.s.ra) + ", 적위 " + fDec(p.s.dec) + "로 목표 바로 옆의 다른 별입니다. 목표 별을 조준 원 한가운데에 놓고 다시 판정하세요.";
      }
      return wrongCommon(m3, "✘ 다른 별(적경 " + fRA(p.s.ra) + ")", hintFor());
    }
    /* 단서 미션 */
    if (R.clue.ok(p)) {
      R.reveal[p.s.n] = 1;
      R.tip = ["✔ " + p.s.n, true]; S.foundBy = S.foundBy || {}; S.foundBy[R.idx] = p.s.n;
      return solved("✅ <b>" + p.s.con + "의 " + p.s.n + "</b> — 단서와 맞습니다. 고도 " + p.alt.toFixed(1) + "°, 방위각 " + p.az.toFixed(0) + "°, 적위 " + fDec(p.s.dec) + ", 시간각 " + fH(p.H) + ". " + clueWhy(R.idx, p));
    }
    wrongCommon(R.clue.why(p), "✘ 단서와 다른 별", hintFor());
  }
  function clueWhy(i, p) {
    return [
      "천구 북극의 고도는 위도와 같으므로, 북극성의 고도만 재면 내가 있는 곳의 위도를 알 수 있습니다.",
      "적위 " + fDec(p.s.dec) + " > 52.5°라 천구 북극에서 " + (90 - p.s.dec).toFixed(1) + "° 안쪽을 돕니다. 가장 낮을 때(하부 정중)도 고도 " + sg(p.s.dec - (90 - PHI)) + "°라 지지 않습니다.",
      "남중 고도 = 90° − 위도 + 적위 = 90° − 37.5° + (" + sg(p.s.dec) + "°) = " + sg(90 - PHI + p.s.dec) + "°. 계산과 화면이 맞습니다. 덧붙여 자오선 가까이 아래쪽에 있는 카노푸스(적위 −52.7°)는 남중 고도가 −0.2°라 서울에서는 지평선에 걸려 거의 보이지 않습니다.",
      "적위가 0°에 가까운 별은 정동에서 떠서 정서로 지고, 하루 가운데 지평선 위에 떠 있는 시간이 약 12시간(절반)입니다.",
      "이 별은 남중을 지나 시간각 " + fH(p.H) + "이고, 고도 0°(서쪽 지평선)에 닿으면 집니다."
    ][i];
  }
  function solved(msg) { R.solved = true; finishRound(msg); }
  function finishRound(msg) {
    var last = false;
    if (R.lv === 5) S.free++;
    else {
      S.rd[R.lv] = R.idx + 1;
      if (R.idx + 1 >= R.total) { last = true; S.done[R.lv] = 1; S.open = Math.max(S.open, R.lv + 1); }
    }
    save(); buildLevels();
    $("g-show").hidden = true; $("g-check").hidden = true;
    var nx = $("g-next"); nx.hidden = false;
    nx.textContent = R.lv === 5 ? "다음 문제 ▶" : !last ? "다음 문제 ▶" : R.lv < 4 ? "레벨 " + (R.lv + 1) + " ▶" : "자유 모드 ▶";
    fb(msg + (last ? "<div class='g-sum'>📌 <b>레벨 " + R.lv + " 정리</b> — " + SUM[R.lv] + "</div>" : ""), "ok");
    if (R.kind === "clue") story();
    draw();
  }
  function showQuiz(msg) {
    var L0 = lstDeg(21), a0 = starAt(R.star, L0), a1 = starAt(R.star, curL());
    var box = $("g-quiz"); box.hidden = false;
    box.innerHTML = "<div class='g-cap'>3시간 사이에 " + R.star.n + "의 좌표 가운데 바뀐 것은 무엇일까요?</div>" +
      "<div class='g-cmp'>밤 9시: 고도 " + a0.alt.toFixed(1) + "° · 방위각 " + a0.az.toFixed(1) + "° · 적경 " + fRA(R.star.ra) + " · 적위 " + fDec(R.star.dec) +
      "<br>자정: 고도 " + a1.alt.toFixed(1) + "° · 방위각 " + a1.az.toFixed(1) + "° · 적경 " + fRA(R.star.ra) + " · 적위 " + fDec(R.star.dec) + "</div>" +
      "<div class='g-opts'>" + ["고도·방위각만 바뀌었다", "적경·적위만 바뀌었다", "넷 다 바뀌었다", "아무것도 바뀌지 않았다"].map(function (s, i) { return "<button type='button' class='g-opt' data-i='" + i + "'>" + s + "</button>"; }).join("") + "</div>";
    fb(msg + "<br><br>이제 아래 질문에 답하면 레벨이 끝납니다.", "ok");
    $("g-check").hidden = true;
    R.tip = ["✔ 찾았습니다 · 질문에 답하세요", true]; draw();
  }
  function quizPick(i) {
    if (!R.quiz) return;
    var why = [null,
      "적경·적위는 천구(하늘)에 붙은 좌표라 하늘과 함께 돕니다. 그래서 별이 움직여도 값이 그대로입니다. 위의 두 줄을 비교해 보세요.",
      "적경·적위는 3시간 뒤에도 똑같습니다. 바뀐 것은 관측자에게 붙은 좌표뿐입니다.",
      "별은 3시간 동안 45°나 움직였으니, 관측자 기준의 값은 분명히 바뀌었습니다."][i];
    if (i === 0) {
      R.quiz = false; $("g-quiz").hidden = true;
      finishRound("✅ <b>맞습니다.</b> 3시간 동안 하늘이 45° 돌아 베텔게우스의 고도·방위각은 바뀌었지만, 적경 " + fRA(R.star.ra) + "·적위 " + fDec(R.star.dec) + "는 그대로입니다. <b>지평 좌표</b>(고도·방위각)는 관측자의 지평선과 북점을 기준으로 하고, <b>적도 좌표</b>(적경·적위)는 천구 적도와 춘분점을 기준으로 하기 때문입니다.");
    } else { R.wrong++; R.tip = ["✘ 다시 생각해 보세요", false]; fb("❌ " + why, "bad"); draw(); }
  }

  /* ---------- 일주 운동 애니메이션(setTimeout) ---------- */
  var anim = null;
  function startAnim() {
    var t0 = Date.now(), dur = K.REDUCE ? 1 : 1800, N = R.N;
    anim = true;
    (function step() {
      var f = Math.min(1, (Date.now() - t0) / dur), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      R.shift = N * e; draw();
      if (f < 1) setTimeout(step, 33); else { anim = null; R.shift = N; draw(); }
    })();
  }

  /* ---------- 화면 구성 ---------- */
  function buildLevels() {
    var box = $("g-levels"); box.innerHTML = "";
    [1, 2, 3, 4, 5].forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "g-lv"; b.setAttribute("aria-pressed", R && R.lv === n ? "true" : "false");
      b.disabled = !isOpen(n);
      b.innerHTML = (n === 5 ? "자유" : "레벨 " + n) + (S.done[n] ? " ✔" : "") + "<small>" + (isOpen(n) ? LVN[n] : "🔒 앞 레벨을 마치면") + "</small>";
      b.addEventListener("click", function () { if (isOpen(n)) startLevel(n, true); });
      box.appendChild(b);
    });
  }
  function goal() {
    if (R.kind === "aa") return "방위각 " + R.tA + "°, 고도 " + R.th + "°인 곳에 별이 숨어 있습니다. 하늘을 끌어 십자선을 그곳에 맞추고 ‘조준 판정’을 누르세요.";
    if (R.kind === "dm") return "지금(" + ko(R.t) + ") 주황 고리 속 " + j(R.star.n, "은") + " " + R.N + "시간 뒤(" + ko(R.t + R.N) + ") 어디에 있을까요? 그 자리를 조준하세요.";
    if (R.kind === "eq") return (R.quizAfter ? "3시간이 지나 자정이 되었습니다. 다시 " : "") + "적경 " + fRA(R.star.ra) + ", 적위 " + fDec(R.star.dec) + "인 밝은 별을 조준하세요" + (R.t !== 21 && !R.quizAfter ? "(" + clock(R.t) + ")" : "") + ".";
    return "단서 " + (R.idx + 1) + " — " + R.clue.s;
  }
  function story() {
    var el = $("g-story"), h = "";
    if (R.kind === "aa") h = "<b>지평 좌표</b> — 관측자가 선 곳의 지평선을 기준으로 합니다.<ul><li><b>방위각</b>: 북점(0°)에서 지평선을 따라 동(90°) → 남(180°) → 서(270°) 차례로 잰 각(위에서 내려다볼 때 시계 방향)</li><li><b>고도</b>: 지평선(0°)에서 천정(90°) 쪽으로 올려다본 각</li><li>남쪽을 바라볼 때는 <b>왼쪽이 동쪽, 오른쪽이 서쪽</b>입니다(교과서에 따라 남점을 0°로 잡기도 합니다).</li></ul>";
    else if (R.kind === "dm") h = "<b>일주 운동 규칙</b> — 별은 <b>천구 북극</b>(정북, 고도 37.5° · 북극성 바로 옆, 하늘색 ＋)을 중심으로 <b>1시간에 15°</b>씩 <b>동에서 서로</b> 돕니다. 지구가 서에서 동으로 하루 한 바퀴(360° ÷ 24시간 = 15°/시간) 자전하기 때문입니다. 별과 천구 북극 사이의 각은 바뀌지 않습니다.";
    else if (R.kind === "eq") h = "<b>적도 좌표</b> — 천구에 붙은 좌표라 하늘과 함께 돕니다(하늘색 격자).<ul><li><b>적경</b>: 춘분점에서 천구 적도를 따라 <b>동쪽으로</b> 잰 각. 0h~24h, 1h = 15°</li><li><b>적위</b>: 천구 적도(0°)에서 북(+)·남(−)으로 잰 각</li><li><b>지방 항성시</b> = 지금 자오선 위에 있는 적경. 시간각 = 지방 항성시 − 적경</li></ul>";
    else {
      h = "<b>오늘 밤 하늘 · 2027년 2월 24일(수) 밤 9시 · 서울 부근(위도 37.5°N)</b> — 단서에 맞는 별을 차례로 조준하세요. 맞힌 별은 이름이 나타납니다.<ol>";
      CLUES.forEach(function (c, i) { var dn = i < R.idx || (i === R.idx && R.solved); h += "<li>" + (dn ? "✔ " : i === R.idx ? "▶ " : "") + (i <= R.idx ? c.s : "(앞 단서를 풀면 열립니다)") + (dn ? " — <b>" + (i < R.idx ? (S.foundBy && S.foundBy[i]) || c.ans : (S.foundBy && S.foundBy[i]) || "") + "</b>" : "") + "</li>"; });
      h += "</ol>";
    }
    el.innerHTML = h; el.hidden = !h;
  }
  function startRound(lv, idx) {
    R = mkRound(lv, idx);
    G.eq = !!R.eqDef;
    if (anim) anim = null;
    if (R.kind === "dm") { var c0 = starAt(R.star, lstDeg(R.t)); V.az = c0.az; V.alt = clamp(c0.alt, -5, 90); }
    $("g-check").hidden = false; $("g-next").hidden = true; $("g-show").hidden = true; $("g-quiz").hidden = true;
    $("g-goal").textContent = goal(); story(); fb("", "");
    syncToggles(); buildLevels(); draw();
  }
  function startLevel(n, user) {
    S.lv = n; save();
    var idx = n === 5 ? 0 : (S.rd[n] || 0);
    if (idx >= TOT[n]) idx = 0;
    if (user || n !== R.lv) { V.az = n === 2 ? 60 : 180; V.alt = 30; }
    startRound(n, idx);
  }
  function syncToggles() { $("g-hz").setAttribute("aria-pressed", G.hz ? "true" : "false"); $("g-eq").setAttribute("aria-pressed", G.eq ? "true" : "false"); }

  /* ---------- 조작: 끌기·누르기·화살표 ---------- */
  var pend = false;
  function req() { if (pend) return; pend = true; setTimeout(function () { pend = false; draw(); }, 16); }
  function look(dAz, dAlt) { V.az = wrap360(V.az + dAz); V.alt = clamp(V.alt + dAlt, -5, 90); req(); }
  function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  var drag = null;
  cv.addEventListener("pointerdown", function (e) {
    var p = pt(e); if (p.x > SKY.x + SKY.w || p.y > SKY.y + SKY.h) return;
    drag = { x: p.x, y: p.y, az: V.az, alt: V.alt, moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ }
    e.preventDefault();
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var p = pt(e), dx = p.x - drag.x, dy = p.y - drag.y, k = R2D / F;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    V.alt = clamp(drag.alt + dy * k, -5, 90);
    V.az = wrap360(drag.az - dx * k / Math.max(Math.cos(V.alt * D2R), 0.35));
    req();
  });
  function endDrag(e) {
    if (!drag) return;
    if (!drag.moved && e.type === "pointerup") { var u = unproj(drag.x, drag.y); V.az = u.az; V.alt = clamp(u.alt, -5, 90); req(); }
    drag = null;
  }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);
  document.addEventListener("keydown", function (e) {
    var tg = e.target && e.target.tagName;
    if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT" || e.altKey || e.ctrlKey || e.metaKey) return;
    var s = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft") look(-s, 0); else if (e.key === "ArrowRight") look(s, 0);
    else if (e.key === "ArrowUp") look(0, s); else if (e.key === "ArrowDown") look(0, -s);
    else if (e.key === "Enter" && e.target === cv) { check(); } else return;
    e.preventDefault();
  });
  [["g-left", -3, 0], ["g-right", 3, 0], ["g-up", 0, 3], ["g-down", 0, -3]].forEach(function (b) { $(b[0]).addEventListener("click", function () { look(b[1], b[2]); }); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-face]"), function (b) {
    b.addEventListener("click", function () { var v = b.getAttribute("data-face"); if (v === "z") { V.alt = 90; } else { V.az = +v; V.alt = 25; } req(); });
  });
  $("g-hz").addEventListener("click", function () { G.hz = !G.hz; syncToggles(); draw(); });
  $("g-eq").addEventListener("click", function () { G.eq = !G.eq; syncToggles(); draw(); });
  $("g-check").addEventListener("click", check);
  $("g-show").addEventListener("click", function () {
    var a = answerPos(); V.az = a.az; V.alt = clamp(a.alt, -5, 90); R.shown = true; R.readout = true;
    fb("정답 자리로 하늘을 돌려 두었습니다(초록 점선 고리). 왜 그 자리인지 힌트를 다시 읽고 ‘조준 판정’을 눌러 확인하세요.", ""); draw();
  });
  $("g-next").addEventListener("click", function () {
    if (R.lv === 5) return startRound(5, 0);
    if (R.idx + 1 < R.total) return startRound(R.lv, R.idx + 1);
    startLevel(R.lv < 4 ? R.lv + 1 : 5, true);
  });
  $("g-quiz").addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest(".g-opt") : null; if (b) quizPick(+b.getAttribute("data-i")); });
  $("g-reset").addEventListener("click", function () { if (R.lv !== 5) { S.rd[R.lv] = 0; if (R.lv === 4) S.foundBy = {}; save(); } V.az = R.lv === 2 ? 60 : 180; V.alt = 30; startRound(R.lv, 0); });
  var wipeArm = 0;
  $("g-wipe").addEventListener("click", function () {
    var b = $("g-wipe");
    if (Date.now() - wipeArm < 4000) { S = fresh(); save(); b.textContent = "기록 지우기"; wipeArm = 0; startLevel(1, true); return; }
    wipeArm = Date.now(); b.textContent = "한 번 더 누르면 모두 지웁니다";
    setTimeout(function () { if (wipeArm && Date.now() - wipeArm >= 3900) { wipeArm = 0; b.textContent = "기록 지우기"; } }, 4000);
  });
  cv._redraw = draw;

  /* 시험용(교사·검수): 하늘 보는 방향 바꾸기 */
  window.sthSkyGame = { look: function (alt, az) { V.alt = alt; V.az = az; draw(); }, answer: function () { return answerPos(); }, round: function () { return R; } };

  if (!isOpen(S.lv)) S.lv = 1;
  R = { lv: 0 };
  startLevel(S.lv, true);
})();
