// static/js/main.js - Полный JavaScript для проекта

// DOM элементы
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const applyBtn = document.getElementById('applyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const statusText = document.getElementById('statusText');
const originalPreview = document.getElementById('originalPreview');
const enhancedPreview = document.getElementById('enhancedPreview');

const shapeSelect = document.getElementById('shapeSelect');
const blurSlider = document.getElementById('blurSlider');
const depthSlider = document.getElementById('depthSlider');
const haloSlider = document.getElementById('haloSlider');
const contrastSlider = document.getElementById('contrastSlider');
const brightnessSlider = document.getElementById('brightnessSlider');
const stoneSelect = document.getElementById('stoneSelect');
const scaleSlider = document.getElementById('scaleSlider');
const offsetXSlider = document.getElementById('offsetXSlider');
const offsetYSlider = document.getElementById('offsetYSlider');
const offsetZSlider = document.getElementById('offsetZSlider');

const cropTopSlider = document.getElementById('cropTopSlider');
const cropBottomSlider = document.getElementById('cropBottomSlider');
const cropLeftSlider = document.getElementById('cropLeftSlider');
const cropRightSlider = document.getElementById('cropRightSlider');
const cropTopValue = document.getElementById('cropTopValue');
const cropBottomValue = document.getElementById('cropBottomValue');
const cropLeftValue = document.getElementById('cropLeftValue');
const cropRightValue = document.getElementById('cropRightValue');

const blurValue = document.getElementById('blurValue');
const depthValue = document.getElementById('depthValue');
const haloValue = document.getElementById('haloValue');
const contrastValue = document.getElementById('contrastValue');
const brightnessValue = document.getElementById('brightnessValue');
const scaleValue = document.getElementById('scaleValue');
const offsetXValue = document.getElementById('offsetXValue');
const offsetYValue = document.getElementById('offsetYValue');
const offsetZValue = document.getElementById('offsetZValue');

const modeEngraving = document.getElementById('modeEngraving');
const modePhoto = document.getElementById('modePhoto');
const modeEngravingLabel = document.getElementById('modeEngravingLabel');
const modePhotoLabel = document.getElementById('modePhotoLabel');
const engravingSettings = document.getElementById('engravingSettings');
const photoSettings = document.getElementById('photoSettings');
const photoModeColor = document.getElementById('photoModeColor');
const photoModeBW = document.getElementById('photoModeBW');

const textureSelect = document.getElementById('textureSelect');

// Элементы для фото
const photoBrightnessSlider = document.getElementById('photoBrightnessSlider');
const photoContrastSlider = document.getElementById('photoContrastSlider');
const photoBrightnessValue = document.getElementById('photoBrightnessValue');
const photoContrastValue = document.getElementById('photoContrastValue');

// Проверка авторизации
const isAuthenticated = document.querySelector('.top-bar span[style*="color:#888"]') !== null;
const isGuest = window.location.pathname.includes('/guest');

const haloEnabled = document.getElementById('haloEnabled');
const haloDensity = document.getElementById('haloDensity');
const haloSize = document.getElementById('haloSize');
const haloBrightness = document.getElementById('haloBrightness');
const haloBlur = document.getElementById('haloBlur');

const haloDensityValue = document.getElementById('haloDensityValue');
const haloSizeValue = document.getElementById('haloSizeValue');
const haloBrightnessValue = document.getElementById('haloBrightnessValue');
const haloBlurValue = document.getElementById('haloBlurValue');

// Переменные состояния
let currentFile = null;
let sessionId = null;
let engravingBase64 = null;
let maskBase64 = null;
let isProcessing = false;
let isUploading = false;
let currentShape = 'none';
let texturesList = [];
let currentTexturePath = null;
let isTextureApplying = false;

// === 3D переменные ===
let scene, camera, renderer, controls;
let stelaMesh = null;
let stelaMeshForDecal = null;
let stelaTextureLoaded = null;
// В самом начале файла, после других переменных
let printImageDataUrl = null; // Для хранения изображения для печати
let finalImageDataURL = null; // Финальное изображение с ореолом для скачивания
let finalImageWithHalo = null; // Финальное изображение с ореолом для скачивания/печати

// === КНОПКИ ===
const orderBtn = document.getElementById('orderBtn');
const orderModal = document.getElementById('orderModal');

// === ФУНКЦИИ ===
function getMode() {
    return modeEngraving.checked ? 'engraving' : 'photo';
}

function getPhotoMode() {
    return photoModeColor.checked ? 'color' : 'bw';
}

function updateModeUI() {
    const isEngraving = getMode() === 'engraving';
    
    modeEngravingLabel.classList.toggle('active', isEngraving);
    modePhotoLabel.classList.toggle('active', !isEngraving);
    
    engravingSettings.classList.toggle('hidden', !isEngraving);
    photoSettings.classList.toggle('hidden', isEngraving);
    
    statusText.textContent = isEngraving ? 
        '✅ Режим гравировки' : 
        '✅ Режим фото-декали';
}

modeEngraving.addEventListener('change', () => {
    updateModeUI();
    if (engravingBase64) applyToStela(engravingBase64);
});
modePhoto.addEventListener('change', () => {
    updateModeUI();
    if (engravingBase64) applyToStela(engravingBase64);
});

if (photoBrightnessSlider) {
    photoBrightnessSlider.addEventListener('input', () => {
        if (photoBrightnessValue) photoBrightnessValue.textContent = photoBrightnessSlider.value;
        if (engravingBase64 && getMode() === 'photo') applyToStela(engravingBase64);
    });
}
if (photoContrastSlider) {
    photoContrastSlider.addEventListener('input', () => {
        if (photoContrastValue) photoContrastValue.textContent = parseFloat(photoContrastSlider.value).toFixed(2);
        if (engravingBase64 && getMode() === 'photo') applyToStela(engravingBase64);
    });
}

function finalizeDecal(ctx, canvas, canvasSize) {
    try {
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
        
        const stelaWidth = 0.6;
        const stelaHeight = 1.2;
        const stelaDepth = 0.08;
        const userScale = parseFloat(scaleSlider.value);
        const decalSize = Math.min(stelaWidth, stelaHeight) * 0.85 * userScale;
        const offsetXPos = parseFloat(offsetXSlider.value) * 0.3;
        const offsetYPos = parseFloat(offsetYSlider.value) * 0.3;
        const offsetZPos = parseFloat(offsetZSlider.value) * 0.05;
        
        const decalGeometry = new THREE.DecalGeometry(
            stelaMeshForDecal,
            new THREE.Vector3(offsetXPos, 0.8 + offsetYPos, stelaDepth/2 + 0.01 + offsetZPos),
            new THREE.Euler(0, 0, 0),
            new THREE.Vector3(decalSize, decalSize, 0.01)
        );
        
        // ИСПРАВЛЕННЫЙ МАТЕРИАЛ - лучшая видимость ореола
        const decalMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2, // Увеличено для лучшей видимости
            side: THREE.DoubleSide,
            opacity: 1.0,
            color: 0xffffff,
            roughness: 0.5, // Добавлено для лучшей видимости
            metalness: 0.0  // Добавлено
        });
        
        if (window.currentDecal) {
            scene.remove(window.currentDecal);
            window.currentDecal = null;
        }
        
        const decal = new THREE.Mesh(decalGeometry, decalMaterial);
        scene.add(decal);
        window.currentDecal = decal;
        
        statusText.textContent = '✅ Нанесено на стелу!';
        
        if (isAuthenticated) {
            printBtn.disabled = false;
            if (orderBtn) orderBtn.disabled = false;
        }
        
        downloadBtn.disabled = false;
    } catch (e) {
        console.error('Ошибка в finalizeDecal:', e);
        statusText.textContent = '❌ Ошибка нанесения';
    }
}

function createShapeMask(width, height, shapeType) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#FFFFFF';
    
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.min(width, height);
    
    switch(shapeType) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'oval':
            ctx.beginPath();
            ctx.ellipse(cx, cy, width * 0.45, height * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'square':
            const sqSize = size * 0.45;
            ctx.fillRect(cx - sqSize, cy - sqSize, sqSize * 2, sqSize * 2);
            break;
        case 'rounded':
            const rSize = size * 0.45;
            const radius = 20;
            ctx.beginPath();
            ctx.moveTo(cx - rSize + radius, cy - rSize);
            ctx.lineTo(cx + rSize - radius, cy - rSize);
            ctx.quadraticCurveTo(cx + rSize, cy - rSize, cx + rSize, cy - rSize + radius);
            ctx.lineTo(cx + rSize, cy + rSize - radius);
            ctx.quadraticCurveTo(cx + rSize, cy + rSize, cx + rSize - radius, cy + rSize);
            ctx.lineTo(cx - rSize + radius, cy + rSize);
            ctx.quadraticCurveTo(cx - rSize, cy + rSize, cx - rSize, cy + rSize - radius);
            ctx.lineTo(cx - rSize, cy - rSize + radius);
            ctx.quadraticCurveTo(cx - rSize, cy - rSize, cx - rSize + radius, cy - rSize);
            ctx.fill();
            break;
        default:
            return null;
    }
    
    return canvas;
}

function applyTextureToStela(texturePath) {
    if (!stelaMesh) return;
    if (isTextureApplying) return;
    if (texturePath === currentTexturePath && stelaTextureLoaded) return;
    
    isTextureApplying = true;
    
    if (!texturePath) {
        const materials = stelaMesh.material;
        if (Array.isArray(materials)) {
            materials[4] = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.6,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            for (let i = 0; i < materials.length; i++) {
                if (i !== 4) {
                    materials[i] = new THREE.MeshStandardMaterial({
                        color: 0x444444,
                        roughness: 0.8,
                        metalness: 0.0,
                        side: THREE.DoubleSide
                    });
                }
            }
        }
        stelaMesh.material = materials;
        stelaTextureLoaded = null;
        currentTexturePath = null;
        isTextureApplying = false;
        return;
    }
    
    const loader = new THREE.TextureLoader();
    const fullPath = `/texture/${texturePath}`;
    
    loader.load(fullPath, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        const materials = stelaMesh.material;
        if (Array.isArray(materials)) {
            materials[4] = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.7,
                metalness: 0.0,
                side: THREE.DoubleSide
            });
            
            for (let i = 0; i < materials.length; i++) {
                if (i !== 4) {
                    materials[i] = new THREE.MeshStandardMaterial({
                        color: 0x333333,
                        roughness: 0.8,
                        metalness: 0.0,
                        side: THREE.DoubleSide
                    });
                }
            }
        }
        stelaMesh.material = materials;
        stelaTextureLoaded = texture;
        currentTexturePath = texturePath;
        
        console.log('✅ Текстура применена к стеле:', texturePath);
        isTextureApplying = false;
    }, undefined, (error) => {
        console.error('❌ Ошибка загрузки текстуры:', error);
        isTextureApplying = false;
    });
}

