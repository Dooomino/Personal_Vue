# Project Cleanup + HTML-TO-CANVAS Exploration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Clean up dead code/deps from Personal_Vue, then add a "download resume as image" feature via `modern-screenshot`.

**Architecture:** Phase 1 removes unused files/deps. Phase 2 adds `modern-screenshot` to let users download the Experience page as a PNG.

**Tech Stack:** Vue 3, TypeScript, modern-screenshot (zero deps)

---

## Phase 1: Cleanup

### Task 1: Delete unused files

**Objective:** Remove dead code from the repo.

**Files to delete:**
- `src/components/icons/IconCommunity.vue`
- `src/components/icons/IconDocumentation.vue`
- `src/components/icons/IconEcosystem.vue`
- `src/components/icons/IconSupport.vue`
- `src/components/icons/IconTooling.vue`
- `src/components/__tests__/HelloWorld.spec.ts`
- `src/components/background/BackCanvas_test.vue`
- `src/components/background/shaders/moebius copy.ts`

**Step 1: Delete**

```bash
rm src/components/icons/IconCommunity.vue \
   src/components/icons/IconDocumentation.vue \
   src/components/icons/IconEcosystem.vue \
   src/components/icons/IconSupport.vue \
   src/components/icons/IconTooling.vue \
   src/components/__tests__/HelloWorld.spec.ts \
   src/components/background/BackCanvas_test.vue \
   "src/components/background/shaders/moebius copy.ts"
rmdir src/components/icons src/components/__tests__ 2>/dev/null
```

**Step 2: Verify nothing imports them**

```bash
grep -r "IconCommunity\|IconDocumentation\|IconEcosystem\|IconSupport\|IconTooling\|HelloWorld\|BackCanvas_test\|moebius copy" src/ --include="*.vue" --include="*.ts"
```

Expected: no output.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: delete unused icon components, test files, shader copy"
```

---

### Task 2: Remove unused dependencies

**Objective:** Trim package.json.

**Files:**
- Modify: `package.json` (via pnpm)

**Step 1: Remove**

```bash
pnpm remove @chenglou/pretext @primeuix/themes autoprefixer postcss
```

- `@chenglou/pretext` — not imported anywhere
- `@primeuix/themes` — not imported anywhere
- `autoprefixer`, `postcss` — Tailwind remnants

**Step 2: Verify build**

```bash
pnpm run build 2>&1 | grep -E "^src/(views|data|components/(ui|NavBar|FooterBar)|styles/base)" | head -3
```

Expected: no errors from our code.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove unused deps (@chenglou/pretext, @primeuix/themes, autoprefixer, postcss)"
```

---

## Phase 2: HTML-TO-CANVAS Feature

### Task 3: Install modern-screenshot

**Objective:** Add zero-dep DOM-to-image library.

**Files:**
- Modify: `package.json` (via pnpm)

**Step 1: Install**

```bash
pnpm add modern-screenshot
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add modern-screenshot for resume download"
```

---

### Task 4: Add download button to Experience page

**Objective:** "下载简历" button that captures the experience section as PNG.

**Files:**
- Modify: `src/views/ExperienceView.vue`

**Step 1: Add download logic**

Add to `<script setup>`:

```typescript
import { domToPng } from 'modern-screenshot'

async function downloadResume() {
  const el = document.querySelector('.experience-printable') as HTMLElement
  if (!el) return
  const dataUrl = await domToPng(el, {
    backgroundColor: '#1e1e1e',
    scale: 2,
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = '陶雨迪_简历.png'
  a.click()
}
```

**Step 2: Add button to template**

Wrap the content in `.experience-printable` and add a download button:

```vue
<template>
  <div class="page">
    <!-- 下载按钮 -->
    <button class="download-btn" @click="downloadResume">下载简历</button>

    <div class="experience-printable">
      <div class="content">
        <!-- ... existing content unchanged ... -->
      </div>
    </div>
  </div>
</template>
```

**Step 3: Add button style**

```css
.download-btn {
  position: fixed;
  top: 72px;
  right: 24px;
  z-index: 10;
  padding: 8px 16px;
  font-size: 13px;
  color: #fff;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.download-btn:hover {
  background: rgba(96, 165, 250, 0.25);
  border-color: rgba(96, 165, 250, 0.5);
}
```

**Step 4: Verify**

```bash
pnpm run build 2>&1 | grep -E "^src/views/ExperienceView" | head -3
```

Expected: no errors.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add resume download as PNG on experience page"
```

---

## Files Summary

| Action | File |
|--------|------|
| Delete | `src/components/icons/` (5 files) |
| Delete | `src/components/__tests__/HelloWorld.spec.ts` |
| Delete | `src/components/background/BackCanvas_test.vue` |
| Delete | `src/components/background/shaders/moebius copy.ts` |
| Modify | `package.json` (remove 4 deps, add 1) |
| Modify | `src/views/ExperienceView.vue` |

## Risks

- **dom-to-png captures DOM, not WebGL**: The 3D scenes won't render in the screenshot. Only the text/card content captures correctly. This is fine for resume download.
- **Font rendering**: System fonts may differ across OS. Use web fonts if consistent output matters.
- **Large PNG at 2x scale**: Typical resume ~200-400KB. Acceptable.
