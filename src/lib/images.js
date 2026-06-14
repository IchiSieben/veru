// Mapa de assets locales -> ImageMetadata, para alimentar el componente <Image> de Astro.
// import.meta.glob resuelve en build los archivos de src/assets/img.
// Cambiar a las fotos reales después = reemplazar el archivo .jpg con el mismo nombre.
const modules = import.meta.glob('../assets/img/*.{jpg,jpeg,png,webp,avif}', { eager: true });

const map = {};
for (const path in modules) {
  const file = path.split('/').pop();
  map[file] = modules[path].default;
}

/** Devuelve el ImageMetadata de un archivo en src/assets/img por su nombre. */
export function img(file) {
  const meta = map[file];
  if (!meta) {
    throw new Error(`[veru] Imagen no encontrada en src/assets/img: ${file}`);
  }
  return meta;
}

export { map as imageMap };