textureSelect.addEventListener('change', function() {
    const selectedTexture = this.value;
    if (selectedTexture) {
        const texture = texturesList.find(t => t.id === selectedTexture);
        if (texture) {
            const relPath = texture.path.replace(/^.*[\\\/]textures[\\\/]/, '');
            applyTextureToStela(relPath);
        }
    } else {
        applyTextureToStela(null);
    }
});

// Функция генерации ореола - свет снизу вверх (софиты) с чистым размытием
function generateHaloBehindSilhouette(imageData, width, height, settings) {
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = width;
    haloCanvas.height = height;
    const hCtx = haloCanvas.getContext('2d', { willReadFrequently: true });
    
    // Создаем маску силуэта
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const mCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    
    const tempImgData = mCtx.createImageData(width, height);
    const data = imageData.data;
    const tempData = tempImgData.data;
    
    // Создаем бинарную маску силуэта
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 30) {
            tempData[i] = 255;
            tempData[i + 1] = 255;
            tempData[i + 2] = 255;
            tempData[i + 3] = 255;
        }
    }
    mCtx.putImageData(tempImgData, 0, 0);
    
    // Получаем данные маски
    const maskData = mCtx.getImageData(0, 0, width, height);
    const maskPixels = maskData.data;
    
    // Создаем карту расстояний
    const distanceMap = new Float32Array(width * height);
    const MAX_DIST = 1000;
    
    // Инициализация
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (maskPixels[idx] > 128) {
                distanceMap[y * width + x] = 0;
            } else {
                distanceMap[y * width + x] = MAX_DIST;
            }
        }
    }
    
    // Distance Transform (проход вперед)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (distanceMap[idx] > 0) {
                let minDist = distanceMap[idx];
                if (y > 0) minDist = Math.min(minDist, distanceMap[(y-1) * width + x] + 1);
                if (x > 0) minDist = Math.min(minDist, distanceMap[y * width + (x-1)] + 1);
                distanceMap[idx] = minDist;
            }
        }
    }
    
    // Distance Transform (проход назад)
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const idx = y * width + x;
            if (distanceMap[idx] > 0) {
                let minDist = distanceMap[idx];
                if (y < height - 1) minDist = Math.min(minDist, distanceMap[(y+1) * width + x] + 1);
                if (x < width - 1) minDist = Math.min(minDist, distanceMap[y * width + (x+1)] + 1);
                distanceMap[idx] = minDist;
            }
        }
    }
    
    // Находим максимальное расстояние
    let maxDist = 0;
    for (let i = 0; i < distanceMap.length; i++) {
        if (distanceMap[i] < MAX_DIST && distanceMap[i] > maxDist) {
            maxDist = distanceMap[i];
        }
    }
    if (maxDist === 0) maxDist = 1;
    
    // ===== ПАРАМЕТРЫ ОРЕОЛА =====
    const densityFactor = Math.max(0.01, settings.density / 100);
    const brightnessFactor = Math.max(0.3, settings.brightness / 100);
    
    // РАЗМЕР ОРЕОЛА
    const haloSizeFactor = Math.max(0.01, settings.size / 100);
    const effectiveMaxDist = maxDist * haloSizeFactor;
    
    // ===== ГРАДИЕНТ СНИЗУ ВВЕРХ =====
    const verticalGradient = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        const normY = y / height;
        const rawIntensity = 1 - normY;
        const intensity = Math.pow(rawIntensity, 0.7);
        for (let x = 0; x < width; x++) {
            verticalGradient[y * width + x] = intensity;
        }
    }
    
    // Создаем отдельный canvas для точек
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = width;
    dotCanvas.height = height;
    const dCtx = dotCanvas.getContext('2d', { willReadFrequently: true });
    
    // ===== ГЕНЕРАЦИЯ ТОЧЕК =====
    const maxStep = Math.max(1, Math.floor(6 - densityFactor * 4));
    const minStep = 1;
    const step = Math.max(minStep, maxStep);
    
    const maxRadius = 2.0 + densityFactor * 3.0;
    const minRadius = 0.8 + densityFactor * 0.5;
    
    let totalPoints = 0;
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const idx = y * width + x;
            const dist = distanceMap[idx];
            
            if (dist > 0 && dist <= effectiveMaxDist) {
                const normalizedDist = Math.min(dist / effectiveMaxDist, 1);
                const verticalIntensity = verticalGradient[idx];
                
                if (verticalIntensity < 0.03) continue;
                
                const edgeFalloff = Math.exp(-normalizedDist * 3.5);
                const falloff = edgeFalloff * verticalIntensity;
                
                const intensity = Math.max(0, falloff * brightnessFactor * 1.2);
                const prob = intensity * densityFactor * 1.3;
                
                if (Math.random() < prob && intensity > 0.005) {
                    const sizeFactor = Math.max(0.2, 1.0 - normalizedDist * 0.6);
                    const radius = minRadius + (maxRadius - minRadius) * sizeFactor * (0.5 + 0.5 * verticalIntensity);
                    const finalRadius = Math.max(1.5, radius);
                    
                    const alpha = Math.min(1.0, intensity * 0.8 + 0.2);
                    const gray = Math.floor(200 + 55 * (1 - normalizedDist * 0.3));
                    
                    dCtx.fillStyle = `rgba(${gray}, ${gray}, ${Math.min(255, gray + 20)}, ${alpha})`;
                    
                    dCtx.beginPath();
                    dCtx.arc(x, y, finalRadius, 0, Math.PI * 2);
                    dCtx.fill();
                    totalPoints++;
                }
            }
        }
    }
    
    console.log(`✅ Сгенерировано ${totalPoints} точек ореола`);
    
    // ===== ОДНОКРАТНОЕ РАЗМЫТИЕ =====
    const blurAmount = Math.max(1, Math.floor(settings.blur / 12));
    
    if (blurAmount > 0 && totalPoints > 0) {
        // Применяем размытие к точкам
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tCtx.drawImage(dotCanvas, 0, 0);
        
        // Размываем
        dCtx.clearRect(0, 0, width, height);
        dCtx.filter = `blur(${blurAmount}px)`;
        dCtx.drawImage(tempCanvas, 0, 0);
        dCtx.filter = 'none';
        
        console.log(`✅ Размытие применено: ${blurAmount}px`);
    }
    
    // ===== УБИРАЕМ ТОЧКИ ВНУТРИ СИЛУЭТА =====
    const finalData = dCtx.getImageData(0, 0, width, height);
    const fd = finalData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 30) {
            fd[i] = 0;
            fd[i + 1] = 0;
            fd[i + 2] = 0;
            fd[i + 3] = 0;
        }
    }
    
    // Возвращаем результат
    dCtx.putImageData(finalData, 0, 0);
    return dCtx.getImageData(0, 0, width, height);
}

function applyToStela(base64Image) {
    if (!stelaMeshForDecal) {
        setTimeout(() => applyToStela(base64Image), 500);
        return;
    }

    const img = new Image();
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            const srcW = img.width;
            const srcH = img.height;
            
            const canvasSize = Math.max(srcW, srcH) * 1.0;
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(canvasSize / srcW, canvasSize / srcH);
            const newW = srcW * scale;
            const newH = srcH * scale;
            const offsetX = (canvasSize - newW) / 2;
            const offsetY = (canvasSize - newH) / 2;
            ctx.drawImage(img, offsetX, offsetY, newW, newH);
            
            const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
            
            // Получаем настройки ореола
            const haloSettings = {
                enabled: haloEnabled ? haloEnabled.checked : true,
                density: haloDensity ? parseInt(haloDensity.value) : 50,
                size: haloSize ? parseInt(haloSize.value) : 180,
                brightness: haloBrightness ? parseInt(haloBrightness.value) : 60,
                blur: haloBlur ? parseInt(haloBlur.value) : 50
            };
            
            // ===== СОЗДАЕМ ФИНАЛЬНОЕ ИЗОБРАЖЕНИЕ =====
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvasSize;
            finalCanvas.height = canvasSize;
            const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
            
            // 1. Сначала рисуем ореол (ОДИН РАЗ)
            if (haloSettings.enabled) {
                const haloData = generateHaloBehindSilhouette(imageData, canvasSize, canvasSize, haloSettings);
                if (haloData) {
                    finalCtx.putImageData(haloData, 0, 0);
                    console.log('✅ Ореол добавлен');
                }
            }
            
            // 2. Поверх ореола рисуем само изображение (силуэт)
            finalCtx.drawImage(canvas, 0, 0);
            
            // 3. Применяем форму (если выбрана)
            const shape = shapeSelect.value;
            if (shape !== 'none') {
                const maskCanvas = createShapeMask(canvasSize, canvasSize, shape);
                if (maskCanvas) {
                    const maskData = maskCanvas.getContext('2d').getImageData(0, 0, canvasSize, canvasSize);
                    const finalData = finalCtx.getImageData(0, 0, canvasSize, canvasSize);
                    const fd = finalData.data;
                    const md = maskData.data;
                    
                    for (let i = 0; i < fd.length; i += 4) {
                        if (md[i] === 0) {
                            fd[i + 3] = 0;
                        }
                    }
                    finalCtx.putImageData(finalData, 0, 0);
                }
            }
            
            // ===== СОХРАНЯЕМ ФИНАЛЬНОЕ ИЗОБРАЖЕНИЕ =====
            finalImageWithHalo = finalCanvas.toDataURL('image/png');
            console.log('✅ Финальное изображение с ореолом сохранено');
            
            // Завершаем обработку для 3D отображения
            finalizeDecal(finalCtx, finalCanvas, canvasSize);
            
        } catch (e) {
            console.error('Ошибка в applyToStela:', e);
            statusText.textContent = '❌ Ошибка обработки изображения';
        }
    };
    img.onerror = () => {
        statusText.textContent = '❌ Ошибка загрузки изображения';
    };
    img.src = `data:image/png;base64,${base64Image}`;
}

