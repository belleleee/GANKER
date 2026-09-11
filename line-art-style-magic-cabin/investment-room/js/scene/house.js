function horizontalLogWall(along, fixed, half, openings) {
  const wallTop = 4.4;
  const logGap = .22;
  const group = new THREE.Group();
  for (let y = .18; y < wallTop; y += logGap) {
    let segments = [[-half, half]];
    for (const op of openings || []) {
      if (y <= op.y0 || y >= op.y1) continue;
      const next = [];
      for (const seg of segments) {
        const a = seg[0];
        const b = seg[1];
        const lo = op.c - op.hw;
        const hi = op.c + op.hw;
        if (hi <= a || lo >= b) {
          next.push(seg);
        } else {
          if (lo > a) next.push([a, lo]);
          if (hi < b) next.push([hi, b]);
        }
      }
      segments = next;
    }
    for (const seg of segments) {
      if (seg[1] - seg[0] < .16) continue;
      const piece = log(seg[1] - seg[0], .075);
      if (along === 'x') {
        piece.rotation.z = Math.PI / 2;
        piece.position.set((seg[0] + seg[1]) / 2, y, fixed);
      } else {
        piece.rotation.x = Math.PI / 2;
        piece.position.set(fixed, y, (seg[0] + seg[1]) / 2);
      }
      group.add(piece);
    }
  }
  scene.add(group);
}

function gableWall(z, openings) {
  const wallTop = 4.4;
  const ridgeY = 6.35;
  const half = 4;
  const group = new THREE.Group();
  for (let y = wallTop + .08; y < ridgeY; y += .22) {
    const halfWidth = half * (ridgeY - y) / (ridgeY - wallTop);
    if (halfWidth < .28) break;
    let segments = [[-halfWidth, halfWidth]];
    for (const op of openings || []) {
      if (y <= op.y0 || y >= op.y1) continue;
      const next = [];
      for (const seg of segments) {
        const lo = op.c - op.hw;
        const hi = op.c + op.hw;
        if (hi <= seg[0] || lo >= seg[1]) {
          next.push(seg);
        } else {
          if (lo > seg[0]) next.push([seg[0], lo]);
          if (hi < seg[1]) next.push([hi, seg[1]]);
        }
      }
      segments = next;
    }
    for (const seg of segments) {
      if (seg[1] - seg[0] < .16) continue;
      const piece = log(seg[1] - seg[0], .07);
      piece.rotation.z = Math.PI / 2;
      piece.position.set((seg[0] + seg[1]) / 2, y, z);
      group.add(piece);
    }
  }
  scene.add(group);
}

function squareWindow(cx, cy, cz, face, w, h, holeHw) {
  const group = new THREE.Group();
  const frameDepth = .12;
  put(box(w, .09, frameDepth), w / 2, h / 2 - .045, 0, 0, 0, 0, group);
  put(box(w, .09, frameDepth), w / 2, -h / 2 + .045, 0, 0, 0, 0, group);
  put(box(.09, h, frameDepth), .045, 0, 0, 0, 0, 0, group);
  put(box(.09, h, frameDepth), w - .045, 0, 0, 0, 0, 0, group);
  put(box(w - .18, .045, .07), w / 2, 0, .02, 0, 0, 0, group);
  put(box(.045, h - .18, .07), w / 2, 0, .02, 0, 0, 0, group);
  const glassGeo = new THREE.BoxGeometry(w - .18, h - .18, .035);
  const glass = new THREE.Mesh(glassGeo, GLASS_MAT);
  glass.position.set(w / 2, 0, 0);
  group.add(glass);
  const glassLines = new THREE.LineSegments(new THREE.EdgesGeometry(glassGeo), LINE_MAT);
  glassLines.position.copy(glass.position);
  group.add(glassLines);

  if (face === '+z') group.position.set(cx - w / 2, cy, cz);
  if (face === '-z') {
    group.rotation.y = Math.PI;
    group.position.set(cx + w / 2, cy, cz);
  }
  if (face === '-x') {
    group.rotation.y = -Math.PI / 2;
    group.position.set(cx, cy, cz - w / 2);
  }
  if (face === '+x') {
    group.rotation.y = Math.PI / 2;
    group.position.set(cx, cy, cz + w / 2);
  }
  scene.add(group);

  if (face === '+z' || face === '-z') {
    put(box(.1, h + .28, .22), cx - holeHw, cy, cz);
    put(box(.1, h + .28, .22), cx + holeHw, cy, cz);
    put(box(holeHw * 2 + .14, .1, .22), cx, cy + h / 2 + .07, cz);
    put(box(w + .22, .08, .18), cx, cy - h / 2 - .07, cz);
  } else {
    put(box(.22, h + .28, .1), cx, cy, cz - holeHw);
    put(box(.22, h + .28, .1), cx, cy, cz + holeHw);
    put(box(.22, .1, holeHw * 2 + .14), cx, cy + h / 2 + .07, cz);
    put(box(.18, .08, w + .22), cx, cy - h / 2 - .07, cz);
  }
}
