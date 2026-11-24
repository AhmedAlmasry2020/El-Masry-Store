// El-Masry Store - wizard duel sign-in intro
// Original young mage (blue robe, golden beam) vs original shadow lord
// (hooded, green beam): beams clash back and forth until the middle explodes
// and the sign-in form rises from the blast. The duel always plays to the
// end; only prefers-reduced-motion skips it (accessibility).
// All characters are original hand-drawn illustrations, drawn procedurally
// on canvas - no film/comic/game art, logos or assets.
// Author: Ahmed El-Masry
import { useEffect, useRef } from 'react'

const DURATION = 4800 // ms, full sequence before the form reveal

// Simple seeded-ish particle helper
function makeParticles(n, cx, cy, speed, hue) {
  return Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2
    const v = speed * (0.35 + Math.random() * 0.65)
    return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.15, r: 1.5 + Math.random() * 3.5, hue, life: 1 }
  })
}

// Original young mage: cobalt robe with silver trim, hood on shoulders,
// chestnut hair, amber eyes, twisted wand with a golden glow. Faces right.
// Original hand-drawn character approved by Ahmed (msg 12488992).
// Drawn in a 200x340 art space (feet at y=332), scaled so the feet land at
// local y=120 like the old cartoon anchor.
const ART_SCALE = 0.6
const ART_FEET = 332
function artTransform(ctx, x, y, s) {
  ctx.translate(x, y)
  const k = s * ART_SCALE
  ctx.scale(k, k)
  ctx.translate(-100, -(ART_FEET - 120 / ART_SCALE))
}

