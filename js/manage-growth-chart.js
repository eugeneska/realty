/* v1.0.4 */
const containers = document.querySelectorAll("[data-manage-growth-chart]");

if (containers.length) {
  initManageGrowthCharts().catch(function (err) {
    console.error("manage-growth-chart:", err);
  });
}

async function initManageGrowthCharts() {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  containers.forEach(function (container) {
    if (container.dataset.ready === "1") return;
    container.dataset.ready = "1";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf6efff, 0x220d38, 2.25));

    const key = new THREE.DirectionalLight(0xffffff, 4.7);
    key.position.set(-4, 8, 7);
    scene.add(key);

    const purpleRim = new THREE.DirectionalLight(0xa76cff, 3.2);
    purpleRim.position.set(6, 3.5, -4);
    scene.add(purpleRim);

    const frontFill = new THREE.PointLight(0xf2deff, 9, 20, 2);
    frontFill.position.set(-2.5, 3.3, 5);
    scene.add(frontFill);

    function glossy(color, roughness) {
      if (roughness === undefined) roughness = 0.18;
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.03,
        roughness: roughness,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        reflectivity: 1
      });
    }

    function roundedRectShape(width, height, radius) {
      const w = width;
      const h = height;
      const r = Math.min(radius, width / 2, height / 2);
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    }

    function roundedExtrudedMesh(width, height, depth, radius, material, bevel) {
      if (bevel === undefined) bevel = 0.10;
      const shape = roundedRectShape(width, height, radius);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: bevel,
        bevelThickness: bevel,
        curveSegments: 12
      });
      geo.translate(0, 0, -depth / 2);
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, material);
    }

    const root = new THREE.Group();
    root.rotation.set(-0.08, 0, 0);
    root.scale.setScalar(0.93);
    scene.add(root);

    const base = roundedExtrudedMesh(6.65, 0.68, 1.72, 0.32, glossy(0xb99aee, 0.20), 0.12);
    base.position.set(0.1, 0.34, 0);
    root.add(base);

    const colors = [0xdfceff, 0xc8a8ff, 0xac78f7, 0x8248df, 0x4d2086];
    const targetHeights = [1.15, 1.78, 2.46, 3.26, 4.12];
    const xPositions = [-2.12, -1.08, -0.04, 1.0, 2.04];
    const bars = [];

    targetHeights.forEach(function (targetH, i) {
      const bar = roundedExtrudedMesh(1.02, 1, 1.12, 0.24, glossy(colors[i], 0.13), 0.10);
      bar.position.x = xPositions[i];
      bar.position.z = 0.05;
      bar.userData.targetH = targetH;
      root.add(bar);
      bars.push(bar);
    });

    const arrowGroup = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.46, 2.28, 0.34),
      new THREE.Vector3(-1.52, 2.56, 0.35),
      new THREE.Vector3(-0.58, 2.98, 0.36),
      new THREE.Vector3(0.40, 3.54, 0.36),
      new THREE.Vector3(1.34, 4.22, 0.36),
      new THREE.Vector3(2.05, 4.88, 0.36)
    ]);
    const arrowMat = glossy(0x813bef, 0.10);
    const shaft = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.19, 20, false), arrowMat);
    arrowGroup.add(shaft);

    const end = curve.getPoint(1);
    const tangent = curve.getTangent(1).normalize();
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.0, 40), arrowMat);
    head.position.copy(end).add(tangent.clone().multiplyScalar(0.28));
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    arrowGroup.add(head);
    root.add(arrowGroup);

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    function easeInOutSine(x) {
      return -(Math.cos(Math.PI * THREE.MathUtils.clamp(x, 0, 1)) - 1) / 2;
    }

    const sceneFrame = {
      width: 7.2,
      height: 6.4,
      centerX: 0.1,
      centerY: 2.95
    };

    function fitCamera() {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;

      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const distForHeight = (sceneFrame.height * 0.5) / Math.tan(vFov * 0.5);
      const hFov = 2 * Math.atan(Math.tan(vFov * 0.5) * camera.aspect);
      const distForWidth = (sceneFrame.width * 0.5) / Math.tan(hFov * 0.5);
      const distance = Math.max(distForHeight, distForWidth) * 1.14;

      camera.position.set(sceneFrame.centerX, sceneFrame.centerY + 0.45, distance);
      camera.lookAt(sceneFrame.centerX, sceneFrame.centerY - 0.2, 0);
      camera.updateProjectionMatrix();
    }

    function render() {
      raf = 0;
      if (!visible) return;

      const t = clock.getElapsedTime();

      if (!reduce.matches) {
        root.position.y = Math.sin(t * 1.25) * 0.035;
        root.rotation.y = Math.sin(t * 0.62) * 0.018;
        root.rotation.x = -0.08 + Math.sin(t * 0.82) * 0.012;
        root.rotation.z = Math.sin(t * 0.72) * 0.008;

        const cycleSpeed = 1.35;

        bars.forEach(function (bar, i) {
          const wave = Math.sin(t * cycleSpeed - i * 0.55) * 0.5 + 0.5;
          const e = easeInOutSine(wave);
          const low = 0.86;
          const scaleFactor = low + (1 - low) * e;
          const breathe = 1 + Math.sin(t * 2.0 + i * 0.55) * 0.004;
          const h = bar.userData.targetH * scaleFactor * breathe;
          bar.scale.y = h;
          bar.position.y = 0.76 + h / 2;
        });

        const arrowWave = Math.sin(t * cycleSpeed - 0.35) * 0.5 + 0.5;
        const arrowEase = easeInOutSine(arrowWave);
        arrowGroup.position.y = 0.02 + arrowEase * 0.06 + Math.sin(t * 1.75) * 0.01;
        arrowGroup.scale.setScalar(0.98 + arrowEase * 0.025 + Math.sin(t * 1.55) * 0.002);
        arrowGroup.rotation.z = Math.sin(t * 1.15) * 0.01;
      }

      renderer.render(scene, camera);
      if (!reduce.matches) raf = window.requestAnimationFrame(render);
    }

    function resize() {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      fitCamera();
      renderer.setSize(w, h, false);
    }

    function onVisible(entries) {
      visible = entries.some(function (entry) {
        return entry.isIntersecting;
      });
      if (visible && !raf) render();
    }

    if ("IntersectionObserver" in window) {
      const watch = new IntersectionObserver(onVisible, { threshold: 0.08 });
      watch.observe(container);
    }

    window.addEventListener("resize", resize);
    resize();
    render();
  });
}
