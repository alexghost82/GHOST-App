import fs from 'node:fs/promises'

const files = [
  'src/App.tsx',
  'src/components/channels-hub.tsx',
  'src/components/message-row.tsx',
  'server/channels/create-channels-router.ts',
]

function scoreText(text) {
  const hebrew = (text.match(/[\u0590-\u05ff]/g) ?? []).length
  const mojibake = (text.match(/[ÃÂâ×]/g) ?? []).length
  const replacement = (text.match(/�/g) ?? []).length
  return hebrew * 5 - mojibake * 4 - replacement * 6
}

function decodeLatin1ToUtf8(text) {
  return Buffer.from(text, 'latin1').toString('utf8')
}

function repairSegment(segment) {
  const candidates = [segment]
  let current = segment

  for (let i = 0; i < 3; i += 1) {
    const next = decodeLatin1ToUtf8(current)
    if (next === current) {
      break
    }
    candidates.push(next)
    current = next
  }

  return candidates.reduce((best, candidate) => {
    return scoreText(candidate) > scoreText(best) ? candidate : best
  }, segment)
}

function repairFile(text) {
  const patterns = [
    /'([^'\\\r\n]*[ÃÂâ×][^'\\\r\n]*)'/g,
    /"([^"\\\r\n]*[ÃÂâ×][^"\\\r\n]*)"/g,
    /`([^`\r\n]*[ÃÂâ×][^`\r\n]*)`/g,
    />([^<>{}\r\n]*[ÃÂâ×][^<>{}\r\n]*)</g,
  ]

  let repaired = text

  for (const pattern of patterns) {
    repaired = repaired.replace(pattern, (full, inner) => full.replace(inner, repairSegment(inner)))
  }

  repaired = repaired.replace(/Â·/g, '·')

  return repaired
}

for (const file of files) {
  const original = await fs.readFile(file, 'utf8')
  const repaired = repairFile(original)
  if (repaired !== original) {
    await fs.writeFile(file, repaired, 'utf8')
    console.log(`repaired ${file}`)
  } else {
    console.log(`unchanged ${file}`)
  }
}
