# Design System Master File

> Источник визуала: [reality.by](https://reality.by/) + прототип `docs/prototype.html`.
> Автогенерация UI UX Pro Max скорректирована под реальные токены сайта.

**Project:** REALITY (РИАЛИТИ)
**Category:** Real estate agency / exclusive listing landing

---

## Global Rules

### Color Palette (parsed from reality.by)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#2c1c4c` | `--primary-color`, `--color-primary` |
| Hover | `#1b112e` | `--hover-color`, `--color-primary-hover` |
| Link | `#2c1c4c` | `--link-color` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Background | `#FFFFFF` | `--color-background` |
| Surface / muted | `#f3f1ec` | `--color-muted` |
| Foreground | `#2c1c4c` | `--color-foreground` |
| Body text | `#3d3550` | `--color-body` |
| Muted text | `#6b6578` | `--color-muted-foreground` |
| Border | `#d9d4cc` | `--color-border` |
| Card | `#FFFFFF` | `--color-card` |

Не использовать золото, чёрный «luxury» и Cinzel из автоподбора. Акцент лендинга — фиолетовый бренда.

### Typography (parsed from reality.by)

- **UI / body:** Open Sans (300–700, cyrillic)
- **Headings / accent:** Merriweather (300, 400, cyrillic)
- Дополнительно на сайте есть Comfortaa — на лендинге не используем, чтобы не плодить третий шрифт.

```html
<link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i&amp;subset=cyrillic" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Merriweather:300,400&amp;subset=cyrillic" rel="stylesheet">
```

На сайте: `h1` ~50px / weight 300; кнопки 18px / 600 / uppercase.

### Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--space-3xl` | `64px` |
| `--wrap` | `1080px` (как в прототипе) |

### Radius & buttons (parsed)

- Кнопки: `border-radius: 4px`, высота `60px` (мобилка `50px`), `text-transform: uppercase`, `font-weight: 600`
- Карточки: `4px` (как `.lk` на сайте), не 12–16px «saas»

### Anti-patterns

- Не копировать каталог/слайдер главной reality.by
- Не менять тексты, CTA и порядок блоков прототипа
- Не emoji-иконки
- `prefers-reduced-motion`: без parallax
