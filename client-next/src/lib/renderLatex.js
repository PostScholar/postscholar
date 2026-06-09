import katex from 'katex'

export function renderLatex(text) {
  if (!text || typeof text !== 'string') return text

  let result = text

  result = result.replace(/\$\$(.+?)\$\$/gs, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: false
      })
    } catch (err) {
      console.error('KaTeX error:', err)
      return match
    }
  })

  result = result.replace(/\$(.+?)\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: false
      })
    } catch (err) {
      console.error('KaTeX error:', err)
      return match
    }
  })

  return result
}

export function hasLatex(text) {
  return typeof text === 'string' && text.includes('$')
}
