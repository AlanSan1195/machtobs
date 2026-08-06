# Plan 012: Add capture-card audio automatically when creating a console source

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report; do not improvise. The reviewing
> advisor maintains `plans/README.md` — do not edit it yourself unless the
> operator told you that you maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2ff5d01..HEAD -- src/renderer/lib/obs-manager.ts src/renderer/components/AddSourceWizard.tsx src/renderer/lib/app-api.ts src/renderer/hooks/useAppAPI.ts src/shared/validation.ts src/shared/types.ts`
> If any in-scope file differs from the excerpts below, compare carefully; on a
> semantic mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction (feature — requested by the maintainer)
- **Planned at**: commit `2ff5d01`, 2026-07-30

## Why this matters

When the app creates a **console (capture card) source** in OBS, only the video
is captured. The OBS video-capture source (e.g. `av_capture_input_v2` on macOS)
carries **no audio**, so recordings/streams of the console are silent until the
user manually adds `Fuentes → + → Captura de entrada de audio` and re-selects
the capture card — every single time. The maintainer hits this with their
Elgato. The app already knows which capture card the user picked, so it should
create the companion audio source itself, exactly the way the user does it
manually, and point it at the same device.

## Current state

Repo: Machtobs, a React 19 + Vite + TypeScript web app that configures a
local OBS Studio via `obs-websocket-js` (`ws://localhost:4455`). pnpm + Vitest.
Conventions: TypeScript, two-space indent, single quotes, semicolons, named
exports, colocated `*.test.ts(x)`, Spanish UI strings and code comments (no
accents in comments), English identifiers. Validation of everything crossing to
OBS lives in `src/shared/validation.ts`; OBS calls live only in
`src/renderer/lib/obs-manager.ts`; `src/renderer/lib/app-api.ts` is the facade
that validates then delegates; `src/renderer/hooks/useAppAPI.ts` wraps the
facade and surfaces failures through the Zustand store's `setError`.

Relevant files and facts:

- `src/renderer/lib/obs-manager.ts` — the only place that talks to OBS.
  - `obs-manager.ts:72-78` — audio input kinds and the managed-name convention:

    ```ts
    const audioInputKindCandidates = [
      'coreaudio_input_capture',
      'wasapi_input_capture',
      'pulse_input_capture',
      'alsa_input_capture',
    ] as const;
    const managedVoiceInputName = 'Voz · Machtobs';
    ```

  - `obs-manager.ts:1491-1496` (inside `getCaptureCapabilities`) — the existing
    device-name matching this plan reuses, including the capture-card regex:

    ```ts
    const filter = (deviceNameFilter ?? '').toLowerCase().trim();
    const chosen = (filter
      ? devices.find((device) => device.name.toLowerCase().includes(filter) || filter.includes(device.name.toLowerCase()))
      : undefined)
      ?? devices.find((device) => /capture|hdmi|elgato|avermedia|ugreen|macro|cam link|live gamer|ripsaw/i.test(device.name))
      ?? devices[0];
    ```

  - `obs-manager.ts:1135-1174` — `private async getAudioDevices(inputName,
    selectedDeviceId?)` enumerates an audio input's devices by probing the
    `device_id` then `device` properties with
    `GetInputPropertiesListPropertyItems`; returns `{ devices:
    OBSAudioDevice[]; propertyName?: string }` (`OBSAudioDevice` has `id` and
    `name`). Reuse it as-is.
  - `obs-manager.ts:1375-1385` — `private async getExistingInputNames()` returns
    all input names via `GetInputList` (`[]` on error).
  - `obs-manager.ts:1264` — `private notConnected(): { success: false; message:
    string }`; sibling methods spread it: `return { ...this.notConnected(),
    warnings: [] };`
  - `beginGuidedSource` (1578), `applyGuidedSourceDevice` (1639),
    `createCameraScene` (1737) and `setCameraFrame` (1846) are the style
    exemplars: `warnings: string[]` collected, Spanish `message`, errors via
    `OBSManager.describeError(error)`, unique names via
    `buildUniqueInputName(base, existingNames)` from `./scene-helpers`.