function init3D() {
    const container = document.getElementById('stelaViewer');
    if (!container) return;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5);
    camera.lookAt(0, 0.5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0.5, 0);
    controls.update();

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 3, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(-2, 1, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8844, 0.3);
    rimLight.position.set(0, -1, -2);
    scene.add(rimLight);

    const groundGeometry = new THREE.CircleGeometry(3, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x111122,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

	const stelaWidth = 0.6;
	const stelaHeight = 1.2;
	const stelaDepth = 0.08;
    
    const frontMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    const otherMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    
    const materials = [
        otherMat, otherMat,
        otherMat, otherMat,
        frontMat, otherMat
    ];
    
    const geometry = new THREE.BoxGeometry(stelaWidth, stelaHeight, stelaDepth);
    
    stelaMesh = new THREE.Mesh(geometry, materials);
    stelaMesh.position.set(0, 0.8, 0);
    stelaMesh.castShadow = true;
    stelaMesh.receiveShadow = true;
    
    scene.add(stelaMesh);
    stelaMeshForDecal = stelaMesh;
    
    const edgeGeo = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    wireframe.position.copy(stelaMesh.position);
    scene.add(wireframe);
    
    animate();
    
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    });
}

function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// === ЗАГРУЗКА ТЕКСТУР ===
async function loadTextures() {
    try {
        const response = await fetch('/textures');
        if (!response.ok) {
            throw new Error('Ошибка загрузки текстур');
        }
        const data = await response.json();
        
        texturesList = data.textures;
        
        textureSelect.innerHTML = '<option value="">Без текстуры</option>';
        
        const categories = {};
        data.textures.forEach(texture => {
            const category = texture.category || 'root';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(texture);
        });
        
        for (const [category, textures] of Object.entries(categories)) {
            if (category !== 'root') {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                textures.forEach(texture => {
                    const option = document.createElement('option');
                    option.value = texture.id;
                    option.textContent = texture.display_name || texture.name;
                    optgroup.appendChild(option);
                });
                textureSelect.appendChild(optgroup);
            } else {
                textures.forEach(texture => {
                    const option = document.createElement('option');
                    option.value = texture.id;
                    option.textContent = texture.display_name || texture.name;
                    textureSelect.appendChild(option);
                });
            }
        }
        
        textureSelect.value = '';
        
        console.log('✅ Текстуры загружены:', data.textures.length);
    } catch (error) {
        console.error('❌ Ошибка загрузки текстур:', error);
    }
}


// Функция создания финального изображения с ореолом для скачивания/печати
function generateFinalImageWithHalo(base64Image) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const srcW = img.width;
                const srcH = img.height;
                
                // Используем тот же размер, что и в applyToStela
                const canvasSize = Math.max(srcW, srcH) * 1.0;
                canvas.width = canvasSize;
                canvas.height = canvasSize;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Рисуем изображение по центру
                const scale = Math.min(canvasSize / srcW, canvasSize / srcH);
                const newW = srcW * scale;
                const newH = srcH * scale;
                const offsetX = (canvasSize - newW) / 2;
                const offsetY = (canvasSize - newH) / 2;
                ctx.drawImage(img, offsetX, offsetY, newW, newH);
                
                // Получаем данные изображения
                const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
                
                // Получаем настройки ореола
                const haloSettings = {
                    enabled: haloEnabled ? haloEnabled.checked : true,
                    density: haloDensity ? parseInt(haloDensity.value) : 50,
                    size: haloSize ? parseInt(haloSize.value) : 180,
                    brightness: haloBrightness ? parseInt(haloBrightness.value) : 60,
                    blur: haloBlur ? parseInt(haloBlur.value) : 50
                };
                
                // СОЗДАЕМ ФИНАЛЬНОЕ ИЗОБРАЖЕНИЕ С ОРЕОЛОМ
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = canvasSize;
                finalCanvas.height = canvasSize;
                const finalCtx = finalCanvas.getContext('2d');
                
                // 1. Сначала рисуем ореол (на заднем плане)
                if (haloSettings.enabled) {
                    const haloData = generateHaloBehindSilhouette(imageData, canvasSize, canvasSize, haloSettings);
                    if (haloData) {
                        finalCtx.putImageData(haloData, 0, 0);
                        console.log('✅ Ореол добавлен в финальное изображение');
                    }
                }
                
                // 2. Поверх ореола рисуем само изображение (силуэт)
                finalCtx.drawImage(canvas, 0, 0);
                
                // 3. Применяем форму (если выбрана)
                const shape = shapeSelect ? shapeSelect.value : 'none';
                if (shape !== 'none') {
                    const maskCanvas = createShapeMask(canvasSize, canvasSize, shape);
                    if (maskCanvas) {
                        const maskData = maskCanvas.getContext('2d').getImageData(0, 0, canvasSize, canvasSize);
                        const finalData = finalCtx.getImageData(0, 0, canvasSize, canvasSize);
                        const fd = finalData.data;
                        const md = maskData.data;
                        
                        for (let i = 0; i < fd.length; i += 4) {
                            if (md[i] === 0) {
                                fd[i + 3] = 0;
                            }
                        }
                        finalCtx.putImageData(finalData, 0, 0);
                    }
                }
                
                // Сохраняем финальное изображение
                finalImageWithHalo = finalCanvas.toDataURL('image/png');
                console.log('✅ Финальное изображение с ореолом создано');
                resolve(finalImageWithHalo);
                
            } catch (e) {
                console.error('❌ Ошибка создания финального изображения:', e);
                reject(e);
            }
        };
        img.onerror = () => {
            console.error('❌ Ошибка загрузки изображения для финального рендеринга');
            reject(new Error('Ошибка загрузки изображения'));
        };
        img.src = `data:image/png;base64,${base64Image}`;
    });
}

function openPrintForm() {
    console.log('🖨️ [openPrintForm] НАЧАЛО');
    
    if (!engravingBase64) {
        statusText.textContent = '⚠️ Сначала создайте гравировку';
        console.warn('⚠️ Нет гравировки');
        return;
    }
    
    if (!isAuthenticated) {
        statusText.textContent = '⚠️ Для печати войдите в систему';
        if (confirm('⚠️ Для печати нужно войти или зарегистрироваться. Перейти на страницу входа?')) {
            window.location.href = '/login';
        }
        return;
    }
    
    const printForm = document.getElementById('printForm');
    if (!printForm) {
        console.error('❌ Форма печати не найдена');
        return;
    }
    
    // Показываем форму
    printForm.classList.add('active');
    printForm.style.display = 'flex';
    printForm.style.visibility = 'visible';
    printForm.style.opacity = '1';
    
    console.log('📋 Форма показана');
    
    // Заполняем параметры
    fillPrintParams();
    console.log('📋 Параметры заполнены');
    
    // Сбрасываем чекбокс
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const printAgreeBtn = document.getElementById('printAgreeBtn');
    if (agreeCheckbox) agreeCheckbox.checked = false;
    if (printAgreeBtn) printAgreeBtn.disabled = true;
    
    // ===== ВАЖНО: Генерируем финальное изображение с ореолом =====
    statusText.textContent = '⏳ Генерация изображения с ореолом...';
    console.log('🔄 Генерация финального изображения с ореолом...');
    
    // Если уже есть финальное изображение, используем его
    if (finalImageWithHalo) {
        console.log('✅ Используем существующее изображение с ореолом');
        setTimeout(function() {
            renderStelaForPrint();
        }, 200);
    } else {
        // Генерируем новое изображение с ореолом
        generateFinalImageWithHalo(engravingBase64).then(() => {
            console.log('✅ Финальное изображение с ореолом создано');
            statusText.textContent = '✅ Готово к печати';
            
            // Рендерим для печати
            setTimeout(function() {
                renderStelaForPrint();
            }, 200);
        }).catch((error) => {
            console.error('❌ Ошибка генерации изображения с ореолом:', error);
            statusText.textContent = '⚠️ Ошибка генерации, используем стандартное изображение';
            // Fallback: используем стандартное изображение
            setTimeout(function() {
                renderStelaForPrint();
            }, 200);
        });
    }
    
    console.log('✅ [openPrintForm] ГОТОВО');
}

// ===== ОТЛАДКА ПЕЧАТИ =====

function debugPrintState() {
    console.log('===== ОТЛАДКА ПЕЧАТИ =====');
    
    const canvas = document.getElementById('printCanvas');
    const container = document.getElementById('printStelaContainer');
    const printForm = document.getElementById('printForm');
    
    console.log('📋 Форма печати:', printForm ? 'найдена' : 'НЕ НАЙДЕНА');
    console.log('📋 Класс active:', printForm ? printForm.classList.contains('active') : 'нет');
    console.log('📋 display:', printForm ? printForm.style.display : 'нет');
    
    console.log('🖼️ Контейнер стеллы:', container ? 'найден' : 'НЕ НАЙДЕН');
    if (container) {
        const rect = container.getBoundingClientRect();
        console.log('📐 Размеры контейнера:', rect.width, 'x', rect.height);
        console.log('📐 display:', container.style.display);
        console.log('📐 visibility:', container.style.visibility);
        console.log('📐 opacity:', container.style.opacity);
    }
    
    console.log('🎨 Canvas:', canvas ? 'найден' : 'НЕ НАЙДЕН');
    if (canvas) {
        console.log('📐 Размеры canvas:', canvas.width, 'x', canvas.height);
        console.log('📐 style width:', canvas.style.width);
        console.log('📐 style height:', canvas.style.height);
        
        // Проверяем содержимое canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
        let hasContent = false;
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i] !== 0 || imageData.data[i+1] !== 0 || imageData.data[i+2] !== 0) {
                hasContent = true;
                break;
            }
        }
        console.log('📊 Canvas имеет содержимое:', hasContent);
        if (!hasContent) {
            console.log('⚠️ Canvas пустой!');
        }
    }
    
    console.log('🎮 3D Рендерер:', renderer ? 'инициализирован' : 'НЕ ИНИЦИАЛИЗИРОВАН');
    if (renderer) {
        console.log('📐 Размер рендерера:', renderer.domElement.width, 'x', renderer.domElement.height);
    }
    
    console.log('===============================');
}

