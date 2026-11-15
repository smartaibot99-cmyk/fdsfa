import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface CornerEarth3DProps {
  isLight: boolean;
}

const EARTH_RADIUS = 2.0;
const CLOUDS_RADIUS = 2.026;
const INNER_ATMOS_RADIUS = 2.042;
const OUTER_ATMOS_RADIUS = 2.18;

// Pre-allocated math helpers at module scope (zero GC in render loop)
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisX = new THREE.Vector3(1, 0, 0);
const _tiltedSpinAxis = new THREE.Vector3(-0.36, 0.91, 0.19).normalize(); // ~23.4° axial tilt
const _qYaw = new THREE.Quaternion();
const _qPitch = new THREE.Quaternion();
const _qTiltSpin = new THREE.Quaternion();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function checkWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export const CornerEarth3D: React.FC<CornerEarth3DProps> = ({ isLight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const [webglOk] = useState(() => checkWebGLAvailable());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [texturesReady, setTexturesReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const mount = canvasHostRef.current;
    if (!container || !mount || !webglOk) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const isMobile = window.innerWidth < 768;

    // Renderer setup (transparent alpha so starry/daytime backdrop shows through cleanly)
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'pan-y';
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.8);
    camera.lookAt(0, 0, 0);

    // Procedural Studio Environment Map (RoomEnvironment via PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Balanced Luminous Lighting Rig (warm solar key + bright sky fill + electric atmospheric rim)
    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.9);
    sunLight.position.set(-5.8, 3.6, 5.8);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x9bd7ff, 0x0b2a58, 0.95);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x52c7ff, 1.25);
    rimLight.position.set(5.5, -2.5, -4.0);
    scene.add(rimLight);

    // Composite Earth Group (Surface + Clouds) starting with a natural ~23° tilt showing Americas/Atlantic
    const earthSpinGroup = new THREE.Group();
    earthSpinGroup.rotation.set(0.24, -1.78, -0.34);
    scene.add(earthSpinGroup);

    const maxAnisotropy = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const loader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];
    let loadedCount = 0;

    const markTextureLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 5) {
        setTexturesReady(true);
      }
    };

    const loadTex = (url: string, isColor: boolean) => {
      const tex = loader.load(url, markTextureLoaded, undefined, markTextureLoaded);
      if (isColor) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      tex.anisotropy = maxAnisotropy;
      loadedTextures.push(tex);
      return tex;
    };

    const dayTex = loadTex(
      isMobile ? '/textures/earth_day_2k.jpg' : '/textures/earth_day_4k.jpg',
      true
    );
    const nightTex = loadTex(
      isMobile ? '/textures/earth_night_2k.png' : '/textures/earth_night_4k.jpg',
      true
    );
    const specTex = loadTex('/textures/earth_specular_2k.jpg', false);
    const bumpTex = loadTex('/textures/earth_bump_2k.png', false);
    const cloudsTex = loadTex('/textures/earth_clouds_1k.png', true);

    // Part 1: Earth Planetary Surface (Vibrant Day + Bright City Lights + Specular Ocean + Bump Relief + proper ToneMapping/SRGB)
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    const sunDirUniform = new THREE.Vector3(-0.62, 0.42, 0.66).normalize();
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayTex },
        nightMap: { value: nightTex },
        specularMap: { value: specTex },
        bumpMap: { value: bumpTex },
        sunDir: { value: sunDirUniform },
        isLightMode: { value: isLightRef.current ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform sampler2D specularMap;
        uniform sampler2D bumpMap;
        uniform vec3 sunDir;
        uniform float isLightMode;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 N = normalize(vWorldNormal);
          vec3 L = normalize(sunDir);
          vec3 V = normalize(cameraPosition - vWorldPosition);

          float texel = 1.0 / 2048.0;
          float hL = texture2D(bumpMap, vUv - vec2(texel, 0.0)).r;
          float hR = texture2D(bumpMap, vUv + vec2(texel, 0.0)).r;
          float hD = texture2D(bumpMap, vUv - vec2(0.0, texel)).r;
          float hU = texture2D(bumpMap, vUv + vec2(0.0, texel)).r;
          float relief = clamp(1.0 + ((hL - hR) + (hD - hU)) * 2.5, 0.78, 1.28);

          vec3 rawDay = texture2D(dayMap, vUv).rgb * relief;
          // Boost vibrancy & clarity of oceans and green landmasses
          float luma = dot(rawDay, vec3(0.299, 0.587, 0.114));
          vec3 dayColor = mix(vec3(luma), rawDay, 1.24) * 1.48;

          vec3 nightColor = texture2D(nightMap, vUv).rgb;
          float oceanMask = texture2D(specularMap, vUv).r;

          float ndotl = dot(N, L);
          float dayFactor = smoothstep(-0.24, 0.30, ndotl);

          float ambientLift = mix(0.24, 0.48, isLightMode);
          float diffuseStrength = mix(1.38, 1.32, isLightMode);
          float diffuse = max(ndotl, 0.0) * diffuseStrength + ambientLift;
          vec3 litDay = dayColor * diffuse;

          // Bright solar specular glint on oceans
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 36.0) * oceanMask * max(ndotl, 0.0) * 0.85;
          litDay += vec3(0.84, 0.94, 1.0) * spec;

          // Luminous golden Black Marble city lights on the night hemisphere
          float nightBoost = mix(2.75, 0.45, isLightMode);
          vec3 nightLights = nightColor * vec3(1.35, 1.05, 0.68) * nightBoost;
          vec3 nightBase = dayColor * mix(0.22, 0.46, isLightMode) + vec3(0.015, 0.045, 0.105) * (1.0 - isLightMode);

          // Luminous cyan-azure twilight scatter along the day/night terminator
          float twilight = exp(-pow(ndotl * 5.2, 2.0)) * 0.28;
          vec3 twilightColor = vec3(0.25, 0.65, 1.0) * twilight;

          // Crisp front Fresnel atmospheric haze along the horizon limb
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.1);
          vec3 limbScatter = vec3(0.32, 0.72, 1.0) * fresnel * mix(0.85, 0.58, isLightMode);

          vec3 finalColor = mix(nightBase + nightLights, litDay, dayFactor) + twilightColor + limbScatter;
          gl_FragColor = vec4(finalColor, 1.0);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthSpinGroup.add(earthMesh);

    // Part 2: Drifting Cloud Layer (bright crisp white clouds over sunlit hemisphere)
    const cloudsGeo = new THREE.SphereGeometry(CLOUDS_RADIUS, 72, 72);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0.0,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthSpinGroup.add(cloudsMesh);

    // Part 3: Inner Atmospheric Scattering Shell
    const innerAtmosGeo = new THREE.SphereGeometry(INNER_ATMOS_RADIUS, 64, 64);
    const innerAtmosMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#52C6FF') },
        intensityScale: { value: 0.78 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensityScale;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float rim = pow(1.0 - max(dot(vNormal, V), 0.0), 3.4);
          gl_FragColor = vec4(glowColor, rim * intensityScale);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const innerAtmosMesh = new THREE.Mesh(innerAtmosGeo, innerAtmosMat);
    innerAtmosMesh.renderOrder = 2;
    scene.add(innerAtmosMesh);

    // Part 4: Outer Atmospheric Halo (BackSide additive electric-blue bloom)
    const outerAtmosGeo = new THREE.SphereGeometry(OUTER_ATMOS_RADIUS, 64, 64);
    const outerAtmosMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#38A8FF') },
        opacityScale: { value: 1.05 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float opacityScale;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float rim = clamp(0.66 - dot(vNormal, -V), 0.0, 1.0);
          float alpha = pow(rim, 2.7) * opacityScale;
          gl_FragColor = vec4(glowColor, alpha);
          #include <colorspace_fragment>
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const outerAtmosMesh = new THREE.Mesh(outerAtmosGeo, outerAtmosMat);
    outerAtmosMesh.renderOrder = 3;
    scene.add(outerAtmosMesh);

    // Invisible spherical collider slightly larger than Earth for comfortable dragging
    const hitGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.06, 24, 24);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitSphere = new THREE.Mesh(hitGeo, hitMat);
    scene.add(hitSphere);

    // Pre-compile shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Spin & inertia physics state
    let dragging = false;
    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let velYaw = 0;
    let velPitch = 0;
    let lastDragAt = 0;

    const hitTestSphere = (clientX: number, clientY: number): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      return _raycaster.intersectObject(hitSphere, false).length > 0;
    };

    const applySpinDelta = (dYaw: number, dPitch: number) => {
      _qYaw.setFromAxisAngle(_axisY, dYaw);
      _qPitch.setFromAxisAngle(_axisX, dPitch);
      earthSpinGroup.quaternion.premultiply(_qYaw);
      earthSpinGroup.quaternion.premultiply(_qPitch);
      earthSpinGroup.quaternion.normalize();
    };

    const applyTiltedSlowMoSpin = (angleRad: number) => {
      _qTiltSpin.setFromAxisAngle(_tiltedSpinAxis, angleRad);
      earthSpinGroup.quaternion.premultiply(_qTiltSpin);
      earthSpinGroup.quaternion.normalize();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (!hitTestSphere(e.clientX, e.clientY)) return;

      dragging = true;
      activePointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      velYaw = 0;
      velPitch = 0;
      lastDragAt = performance.now();
      setIsDragging(true);
      setHasInteracted(true);
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if capture is unsupported
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) {
        const over = hitTestSphere(e.clientX, e.clientY);
        setIsHovered(over);
        return;
      }
      if (activePointerId !== null && e.pointerId !== activePointerId) return;

      const now = performance.now();
      const dtSec = Math.max((now - lastDragAt) / 1000, 0.004);
      lastDragAt = now;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const sensitivity = 0.0052;
      const dYaw = dx * sensitivity;
      const dPitch = dy * sensitivity;
      applySpinDelta(dYaw, dPitch);

      // Exponentially smooth velocity for natural release inertia
      const instYaw = THREE.MathUtils.clamp(dYaw / dtSec, -8, 8);
      const instPitch = THREE.MathUtils.clamp(dPitch / dtSec, -8, 8);
      velYaw = THREE.MathUtils.lerp(velYaw, instYaw, 0.45);
      velPitch = THREE.MathUtils.lerp(velPitch, instPitch, 0.45);
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      setIsDragging(false);
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    };

    const onPointerLeave = () => {
      if (!dragging) setIsHovered(false);
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointerleave', onPointerLeave);

    // ResizeObserver for crisp responsive sizing
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation & software-WebGL paced rendering loop
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.08);

      // Live theme reactivity without recreating scene
      const lightMode = isLightRef.current;
      earthMat.uniforms.isLightMode.value = THREE.MathUtils.damp(
        earthMat.uniforms.isLightMode.value,
        lightMode ? 1.0 : 0.0,
        5.0,
        delta
      );

      // Update sun direction smoothly (luminous terminator in dark mode, bright sunlit globe in light mode)
      const targetSunX = lightMode ? -0.35 : -0.62;
      const targetSunY = lightMode ? 0.45 : 0.42;
      const targetSunZ = lightMode ? 0.82 : 0.66;
      sunDirUniform.x = THREE.MathUtils.damp(sunDirUniform.x, targetSunX, 4.5, delta);
      sunDirUniform.y = THREE.MathUtils.damp(sunDirUniform.y, targetSunY, 4.5, delta);
      sunDirUniform.z = THREE.MathUtils.damp(sunDirUniform.z, targetSunZ, 4.5, delta);
      sunDirUniform.normalize();

      sunLight.position.set(sunDirUniform.x * 8, sunDirUniform.y * 8, sunDirUniform.z * 8);
      sunLight.intensity = lightMode ? 3.1 : 2.65;
      hemiLight.intensity = lightMode ? 1.15 : 0.82;
      cloudsMat.opacity = lightMode ? 0.56 : 0.44;
      innerAtmosMat.uniforms.intensityScale.value = lightMode ? 0.55 : 0.82;
      outerAtmosMat.uniforms.opacityScale.value = lightMode ? 0.68 : 1.08;

      if (!dragging) {
        const speedMag = Math.hypot(velYaw, velPitch);
        if (speedMag > 0.002) {
          applySpinDelta(velYaw * delta, velPitch * delta);
          const damping = Math.exp(-3.4 * delta);
          velYaw *= damping;
          velPitch *= damping;
        }
        // Continuous slow-motion spin along a slightly tilted (~23.4°) planetary axis
        const spinBlend = THREE.MathUtils.clamp(1.0 - speedMag * 0.4, 0.25, 1.0);
        applyTiltedSlowMoSpin(delta * 0.075 * spinBlend);
      }

      // Subtle atmospheric cloud drift slightly faster than Earth surface
      cloudsMesh.rotation.y += delta * 0.018;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('pointerleave', onPointerLeave);

      earthGeo.dispose();
      earthMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      innerAtmosGeo.dispose();
      innerAtmosMat.dispose();
      outerAtmosGeo.dispose();
      outerAtmosMat.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      loadedTextures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (el.parentElement === mount) {
        mount.removeChild(el);
      }
    };
  }, [webglOk]);

  if (!webglOk) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none select-none w-[460px] h-[460px] sm:w-[680px] sm:h-[680px] lg:w-[920px] lg:h-[920px] xl:w-[1080px] xl:h-[1080px] -bottom-[175px] -right-[165px] sm:-bottom-[250px] sm:-right-[240px] lg:-bottom-[330px] lg:-right-[310px] xl:-bottom-[385px] xl:-right-[360px] absolute z-10 rounded-full overflow-hidden opacity-85"
      >
        <img
          src="/textures/earth_day_2k.jpg"
          alt="Earth"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="Interactive 3D Earth globe — drag to spin"
      className="
        absolute z-10 select-none
        w-[460px] h-[460px] -bottom-[175px] -right-[165px]
        sm:w-[680px] sm:h-[680px] sm:-bottom-[250px] sm:-right-[240px]
        lg:w-[920px] lg:h-[920px] lg:-bottom-[330px] lg:-right-[310px]
        xl:w-[1080px] xl:h-[1080px] xl:-bottom-[385px] xl:-right-[360px]
      "
      style={{
        cursor: isDragging ? 'grabbing' : isHovered ? 'grab' : 'default',
      }}
    >
      <div
        ref={canvasHostRef}
        className={`w-full h-full transition-opacity duration-700 ${
          texturesReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle upper-left edge hint on the visible limb before first drag */}
      {texturesReady && !hasInteracted && (
        <div
          className={`pointer-events-none hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium tracking-wide transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-85'
          } ${
            isLight
              ? 'bg-white/90 text-[#082441] border border-[#BFDFF8] shadow-sm'
              : 'bg-[#032142]/88 text-[#CBE6FF] border border-[#49AEF7]/45'
          }`}
          style={{
            position: 'absolute',
            left: '16%',
            top: '22%',
          }}
        >
          <span>Drag to spin Earth</span>
        </div>
      )}
    </div>
  );
};
