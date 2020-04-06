type Range = {
  begin: number
  end: number
  text?: string
  count?: number
  tooltip?: string[]
  classes?: string
  lsp?: string
}

const splice = (str: string, idx: number, rem: number, newString: string) =>
  str.slice(0, idx) + newString + str.slice(idx + Math.abs(rem))

/**
 * We're given the text which lives inside the token, and this function will
 * annotate it with twoslash metadata
 */
export function createHighlightedString2(ranges: Range[], text: string) {
  const actions = [] as { text: string; index: number }[]
  let hasErrors = false

  // Why the weird chars? We need to make sure that generic syntax isn't
  // interpreted as html tags - to do that we need to switch out < to &lt; - *but*
  // making that transition changes the indexes because it's gone from 1 char to 4 chars

  // So, use an obscure character to indicate a real < for HTML, then switch it after

  ranges.forEach((r) => {
    if (r.classes === 'lsp') {
      actions.push({ text: '⇶/data-lsp>', index: r.end })
      actions.push({ text: `⇶data-lsp lsp='${stripHTML(r.lsp || '')}'>`, index: r.begin })
    } else if (r.classes === 'err') {
      hasErrors = true
    } else if (r.classes === 'query') {
      actions.push({ text: '⇶/data-highlight>', index: r.end })
      actions.push({ text: `⇶data-highlight'>`, index: r.begin })
    }
  })

  let html = stripHTML((' ' + text).slice(1))

  // Apply all the edits
  actions
    .sort((l, r) => r.index - l.index)
    .forEach((action) => {
      html = splice(html, action.index, 0, action.text)
    })

  if (hasErrors) html = `<data-err>${html}</data-err>`

  return replaceTripleArrow(html)
}

const replaceTripleArrow = (str: string) => str.replace(/⇶/g, '<')

export function stripHTML(text: string) {
  var table: any = {
    '<': 'lt',
    '"': 'quot',
    "'": 'apos',
    '&': 'amp',
    '\r': '#10',
    '\n': '#13',
  }
  return text.toString().replace(/[<"'\r\n&]/g, function (chr) {
    return '&' + table[chr] + ';'
  })
}