// ===== ФУНКЦИЯ ПОЛУЧЕНИЯ ФОНА ДЛЯ СТЕЛЛЫ =====
function getStelaBackground() {
    const bgLight = document.getElementById('stelaBgLight');
    if (bgLight && bgLight.checked) {
        return 'light';
    }
    return 'dark';
}

function forceUpdateDecalForPrint() {
    if (!engravingBase64) return;
    
    // Создаем новую декаль с ореолом
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Рисуем изображение с ореолом
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Применяем как декаль
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
        
        if (window.currentDecal) {
            window.currentDecal.material.map = texture;
            window.currentDecal.material.needsUpdate = true;
            console.log('✅ Декаль принудительно обновлена с ореолом');
        }
    };
    img.src = `data:image/png;base64,${engravingBase64}`;
}


function renderStelaForPrint() {
    console.log('🎨 [renderStelaForPrint] НАЧАЛО');
    
    const canvas = document.getElementById('printCanvas');
    const container = document.getElementById('printStelaContainer');
    
    if (!renderer) {
        console.error('❌ Рендерер не инициализирован');
        return;
    }
    
    if (!canvas || !container) {
        console.error('❌ Canvas или контейнер не найдены');
        return;
    }
    
    // Получаем размеры контейнера
    const rect = container.getBoundingClientRect();
    let width = rect.width || 800;
    let height = rect.height || 600;
    
    if (width < 100) width = 800;
    if (height < 100) height = 600;
    
    console.log('📐 Размеры для печати:', width, 'x', height);
    
    // ===== ВЫБИРАЕМ ФОН =====
    const bgLight = document.getElementById('stelaBgLight');
    let bgColor, bgColorThree;
    
    if (bgLight && bgLight.checked) {
        bgColor = '#f5f0eb';
        bgColorThree = 0xf5f0eb;
        console.log('🎨 ВЫБРАН СВЕТЛЫЙ ФОН (#f5f0eb)');
    } else {
        bgColor = '#1a1a1a';
        bgColorThree = 0x1a1a1a;
        console.log('🎨 ВЫБРАН ТЕМНЫЙ ФОН (#1a1a1a)');
    }
    
    // Устанавливаем размеры canvas
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // ===== РИСУЕМ ФОН НА CANVAS =====
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    console.log('🎨 Фон нарисован на canvas:', bgColor);
    
    // ===== ИСПОЛЬЗУЕМ ФИНАЛЬНОЕ ИЗОБРАЖЕНИЕ С ОРЕОЛОМ =====
    if (finalImageWithHalo) {
        console.log('✅ Используем сохраненное изображение с ореолом');
        const img = new Image();
        img.onload = function() {
            // Рисуем изображение с ореолом на canvas
            const imgWidth = img.width;
            const imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;
            
            let drawWidth = width;
            let drawHeight = height;
            
            if (aspectRatio > width / height) {
                drawWidth = width;
                drawHeight = width / aspectRatio;
            } else {
                drawHeight = height;
                drawWidth = height * aspectRatio;
            }
            
            const x = (width - drawWidth) / 2;
            const y = (height - drawHeight) / 2;
            
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            console.log('✅ Изображение с ореолом нарисовано на canvas');
            
            // СОХРАНЯЕМ DATAURL
            try {
                printImageDataUrl = canvas.toDataURL('image/png');
                console.log('✅ DataURL сохранен, длина:', printImageDataUrl.length);
                window.lastPrintDataUrl = printImageDataUrl;
            } catch (e) {
                console.error('❌ Ошибка создания dataURL:', e);
            }
        };
        img.onerror = function() {
            console.error('❌ Ошибка загрузки изображения с ореолом');
            // Fallback: используем 3D рендеринг
            renderStelaWithThreeJs(ctx, canvas, width, height, bgColor, bgColorThree);
        };
        img.src = finalImageWithHalo;
    } else {
        console.warn('⚠️ Нет сохраненного изображения с ореолом, используем 3D рендеринг');
        renderStelaWithThreeJs(ctx, canvas, width, height, bgColor, bgColorThree);
    }
    
    console.log('✅ [renderStelaForPrint] ГОТОВО');
}

// Вспомогательная функция для 3D рендеринга
function renderStelaWithThreeJs(ctx, canvas, width, height, bgColor, bgColorThree) {
    // СОЗДАЕМ ВРЕМЕННУЮ СЦЕНУ
    const tempScene = new THREE.Scene();
    tempScene.background = new THREE.Color(bgColorThree);
    
    // Копируем стеллу
    const stelaCopy = stelaMesh.clone();
    tempScene.add(stelaCopy);
    
    // Копируем свет
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            const lightCopy = child.clone();
            tempScene.add(lightCopy);
        }
    });
    
    // Копируем декаль
    if (window.currentDecal) {
        const decalCopy = window.currentDecal.clone();
        tempScene.add(decalCopy);
    }
    
    // НАСТРАИВАЕМ КАМЕРУ
    const aspect = width / height;
    let distance;
    const fov = 30;
    
    if (aspect < 0.7) {
        distance = 2.0 / (2 * Math.tan(fov * Math.PI / 360)) * 1.1;
    } else if (aspect > 1.2) {
        distance = 1.2 / (2 * Math.tan(fov * Math.PI / 360)) * 1.3;
    } else {
        distance = 1.5 / (2 * Math.tan(fov * Math.PI / 360)) * 1.2;
    }
    
    distance = Math.max(distance, 1.8);
    distance = Math.min(distance, 4.0);
    
    const tempCamera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    tempCamera.position.set(0, 0.8, distance);
    tempCamera.lookAt(0, 0.5, 0);
    
    // Создаем временный рендерер
    const tempRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
    });
    tempRenderer.setSize(width, height);
    tempRenderer.setPixelRatio(2);
    tempRenderer.shadowMap.enabled = true;
    tempRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    tempRenderer.render(tempScene, tempCamera);
    
    // Копируем на canvas
    ctx.drawImage(tempRenderer.domElement, 0, 0, width, height);
    
    // Очищаем
    tempRenderer.dispose();
    
    // СОХРАНЯЕМ DATAURL
    try {
        printImageDataUrl = canvas.toDataURL('image/png');
        console.log('✅ DataURL сохранен (3D), длина:', printImageDataUrl.length);
        window.lastPrintDataUrl = printImageDataUrl;
    } catch (e) {
        console.error('❌ Ошибка создания dataURL:', e);
    }
}


// Переопределяем openPrintForm с логированием
const originalOpenPrintForm = openPrintForm;
openPrintForm = function() {
    console.log('🖨️ [openPrintForm] НАЧАЛО');
    
    if (!engravingBase64) {
        statusText.textContent = '⚠️ Сначала создайте гравировку';
        console.warn('⚠️ Нет гравировки');
        return;
    }
    
    if (!isAuthenticated) {
        statusText.textContent = '⚠️ Для печати войдите в систему';
        if (confirm('⚠️ Для печати нужно войти или зарегистрироваться. Перейти на страницу входа?')) {
            window.location.href = '/login';
        }
        return;
    }
    
    const printForm = document.getElementById('printForm');
    if (!printForm) {
        console.error('❌ Форма печати не найдена');
        return;
    }
    
    // Показываем форму
    printForm.classList.add('active');
    printForm.style.display = 'flex';
    printForm.style.visibility = 'visible';
    printForm.style.opacity = '1';
    
    console.log('📋 Форма показана');
    
    // Заполняем параметры
    fillPrintParams();
    console.log('📋 Параметры заполнены');
    
    // Сбрасываем чекбокс
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const printAgreeBtn = document.getElementById('printAgreeBtn');
    if (agreeCheckbox) agreeCheckbox.checked = false;
    if (printAgreeBtn) printAgreeBtn.disabled = true;
    
    // Даем время на отрисовку формы
    setTimeout(function() {
        console.log('⏳ Первый рендеринг через 300ms');
        debugPrintState();
        renderStelaForPrint();
    }, 300);
    
    setTimeout(function() {
        console.log('⏳ Второй рендеринг через 800ms');
        debugPrintState();
        renderStelaForPrint();
    }, 800);
    
    setTimeout(function() {
        console.log('⏳ Третий рендеринг через 1500ms');
        debugPrintState();
        renderStelaForPrint();
    }, 1500);
    
    console.log('✅ [openPrintForm] ГОТОВО');
};

console.log('✅ Функции отладки загружены');


// ===== ОБНОВЛЕННАЯ ФУНКЦИЯ renderStelaDirectly =====
function renderStelaDirectly() {
    console.log('🎨 Прямой рендеринг стеллы...');
    
    const canvas = document.getElementById('printCanvas');
    const container = document.getElementById('printStelaContainer');
    
    if (!renderer || !canvas || !container) {
        console.error('❌ Не удалось найти элементы');
        return;
    }
    
    const rect = container.getBoundingClientRect();
    let width = rect.width || 600;
    let height = rect.height || 600;
    
    if (width < 100) width = 600;
    if (height < 100) height = 600;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // ===== ВЫБИРАЕМ ФОН ДЛЯ СТЕЛЛЫ =====
    const bgMode = getStelaBackground();
    let bgColor, bgColorThree;
    
    if (bgMode === 'light') {
        bgColor = '#f5f0eb';
        bgColorThree = 0xf5f0eb;
    } else {
        bgColor = '#1a1a1a';
        bgColorThree = 0x1a1a1a;
    }
    
    // Создаем временную сцену
    const tempScene = new THREE.Scene();
    tempScene.background = new THREE.Color(bgColorThree);
    
    const stelaCopy = stelaMesh.clone();
    tempScene.add(stelaCopy);
    
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            const lightCopy = child.clone();
            tempScene.add(lightCopy);
        }
    });
    
    if (window.currentDecal) {
        const decalCopy = window.currentDecal.clone();
        tempScene.add(decalCopy);
    }
    
    const tempCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    tempCamera.position.set(0, 0.8, 3.2);
    tempCamera.lookAt(0, 0.5, 0);
    
    const tempRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false
    });
    tempRenderer.setSize(width, height);
    tempRenderer.render(tempScene, tempCamera);
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(tempRenderer.domElement, 0, 0, width, height);
    
    tempRenderer.dispose();
    
    console.log('✅ Прямой рендеринг выполнен, фон:', bgMode);
}

