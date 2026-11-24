// El-Masry Store - shared ambient sound (Web Audio synth pad)
// Author: Ahmed El-Masry

let nodes = null

export function startAmbient() {
  if (nodes) return
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 240
  filter.connect(master)

  const oscA = ctx.createOscillator()
  oscA.type = 'sine'
  oscA.frequency.value = 55
  const oscB = ctx.createOscillator()
  oscB.type = 'sine'
  oscB.frequency.value = 55.6
  const oscC = ctx.createOscillator()
  oscC.type = 'triangle'
  oscC.frequency.value = 110.3
  const gainC = ctx.createGain()
  gainC.gain.value = 0.25
  oscA.connect(filter)
  oscB.connect(filter)
  oscC.connect(gainC)
  gainC.connect(filter)

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.03
  lfo.connect(lfoGain)
  lfoGain.connect(master.gain)

  oscA.start()
  oscB.start()
  oscC.start()
  lfo.start()
  master.gain.setTargetAtTime(0.07, ctx.currentTime, 1.2)
  nodes = { ctx, master, oscs: [oscA, oscB, oscC, lfo] }
}

export function stopAmbient() {
  if (!nodes) return
  const n = nodes
  nodes = null
  n.master.gain.setTargetAtTime(0, n.ctx.currentTime, 0.4)
  setTimeout(() => {
    n.oscs.forEach((o) => o.stop())
    n.ctx.close()
  }, 900)
}

export function ambientOn() {
  return Boolean(nodes)
}