- `src/renderer/components/AddSourceWizard.tsx` — the only UI that creates a
  `game_console` source. Flow: `handleChooseFriendly` (line 90) →
  `beginGuidedSource` → `choose-device` step ("Elige tu tarjeta de captura") →
  `handleApplyDevice` (158) → `applyGuidedSourceDevice` → `confirm` step →
  `handleFinish` (331) renames if needed and closes. State available in the
  component: `friendly`, `devices` (`DeviceOption[]` with `id`/`name`),
  `selectedDeviceId`, `inputName`, `sceneItemId`. `handleFinish` today:

  ```ts
  const handleFinish = async () => {
    setBusy(true);
    setLocalError('');
    try {
      const trimmed = nameDraft.trim();
      let finalInputName = inputName;
      if (trimmed && trimmed !== inputName) {
        const renameResult = await renameSource(inputName, trimmed);
        if (!renameResult.success) {
          setLocalError(renameResult.message);
          return;
        }
        finalInputName = trimmed;
      }
      if (frameEnabled && sceneItemId !== null) {
        // ... setCameraFrame (only reachable for camera) ...
      }
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  ```

- `src/renderer/lib/app-api.ts:140-146` — facade wrapper exemplar:

  ```ts
  applyGuidedSourceDevice: async (arg: ApplyGuidedSourceDeviceInput) => {
    const validation = validateApplyGuidedSourceDevice(arg);
    if (!validation.success) {
      return { success: false, message: validation.message, warnings: [] as string[] };
    }
    return obsManager.applyGuidedSourceDevice(validation.value);
  },
  ```

- `src/renderer/hooks/useAppAPI.ts:305-311` — hook wrapper exemplar:

  ```ts
  const applyGuidedSourceDevice = async (arg: ApplyGuidedSourceDeviceInput) => {
    const result = await appAPI.obs.applyGuidedSourceDevice(arg);
    if (!result.success) {
      setError(result.message);
    }
    return result;
  };
  ```

  The hook's return object (around lines 421-428) lists `beginGuidedSource`,
  `applyGuidedSourceDevice`, `cancelGuidedSource`, `createGuidedSource`, etc.
- `src/shared/validation.ts:820-847` — validator exemplar
  `validateApplyGuidedSourceDevice` (uses `isRecord`, `validateSceneName`,
  `validateInputName`, `isNonEmptyString`; returns
  `ValidationResult<T>` = `{ success: true, value } | { success: false,
  message }` with Spanish messages).
- `src/shared/types.ts:490-497` — where guided-source payload interfaces live:

  ```ts
  // Payload validado para aplicar el dispositivo elegido a una fuente recien creada.
  export interface ApplyGuidedSourceDeviceInput {
    inputName: string;
    sceneName: string;
    sceneItemId: number;
    propertyName: string;
    deviceId: string;
  }
  ```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Focused tests | `pnpm test -- src/renderer/lib/obs-manager.test.ts src/renderer/components/AddSourceWizard.test.tsx src/shared/validation.test.ts` | exit 0; all pass |
| Full tests | `pnpm test` | exit 0; all pass (baseline: 191 tests + the new ones) |
| Typecheck | `pnpm run typecheck` | exit 0; no errors |
| Lint | `pnpm run lint` | exit 0; no errors |

## Scope

**In scope** (the only files you should modify):

- `src/renderer/lib/obs-manager.ts`
- `src/renderer/lib/obs-manager.test.ts`
- `src/shared/types.ts`
- `src/shared/validation.ts`
- `src/shared/validation.test.ts`
- `src/renderer/lib/app-api.ts`
- `src/renderer/hooks/useAppAPI.ts`
- `src/renderer/components/AddSourceWizard.tsx`
- `src/renderer/components/AddSourceWizard.test.tsx`

**Out of scope** (do NOT touch, even though they look related):

- The voice/mic pipeline: `configureAudio`, `getUnconfiguredAudioSnapshot`,
  `ensureAudioFilters`, `configureDucking`, `MANAGED_MIC_FILTER_NAMES`. Capture
  audio gets NO mic filters, NO mono, NO ducking.
- `getCaptureCapabilities` behavior (obs-manager.ts:1462-1535). You will only
  replace its inline regex with the extracted shared constant — same pattern,
  same behavior.
- `beginGuidedSource` / `applyGuidedSourceDevice` / `createGuidedSource` /
  `createCameraScene` / `cancelGuidedSource` — the wizard calls the new method
  from `handleFinish` instead, so cancel-cleanup semantics stay unchanged.
