/* =========================================
   DIRECTOR MARKET — 3D Solar System (Three.js)
   Contact Page Background
   ========================================= */

(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }

    let scene, camera, renderer;
    let planets = [];
    let sun, sunGlows = [];
    let scrollY = 0;
    let mouseX = 0, mouseY = 0;
    let clock;

    // Sun center = origin. Camera looks LEFT of origin so sun appears RIGHT.
    const SUN_POS = new THREE.Vector3(0, 0, 0);
    // Camera looks at a point far left of the sun
    const LOOK_TARGET = new THREE.Vector3(-30, -3, 0);

    const PLANET_DATA = [
        { name: 'mercury', dist: 8,   size: 0.35, speed: 1.6,  texture: 'assets/planets/mercury.png', tilt: 0.03 },
        { name: 'venus',   dist: 12,  size: 0.55, speed: 1.2,  texture: 'assets/planets/venus.png',   tilt: 2.64 },
        { name: 'earth',   dist: 17,  size: 0.6,  speed: 1.0,  texture: 'assets/planets/earth.png',   tilt: 0.41, glow: [0.2, 0.4, 1.0] },
        { name: 'mars',    dist: 22,  size: 0.45, speed: 0.8,  texture: 'assets/planets/mars.png',    tilt: 0.44 },
        { name: 'jupiter', dist: 30,  size: 2.0,  speed: 0.45, texture: 'assets/planets/jupiter.png', tilt: 0.05 },
        { name: 'saturn',  dist: 40,  size: 1.6,  speed: 0.35, texture: 'assets/planets/saturn.png',  tilt: 0.47, rings: true },
        { name: 'uranus',  dist: 50,  size: 1.1,  speed: 0.25, texture: 'assets/planets/uranus.png',  tilt: 1.71 },
        { name: 'neptune', dist: 58,  size: 1.1,  speed: 0.18, texture: 'assets/planets/neptune.png', tilt: 0.49 }
    ];

    function init() {
        clock = new THREE.Clock();
        scene = new THREE.Scene();

        // Camera: offset right + high, looking to the LEFT
        // This makes the origin (sun) appear in the RIGHT side of the viewport
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.set(20, 30, 55);
        camera.lookAt(LOOK_TARGET);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const canvas = renderer.domElement;
        canvas.id = 'solar-system-3d';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2;pointer-events:none;';
        document.body.prepend(canvas);

        const textureLoader = new THREE.TextureLoader();

        createStarfield();
        createSun(textureLoader);
        PLANET_DATA.forEach(d => createPlanet(d, textureLoader));
        createOrbitLines();

        // Lights
        const sunLight = new THREE.PointLight(0xffaa44, 3, 200);
        sunLight.position.copy(SUN_POS);
        scene.add(sunLight);

        scene.add(new THREE.AmbientLight(0x222244, 0.35));
        scene.add(new THREE.HemisphereLight(0x4466aa, 0x111122, 0.15));

        // Events
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', () => { scrollY = window.scrollY; });
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        animate();
    }

    function createStarfield() {
        const count = 2500;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = 100 + Math.random() * 150;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i3]     = r * Math.sin(phi) * Math.cos(theta);
            pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i3 + 2] = r * Math.cos(phi);

            const t = Math.random();
            if (t > 0.95) { col[i3] = 0.7; col[i3+1] = 0.85; col[i3+2] = 1.0; }
            else if (t > 0.9) { col[i3] = 1.0; col[i3+1] = 0.85; col[i3+2] = 0.7; }
            else { col[i3] = 1.0; col[i3+1] = 1.0; col[i3+2] = 0.95; }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stars = new THREE.Points(geo, mat);
        stars.userData.isStarfield = true;
        scene.add(stars);
    }

    function createSun(textureLoader) {
        const tex = textureLoader.load('assets/planets/sun.png');
        tex.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.SphereGeometry(2.5, 64, 64);
        const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffcc66 });
        sun = new THREE.Mesh(geo, mat);
        sun.position.copy(SUN_POS);
        scene.add(sun);

        // Glow layers (sphere-based, no sprite squares)
        [
            { color: 0xff9900, size: 4.0, opacity: 0.12 },
            { color: 0xff6600, size: 6.0, opacity: 0.06 },
            { color: 0xff4400, size: 8.5, opacity: 0.03 },
            { color: 0xff2200, size: 11,  opacity: 0.015 }
        ].forEach(g => {
            const gGeo = new THREE.SphereGeometry(g.size, 32, 32);
            const gMat = new THREE.MeshBasicMaterial({
                color: g.color,
                transparent: true,
                opacity: g.opacity,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(gGeo, gMat);
            mesh.position.copy(SUN_POS);
            sunGlows.push(mesh);
            scene.add(mesh);
        });
    }

    function createPlanet(data, textureLoader) {
        const group = new THREE.Group();
        const pivot = new THREE.Group();

        const tex = textureLoader.load(data.texture);
        tex.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.SphereGeometry(data.size, 64, 64);
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.8,
            metalness: 0.05
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = data.tilt || 0;
        pivot.add(mesh);

        // Atmospheric glow for Earth
        if (data.glow) {
            const gGeo = new THREE.SphereGeometry(data.size * 1.15, 32, 32);
            const gMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(data.glow[0], data.glow[1], data.glow[2]),
                transparent: true,
                opacity: 0.18,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            pivot.add(new THREE.Mesh(gGeo, gMat));
        }

        // Saturn rings
        if (data.rings) {
            const inner = data.size * 1.4;
            const outer = data.size * 2.8;
            
            const ringGeo = new THREE.RingGeometry(inner, outer, 128);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xd4b896,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2 + 0.3;
            pivot.add(ring);

            // Darker inner band
            const innerGeo = new THREE.RingGeometry(inner, inner + (outer - inner) * 0.35, 128);
            const innerMat = new THREE.MeshBasicMaterial({
                color: 0x997755,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const innerRing = new THREE.Mesh(innerGeo, innerMat);
            innerRing.rotation.x = -Math.PI / 2 + 0.3;
            pivot.add(innerRing);
        }

        // Starting position on orbit
        const angle = Math.random() * Math.PI * 2;
        pivot.position.set(
            SUN_POS.x + Math.cos(angle) * data.dist,
            (Math.random() - 0.5) * 1.5,
            SUN_POS.z + Math.sin(angle) * data.dist
        );

        group.add(pivot);
        scene.add(group);

        planets.push({ group, pivot, mesh, data, angle });
    }

    function createOrbitLines() {
        PLANET_DATA.forEach(data => {
            const pts = [];
            const seg = 128;
            for (let i = 0; i <= seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                pts.push(new THREE.Vector3(
                    SUN_POS.x + Math.cos(a) * data.dist,
                    0,
                    SUN_POS.z + Math.sin(a) * data.dist
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.04,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            scene.add(new THREE.Line(geo, mat));
        });
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Sun rotation
        if (sun) sun.rotation.y += 0.002;

        // Planet orbits + self-spin
        planets.forEach(p => {
            p.angle += p.data.speed * 0.003;
            p.pivot.position.x = SUN_POS.x + Math.cos(p.angle) * p.data.dist;
            p.pivot.position.z = SUN_POS.z + Math.sin(p.angle) * p.data.dist;
            p.mesh.rotation.y += 0.008;
        });

        // Scroll-based camera drift
        const sf = scrollY * 0.002;
        const targetY = 30 - sf * 3;
        const targetZ = 55 + sf * 5;
        camera.position.y += (targetY - camera.position.y) * 0.03;
        camera.position.z += (targetZ - camera.position.z) * 0.03;

        // Mouse parallax on look target
        const lx = LOOK_TARGET.x + mouseX * 2;
        const ly = LOOK_TARGET.y + mouseY * 1.5;
        camera.lookAt(lx, ly, LOOK_TARGET.z);

        // Slow scene rotation for scroll
        scene.rotation.y = scrollY * 0.0002;

        // Starfield drift
        scene.children.forEach(c => {
            if (c.userData && c.userData.isStarfield) {
                c.rotation.y += 0.00004;
                c.rotation.x += 0.00002;
            }
        });

        renderer.render(scene, camera);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
