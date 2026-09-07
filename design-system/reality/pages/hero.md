# Hero Page Overrides

**PROJECT:** REALITY  
Тексты — из `docs/prototype.html`. Визуал — cinematic full-bleed, не split-card.

## Direction

- Photo-based full-bleed (banner art: Photo-Based + Glassmorphism + Dark/Moody)
- Parallax Storytelling, **Subtle**: только фон (`yPercent` ~10), текст не двигается
- Слои: фон (скорость 0.3) → scrim бренда → контент (1.0)
- `overflow: hidden` на секции; `prefers-reduced-motion` и мобилка — статичный кадр
- Header: стекло поверх фото, светлая навигация
- CTA: белая заливка / ghost-обводка на тёмном кадре, hover `#1b112e`