function drawYoungMage(ctx, x, y, s, wandTip) {
  ctx.save()
  artTransform(ctx, x, y, s)
  ctx.lineCap = 'round'

  const skin = ctx.createLinearGradient(73, 35, 127, 97)
  skin.addColorStop(0, '#f7d5ab')
  skin.addColorStop(0.6, '#eec394')
  skin.addColorStop(1, '#d99f68')
  const robe = ctx.createLinearGradient(42, 0, 158, 0)
  robe.addColorStop(0, '#33509c')
  robe.addColorStop(0.5, '#1e3168')
  robe.addColorStop(1, '#111b40')
  const hair = ctx.createLinearGradient(0, 16, 0, 62)
  hair.addColorStop(0, '#5a3a1e')
  hair.addColorStop(1, '#2c1a0a')
  const hood = ctx.createLinearGradient(66, 92, 134, 128)
  hood.addColorStop(0, '#2a4488')
  hood.addColorStop(1, '#101a3c')

  // hood resting on the shoulders, behind everything
  ctx.fillStyle = hood
  ctx.fill(new Path2D('M66 128 Q56 96 100 92 Q144 96 134 128 Q126 116 100 114 Q74 116 66 128 Z'))
  ctx.strokeStyle = '#101a3c'
  ctx.lineWidth = 1.6
  ctx.globalAlpha = 0.7
  ctx.stroke(new Path2D('M66 128 Q56 96 100 92 Q144 96 134 128'))
  ctx.globalAlpha = 1

  // back arm (left, at his side)
  ctx.strokeStyle = '#16224a'
  ctx.lineWidth = 20
  ctx.stroke(new Path2D('M61 150 Q52 195 55 245'))
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(56, 250, 9, 0, Math.PI * 2)
  ctx.fill()

  // robe body
  ctx.fillStyle = robe
  ctx.fill(new Path2D('M62 138 Q70 124 84 119 L116 119 Q130 124 138 138 Q146 180 150 250 Q152 300 158 332 L42 332 Q48 300 50 250 Q54 180 62 138 Z'))
  // folds
  ctx.strokeStyle = '#0d1430'
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.7
  ctx.stroke(new Path2D('M78 160 Q74 240 70 320'))
  ctx.stroke(new Path2D('M100 170 Q100 250 100 328'))
  ctx.stroke(new Path2D('M122 160 Q126 240 130 320'))
  ctx.globalAlpha = 1
  // silver trim: edge light + hem band
  ctx.strokeStyle = '#9fb6e8'
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.8
  ctx.stroke(new Path2D('M50 250 Q54 180 62 138 Q70 124 84 119'))
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(46, 314); ctx.lineTo(154, 314)
  ctx.stroke()
  ctx.globalAlpha = 1
  // collar + silver star clasp
  ctx.fillStyle = '#16224a'
  ctx.fill(new Path2D('M78 118 Q100 130 122 118 L122 132 Q100 144 78 132 Z'))
  ctx.strokeStyle = '#9fb6e8'
  ctx.lineWidth = 2
  ctx.stroke(new Path2D('M80 123 Q100 134 120 123'))
  ctx.stroke(new Path2D('M79 129 Q100 140 121 129'))
  ctx.fillStyle = '#dfe9fb'
  ctx.fill(new Path2D('M100 126 l3 6 6 1 -4.5 4.5 1 6.5 -5.5 -3 -5.5 3 1 -6.5 -4.5 -4.5 6 -1 Z'))

  // extended right arm + twisted wand with amber glow
  ctx.strokeStyle = '#1e3168'
  ctx.lineWidth = 19
  ctx.stroke(new Path2D('M126 138 Q150 128 172 118'))
  ctx.strokeStyle = '#9fb6e8'
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.8
  ctx.stroke(new Path2D('M126 136 Q150 126 172 116'))
  ctx.globalAlpha = 1
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(176, 115, 9.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#c98e58'
  ctx.lineWidth = 2
  ctx.stroke(new Path2D('M170 110 Q176 104 183 109'))
  ctx.stroke(new Path2D('M171 118 Q177 122 183 118'))
  ctx.strokeStyle = '#8a6a42'
  ctx.lineWidth = 4.5
  ctx.stroke(new Path2D('M172 122 Q182 110 190 104 T198 94'))
  ctx.strokeStyle = '#c19a68'
  ctx.lineWidth = 1.6
  ctx.stroke(new Path2D('M172 122 Q182 110 190 104 T198 94'))
  ctx.fillStyle = '#ffcf5e'
  ctx.beginPath()
  ctx.arc(198, 93, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(198, 93, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // neck
  ctx.fillStyle = skin
  ctx.fillRect(90, 96, 20, 18)
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#d99f68'
  ctx.fill(new Path2D('M90 96 h20 v6 q-10 5 -20 0 Z'))
  ctx.globalAlpha = 1

  // head + ear
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(100, 66, 27, 31, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(73, 70, 4.5, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#d99f68'
  ctx.fill(new Path2D('M118 78 Q114 92 100 96 Q112 90 115 76 Z'))
  ctx.globalAlpha = 1

  // chestnut hair, side-swept fringe
  ctx.fillStyle = hair
  ctx.fill(new Path2D('M71 62 Q66 30 100 26 Q134 30 129 62 Q128 46 116 44 Q120 54 112 54 Q112 44 102 44 Q106 54 96 54 Q92 46 84 48 Q88 56 80 58 Q74 54 73 62 Z'))
  ctx.strokeStyle = '#1c1006'
  ctx.lineWidth = 1.4
  ctx.globalAlpha = 0.6
  ctx.stroke(new Path2D('M71 62 Q66 30 100 26 Q134 30 129 62'))
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#3a2410'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(90, 28); ctx.lineTo(86, 19)
  ctx.moveTo(110, 29); ctx.lineTo(114, 20)
  ctx.stroke()

  // eyebrows + amber eyes
  ctx.strokeStyle = '#3a2410'
  ctx.lineWidth = 2.6
  ctx.stroke(new Path2D('M78 57 Q85 54 92 57'))
  ctx.stroke(new Path2D('M108 57 Q115 54 122 57'))
  for (const [ex, ix] of [[85, 86], [115, 114]]) {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(ex, 65, 5.5, 4.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#a06618'
    ctx.beginPath()
    ctx.arc(ix, 65, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#241303'
    ctx.beginPath()
    ctx.arc(ix + 0.6 * (ix < 100 ? 1 : -1), 65, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(ex - 0.2 + (ix < 100 ? 0 : 1), 63.6, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
  // freckles + nose + confident smile
  ctx.fillStyle = '#c98e58'
  for (const [fx, fy] of [[80, 74], [88, 75], [112, 74], [120, 75]]) {
    ctx.beginPath()
    ctx.arc(fx, fy, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = '#cf9460'
  ctx.lineWidth = 1.8
  ctx.stroke(new Path2D('M100 68 L98 76 Q100 78 103 76'))
  ctx.strokeStyle = '#a96b42'
  ctx.lineWidth = 2.2
  ctx.stroke(new Path2D('M92 84 Q100 88 108 84'))

  ctx.restore()
  // wand tip in scene coordinates (art-space 198,93 through the same transform)
  wandTip.x = x + (198 - 100) * ART_SCALE * s
  wandTip.y = y + (93 - (ART_FEET - 120 / ART_SCALE)) * ART_SCALE * s
}

// Original shadow lord: hooded black robe with purple lining, face fully in
// shadow with glowing violet eyes, black wand with a green crystal.
// Faces left. Original hand-drawn character approved by Ahmed (msg 12488992).
function drawShadowLord(ctx, x, y, s, wandTip) {
  ctx.save()
  artTransform(ctx, x, y, s)
  ctx.lineCap = 'round'

  const robe = ctx.createLinearGradient(24, 0, 178, 0)
  robe.addColorStop(0, '#1c1428')
  robe.addColorStop(0.5, '#0c0813')
  robe.addColorStop(1, '#040308')
  const hood = ctx.createLinearGradient(72, 22, 128, 118)
  hood.addColorStop(0, '#241a36')
  hood.addColorStop(1, '#0a0714')
  const skin = ctx.createLinearGradient(10, 100, 30, 126)
  skin.addColorStop(0, '#cfc9dd')
  skin.addColorStop(1, '#8f88a3')

  // back arm (right, low) + long fingers
  ctx.strokeStyle = '#08060f'
  ctx.lineWidth = 19
  ctx.stroke(new Path2D('M142 150 Q152 200 148 250'))
  ctx.strokeStyle = skin
  ctx.lineWidth = 3.4
  ctx.beginPath()
  ctx.moveTo(148, 252); ctx.lineTo(146, 264)
  ctx.moveTo(152, 253); ctx.lineTo(152, 266)
  ctx.moveTo(156, 252); ctx.lineTo(158, 264)
  ctx.stroke()

  // flowing robe + purple inner lining + folds
  ctx.fillStyle = robe
  ctx.fill(new Path2D('M64 140 Q74 124 88 119 L114 119 Q128 124 136 140 Q150 190 164 262 Q170 306 178 334 L24 334 Q34 300 40 258 Q52 190 64 140 Z'))
  ctx.fillStyle = '#3d2a5e'
  ctx.globalAlpha = 0.9
  ctx.fill(new Path2D('M88 122 Q100 132 114 122 L112 150 Q100 158 90 150 Z'))
  ctx.globalAlpha = 0.8
  ctx.strokeStyle = '#2c2244'
  ctx.lineWidth = 2.6
  ctx.stroke(new Path2D('M70 170 Q60 250 48 326'))
  ctx.stroke(new Path2D('M124 172 Q136 250 152 326'))
  ctx.strokeStyle = '#221a38'
  ctx.stroke(new Path2D('M96 180 Q94 260 92 330'))
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = '#5a3f8f'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(46, 314); ctx.lineTo(172, 314)
  ctx.stroke()
  ctx.globalAlpha = 1

  // extended left arm + black wand with green crystal
  ctx.strokeStyle = '#100b1c'
  ctx.lineWidth = 18
  ctx.stroke(new Path2D('M72 140 Q48 128 26 116'))
  ctx.strokeStyle = '#3a2c5c'
  ctx.lineWidth = 2.2
  ctx.globalAlpha = 0.9
  ctx.stroke(new Path2D('M72 138 Q48 126 26 114'))
  ctx.globalAlpha = 1
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(22, 113, 8.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8f88a3'
  ctx.lineWidth = 1.8
  ctx.stroke(new Path2D('M25 107 Q19 103 14 107'))
  ctx.stroke(new Path2D('M26 117 Q19 121 14 117'))
  ctx.strokeStyle = '#0d0d12'
  ctx.lineWidth = 4.5
  ctx.stroke(new Path2D('M18 121 Q10 106 8 96'))
  ctx.strokeStyle = '#33333f'
  ctx.lineWidth = 1.5
  ctx.stroke(new Path2D('M18 121 Q10 106 8 96'))
  ctx.fillStyle = '#39d353'
  ctx.fill(new Path2D('M8 96 l-4 -6 5 -3 4 4 Z'))
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(7, 90, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // hood over the whole head
  ctx.fillStyle = hood
  ctx.fill(new Path2D('M72 96 Q58 30 100 22 Q142 30 128 96 Q138 108 132 118 Q118 108 100 106 Q82 108 68 118 Q62 108 72 96 Z'))
  ctx.strokeStyle = '#3a2c5c'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.8
  ctx.stroke(new Path2D('M72 96 Q58 30 100 22 Q142 30 128 96'))
  ctx.globalAlpha = 1
  // shadowed face void
  ctx.fillStyle = '#070510'
  ctx.fill(new Path2D('M82 92 Q78 48 100 44 Q122 48 118 92 Q110 100 100 100 Q90 100 82 92 Z'))
  // glowing violet eyes
  for (const [ex, rot] of [[91, -10 * Math.PI / 180], [109, 10 * Math.PI / 180]]) {
    ctx.fillStyle = 'rgba(176,77,240,0.3)'
    ctx.beginPath()
    ctx.ellipse(ex, 70, 7.5, 4.5, rot, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b04df0'
    ctx.beginPath()
    ctx.ellipse(ex, 70, 4.6, 2.6, rot, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
  // wand tip in scene coordinates (art-space 7,90 through the same transform)
  wandTip.x = x + (7 - 100) * ART_SCALE * s
  wandTip.y = y + (90 - (ART_FEET - 120 / ART_SCALE)) * ART_SCALE * s
}

export default function WizardDuel({ onDone }) {
  const canvasRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let start = performance.now()
    let sparks = []
    let blast = null
    const leftTip = { x: 0, y: 0 }
    const rightTip = { x: 0, y: 0 }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function finish() {
      if (doneRef.current) return
      doneRef.current = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      onDone()
    }

    // ease helpers
    const clamp01 = (t) => Math.max(0, Math.min(1, t))
    const smooth = (t) => t * t * (3 - 2 * t)

    function frame(now) {
      if (doneRef.current) return
      const t = now - start
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      const cx = W / 2
      const floorY = H * 0.78
      const s = Math.min(W, H) / 520

      // --- background: night gradient + stars
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#05060f')
      bg.addColorStop(0.7, '#0d1030')
      bg.addColorStop(1, '#191036')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 46; i++) {
        const sx = ((i * 733) % 997) / 997 * W
        const sy = ((i * 389) % 521) / 521 * H * 0.55
        const tw = 0.5 + 0.5 * Math.sin(now / 480 + i)
        ctx.globalAlpha = 0.25 + 0.45 * tw
        ctx.fillRect(sx, sy, 1.6, 1.6)
      }
      ctx.globalAlpha = 1
      // ground
      ctx.fillStyle = '#0a0817'
      ctx.fillRect(0, floorY + 22 * s, W, H)

      // camera shake during the final power struggle / explosion
      let shakeX = 0, shakeY = 0
      if (t > 3200 && t < 4100) {
        const m = 4 * clamp01((t - 3200) / 900)
        shakeX = (Math.random() - 0.5) * m
        shakeY = (Math.random() - 0.5) * m
      }
      ctx.save()
      ctx.translate(shakeX, shakeY)

      // --- phase 1 (0-700ms): silhouettes rise
      const rise = smooth(clamp01(t / 700))
      const wizY = floorY + (1 - rise) * 160 * s
      const leftX = W * 0.16
      const rightX = W * 0.84
      drawYoungMage(ctx, leftX, wizY - 120 * s, s, leftTip)
      drawShadowLord(ctx, rightX, wizY - 120 * s, s, rightTip)

      // --- phase 2 (700-1200ms): wand tips charge
      if (t > 700) {
        const charge = smooth(clamp01((t - 700) / 500))
        for (const [tip, color] of [[leftTip, '#ffcf5e'], [rightTip, '#39d353']]) {
          ctx.save()
          ctx.globalAlpha = charge
          ctx.shadowColor = color
          ctx.shadowBlur = 26 * charge
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, (4 + 5 * charge) * s, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      // --- phase 3 (1200-4100ms): beams clash, point swings
      if (t > 1200) {
        // clash position: left dominates, right answers, then dead center
        // x01 = 0 at left wand, 1 at right wand
        let x01
        if (t < 2100) x01 = 0.62 - 0.2 * smooth(clamp01((t - 1200) / 900)) // -> 0.42 (left pushes)
        else if (t < 3000) x01 = 0.42 + 0.26 * smooth(clamp01((t - 2100) / 900)) // -> 0.68 (right pushes)
        else x01 = 0.68 - 0.18 * smooth(clamp01((t - 3000) / 700)) // -> 0.50 (center)
        x01 += Math.sin(now / 55) * 0.008 // crackle jitter
        const clashX = leftTip.x + (rightTip.x - leftTip.x) * x01
        const clashY = (leftTip.y + rightTip.y) / 2 + Math.sin(now / 70) * 3

        const beam = (tip, color) => {
          ctx.save()
          ctx.strokeStyle = color
          ctx.shadowColor = color
          ctx.shadowBlur = 18
          for (const [w, a] of [[7, 0.35], [3.5, 0.8], [1.6, 1]]) {
            ctx.globalAlpha = a
            ctx.lineWidth = w * s
            ctx.beginPath()
            ctx.moveTo(tip.x, tip.y)
            // jagged energy path
            const steps = 7
            for (let i = 1; i <= steps; i++) {
              const f = i / steps
              const jx = (Math.random() - 0.5) * 7 * (1 - Math.abs(f - 0.5))
              const jy = (Math.random() - 0.5) * 7 * (1 - Math.abs(f - 0.5))
              ctx.lineTo(tip.x + (clashX - tip.x) * f + jx, tip.y + (clashY - tip.y) * f + jy)
            }
            ctx.stroke()
          }
          ctx.restore()
        }
        beam(leftTip, '#ffcf5e') // golden beam
        beam(rightTip, '#39d353') // killing-curse green beam

        // clash orb
        const orbR = (10 + 9 * Math.sin(now / 90) + (t > 3200 ? (t - 3200) / 60 : 0)) * s
        ctx.save()
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 40
        const orb = ctx.createRadialGradient(clashX, clashY, 0, clashX, clashY, orbR)
        orb.addColorStop(0, '#ffffff')
        orb.addColorStop(0.45, '#ffd0a8')
        orb.addColorStop(0.75, '#39d353')
        orb.addColorStop(1, 'rgba(40,220,90,0)')
        ctx.fillStyle = orb
        ctx.beginPath()
        ctx.arc(clashX, clashY, orbR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // spark spray from the clash
        if (Math.random() < 0.6) sparks.push(...makeParticles(3, clashX, clashY, 3.4, Math.random() < 0.5 ? 15 : 130))
        // charge the blast
        if (t > 3950 && !blast) blast = { x: clashX, y: clashY, r: 0 }
      }

      // --- phase 4 (3950-4800ms): explosion
      if (blast) {
        blast.r += (Math.max(W, H) - blast.r) * 0.16 + 6
        const life = clamp01((t - 3950) / 850)
        ctx.save()
        ctx.globalAlpha = 1 - life * 0.9
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = (1 - life) * 14 + 2
        ctx.shadowColor = '#ffd76a'
        ctx.shadowBlur = 50
        ctx.beginPath()
        ctx.arc(blast.x, blast.y, blast.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        // white flash
        ctx.fillStyle = `rgba(255, 246, 220, ${life < 0.35 ? 0.9 - life : 0.5 * (1 - life)})`
        ctx.fillRect(-10, -10, W + 20, H + 20)
        if (Math.random() < 0.9) sparks.push(...makeParticles(6, blast.x, blast.y, 7, 40))
      }

      // --- sparks physics (drawn unshaken so trails feel right)
      ctx.restore()
      sparks = sparks.filter((p) => p.life > 0.03)
      for (const p of sparks) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06
        p.life *= 0.94
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = `hsl(${p.hue} 95% 65%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (t >= DURATION) return finish()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="duel-overlay">
      <canvas ref={canvasRef} className="duel-canvas" aria-hidden="true" />
      <p className="duel-caption">The young mage vs the shadow lord. Winner gets your email.</p>
    </div>
  )
}