function fillPrintParams() {
    console.log('🔄 Заполняем параметры...');
    
    // РАЗМЕРЫ В МИЛЛИМЕТРАХ
    const realWidth = 600;   // мм
    const realHeight = 1200;  // мм
    const realDepth = 80;    // мм
    
    // Масштаб из слайдера
    const scale = parseFloat(scaleSlider.value) || 0.8;
    
    // Размеры гравировки в мм
    const engravingWidth = Math.round(realWidth * 0.85 * scale);
    const engravingHeight = Math.round(realHeight * 0.45 * scale);
    
    // Смещения
    const offsetX = parseFloat(offsetXSlider.value) || 0;
    const offsetY = parseFloat(offsetYSlider.value) || 0;
    const offsetZ = parseFloat(offsetZSlider.value) || -0.1;
    
    // Положение на стеле
    const posX = offsetX > 0.05 ? `смещено вправо на ${Math.round(offsetX * 50)} мм` : 
                 offsetX < -0.05 ? `смещено влево на ${Math.round(Math.abs(offsetX) * 50)} мм` : 'по центру';
    const posY = offsetY > 0.05 ? `смещено вверх на ${Math.round(offsetY * 50)} мм` : 
                 offsetY < -0.05 ? `смещено вниз на ${Math.round(Math.abs(offsetY) * 50)} мм` : 'по центру';
    
    // ===== ПОЛУЧАЕМ НАЗВАНИЕ ТЕКСТУРЫ =====
    let textureName = 'Нет';
    const selectedTexture = textureSelect.value;
    if (selectedTexture) {
        const texture = texturesList.find(t => t.id === selectedTexture);
        if (texture) {
            textureName = texture.display_name || texture.name || selectedTexture;
        } else {
            textureName = selectedTexture;
        }
    }
    
    // ===== ПОЛУЧАЕМ НАЗВАНИЕ КАМНЯ =====
    let stoneName = 'Классический';
    const stoneOption = stoneSelect.options[stoneSelect.selectedIndex];
    if (stoneOption) {
        stoneName = stoneOption.text || 'Классический';
    }
    
    // Заполняем элементы
    const map = {
        'printStelaHeight': realHeight + ' мм',
        'printStelaWidth': realWidth + ' мм',
        'printStelaDepth': realDepth + ' мм',
        'printStelaMaterial': textureName, // Вместо "Гранит" - название текстуры
        'printEngravingWidth': engravingWidth + ' мм',
        'printEngravingHeight': engravingHeight + ' мм',
        'printEngravingScale': scale.toFixed(2),
        'printEngravingPosition': `X: ${posX}, Y: ${posY}`,
        'printScale': scale.toFixed(2),
        'printOffsetX': offsetX.toFixed(2),
        'printOffsetY': offsetY.toFixed(2),
        'printOffsetZ': offsetZ.toFixed(2),
        'printMode': getMode() === 'engraving' ? 'Гравировка' : 'Фото (декаль)',
        'printShape': shapeSelect.options[shapeSelect.selectedIndex]?.text || 'Без формы',
        'printDepth': depthSlider.value || '0.9',
        'printHalo': haloSlider.value || '35',
        'printContrast': contrastSlider.value || '3.0',
        'printBrightness': brightnessSlider.value || '0',
        'printStone': stoneName,
        'printTexture': textureName
    };
    
    // Заполняем все элементы
    for (const [id, value] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    }
    
    // Отступы
    const cropTop = cropTopSlider.value + '%';
    const cropBottom = cropBottomSlider.value + '%';
    const cropLeft = cropLeftSlider.value + '%';
    const cropRight = cropRightSlider.value + '%';
    
    ['printCropTopParam', 'printCropBottomParam', 'printCropLeftParam', 'printCropRightParam'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = [cropTop, cropBottom, cropLeft, cropRight][i];
        }
    });
    
    console.log('✅ Параметры заполнены, материал:', textureName);
}

function forceRenderForPrint() {
    const canvas = document.getElementById('printCanvas');
    if (!canvas) return;
    
    // Получаем контейнер
    const container = document.getElementById('printStelaContainer');
    if (!container) return;
    
    // Устанавливаем размеры
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;
    
    // Рендерим
    renderer.render(scene, camera);
    
    // Копируем на canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
    
    console.log('✅ Принудительный рендеринг выполнен');
}


function closePrintForm() {
    const printForm = document.getElementById('printForm');
    printForm.classList.remove('active');
    printForm.style.display = 'none';
}

function printDocument() {
    console.log('🖨️ [printDocument] НАЧАЛО');
    
    // Проверяем, есть ли сохраненное изображение с ореолом
    if (!finalImageWithHalo) {
        console.error('❌ Нет изображения с ореолом!');
        alert('⚠️ Сначала создайте гравировку и откройте форму печати');
        return;
    }
    
    // Создаем временный элемент с изображением для печати
    const printContainer = document.getElementById('printStelaContainer');
    if (printContainer) {
        // Удаляем старые изображения
        const oldImgs = printContainer.querySelectorAll('.print-fallback-img');
        oldImgs.forEach(img => img.remove());
        
        // Создаем новое изображение с ореолом
        const img = document.createElement('img');
        img.src = finalImageWithHalo; // Используем изображение с ореолом
        img.className = 'print-fallback-img';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.zIndex = '20';
        img.style.display = 'block !important';
        img.style.visibility = 'visible !important';
        img.style.background = '#f5f5f5';
        img.setAttribute('id', 'print-image-' + Date.now());
        
        printContainer.appendChild(img);
        console.log('✅ Изображение с ореолом вставлено в контейнер для печати');
    }
    
    // Даем время на вставку изображения
    setTimeout(function() {
        console.log('🖨️ Запуск печати...');
        window.print();
    }, 500);
}

const agreeCheckbox = document.getElementById('agreeCheckbox');
if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', function() {
        const printAgreeBtn = document.getElementById('printAgreeBtn');
        if (printAgreeBtn) printAgreeBtn.disabled = !this.checked;
    });
}

// === СЛАЙДЕРЫ ===
if (blurSlider) blurSlider.addEventListener('input', () => blurValue.textContent = blurSlider.value);
if (depthSlider) depthSlider.addEventListener('input', () => depthValue.textContent = depthSlider.value);
if (haloSlider) haloSlider.addEventListener('input', () => haloValue.textContent = haloSlider.value);
if (contrastSlider) contrastSlider.addEventListener('input', () => contrastValue.textContent = contrastSlider.value);
if (brightnessSlider) brightnessSlider.addEventListener('input', () => brightnessValue.textContent = brightnessSlider.value);

if (cropTopSlider) {
    cropTopSlider.addEventListener('input', () => {
        if (cropTopValue) cropTopValue.textContent = cropTopSlider.value + '%';
        if (engravingBase64) recreateEngraving();
    });
}
if (cropBottomSlider) {
    cropBottomSlider.addEventListener('input', () => {
        if (cropBottomValue) cropBottomValue.textContent = cropBottomSlider.value + '%';
        if (engravingBase64) recreateEngraving();
    });
}
if (cropLeftSlider) {
    cropLeftSlider.addEventListener('input', () => {
        if (cropLeftValue) cropLeftValue.textContent = cropLeftSlider.value + '%';
        if (engravingBase64) recreateEngraving();
    });
}
if (cropRightSlider) {
    cropRightSlider.addEventListener('input', () => {
        if (cropRightValue) cropRightValue.textContent = cropRightSlider.value + '%';
        if (engravingBase64) recreateEngraving();
    });
}

if (scaleSlider) {
    scaleSlider.addEventListener('input', () => {
        if (scaleValue) scaleValue.textContent = parseFloat(scaleSlider.value).toFixed(2);
        if (engravingBase64) applyToStela(engravingBase64);
    });
}
if (offsetXSlider) {
    offsetXSlider.addEventListener('input', () => {
        if (offsetXValue) offsetXValue.textContent = parseFloat(offsetXSlider.value).toFixed(2);
        if (engravingBase64) applyToStela(engravingBase64);
    });
}
if (offsetYSlider) {
    offsetYSlider.addEventListener('input', () => {
        if (offsetYValue) offsetYValue.textContent = parseFloat(offsetYSlider.value).toFixed(2);
        if (engravingBase64) applyToStela(engravingBase64);
    });
}
if (offsetZSlider) {
    offsetZSlider.addEventListener('input', () => {
        if (offsetZValue) offsetZValue.textContent = parseFloat(offsetZSlider.value).toFixed(2);
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

if (shapeSelect) {
    shapeSelect.addEventListener('change', () => {
        currentShape = shapeSelect.value;
        if (engravingBase64) {
            applyToStela(engravingBase64);
        }
    });
}

// === ЗАГРУЗКА ФАЙЛА ===
if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#4CAF50'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = '#444'; });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault(); uploadArea.style.borderColor = '#444';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
}
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        statusText.textContent = '❌ Загрузите изображение';
        return;
    }
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (originalPreview) originalPreview.innerHTML = `<img src="${e.target.result}" alt="Оригинал">`;
        statusText.textContent = '✅ Фото загружено. Нажмите "Загрузить" для обработки';
        if (uploadBtn) uploadBtn.disabled = false;
        if (applyBtn) applyBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
        if (printBtn) printBtn.disabled = true;
    };
    reader.readAsDataURL(file);
}

// === КНОПКА ЗАГРУЗКИ ===
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        if (!currentFile || isUploading) return;
        isUploading = true;
        uploadBtn.disabled = true;
        uploadBtn.textContent = '⏳ Загрузка...';
        statusText.textContent = '🔄 Обработка...';

        const formData = new FormData();
        formData.append('image', currentFile);

        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Ошибка загрузки');
            }
            const data = await response.json();
            if (data.success) {
                sessionId = data.session_id;
                if (enhancedPreview) enhancedPreview.innerHTML = `<img src="data:image/jpeg;base64,${data.enhanced}" alt="Улучшенное">`;
                statusText.textContent = '✅ Готово! Нажмите "Создать" для генерации';
                uploadBtn.textContent = '✅ Готово';
                if (applyBtn) applyBtn.disabled = false;
            } else {
                throw new Error(data.error || 'Ошибка');
            }
        } catch (error) {
            statusText.textContent = '❌ ' + error.message;
            uploadBtn.textContent = '📤 Загрузить';
        } finally {
            isUploading = false;
            uploadBtn.disabled = false;
        }
    });
}

