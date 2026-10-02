# eraser_logic.py - Логика ластика для ореола
import cv2
import numpy as np
from PIL import Image
import io
import base64

class EraserMask:
    """Класс для управления маской ластика"""
    def __init__(self, width, height):
        self.width = width
        self.height = height
        # Белая маска = ничего не стерто (255 = видимо)
        # Черная маска = стерто (0 = скрыть)
        self.mask = np.ones((height, width), dtype=np.uint8) * 255

    def erase(self, x, y, radius):
        """Стереть область (нарисовать черный круг)"""
        # Убедимся, что координаты целые и в пределах границ
        x, y = int(x), int(y)
        radius = int(radius)
        cv2.circle(self.mask, (x, y), radius, 0, -1)

    def get_mask_base64(self):
        """Получить маску в base64"""
        img = Image.fromarray(self.mask, 'L')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    def get_mask_as_cv2(self):
        """Получить маску как numpy array для OpenCV"""
        return self.mask.copy()

    def apply_mask_to_halo(self, halo_image_base64, mask=None):
        """Применить маску к изображению ореола"""
        try:
            img_data = base64.b64decode(halo_image_base64)
            img = Image.open(io.BytesIO(img_data))
            
            # Конвертируем в RGBA для работы с альфа-каналом
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img_array = np.array(img)
            h, w = img_array.shape[:2]
            
            if mask is None:
                mask = self.mask
            
            # Масштабируем маску под размер изображения, если они отличаются
            if h != mask.shape[0] or w != mask.shape[1]:
                # INTER_NEAREST важен для бинарных масок, чтобы не было полутонов на краях
                mask_resized = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
            else:
                mask_resized = mask

            # --- ВЕКТОРНАЯ ЛОГИКА УДАЛЕНИЯ ---
            # Создаем булевую маску: True там, где нужно стереть (черная часть маски < 128)
            erase_region = (mask_resized < 128)
            
            # Обнуляем альфа-канал (4-й канал, индекс 3) в этой области
            # Это удалит ВСЁ, что попало под кисть, что и требуется от ластика
            img_array[erase_region, 3] = 0
            
            erased_count = np.count_nonzero(erase_region)
            print(f"✅ Стерто {erased_count} пикселей в области маски")
            
            result_img = Image.fromarray(img_array, 'RGBA')
            buffer = io.BytesIO()
            # Сохраняем с оптимизацией
            result_img.save(buffer, format='PNG', optimize=True)
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            print(f"❌ Ошибка в apply_mask_to_halo: {e}")
            import traceback
            traceback.print_exc()
            return halo_image_base64

    def reset(self):
        """Сбросить маску (очистить все стертые области)"""
        self.mask = np.ones((self.height, self.width), dtype=np.uint8) * 255

# Хранилище масок для разных сессий
eraser_masks = {}

def get_eraser_mask(session_id, width, height):
    """Получить или создать маску для сессии"""
    if session_id not in eraser_masks:
        eraser_masks[session_id] = EraserMask(width, height)
    return eraser_masks[session_id]

def erase_halo(session_id, halo_image_base64, x, y, radius, width, height):
    """Стереть ореол в точке"""
    mask = get_eraser_mask(session_id, width, height)
    mask.erase(x, y, radius)
    return mask.apply_mask_to_halo(halo_image_base64)

def reset_eraser(session_id, width, height):
    """Сбросить маску"""
    mask = get_eraser_mask(session_id, width, height)
    mask.reset()
    return mask.get_mask_base64()

def get_eraser_mask_base64(session_id, width, height):
    """Получить маску в base64 для отображения"""
    mask = get_eraser_mask(session_id, width, height)
    return mask.get_mask_base64()

def apply_eraser_mask_to_image(session_id, image_base64, width, height):
    """Применить текущую маску к изображению"""
    mask = get_eraser_mask(session_id, width, height)
    return mask.apply_mask_to_halo(image_base64)