- `ConsoleDetection.tsx`, `localConsoleProfile.ts`, the OBS plugin
  (`obs-plugin/`), and anything under `api/` — unrelated to this feature.
- README/docs updates — noted under Maintenance notes as a follow-up, not part
  of this plan.
- **Rejected alternative**: setting `use_custom_audio_device` +
  `audio_device_id` inside the Windows `dshow_input` video source. Rejected
  because it is Windows-only (the reporter is on macOS, where the video source
  has no such option) and a separate audio source is visible in OBS's Audio
  Mixer — exactly what users do manually and can mute/mix independently.

## Git workflow

- Branch: `advisor/012-add-capture-card-audio`.
- Commit per logical unit; style: short imperative Spanish message, optional
  type prefix — e.g. `add: audio de capturadora al crear fuente de consola`
  (matches `git log`, e.g. `f49ccc1 implementar guia de conexion...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract the capture-device name pattern in `obs-manager.ts`

Near the top of `src/renderer/lib/obs-manager.ts` (next to
`managedVoiceInputName`, line 78), add:

```ts
// Nombres tipicos de capturadoras vistas como dispositivo (video o audio).
const CAPTURE_DEVICE_NAME_PATTERN = /capture|hdmi|elgato|avermedia|ugreen|macro|cam link|live gamer|ripsaw/i;
const managedCaptureAudioInputName = 'Audio/Capturadora';
```

Then in `getCaptureCapabilities` (line 1495) replace the inline regex
`/capture|hdmi|elgato|avermedia|ugreen|macro|cam link|live gamer|ripsaw/i`
with `CAPTURE_DEVICE_NAME_PATTERN`. No behavior change.

**Verify**: `pnpm test -- src/renderer/lib/obs-manager.test.ts` → exit 0, all
existing tests pass.

### Step 2: Add the `EnsureCaptureAudioInput` type

In `src/shared/types.ts`, right after `ApplyGuidedSourceDeviceInput` (line
497), add:

```ts
// Payload validado para crear o actualizar la fuente de audio de la capturadora.
// deviceNameHint es el nombre del dispositivo de video elegido; se usa para
// encontrar su equivalente de audio porque los ids difieren entre ambos.
export interface EnsureCaptureAudioInput {
  sceneName: string;
  deviceNameHint?: string;
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Add `validateEnsureCaptureAudioInput`

In `src/shared/validation.ts`, right after `validateApplyGuidedSourceDevice`
(ends line 847), add a validator modeled on it:

```ts
export function validateEnsureCaptureAudioInput(value: unknown): ValidationResult<EnsureCaptureAudioInput> {
  if (!isRecord(value)) {
    return { success: false, message: 'La solicitud para agregar el audio de la capturadora debe ser un objeto.' };
  }
  const sceneName = validateSceneName(value.sceneName);
  if (!sceneName.success) return sceneName;
  return {
    success: true,
    value: {
      sceneName: sceneName.value,
      deviceNameHint: isNonEmptyString(value.deviceNameHint) ? value.deviceNameHint.trim() : undefined,
    },
  };
}
```

Add `EnsureCaptureAudioInput` to the type import from `./types` at the top of
the file (line 1).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Implement `OBSManager.ensureCaptureAudio`

In `src/renderer/lib/obs-manager.ts`, add a new public method right after
`applyGuidedSourceDevice` (ends line 1655). Behavior, in order:

1. Not connected → `return { ...this.notConnected(), warnings: [] };`
2. Wrap everything in try/catch like its siblings; catch returns
   `{ success: false, message: \`No se pudo agregar el audio de la capturadora:
   ${OBSManager.describeError(error)}\`, warnings }`.
3. `GetInputKindList` → pick the first of `audioInputKindCandidates` present.
   None → `success: false`, message `'OBS no expone una fuente Audio Input
   Capture compatible en este sistema.'` (exact string already used at line
   534).
4. Idempotency: `getExistingInputNames()` — if it already contains
   `managedCaptureAudioInputName`, reuse that name and do NOT create anything.
   Otherwise `CreateInput` into `input.sceneName` with
   `buildUniqueInputName(managedCaptureAudioInputName, existingNames)` and the
   resolved kind; remember you created it.
5. When reusing an existing input, make sure it is also a scene item in
   `input.sceneName`: `GetSceneItemList` → if no item has
   `getStringValue(item, ['sourceName', 'name']) === inputName`, call
   `CreateSceneItem` with `{ sceneName: input.sceneName, sourceName:
   inputName }`. If that call throws, push a warning and continue (do not
   fail).
6. Enumerate with the existing helper: `const enumeration = await
   this.getAudioDevices(inputName);` → `{ devices, propertyName }`.
7. Choose the device (mirrors `getCaptureCapabilities`):

   ```ts
   const hint = (input.deviceNameHint ?? '').toLowerCase().trim();
   const chosen = (hint
     ? enumeration.devices.find((device) => device.name.toLowerCase().includes(hint) || hint.includes(device.name.toLowerCase()))
     : undefined)
     ?? enumeration.devices.find((device) => CAPTURE_DEVICE_NAME_PATTERN.test(device.name));
   ```

   (Unlike `getCaptureCapabilities`, do NOT fall back to `devices[0]`: pointing
   the source at an arbitrary device — usually the built-in mic — would record
   the wrong audio. No confident match means fail honestly.)
8. If `chosen && enumeration.propertyName` → `SetInputSettings` with
   `{ inputName, inputSettings: { [enumeration.propertyName]: chosen.id },
   overlay: true }` and return `success: true` with `inputName` and message:
   created ? `Audio de la capturadora "${chosen.name}" agregado como
   "${inputName}"` : `Audio de la capturadora actualizado a "${chosen.name}"`.
9. Otherwise (no match, empty enumeration, or no propertyName): if you created
   the input in step 4, remove it (`RemoveInput`, best-effort catch) so OBS is
   not left with a source bound to the default device; return
   `success: false`, `warnings`, and message: `'No se encontro el dispositivo
   de audio de la capturadora en OBS. Agregalo manualmente: en Fuentes pulsa
   "+" → "Captura de entrada de audio" y elige tu capturadora.'`

Method signature:

```ts
async ensureCaptureAudio(input: EnsureCaptureAudioInput): Promise<{ success: boolean; message: string; inputName?: string; warnings: string[] }>
```

Add `EnsureCaptureAudioInput` to the existing type import from
`'../../shared/types'` (lines 2-22).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Wire the facade and the hook

In `src/renderer/lib/app-api.ts`:

- Import `validateEnsureCaptureAudioInput` (add to the validation import list,
  lines 17-32) and `EnsureCaptureAudioInput` (type import, lines 33-46).
- Inside `appAPI.obs`, right after `applyGuidedSourceDevice` (line 146), add:

  ```ts
  ensureCaptureAudio: async (arg: EnsureCaptureAudioInput) => {
    const validation = validateEnsureCaptureAudioInput(arg);
    if (!validation.success) {
      return { success: false, message: validation.message, warnings: [] as string[] };
    }
    return obsManager.ensureCaptureAudio(validation.value);
  },
  ```

In `src/renderer/hooks/useAppAPI.ts`:

- Import the `EnsureCaptureAudioInput` type.
- After the `applyGuidedSourceDevice` wrapper (line 311), add:

  ```ts
  const ensureCaptureAudio = async (arg: EnsureCaptureAudioInput) => {
    const result = await appAPI.obs.ensureCaptureAudio(arg);
    if (!result.success) {
      setError(result.message);
    }
    return result;
  };
  ```

- Add `ensureCaptureAudio,` to the hook's return object, next to
  `applyGuidedSourceDevice` (around line 422).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 6: Call it from the wizard when finishing a console source

In `src/renderer/components/AddSourceWizard.tsx`:

1. Add `ensureCaptureAudio` to the `useAppAPI()` destructure (lines 46-56).
2. In `handleFinish`, immediately after the rename block (after
   `finalInputName` is settled, before the `frameEnabled` block), add:

   ```ts
   if (friendly === 'game_console') {
     // La fuente de video ya quedo lista; el audio es un complemento
     // best-effort. Si falla, el hook muestra el aviso global y cerramos
     // igual: bloquear aqui obligaria a cancelar y eso borraria el video.
     const deviceNameHint = devices.find((device) => device.id === selectedDeviceId)?.name;
     await ensureCaptureAudio({ sceneName, deviceNameHint });
   }
   ```

   Do not branch on the result — always proceed to `onCreated(); onClose();`.
   (`devices`/`selectedDeviceId` are component state; when OBS didn't enumerate
   devices, `deviceNameHint` is `undefined` and the manager falls back to the
   capture-card name pattern.)

**Verify**: `pnpm run typecheck` → exit 0; `pnpm run lint` → exit 0.

### Step 7: Tests

Write the tests listed in "Test plan" below.

**Verify**: `pnpm test` → exit 0; `pnpm run lint` → exit 0.

## Test plan

Model `obs-manager` tests on the existing mock pattern in
`src/renderer/lib/obs-manager.test.ts:5-27` (`vi.hoisted` `obsMock`,
`vi.mock('obs-websocket-js', ...)`) and the `describe('OBSManager con marcos de
camara')` block (line 451) — remember `obsMock.connect.mockResolvedValue({})`
in `beforeEach` and `await manager.connect()` before calling the method. Add a
new `describe('OBSManager audio de capturadora')` covering:

1. **Creates and binds the audio device matched by name hint.** Mocks:
   `GetInputKindList` → `{ inputKinds: ['coreaudio_input_capture'] }`;
   `GetInputList` → `{ inputs: [{ inputName: 'Consola' }] }`; `CreateInput` →
   `{ sceneItemId: 31 }`; `GetInputPropertiesListPropertyItems` →
   `{ propertyItems: [{ itemName: 'Microfono integrado', itemValue:
   'builtin-mic' }, { itemName: 'Elgato Game Capture 4K X', itemValue:
   'elgato-audio-uid' }] }`. Call `ensureCaptureAudio({ sceneName: 'Gameplay',
   deviceNameHint: 'Elgato Game Capture 4K X' })`. Expect `success === true`;
   `CreateInput` called with `{ sceneName: 'Gameplay', inputName: 'Audio
   consola · Machtobs', inputKind: 'coreaudio_input_capture' }`;
   `SetInputSettings` called with `{ inputName: 'Audio/Capturadora',
   inputSettings: { device_id: 'elgato-audio-uid' }, overlay: true }`
   (`getAudioDevices` probes `device_id` first).
2. **Falls back to the capture-card name pattern when there is no hint.**
   Devices: `'Microfono (Realtek)'` and `'HDMI Capture'`; call without
   `deviceNameHint`. Expect `SetInputSettings` with the `'HDMI Capture'` id.
3. **No matching audio device → removes the created source and fails
   honestly.** Devices: only `'Microfono integrado'`. Expect
   `RemoveInput` called with `{ inputName: 'Audio/Capturadora' }`,
   `success === false`, and `result.message` to contain `'Agregalo
   manualmente'`.
4. **Reuses the managed source without duplicating it.** `GetInputList` →
   `{ inputs: [{ inputName: 'Audio/Capturadora' }] }`;
   `GetSceneItemList` → `{ sceneItems: [] }`; devices include the hint match.
   Expect `CreateInput` NOT called with an audio kind, `CreateSceneItem`
   called with `{ sceneName: 'Gameplay', sourceName: 'Audi/Capturadoraobs' }`, and `SetInputSettings` applied.

Model the validator tests on the existing guided-source validator tests in
`src/shared/validation.test.ts` (search `validateCreateGuidedSourceConfig`,
line 649). Add `describe('validateEnsureCaptureAudioInput')`:

- accepts `{ sceneName: 'Gameplay' }` → `success: true`,
  `value.deviceNameHint === undefined`;
- trims a provided `deviceNameHint`;
- rejects a non-object and an empty `sceneName` with `success: false`.

Model the wizard tests on `src/renderer/components/AddSourceWizard.test.tsx`
(jsdom env, `apiMocks` hoisted object, `useAppStore.setState`). Add
`ensureCaptureAudio: vi.fn()` to `apiMocks` and a new
`describe('AddSourceWizard audio de capturadora')`:

- **Console flow calls it on finish with the chosen device name.** Mock
  `beginGuidedSource` → `{ success: true, message: '...', inputName:
  'Consola', sceneItemId: 9, supportsDeviceEnum: true, propertyName: 'device',
  devices: [{ id: 'cap-1', name: 'Elgato Game Capture 4K X', isDefault:
  false }], warnings: [] }`; `applyGuidedSourceDevice` → success;
  `ensureCaptureAudio` → `{ success: true, message: '...', warnings: [] }`;
  store: `availableSourceKinds: [{ friendly: 'game_console', inputKind:
  'av_capture_input_v2', supportsDeviceEnum: true, available: true }]`,
  `sceneSources: []`. Click the `Consola (PS5/Xbox/Switch)` card, then
  `Continuar`, then `Listo`. Expect `ensureCaptureAudio` called with
  `{ sceneName: 'Gameplay', deviceNameHint: 'Elgato Game Capture 4K X' }` and
  `onCreated`/`onClose` called.
- **Audio failure does not block closing.** Same setup but
  `ensureCaptureAudio` resolves `{ success: false, message: 'No se encontro
  ...', warnings: [] }`; expect `onCreated` and `onClose` still called.

Verification: `pnpm test -- src/renderer/lib/obs-manager.test.ts
src/renderer/components/AddSourceWizard.test.tsx
src/shared/validation.test.ts` → all pass, including the 7 new tests above;
then `pnpm test` → full suite passes.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm test` exits 0; the 7 new tests (4 manager + 1 wizard-call + 1
  wizard-failure + validator cases) exist and pass
- [ ] `pnpm run lint` exits 0
- [ ] `grep -rn "ensureCaptureAudio" src/` shows hits in `obs-manager.ts`,
  `app-api.ts`, `useAppAPI.ts`, `AddSourceWizard.tsx`, `validation.ts` (as
  `validateEnsureCaptureAudioInput`) and the three test files
- [ ] `grep -n "CAPTURE_DEVICE_NAME_PATTERN" src/renderer/lib/obs-manager.ts`
  shows exactly 2 uses besides the declaration (the old inline regex at
  former line 1495 is gone)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] Manual smoke (only if an OBS instance with a capture card is at hand —
  otherwise note it as unverified in the PR): add a console source in the
  wizard, pick the capture card, finish → OBS shows `Audio/Capturadora ·
  Machtobs` in the scene and its meter moves with console audio

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase drifted since commit `2ff5d01`).
- `getAudioDevices` (obs-manager.ts:1135) no longer has the signature
  `(inputName, selectedDeviceId?) => { devices, propertyName? }`, or
  `getExistingInputNames` / `notConnected` are gone.
- `AddSourceWizard.tsx` no longer has `handleFinish` or the `friendly` /
  `devices` / `selectedDeviceId` state — the integration point moved.
- A step's verification fails twice after a reasonable fix attempt.
- The change appears to require touching an out-of-scope file (e.g. the mic
  pipeline or `getCaptureCapabilities` behavior beyond the regex swap).
- You discover the assumption "OBS audio input capture sources enumerate
  capture-card audio devices through the same `device_id`/`device` property
  mechanism already used for microphones" is false on the target setup.

## Maintenance notes

- **Monitoring is intentionally untouched**: the new source keeps OBS's
  default monitoring-off behavior (console audio is usually heard via the
  capture card's passthrough on the TV/monitor). If users ask to hear it on
  the PC, that's a follow-up using `SetInputAudioMonitorType` (see how
  `configureAudio` applies `monitorType`).
- **Naming contract**: `managedCaptureAudioInputName` (`'Audi/Capturadorabs'`) is what makes re-runs idempotent — anything that renames or
  duplicates managed sources must keep this convention, mirroring
  `managedVoiceInputName`.
- **Capture-card name pattern**: `CAPTURE_DEVICE_NAME_PATTERN` is now shared
  by `getCaptureCapabilities` and `ensureCaptureAudio`; extend it in one
  place when new capture-card brands appear.
- **Scene membership on reuse**: if OBS ever changes `CreateSceneItem`
  semantics for audio sources, re-check step 4.5 of the method.
- **Deferred follow-ups (not this plan)**: a one-liner in `README.md`'s
  console-profiling bullet and a note in `docs/apuntes.md` once the feature
  is verified against real hardware; offering capture audio for console
  sources the user created manually in OBS (outside the wizard).
- **Reviewer focus**: the honest-failure path (step 4.9 — created source is
  removed, `success: false`, message tells the user the exact manual
  clicks), and that the wizard never blocks closing on audio failure.