// === ПЕРЕСОЗДАНИЕ ===
async function recreateEngraving() {
    if (!sessionId || isProcessing) return;
    
    isProcessing = true;
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = '⏳ Обновление...';
    }
    statusText.textContent = '⏳ Обновление...';

    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('blur', blurSlider ? blurSlider.value : 3);
    formData.append('depth', depthSlider ? depthSlider.value : 0.9);
    formData.append('halo', haloSlider ? haloSlider.value : 35);
    formData.append('contrast', contrastSlider ? contrastSlider.value : 3.0);
    formData.append('brightness', brightnessSlider ? brightnessSlider.value : 0);
    formData.append('stone', stoneSelect ? stoneSelect.value : 'classic');
    formData.append('mode', getMode());
    formData.append('crop_top', cropTopSlider ? cropTopSlider.value : 2);
    formData.append('crop_bottom', cropBottomSlider ? cropBottomSlider.value : 2);
    formData.append('crop_left', cropLeftSlider ? cropLeftSlider.value : 2);
    formData.append('crop_right', cropRightSlider ? cropRightSlider.value : 2);
    formData.append('photo_brightness', photoBrightnessSlider ? photoBrightnessSlider.value : 0);
    formData.append('photo_contrast', photoContrastSlider ? photoContrastSlider.value : 1.0);
    formData.append('photo_mode', getPhotoMode());
    formData.append('texture', textureSelect ? textureSelect.value : '');
	// В функции recreateEngraving добавьте:
	formData.append('halo_enabled', haloEnabled ? haloEnabled.checked : true);
	formData.append('halo_density', haloDensity ? haloDensity.value : 50);
	formData.append('halo_size', haloSize ? haloSize.value : 180);
	formData.append('halo_brightness', haloBrightness ? haloBrightness.value : 60);
	formData.append('halo_blur', haloBlur ? haloBlur.value : 50);
	formData.append('halo_shift', haloShift ? parseFloat(haloShift.value) / 100 : 0);

    try {
        const response = await fetch('/process', { method: 'POST', body: formData });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Ошибка обработки');
        }
        const data = await response.json();
        if (data.success) {
            engravingBase64 = data.engraving;
            maskBase64 = data.mask;
            if (downloadBtn) downloadBtn.disabled = false;
            if (isAuthenticated) {
                if (printBtn) printBtn.disabled = false;
            }
            statusText.textContent = '✅ Обновлено!';
            applyToStela(data.engraving);
        } else {
            throw new Error(data.error || 'Ошибка');
        }
    } catch (error) {
        statusText.textContent = '❌ ' + error.message;
    } finally {
        isProcessing = false;
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.textContent = '⚙️ Создать';
        }
    }
}

// === КНОПКА СОЗДАНИЯ ===
if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
        if (!sessionId) {
            statusText.textContent = '⚠️ Сначала загрузите фото';
            return;
        }
        if (isProcessing) return;

        isProcessing = true;
        applyBtn.disabled = true;
        applyBtn.textContent = '⏳ Создание...';
        statusText.textContent = '⏳ Создание...';

        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('blur', blurSlider ? blurSlider.value : 3);
        formData.append('depth', depthSlider ? depthSlider.value : 0.9);
        formData.append('halo', haloSlider ? haloSlider.value : 35);
        formData.append('contrast', contrastSlider ? contrastSlider.value : 3.0);
        formData.append('brightness', brightnessSlider ? brightnessSlider.value : 0);
        formData.append('stone', stoneSelect ? stoneSelect.value : 'classic');
        formData.append('mode', getMode());
        formData.append('crop_top', cropTopSlider ? cropTopSlider.value : 2);
        formData.append('crop_bottom', cropBottomSlider ? cropBottomSlider.value : 2);
        formData.append('crop_left', cropLeftSlider ? cropLeftSlider.value : 2);
        formData.append('crop_right', cropRightSlider ? cropRightSlider.value : 2);
        formData.append('photo_brightness', photoBrightnessSlider ? photoBrightnessSlider.value : 0);
        formData.append('photo_contrast', photoContrastSlider ? photoContrastSlider.value : 1.0);
        formData.append('photo_mode', getPhotoMode());
        formData.append('texture', textureSelect ? textureSelect.value : '');
        
        // ===== ВАЖНО: Добавляем параметры ореола =====
        formData.append('halo_enabled', haloEnabled ? haloEnabled.checked : true);
        formData.append('halo_density', haloDensity ? haloDensity.value : 50);
        formData.append('halo_size', haloSize ? haloSize.value : 180);
        formData.append('halo_brightness', haloBrightness ? haloBrightness.value : 60);
        formData.append('halo_blur', haloBlur ? haloBlur.value : 50);
		formData.append('halo_shift', haloShift ? parseFloat(haloShift.value) / 100 : 0);

        try {
            const response = await fetch('/process', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Ошибка обработки');
            }
            const data = await response.json();
            if (data.success) {
                engravingBase64 = data.engraving;
                maskBase64 = data.mask;
                if (downloadBtn) downloadBtn.disabled = false;
                if (isAuthenticated) {
                    if (printBtn) printBtn.disabled = false;
                }
                statusText.textContent = '✅ Готово!';
                applyToStela(data.engraving);
            } else {
                throw new Error(data.error || 'Ошибка');
            }
        } catch (error) {
            statusText.textContent = '❌ ' + error.message;
        } finally {
            isProcessing = false;
            applyBtn.disabled = false;
            applyBtn.textContent = '⚙️ Создать';
        }
    });
}

// === СКАЧАТЬ ===
// === СКАЧАТЬ ===
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!engravingBase64) {
            statusText.textContent = '⚠️ Сначала создайте гравировку';
            return;
        }
        
        // Используем финальное изображение с ореолом
        if (finalImageWithHalo) {
            console.log('💾 Скачивание изображения с ореолом');
            const link = document.createElement('a');
            link.download = 'stela_with_halo.png';
            link.href = finalImageWithHalo;
            link.click();
            statusText.textContent = '✅ Изображение с ореолом скачано';
        } else {
            // Если по какой-то причине нет финального изображения, создаем его
            statusText.textContent = '⏳ Генерация изображения с ореолом...';
            generateFinalImageWithHalo(engravingBase64).then((imageUrl) => {
                const link = document.createElement('a');
                link.download = 'stela_with_halo.png';
                link.href = imageUrl;
                link.click();
                statusText.textContent = '✅ Изображение с ореолом скачано';
            }).catch((error) => {
                console.error('❌ Ошибка генерации:', error);
                // Fallback: скачиваем без ореола
                const link = document.createElement('a');
                link.download = 'result.png';
                link.href = `data:image/png;base64,${engravingBase64}`;
                link.click();
                statusText.textContent = '⚠️ Скачано без ореола (ошибка генерации)';
            });
        }
    });
}

// === ПЕЧАТЬ ===
if (printBtn) {
    printBtn.addEventListener('click', openPrintForm);
}

// Переключение режима фото (цветное/ЧБ)
if (photoModeColor) {
    photoModeColor.addEventListener('change', () => {
        if (engravingBase64 && getMode() === 'photo') {
            applyToStela(engravingBase64);
        }
    });
}
if (photoModeBW) {
    photoModeBW.addEventListener('change', () => {
        if (engravingBase64 && getMode() === 'photo') {
            applyToStela(engravingBase64);
        }
    });
}

