// Recent places (John's idea, SPEC §2): the last five chosen, newest first, kept only in this
// browser. Blocked storage (some private windows) just means no buttons.

const KEY = 'rainfaller.recent'
export const MAX_RECENT = 5
export type Recent = { code: string; place: string | null }

export function recentPlaces(): Recent[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((r): r is Recent => typeof r?.code === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function save(list: Recent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Not kept; the page still works.
  }
}

export function remember(r: Recent) {
  save([r, ...recentPlaces().filter((x) => x.code !== r.code)].slice(0, MAX_RECENT))
}

export function forget(code: string) {
  save(recentPlaces().filter((x) => x.code !== code))
}
