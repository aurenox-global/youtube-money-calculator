# 💰 Calculadora de Dinero en YouTube

Calculadora web (HTML/CSS/JS, sin dependencias) para **estimar cuánto dinero puedes ganar en YouTube**
a partir de tus vistas diarias, tu engagement y tu RPM (ingresos por 1.000 vistas).

Inspirada en las calculadoras de ingresos de YouTube, con modelo transparente y ajustable.

## ✨ Características

- 📊 Rango de ganancias estimadas **por día, mes y año**.
- 🎚️ Sliders para vistas diarias y tasa de engagement.
- 💵 RPM (bajo/alto) configurable por nicho.
- 📈 Vistas proyectadas mensuales y anuales.
- 🧮 Explicación transparente del reparto **55 % creador / 45 % YouTube**.
- 📱 Diseño responsive (móvil, tablet, escritorio).
- ⚡ 100 % estático: se puede abrir con doble clic o servir desde GitHub Pages.

## 🚀 Uso

### Local
Abre `index.html` en tu navegador. No requiere build ni servidor.

O sirve la carpeta:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

### GitHub Pages
Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`.

## 🧮 Modelo de cálculo

```
ingreso_día_bajo  = vistas_día / 1000 × RPM_bajo
ingreso_día_alto  = vistas_día / 1000 × RPM_alto × boost_engagement
ingreso_mes       = ingreso_día × 30
ingreso_año       = ingreso_día × 365
```

- **Reparto:** YouTube retiene el 45 % de los ingresos publicitarios; el creador recibe el 55 %.
- **RPM por defecto:** $1,43 – $2,38 (rango conservador).
- **boost_engagement:** 0 % → ×1,00 · 20 % → ×1,35 (audiencias más activas captan anuncios mejor pagados).

> Las cifras son estimaciones orientativas, no garantizan ingresos.

## 📂 Estructura

```
youtube-money-calculator/
├── index.html    # estructura y contenido
├── styles.css    # diseño responsive
├── script.js     # lógica de la calculadora
├── README.md
└── LICENSE
```

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