// Обработчики для настроек ореола
if (haloEnabled) {
    haloEnabled.addEventListener('change', () => {
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

if (haloDensity) {
    haloDensity.addEventListener('input', () => {
        if (haloDensityValue) haloDensityValue.textContent = haloDensity.value + '%';
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

if (haloSize) {
    haloSize.addEventListener('input', () => {
        if (haloSizeValue) haloSizeValue.textContent = haloSize.value;
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

if (haloBrightness) {
    haloBrightness.addEventListener('input', () => {
        if (haloBrightnessValue) haloBrightnessValue.textContent = haloBrightness.value + '%';
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

if (haloBlur) {
    haloBlur.addEventListener('input', () => {
        if (haloBlurValue) haloBlurValue.textContent = haloBlur.value + '%';
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ============================================

function openOrderModal() {
    // Проверка авторизации
    if (!isAuthenticated) {
        statusText.textContent = '⚠️ Для оформления заказа войдите в систему';
        if (confirm('⚠️ Для оформления заказа нужно войти или зарегистрироваться. Перейти на страницу входа?')) {
            window.location.href = '/login';
        }
        return;
    }
    
    if (!engravingBase64) {
        statusText.textContent = '⚠️ Сначала создайте гравировку';
        return;
    }
    
    document.getElementById('orderPreviewMode').textContent = 
        getMode() === 'engraving' ? 'Гравировка' : 'Фото-декаль';
    document.getElementById('orderPreviewStone').textContent = 
        stoneSelect.options[stoneSelect.selectedIndex].text;
    document.getElementById('orderPreviewScale').textContent = 
        scaleSlider.value;
    
    orderModal.style.display = 'flex';
}

function closeOrderModal() {
    orderModal.style.display = 'none';
}

if (document.getElementById('orderForm')) {
    document.getElementById('orderForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Проверка авторизации
        if (!isAuthenticated) {
            alert('⚠️ Для оформления заказа войдите в систему');
            window.location.href = '/login';
            return;
        }
        
        const clientName = document.getElementById('orderClientName').value.trim();
        const clientPhone = document.getElementById('orderClientPhone').value.trim();
        const clientEmail = document.getElementById('orderClientEmail').value.trim();
        const notes = document.getElementById('orderNotes').value.trim();
        
        if (!clientName || !clientPhone) {
            alert('⚠️ Заполните ФИО и телефон');
            return;
        }
        
        const orderData = {
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail || '',
            notes: notes || '',
            mode: getMode(),
            shape: shapeSelect.value,
            stone: stoneSelect.value,
            texture: textureSelect.value,
            blur: parseFloat(blurSlider.value),
            depth: parseFloat(depthSlider.value),
            halo: parseInt(haloSlider.value),
            contrast: parseFloat(contrastSlider.value),
            brightness: parseInt(brightnessSlider.value),
            scale: parseFloat(scaleSlider.value),
            offset_x: parseFloat(offsetXSlider.value),
            offset_y: parseFloat(offsetYSlider.value),
            offset_z: parseFloat(offsetZSlider.value),
            crop_top: parseFloat(cropTopSlider.value),
            crop_bottom: parseFloat(cropBottomSlider.value),
            crop_left: parseFloat(cropLeftSlider.value),
            crop_right: parseFloat(cropRightSlider.value),
            photo_mode: getPhotoMode(),
            photo_brightness: parseInt(photoBrightnessSlider.value),
            photo_contrast: parseFloat(photoContrastSlider.value),
            engraving_image: engravingBase64,
            mask_image: maskBase64
        };
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Отправка...';
        statusText.textContent = '⏳ Оформление заказа...';
        
        try {
            const url = isGuest ? '/api/guest/order/create' : '/api/order/create';
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusText.textContent = '✅ Заказ оформлен! Письмо отправлено на почту';
                closeOrderModal();
                document.getElementById('orderClientName').value = '';
                document.getElementById('orderClientPhone').value = '';
                document.getElementById('orderClientEmail').value = '';
                document.getElementById('orderNotes').value = '';
                orderBtn.textContent = '✅ Заказ отправлен';
                orderBtn.disabled = true;
            } else {
                statusText.textContent = '❌ ' + (data.error || 'Ошибка оформления');
            }
        } catch (error) {
            statusText.textContent = '❌ Ошибка: ' + error.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '📨 Отправить заказ';
        }
    });
}

if (orderBtn) {
    orderBtn.addEventListener('click', openOrderModal);
}


// ============================================
// ЛАСТИК ДЛЯ ОРЕОЛА (КЛИЕНТСКАЯ ЧАСТЬ)
// ============================================

let eraserEnabled = false;
let eraserSize = 30;
let eraserSessionId = null;
let eraserActive = false;
let eraserMaskData = null;
let isEraserDrawing = false;

// Инициализация ластика на сервере
async function initEraserOnServer(width, height) {
    try {
        // Генерируем ID сессии если нет
        if (!eraserSessionId) {
            eraserSessionId = sessionId || 'eraser_' + Date.now();
        }
        
        const response = await fetch('/api/eraser/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: eraserSessionId,
                width: width || 1024,
                height: height || 1024
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Ластик инициализирован на сервере');
            eraserMaskData = data.mask;
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ Ошибка инициализации ластика:', e);
        return false;
    }
}

// Стереть ореол на сервере
async function eraseHaloOnServer(x, y, radius, imageBase64) {
    try {
        if (!eraserSessionId) {
            await initEraserOnServer(1024, 1024);
        }
        
        const response = await fetch('/api/eraser/erase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: eraserSessionId,
                image: imageBase64 || engravingBase64,
                x: x,
                y: y,
                radius: radius || eraserSize,
                width: 1024,
                height: 1024
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Ореол стерт в точке', x, y);
            eraserMaskData = data.mask;
            return data.image;
        }
        return null;
    } catch (e) {
        console.error('❌ Ошибка стирания:', e);
        return null;
    }
}

// Применить маску ластика к изображению
async function applyEraserMaskToImage(imageBase64) {
    try {
        if (!eraserSessionId) {
            return imageBase64;
        }
        
        const response = await fetch('/api/eraser/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: eraserSessionId,
                image: imageBase64,
                width: 1024,
                height: 1024
            })
        });
        
        const data = await response.json();
        if (data.success) {
            return data.image;
        }
        return imageBase64;
    } catch (e) {
        console.error('❌ Ошибка применения маски:', e);
        return imageBase64;
    }
}

const haloShift = document.getElementById('haloShift');
const haloShiftValue = document.getElementById('haloShiftValue');

if (haloShift) {
    haloShift.addEventListener('input', () => {
        if (haloShiftValue) haloShiftValue.textContent = haloShift.value + '%';
        if (engravingBase64) applyToStela(engravingBase64);
    });
}

// Обработчик клика для ластика
async function handleEraserClick(event) {
    if (!eraserEnabled || !engravingBase64) return;
    
    // Получаем UV координаты
    const uv = getUVFromClick(event);
    if (!uv) return;
    
    // Конвертируем UV в пиксельные координаты (для изображения 1024x1024)
    const imgSize = 1024;
    const px = uv.u * imgSize;
    const py = uv.v * imgSize;
    
    // Стираем ореол (возвращает изображение с примененной маской)
    const resultImage = await eraseHaloOnServer(px, py, eraserSize, engravingBase64);
    
    if (resultImage) {
        // Обновляем engravingBase64 (уже с примененной маской)
        engravingBase64 = resultImage;
        
        // Обновляем декаль на сцене (без перегенерации ореола!)
        // Просто обновляем текстуру декали
        updateDecalTexture(resultImage);
        
        // Обновляем финальное изображение для скачивания
        finalImageWithHalo = `data:image/png;base64,${resultImage}`;
        
        statusText.textContent = `✅ Ореол стерт в точке (${Math.round(px)}, ${Math.round(py)})`;
    }
}

// Обновить текстуру декали без перегенерации ореола
function updateDecalTexture(imageBase64) {
    if (!window.currentDecal) return;
    
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
        
        window.currentDecal.material.map = texture;
        window.currentDecal.material.needsUpdate = true;
        console.log('✅ Текстура декали обновлена с маской ластика');
    };
    img.src = `data:image/png;base64,${imageBase64}`;
}

// Сбросить ластик
async function resetEraserOnServer() {
    try {
        const response = await fetch('/api/eraser/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: eraserSessionId,
                width: 1024,
                height: 1024
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Ластик сброшен');
            eraserMaskData = data.mask;
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ Ошибка сброса:', e);
        return false;
    }
}

// Получить UV координаты клика на 3D сцене
function getUVFromClick(event) {
    const container = document.getElementById('stelaViewer');
    const rect = container.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(stelaMesh);
    
    if (intersects.length > 0) {
        const uv = intersects[0].uv;
        if (uv) {
            return {
                u: uv.x,
                v: 1 - uv.y,
                point: intersects[0].point
            };
        }
    }
    return null;
}



// ============================================
// ОБРАБОТЧИКИ ДЛЯ ЛАСТИКА (ДОБАВИТЬ В DOMContentLoaded)
// ============================================

// Эти обработчики нужно добавить в функцию DOMContentLoaded
function initEraserControls() {
    const enableEraserBtn = document.getElementById('enableEraserBtn');
    const clearEraserBtn = document.getElementById('clearEraserBtn');
    const eraserSizeSlider = document.getElementById('eraserSizeSlider');
    const eraserSizeValue = document.getElementById('eraserSizeValue');
    
    if (enableEraserBtn) {
        enableEraserBtn.addEventListener('click', async function() {
            eraserEnabled = !eraserEnabled;
            this.textContent = eraserEnabled ? '🔴 Выключить ластик' : '🔲 Включить ластик';
            this.style.background = eraserEnabled ? '#dc3545' : '';
            this.style.color = eraserEnabled ? 'white' : '';
            
            const status = document.getElementById('eraserStatus');
            if (status) {
                status.textContent = eraserEnabled ? 
                    '🟢 Ластик активен! Кликните на стелу, чтобы стереть ореол' : 
                    'Кликните на 3D сцене, чтобы стереть ореол';
                status.style.color = eraserEnabled ? '#4CAF50' : '#888';
            }
            
            if (clearEraserBtn) {
                clearEraserBtn.style.display = eraserEnabled ? 'inline-block' : 'none';
            }
            
            // Инициализируем ластик на сервере
            if (eraserEnabled && engravingBase64) {
                await initEraserOnServer(1024, 1024);
                statusText.textContent = '✅ Ластик готов к работе';
            }
        });
    }
    
    if (clearEraserBtn) {
        clearEraserBtn.addEventListener('click', async function() {
            if (confirm('Очистить все стертые области ореола?')) {
                const result = await resetEraserOnServer();
                if (result && engravingBase64) {
                    // Пересоздаем гравировку без стертых областей
                    applyToStela(engravingBase64);
                    statusText.textContent = '✅ Все стертые области восстановлены';
                }
            }
        });
    }
    
    if (eraserSizeSlider) {
        eraserSizeSlider.addEventListener('input', function() {
            eraserSize = parseInt(this.value);
            if (eraserSizeValue) eraserSizeValue.textContent = eraserSize;
        });
    }
}

// Добавляем обработчик клика на 3D вьювер
function initEraserViewerClick() {
    const viewer = document.getElementById('stelaViewer');
    if (viewer) {
        viewer.addEventListener('click', handleEraserClick);
        viewer.style.cursor = 'pointer';
    }
}


// === ЗАПУСК ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, инициализация...');
    
    // === ИНИЦИАЛИЗАЦИЯ 3D ===
    init3D();
    updateModeUI();
    loadTextures();
    initEraserControls();
    initEraserViewerClick();
    
    // === ПРОВЕРКА АВТОРИЗАЦИИ ===
    const isAuthenticated = document.querySelector('.top-bar span[style*="color:#888"]') !== null;
    const isGuest = window.location.pathname.includes('/guest');
    console.log('👤 Авторизован:', isAuthenticated);
    console.log('👤 Гость:', isGuest);
    
    // === КНОПКА ПЕЧАТИ ===
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        console.log('🖨️ Кнопка печати найдена');
        printBtn.addEventListener('click', function(e) {
            console.log('🖨️ Клик по кнопке печати');
            e.preventDefault();
            if (typeof openPrintForm === 'function') {
                openPrintForm();
            } else {
                console.error('❌ Функция openPrintForm не определена');
                const statusText = document.getElementById('statusText');
                if (statusText) {
                    statusText.textContent = '❌ Ошибка: функция печати не загружена';
                }
            }
        });
    } else {
        console.warn('⚠️ Кнопка печати не найдена в DOM');
    }
    
    // === КНОПКА ЗАГРУЗКИ ===
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        console.log('📤 Кнопка загрузки найдена');
        uploadBtn.addEventListener('click', function() {
            // Обработчик уже определен в main.js
            console.log('📤 Клик по кнопке загрузки');
        });
    }
    
    // === КНОПКА СОЗДАНИЯ ===
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) {
        console.log('⚙️ Кнопка создания найдена');
        applyBtn.addEventListener('click', function() {
            console.log('⚙️ Клик по кнопке создания');
        });
    }
    
    // === КНОПКА СКАЧАТЬ ===
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        console.log('💾 Кнопка скачивания найдена');
        downloadBtn.addEventListener('click', function() {
            console.log('💾 Клик по кнопке скачивания');
        });
    }
    
    // === КНОПКА ОФОРМЛЕНИЯ ЗАКАЗА ===
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        console.log('📋 Кнопка заказа найдена');
        orderBtn.addEventListener('click', function() {
            console.log('📋 Клик по кнопке заказа');
            if (typeof openOrderModal === 'function') {
                openOrderModal();
            } else {
                console.error('❌ Функция openOrderModal не определена');
                const statusText = document.getElementById('statusText');
                if (statusText) {
                    statusText.textContent = '❌ Ошибка: функция заказа не загружена';
                }
            }
        });
    }
    
    // === СЛАЙДЕРЫ ===
    // Блюр
    const blurSlider = document.getElementById('blurSlider');
    const blurValue = document.getElementById('blurValue');
    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', function() {
            blurValue.textContent = this.value;
        });
    }
    
    // Глубина
    const depthSlider = document.getElementById('depthSlider');
    const depthValue = document.getElementById('depthValue');
    if (depthSlider && depthValue) {
        depthSlider.addEventListener('input', function() {
            depthValue.textContent = this.value;
        });
    }
    
    // Ореол
    const haloSlider = document.getElementById('haloSlider');
    const haloValue = document.getElementById('haloValue');
    if (haloSlider && haloValue) {
        haloSlider.addEventListener('input', function() {
            haloValue.textContent = this.value;
        });
    }
    
    // Контраст
    const contrastSlider = document.getElementById('contrastSlider');
    const contrastValue = document.getElementById('contrastValue');
    if (contrastSlider && contrastValue) {
        contrastSlider.addEventListener('input', function() {
            contrastValue.textContent = this.value;
        });
    }
    
    // Яркость
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    if (brightnessSlider && brightnessValue) {
        brightnessSlider.addEventListener('input', function() {
            brightnessValue.textContent = this.value;
        });
    }
    
    // Масштаб
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    if (scaleSlider && scaleValue) {
        scaleSlider.addEventListener('input', function() {
            scaleValue.textContent = parseFloat(this.value).toFixed(2);
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // Смещение X
    const offsetXSlider = document.getElementById('offsetXSlider');
    const offsetXValue = document.getElementById('offsetXValue');
    if (offsetXSlider && offsetXValue) {
        offsetXSlider.addEventListener('input', function() {
            offsetXValue.textContent = parseFloat(this.value).toFixed(2);
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // Смещение Y
    const offsetYSlider = document.getElementById('offsetYSlider');
    const offsetYValue = document.getElementById('offsetYValue');
    if (offsetYSlider && offsetYValue) {
        offsetYSlider.addEventListener('input', function() {
            offsetYValue.textContent = parseFloat(this.value).toFixed(2);
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // Смещение Z
    const offsetZSlider = document.getElementById('offsetZSlider');
    const offsetZValue = document.getElementById('offsetZValue');
    if (offsetZSlider && offsetZValue) {
        offsetZSlider.addEventListener('input', function() {
            offsetZValue.textContent = parseFloat(this.value).toFixed(2);
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // === КРОП СЛАЙДЕРЫ ===
    const cropTopSlider = document.getElementById('cropTopSlider');
    const cropTopValue = document.getElementById('cropTopValue');
    if (cropTopSlider && cropTopValue) {
        cropTopSlider.addEventListener('input', function() {
            cropTopValue.textContent = this.value + '%';
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof recreateEngraving === 'function') {
                recreateEngraving();
            }
        });
    }
    
    const cropBottomSlider = document.getElementById('cropBottomSlider');
    const cropBottomValue = document.getElementById('cropBottomValue');
    if (cropBottomSlider && cropBottomValue) {
        cropBottomSlider.addEventListener('input', function() {
            cropBottomValue.textContent = this.value + '%';
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof recreateEngraving === 'function') {
                recreateEngraving();
            }
        });
    }
    
    const cropLeftSlider = document.getElementById('cropLeftSlider');
    const cropLeftValue = document.getElementById('cropLeftValue');
    if (cropLeftSlider && cropLeftValue) {
        cropLeftSlider.addEventListener('input', function() {
            cropLeftValue.textContent = this.value + '%';
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof recreateEngraving === 'function') {
                recreateEngraving();
            }
        });
    }
    
    const cropRightSlider = document.getElementById('cropRightSlider');
    const cropRightValue = document.getElementById('cropRightValue');
    if (cropRightSlider && cropRightValue) {
        cropRightSlider.addEventListener('input', function() {
            cropRightValue.textContent = this.value + '%';
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof recreateEngraving === 'function') {
                recreateEngraving();
            }
        });
    }
    
    // === ФОТО НАСТРОЙКИ ===
    const photoBrightnessSlider = document.getElementById('photoBrightnessSlider');
    const photoBrightnessValue = document.getElementById('photoBrightnessValue');
    if (photoBrightnessSlider && photoBrightnessValue) {
        photoBrightnessSlider.addEventListener('input', function() {
            photoBrightnessValue.textContent = this.value;
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof getMode === 'function' && getMode() === 'photo' && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    const photoContrastSlider = document.getElementById('photoContrastSlider');
    const photoContrastValue = document.getElementById('photoContrastValue');
    if (photoContrastSlider && photoContrastValue) {
        photoContrastSlider.addEventListener('input', function() {
            photoContrastValue.textContent = parseFloat(this.value).toFixed(2);
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof getMode === 'function' && getMode() === 'photo' && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // === ПЕРЕКЛЮЧАТЕЛИ РЕЖИМОВ ===
    const modeEngraving = document.getElementById('modeEngraving');
    const modePhoto = document.getElementById('modePhoto');
    if (modeEngraving) {
        modeEngraving.addEventListener('change', function() {
            console.log('🔄 Режим: Гравировка');
            if (typeof updateModeUI === 'function') updateModeUI();
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    if (modePhoto) {
        modePhoto.addEventListener('change', function() {
            console.log('🔄 Режим: Фото');
            if (typeof updateModeUI === 'function') updateModeUI();
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    const photoModeColor = document.getElementById('photoModeColor');
    const photoModeBW = document.getElementById('photoModeBW');
    if (photoModeColor) {
        photoModeColor.addEventListener('change', function() {
            console.log('📷 Фото режим: Цветной');
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof getMode === 'function' && getMode() === 'photo' && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    if (photoModeBW) {
        photoModeBW.addEventListener('change', function() {
            console.log('📷 Фото режим: Черно-белый');
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof getMode === 'function' && getMode() === 'photo' && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // === ФОРМА ВЫБОРА ФОРМЫ ===
    const shapeSelect = document.getElementById('shapeSelect');
    if (shapeSelect) {
        shapeSelect.addEventListener('change', function() {
            if (typeof engravingBase64 !== 'undefined' && engravingBase64 && typeof applyToStela === 'function') {
                applyToStela(engravingBase64);
            }
        });
    }
    
    // === ВЫБОР ТЕКСТУРЫ ===
    const textureSelect = document.getElementById('textureSelect');
    if (textureSelect) {
        textureSelect.addEventListener('change', function() {
            const selectedTexture = this.value;
            if (typeof applyTextureToStela === 'function') {
                if (selectedTexture) {
                    const texture = texturesList.find(t => t.id === selectedTexture);
                    if (texture) {
                        const relPath = texture.path.replace(/^.*[\\\/]textures[\\\/]/, '');
                        applyTextureToStela(relPath);
                    }
                } else {
                    applyTextureToStela(null);
                }
            }
        });
    }
    
    // === ЧЕКБОКС СОГЛАСИЯ ДЛЯ ПЕЧАТИ ===
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const printAgreeBtn = document.getElementById('printAgreeBtn');
    if (agreeCheckbox && printAgreeBtn) {
        agreeCheckbox.addEventListener('change', function() {
            printAgreeBtn.disabled = !this.checked;
        });
    }
    
    // === ЗАКРЫТИЕ ФОРМЫ ПЕЧАТИ ПОКЛИКУ НА ЗАТЕМНЕНИЕ ===
    const printForm = document.getElementById('printForm');
    if (printForm) {
        printForm.addEventListener('click', function(e) {
            if (e.target === this) {
                if (typeof closePrintForm === 'function') {
                    closePrintForm();
                }
            }
        });
    }
    
    // === ЗАКРЫТИЕ МОДАЛКИ ЗАКАЗА ПОКЛИКУ НА ЗАТЕМНЕНИЕ ===
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        orderModal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (typeof closeOrderModal === 'function') {
                    closeOrderModal();
                }
            }
        });
    }
		
	// === ПЕРЕКЛЮЧАТЕЛИ ФОНА ДЛЯ СТЕЛЛЫ ===
	const stelaBgLight = document.getElementById('stelaBgLight');
	const stelaBgDark = document.getElementById('stelaBgDark');

	if (stelaBgLight && stelaBgDark) {
		stelaBgLight.addEventListener('change', function() {
			if (this.checked) {
				console.log('🔄 Светлый фон для стеллы');
				// Обновляем стеллу в форме печати
				if (document.getElementById('printForm').classList.contains('active')) {
					renderStelaForPrint();
				}
			}
		});
		
		stelaBgDark.addEventListener('change', function() {
			if (this.checked) {
				console.log('🔄 Темный фон для стеллы');
				if (document.getElementById('printForm').classList.contains('active')) {
					renderStelaForPrint();
				}
			}
		});
	}
	
    console.log('✅ Все обработчики событий зарегистрированы');
});