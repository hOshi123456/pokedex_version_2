## Pokédex Version 2

Una aplicación web interactiva construida con **Vue 3** y **AG Grid**, que permite explorar, buscar y visualizar Pokémon con una interfaz moderna y responsiva, compatible con modo oscuro.

## Descripción del Proyecto

**Pokedex_version_2** es una herramienta visual que permite consultar datos de Pokémon como estadísticas, tipos, evoluciones y más. Utiliza AG Grid para mostrar datos de forma ordenada y dinámica, y cuenta con visualizaciones como dashboards, filtros, búsqueda avanzada y soporte completo para dispositivos móviles y modo oscuro.

## Tecnologías Usadas

- **Vue 3**
- **AG Grid Vue 3**
- **TailwindCSS (postcss integrado)**
- **PokéAPI (datos de los Pokémon)**
- **GH Pages** para despliegue

---

## Instalación

### Requisitos previos

- Node.js (>=14)
- npm o yarn

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/pokedex_version_2.git
cd pokedex_version_2
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run serve
```

La aplicación estará disponible en: `http://localhost:8080`

---

## Uso

Una vez ejecutada:

- Utiliza el botón 🌙/☀️ para alternar entre modo oscuro y claro.
- Filtra Pokémon por tipo, búsqueda por nombre o cantidad por página.
- Haz clic en un Pokémon para ver su información detallada en un modal.
- Abre el Dashboard 📊 para ver estadísticas generales (capturados, progreso, tipos más atrapados, etc.).

---

## Características Implementadas

- **Listado de Pokémon con AG Grid**  
- **Búsqueda y filtrado por nombre o tipo**
- **Ordenamiento alfabético por nombre**
- **Captura de Pokémon (con indicador visual)**
- **Dashboard con estadísticas generales**
- **Modo oscuro completamente integrado**
- **Soporte móvil responsivo**
- **Visualización detallada por modal**
- **Gráficos de progreso y tipos más atrapados**
- **Exportación de datos (CSV)**
- **Animaciones suaves y diseño atractivo**

---

## Despliegue

El proyecto está configurado para ser desplegado en GitHub Pages:

```bash
npm run build
npm run deploy
```

Esto publicará la carpeta `/dist` en la rama `gh-pages`.

---

## Estructura del Proyecto

```
src/
│
├── assets/            # Estilos y recursos estáticos
├── components/        # Componentes como Grid, Modal, etc.
├── views/             # Vista principal (PokedexView.vue)
├── App.vue            # Componente raíz
├── main.js            # Punto de entrada
└── router/            # (si usas Vue Router)
```

---

## Licencia

Este proyecto es de uso libre con fines educativos y personales. Basado en datos públicos de [PokéAPI](https://pokeapi.co/).

---

## Agradecimientos

- [Vue.js](https://vuejs.org/)
- [AG Grid](https://www.ag-grid.com/)
- [PokéAPI](https://pokeapi.co/)
- [TailwindCSS](https://tailwindcss.com/)
