import type { ResolvedSourceKind, SourceKindFriendly } from '../../shared/types';

// Candidatos de inputKind por categoria amigable, ordenados por preferencia.
// Se filtran contra los kinds reales que reporta OBS (GetInputKindList), igual
// que el fallback de propertyName en obs-manager.getAudioDevices. Asi soportamos
// macOS (av_capture_input / screen_capture) y Windows (dshow_input / monitor_capture)
// sin hardcodear un solo valor.
export const KIND_CANDIDATES: Record<SourceKindFriendly, string[]> = {
  camera: ['av_capture_input_v2', 'av_capture_input', 'dshow_input'],
  // Una consola se conecta mediante una tarjeta de captura, que el sistema expone
  // como un dispositivo de video. Por eso usa el mismo inputKind que la camara.
  game_console: ['av_capture_input_v2', 'av_capture_input', 'dshow_input'],
  // En macOS preferimos display_capture (legacy) sobre screen_capture: enumerar
  // los monitores de screen_capture via WebSocket cuelga OBS y cierra la conexion
  // (ver ENUM_UNSAFE_KINDS). display_capture lista los monitores sin problemas.
  // En Windows el unico kind es monitor_capture.
  display: ['display_capture', 'monitor_capture', 'screen_capture'],
  window: ['window_capture'],
  image: ['image_source'],
};

// Kinds cuyo GetInputPropertiesListPropertyItems cuelga OBS sobre WebSocket. Para
// estos no enumeramos dispositivos (se usa el valor por defecto) y se avisa al
// usuario, evitando que la conexion se caiga.
export const ENUM_UNSAFE_KINDS = new Set<string>(['screen_capture']);

// Propiedades candidatas para enumerar el dispositivo/monitor/ventana de cada
// categoria. Se prueban en orden hasta que OBS devuelva items (los nombres varian
// segun plataforma y version de OBS).
export const DEVICE_PROPERTY_CANDIDATES: Partial<Record<SourceKindFriendly, string[]>> = {
  camera: ['video_device_id', 'device', 'device_id'],
  game_console: ['video_device_id', 'device', 'device_id'],
  // macOS display_capture usa 'display_uuid'; Windows monitor_capture usa
  // 'monitor_id' (moderno) o 'monitor' (antiguo).
  display: ['display_uuid', 'monitor_id', 'monitor', 'display'],
  window: ['window'],
  // 'image' no enumera dispositivos: se usa un selector de archivo.
};

export const ALL_FRIENDLY_KINDS: SourceKindFriendly[] = ['camera', 'display', 'window', 'game_console', 'image'];

// Etiqueta legible (en espanol) para cada categoria amigable.
export const FRIENDLY_LABELS: Record<SourceKindFriendly, string> = {
  camera: 'Camara web',
  display: 'Pantalla completa',
  window: 'Ventana',
  game_console: 'Consola',
  image: 'Imagen',
};

// Resuelve el inputKind real a usar para una categoria amigable, eligiendo el
// primer candidato presente en la lista de kinds disponibles en este OBS.
export function resolveSourceKind(
  friendly: SourceKindFriendly,
  availableKinds: string[],
): ResolvedSourceKind {
  const available = new Set(availableKinds);
  const inputKind = KIND_CANDIDATES[friendly].find((kind) => available.has(kind));
  const propertyCandidates = DEVICE_PROPERTY_CANDIDATES[friendly];

  return {
    friendly,
    inputKind: inputKind ?? '',
    devicePropertyName: propertyCandidates?.[0],
    supportsDeviceEnum: Boolean(propertyCandidates && propertyCandidates.length > 0),
    available: Boolean(inputKind),
  };
}

export function resolveAllSourceKinds(availableKinds: string[]): ResolvedSourceKind[] {
  return ALL_FRIENDLY_KINDS.map((friendly) => resolveSourceKind(friendly, availableKinds));
}

// Mapeo inverso (best-effort) de un inputKind real a la categoria amigable, solo
// para elegir el icono en la lista de fuentes. Las consolas no se pueden distinguir
// de una camara a partir del kind, asi que caen en 'camera'.
export function friendlyKindFromInputKind(inputKind: string | undefined): SourceKindFriendly | undefined {
  if (!inputKind) return undefined;
  if (KIND_CANDIDATES.image.includes(inputKind)) return 'image';
  if (KIND_CANDIDATES.display.includes(inputKind)) return 'display';
  if (KIND_CANDIDATES.window.includes(inputKind)) return 'window';
  if (KIND_CANDIDATES.camera.includes(inputKind)) return 'camera';
  return undefined;
}

// OBS exige que el nombre de cada input sea unico globalmente. Genera un nombre
// libre a partir de una base ("Camara web", "Camara web 2", ...).
export function buildUniqueInputName(base: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base} ${index}`)) {
    index += 1;
  }
  return `${base} ${index}`;
}

export const CAMERA_FRAME_PREFIX = 'Marco · ';

export function cameraFrameName(cameraInputName: string): string {
  return `${CAMERA_FRAME_PREFIX}${cameraInputName}`;
}

// OBS guarda el color de una fuente en orden ABGR (alpha en el byte alto).
// Usamos aritmetica en vez de operadores bitwise para conservar el uint32.
export function hexToObsColor(hex: string): number {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return red + green * 256 + blue * 65_536 + 255 * 16_777_216;
}

// Halo exterior del marco neon (px). El marco crece este margen alrededor del borde.
export function neonFrameGlow(thickness: number): number {
  return Math.round(Math.max(16, thickness * 1.5));
}

// Pagina para Browser Source: un rectangulo con conic-gradient que gira (color
// + destellos blancos) y un halo que pulsa. Va detras de la camara, asi que
// solo se ve el borde. El color ya viene validado como #RRGGBB.
export function buildNeonFrameUrl(config: { color: string; thickness: number; rounded: boolean }): string {
  const glow = neonFrameGlow(config.thickness);
  const color = config.color;
  const radius = config.rounded ? Math.max(18, config.thickness * 2) : 0;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}
.f{position:absolute;inset:${glow}px;border-radius:${radius}px;overflow:hidden;background:${color};
box-shadow:0 0 ${Math.round(glow / 2)}px ${color},0 0 ${glow}px ${color};animation:p 2.6s ease-in-out infinite}
.f::before{content:'';position:absolute;left:50%;top:50%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;
background:conic-gradient(${color} 0deg,${color} 130deg,#fff 170deg,${color} 205deg,${color} 300deg,rgba(255,255,255,.75) 330deg,${color} 360deg);
animation:s 3.2s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}
@keyframes p{50%{box-shadow:0 0 ${Math.round(glow / 4)}px ${color},0 0 ${Math.round(glow * 0.6)}px ${color}}}
</style></head><body><div class="f"></div></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
