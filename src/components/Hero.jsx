import React, { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimationControls,
  animate,
  useWillChange,
} from 'framer-motion'
import Lenis from 'lenis'

gsap.registerPlugin(CustomEase, MotionPathPlugin)

/* ── Custom GSAP Eases ── */
CustomEase.create('titan',    '0.16, 1, 0.3, 1')
CustomEase.create('godSlam',  '0.22, 1.8, 0.36, 1')
CustomEase.create('warp',     '0.87, 0, 0.13, 1')
CustomEase.create('nova',     '0.34, 1.56, 0.64, 1')

/* ================================================================
   CONSTANTS & CONFIG
================================================================ */
const FRAGMENT_COUNT  = 22
const PARTICLE_COUNT  = 80
const RING_COUNT      = 8
const ORBIT_COUNT     = 7
const SHARD_COUNT     = 140

const COLORS = {
  void:       '#020617',
  accent:     '#3b82f6',
  indigo:     '#4f46e5',
  violet:     '#7c3aed',
  white:      '#ffffff',
  glow:       'rgba(96,165,250,0.7)',
  shardDeep:  'linear-gradient(165deg,#080318,#1a0a3e 50%,#2d1b69)',
  shardCore:  'linear-gradient(165deg,#1a0a3e,#4a2c8a 50%,#6c3cbf)',
  shardEnergy:'linear-gradient(165deg,#4a2c8a,#8b5cf6 50%,#c4b5fd)',
}

const SHARD_CLIPS = {
  needle:  'polygon(44% 0%,56% 0%,53% 100%,47% 100%)',
  dagger:  'polygon(50% 0%,100% 80%,50% 100%,0% 80%)',
  sliver:  'polygon(30% 0%,100% 0%,70% 100%,0% 100%)',
  diamond: 'polygon(50% 0%,100% 42%,50% 100%,0% 42%)',
  razor:   'polygon(46% 0%,54% 0%,52% 100%,48% 100%)',
  blade:   'polygon(0% 0%,100% 8%,100% 92%,0% 100%)',
  spike:   'polygon(50% 0%,62% 38%,100% 100%,0% 100%,38% 38%)',
  hex:     'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
}

/* ================================================================
   SHARD DATA GENERATOR
================================================================ */
function genShards() {
  const shapes = Object.keys(SHARD_CLIPS)
  return Array.from({ length: SHARD_COUNT }, (_, i) => {
    const zone = Math.random()
    let sx, sy
    if (zone < 0.4) {
      const a = (i/SHARD_COUNT)*Math.PI*2 + (Math.random()-0.5)*0.9
      const r = 900 + Math.random()*1600
      sx = Math.cos(a)*r; sy = Math.sin(a)*r
    } else if (zone < 0.65) {
      sx = (Math.random()-0.5)*2400; sy = -(1100+Math.random()*900)
    } else {
      sx = (Math.random()-0.5)*2400; sy = 1100+Math.random()*900
    }
    const w = 1.5+Math.random()*7
    const tier = i%10<4?'deep':i%10<7?'core':'energy'
    const wave = i<55?1:i<100?2:3
    return {
      id:`sh${i}`, sx, sy,
      w: tier==='energy'?w*0.5:w,
      h: w*(3+Math.random()*16),
      shape: shapes[i%shapes.length],
      tier,
      rot: Math.random()*1800-900,
      del: (wave===1?0:wave===2?0.3:0.6) + Math.random()*0.55,
      op: 0.35+Math.random()*0.65,
      dur: (wave===1?1.6:wave===2?1.25:0.95)*(0.55+Math.random()*0.55),
      ex: (Math.random()-0.5)*8, ey: (Math.random()-0.5)*8,
      er: (Math.random()-0.5)*12, es: 0.005+Math.random()*0.04,
    }
  })
}

/* ================================================================
   FM: ORBIT DOT
================================================================ */
function OrbitDot({ index, active }) {
  const angle   = useMotionValue(0)
  const radius  = 105 + index * 22
  const speed   = 2.8 - index * 0.22
  const offset  = (index / ORBIT_COUNT) * Math.PI * 2
  const wc      = useWillChange()

  const x = useTransform(angle, a => Math.cos(a+offset)*radius)
  const y = useTransform(angle, a => Math.sin(a+offset)*radius)
  const t1x = useTransform(angle, a => Math.cos(a+offset-0.2)*radius)
  const t1y = useTransform(angle, a => Math.sin(a+offset-0.2)*radius)

  useEffect(() => {
    if (!active) return
    const ctrl = animate(angle, angle.get()+Math.PI*2, {
      duration: speed, ease:'linear', repeat:Infinity, repeatType:'loop',
    })
    return () => ctrl.stop()
  }, [active])

  const colors = ['#8b5cf6','#8b5cf6','#a78bfa','#a78bfa','#c4b5fd','#c4b5fd','#e0d7ff']
  const sizes  = [8,7,7,6,5,5,4]

  return (
    <>
      <motion.div style={{
        position:'absolute', left:'50%', top:'50%', x:t1x, y:t1y,
        width:sizes[index]*0.45, height:sizes[index]*0.45,
        marginLeft:-sizes[index]*0.225, marginTop:-sizes[index]*0.225,
        borderRadius:'50%', background:colors[index],
        willChange:wc, zIndex:11, pointerEvents:'none',
      }} animate={{ opacity:active?0.25:0 }} transition={{ duration:0.3 }}/>
      <motion.div style={{
        position:'absolute', left:'50%', top:'50%', x, y,
        width:sizes[index], height:sizes[index],
        marginLeft:-sizes[index]/2, marginTop:-sizes[index]/2,
        borderRadius:'50%', background:colors[index],
        boxShadow:`0 0 ${16+index*3}px ${colors[index]}, 0 0 ${32+index*5}px ${colors[index]}50`,
        willChange:wc, zIndex:11, pointerEvents:'none',
      }}
        initial={{ opacity:0, scale:0 }}
        animate={{ opacity:active?0.9:0, scale:active?1:0 }}
        transition={{ type:'spring', stiffness:260, damping:20, delay:index*0.08 }}
      />
    </>
  )
}

/* ================================================================
   FM: ENERGY RING
================================================================ */
function EnergyRing({ index, visible, blazing }) {
  const rotate  = useMotionValue(index%2===0?0:180)
  const wc      = useWillChange()
  const size    = 195+index*55
  const borders = ['solid','dashed','dotted']
  const bColors = [
    `rgba(45,27,105,${0.34-index*0.03})`,
    `rgba(139,92,246,${0.3-index*0.025})`,
    `rgba(196,181,253,${0.26-index*0.02})`,
  ]

  useEffect(() => {
    if (!visible) return
    const speed = blazing ? 1.5+index*0.8 : 8+index*3
    const dir   = index%2===0?360:-360
    const ctrl  = animate(rotate, rotate.get()+dir, {
      duration:speed, ease:'linear', repeat:Infinity, repeatType:'loop',
    })
    return () => ctrl.stop()
  }, [visible, blazing])

  return (
    <motion.div style={{
      position:'absolute', left:'50%', top:'50%',
      width:size, height:size, marginLeft:-size/2, marginTop:-size/2,
      borderRadius:'50%',
      border:`${index<2?2:1}px ${borders[index%3]} ${bColors[index%3]}`,
      rotate, willChange:wc, zIndex:7, pointerEvents:'none',
    }}
      initial={{ opacity:0, scale:0 }}
      animate={{
        opacity: visible?(blazing?0.95:0.55-index*0.05):0,
        scale: visible?(blazing?1.3:1):0,
      }}
      transition={{ type:'spring', stiffness:240, damping:22, delay:visible?0.5+index*0.07:0 }}
    />
  )
}

/* ================================================================
   FM: PULSE WAVE
================================================================ */
function PulseWave({ index, active }) {
  const size = 145+index*40
  return (
    <motion.div style={{
      position:'absolute', left:'50%', top:'50%',
      width:size, height:size, marginLeft:-size/2, marginTop:-size/2,
      borderRadius:'50%',
      border:`1px solid rgba(139,92,246,${0.28-index*0.03})`,
      zIndex:6, pointerEvents:'none',
    }}
      initial={{ opacity:0, scale:0.1 }}
      animate={active?{
        opacity:[0.65,0.3,0], scale:[0.1,2.2,4.5],
      }:{ opacity:0, scale:0.1 }}
      transition={active?{
        duration:2.5+index*0.3, ease:[0.16,1,0.3,1],
        repeat:Infinity, repeatDelay:0.25+index*0.18, delay:index*0.42,
      }:{ duration:0.3 }}
    />
  )
}

/* ================================================================
   FM: FRAMER SHARD
================================================================ */
function FramerShard({ data, active }) {
  const tierBg = {
    deep:   COLORS.shardDeep,
    core:   COLORS.shardCore,
    energy: COLORS.shardEnergy,
  }
  return (
    <motion.div style={{
      position:'absolute', left:'50%', top:'50%',
      width:data.w, height:data.h, pointerEvents:'none',
    }}
      initial={{ opacity:0, x:data.sx, y:data.sy, rotate:data.rot, scale:0.45 }}
      animate={active?{
        opacity:[0,data.op,data.op,0],
        x:[data.sx,data.sx*0.25,data.ex],
        y:[data.sy,data.sy*0.25,data.ey],
        rotate:[data.rot,data.rot*0.25,data.er],
        scale:[0.45,0.12,data.es],
      }:{ opacity:0, x:data.sx, y:data.sy }}
      transition={active?{
        duration:data.dur, ease:[0.87,0,0.13,1], delay:data.del,
        times:[0,0.55,0.9,1],
      }:{duration:0.01}}
    >
      <div style={{
        width:'100%', height:'100%',
        background:tierBg[data.tier],
        clipPath:SHARD_CLIPS[data.shape], opacity:0.92,
      }}/>
    </motion.div>
  )
}

/* ================================================================
   FM: LENS FLARE
================================================================ */
function LensFlare({ active, size, dx, dy, delay, blur }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div style={{
          position:'absolute', left:'50%', top:'50%',
          width:size, height:size, marginLeft:-size/2, marginTop:-size/2,
          borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(200,180,255,0.6) 25%,transparent 70%)',
          filter:`blur(${blur}px)`, zIndex:50, pointerEvents:'none',
        }}
          initial={{ opacity:0, scale:0, x:0, y:0 }}
          animate={{ opacity:[0,1,0.6,0], scale:[0,2.5,3.8,6], x:[0,dx*0.4,dx], y:[0,dy*0.4,dy] }}
          exit={{ opacity:0, scale:0 }}
          transition={{ duration:1.7, delay, ease:[0.16,1,0.3,1], times:[0,0.1,0.4,1] }}
        />
      )}
    </AnimatePresence>
  )
}

/* ================================================================
   FM: SHOCKWAVE RING
================================================================ */
function ShockwaveRing({ active, maxSize, delay, thickness, maxOp }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div style={{
          position:'absolute', left:'50%', top:'50%',
          borderRadius:'50%',
          border:`${thickness}px solid rgba(139,92,246,${maxOp})`,
          zIndex:65, pointerEvents:'none',
        }}
          initial={{ width:0, height:0, x:0, y:0, opacity:maxOp }}
          animate={{ width:maxSize, height:maxSize, x:-maxSize/2, y:-maxSize/2, opacity:0 }}
          exit={{ opacity:0 }}
          transition={{ duration:1.3, delay, ease:[0.16,1,0.3,1] }}
        />
      )}
    </AnimatePresence>
  )
}

/* ================================================================
   FILM GRAIN (Canvas)
================================================================ */
function FilmGrain() {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    let id
    function draw() {
      const d = ctx.createImageData(256,256)
      for (let i=0;i<d.data.length;i+=4) {
        const v=Math.random()*28; d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;d.data[i+3]=12
      }
      ctx.putImageData(d,0,0)
      id=requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <motion.canvas ref={ref} width={256} height={256}
      style={{ position:'absolute',inset:0,width:'100%',height:'100%',
        zIndex:200,pointerEvents:'none',mixBlendMode:'overlay',imageRendering:'pixelated' }}
      initial={{ opacity:0 }}
      animate={{ opacity:0.38 }}
      transition={{ duration:1 }}
    />
  )
}

/* ================================================================
   DATA SCRAMBLE TEXT
================================================================ */
function ScrambleText({ text, visible, style }) {
  const [display, setDisplay] = useState('')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

  useEffect(() => {
    if (!visible) { setDisplay(''); return }
    let frame = 0
    const max = 24
    const interval = setInterval(() => {
      frame++
      const prog = frame/max
      const revealed = Math.floor(prog*text.length)
      let r = ''
      for (let i=0;i<text.length;i++) {
        r += i<revealed ? text[i] : chars[Math.floor(Math.random()*chars.length)]
      }
      setDisplay(r)
      if (frame>=max) { setDisplay(text); clearInterval(interval) }
    }, 28)
    return () => clearInterval(interval)
  }, [visible, text])

  return (
    <motion.span style={style}
      initial={{ opacity:0 }} animate={{ opacity:visible?1:0 }}
      transition={{ duration:0.4 }}>
      {display}
    </motion.span>
  )
}

/* ================================================================
   HERO — MAIN COMPONENT
================================================================ */
export default function Hero() {
  /* Refs */
  const mountRef    = useRef(null)
  const wavesRef    = useRef(null)
  const birdsRef    = useRef(null)
  const netRef      = useRef(null)
  const logoRef     = useRef(null)
  const flashRef    = useRef(null)
  const particleRef = useRef(null)
  const typedRef    = useRef(null)
  const typedEl     = useRef(null)
  const shakeRef    = useRef(0)
  const animeRef    = useRef([])
  const vantaRefs   = useRef({})

  /* Framer Motion values */
  const rawX        = useMotionValue(0)
  const rawY        = useMotionValue(0)
  const mouseX      = useSpring(rawX, { stiffness:45, damping:28 })
  const mouseY      = useSpring(rawY, { stiffness:45, damping:28 })
  const symX        = useTransform(mouseX, [-1,1], [-26,26])
  const symY        = useTransform(mouseY, [-1,1], [-26,26])
  const glowX       = useTransform(mouseX, [-1,1], [-15,15])
  const glowY       = useTransform(mouseY, [-1,1], [-15,15])

  /* Motion values for symbol layers */
  const symScale    = useMotionValue(0)
  const symOp       = useMotionValue(0)
  const symRot      = useMotionValue(-90)
  const symYoff     = useMotionValue(-60)
  const glowScale   = useMotionValue(0)
  const glowOp      = useMotionValue(0)
  const auraScale   = useMotionValue(0)
  const auraOp      = useMotionValue(0)
  const outerScale  = useMotionValue(0)
  const outerOp     = useMotionValue(0)
  const symFilter   = useMotionValue('drop-shadow(0 0 32px rgba(45,27,105,0.14))')

  /* Phase + state */
  const [phase, setPhase]         = useState('void')
  const [count, setCount]         = useState(0)
  const [status, setStatus]       = useState('INITIALIZING')
  const [shineKey, setShineKey]   = useState(0)
  const [showFlares, setFlares]   = useState(false)
  const [showNova, setNova]       = useState(false)
  const shards = React.useMemo(() => genShards(), [])

  /* ── Derived phase flags ── */
  const showHUD      = ['void','target'].includes(phase)
  const showTarget   = phase==='target'
  const showLayers   = !['void','target','nova'].includes(phase)
  const showShards   = ['converge','peak'].includes(phase)
  const ringsVisible = ['genesis','float','charge','eternal'].includes(phase)
  const ringsBlaze   = phase==='charge'
  const orbitsActive = ['genesis','float','rebirth','eternal'].includes(phase)
  const pulsesActive = ['genesis','float','rebirth','eternal'].includes(phase)

  /* ── Mouse tracking ── */
  useEffect(() => {
    const h = e => {
      rawX.set((e.clientX/window.innerWidth)*2-1)
      rawY.set((e.clientY/window.innerHeight)*2-1)
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  /* ── Lenis smooth scroll ── */
  useEffect(() => {
    const l = new Lenis({ duration:1.4, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)), smooth:true })
    let id; function r(t2){l.raf(t2);id=requestAnimationFrame(r)}
    id=requestAnimationFrame(r)
    return () => { cancelAnimationFrame(id); l.destroy() }
  }, [])

  /* ── GSAP Camera Shake ── */
  useEffect(() => {
    let id2
    const shake = () => {
      if (shakeRef.current > 0.001) {
        gsap.to(mountRef.current, {
          x:(Math.random()-0.5)*shakeRef.current*18,
          y:(Math.random()-0.5)*shakeRef.current*18,
          duration:0.04, ease:'none',
        })
        shakeRef.current *= 0.88
      } else {
        gsap.to(mountRef.current, { x:0, y:0, duration:0.2 })
        shakeRef.current = 0
      }
      id2 = requestAnimationFrame(shake)
    }
    id2 = requestAnimationFrame(shake)
    return () => cancelAnimationFrame(id2)
  }, [])

  /* ── Main Effect: Libraries Boot ── */
  useEffect(() => {
    const timers = []
    const vanta = {}

    /* ─── 1. VANTA WAVES (background ocean) ─── */
    if (window.VANTA) {
      vanta.waves = window.VANTA.WAVES({
        el: wavesRef.current,
        mouseControls: true,
        touchControls: true,
        THREE: window.THREE,
        color: 0x0f0f23,
        shininess: 55,
        waveHeight: 8,
        waveSpeed: 0.45,
        zoom: 0.9,
      })

      /* ─── 2. VANTA BIRDS (ambient life) ─── */
      vanta.birds = window.VANTA.BIRDS({
        el: birdsRef.current,
        mouseControls: true,
        THREE: window.THREE,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.0,
        color1: 0x1e1b4b,
        color2: 0x60a5fa,
        quantity: 4,
        wingSpan: 28,
        speedLimit: 3,
        separation: 60,
        alignment: 35,
        cohesion: 45,
      })

      /* ─── 3. VANTA NET (overlay) ─── */
      vanta.net = window.VANTA.NET({
        el: netRef.current,
        mouseControls: true,
        THREE: window.THREE,
        color: 0x4f46e5,
        backgroundColor: 0x000000,
        backgroundAlpha: 0.0,
        maxDistance: 22,
        spacing: 18,
        points: 8,
        showDots: false,
      })
      vantaRefs.current = vanta
    }

    /* ─── 4. PARTICLES.JS ─── */
    if (window.particlesJS && particleRef.current) {
      particleRef.current.id = 'particles-js-shesha'
      window.particlesJS('particles-js-shesha', {
        particles: {
          number: { value:80, density:{ enable:true, value_area:800 } },
          color: { value:['#8b5cf6','#3b82f6','#c4b5fd'] },
          shape: { type:'circle' },
          opacity: {
            value:0.35, random:true,
            anim:{ enable:true, speed:0.8, opacity_min:0.05, sync:false },
          },
          size: {
            value:2.5, random:true,
            anim:{ enable:true, speed:2, size_min:0.3, sync:false },
          },
          line_linked: {
            enable:true, distance:130, color:'#4f46e5', opacity:0.12, width:1,
          },
          move: {
            enable:true, speed:0.8, direction:'none', random:true,
            straight:false, out_mode:'out', bounce:false,
          },
        },
        interactivity: {
          detect_on:'canvas',
          events: {
            onhover:{ enable:true, mode:'repulse' },
            onclick:{ enable:true, mode:'push' },
            resize:true,
          },
          modes: {
            repulse:{ distance:80, duration:0.4 },
            push:{ particles_nb:3 },
          },
        },
        retina_detect:true,
      })
    }

    /* ─── 5. TYPED.JS (status text) ─── */
    if (window.Typed && typedEl.current) {
      typedRef.current = new window.Typed(typedEl.current, {
        strings:[
          'SIGNAL ACQUIRED^600',
          'DECRYPTING PROTOCOL^500',
          'SYSTEM CALIBRATING^500',
          'SHESHA PROTOCOL v3.0^800',
          'IDENTITY VERIFIED^500',
          'CORE ONLINE^1000',
        ],
        typeSpeed: 38,
        backSpeed: 22,
        backDelay: 400,
        startDelay: 300,
        loop: false,
        showCursor: true,
        cursorChar: '|',
        onStringTyped:(i) => {
          const msgs = ['SIGNAL ACQUIRED','DECRYPTING...','CALIBRATING','SHESHA PROTOCOL','VERIFIED','ONLINE']
          setStatus(msgs[i]||'')
        },
      })
    }

    /* ─── 6. GSAP FRAGMENTS (Multi-image 3D scatter) ─── */
    const container = mountRef.current
    const frags = []
    const hueSteps = 360 / FRAGMENT_COUNT

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const el = document.createElement('img')
      el.src = '/logo1.png'
      Object.assign(el.style, {
        position:'absolute',
        width:'300px',
        opacity:'0',
        zIndex:'50',
        pointerEvents:'none',
        left:'50%',
        top:'50%',
        transform:'translate(-50%,-50%)',
        willChange:'transform,opacity,filter',
        transformStyle:'preserve-3d',
        mixBlendMode: i%3===0?'screen':i%3===1?'overlay':'normal',
        filter:`blur(${40+i*3}px) hue-rotate(${i*hueSteps}deg) saturate(${150+i*20}%)`,
      })
      container.appendChild(el)
      frags.push(el)
    }

    /* GSAP scatter in 4D space */
    gsap.set(frags, {
      x: () => (Math.random()-0.5)*window.innerWidth*3,
      y: () => (Math.random()-0.5)*window.innerHeight*3,
      z: () => Math.random()*5000-2500,
      rotationX: () => Math.random()*1080,
      rotationY: () => Math.random()*1080,
      rotationZ: () => Math.random()*360,
      scale: () => 4+Math.random()*6,
      opacity: 0,
    })

    /* ─── 7. ANIME.JS — Fragment Orbit (pre-convergence) ─── */
    animeRef.current = window.anime ? window.anime({
      targets: frags,
      opacity: [0, 0.6],
      easing: 'easeInOutSine',
      delay: window.anime.stagger(60, { from:'random' }),
      duration: 1400,
      autoplay: false,
    }) : null

    /* ─── 8. COUNTER ─── */
    const startTime = Date.now()
    const cDur = 3200
    const ci = setInterval(() => {
      const p = Math.min((Date.now()-startTime)/cDur, 1)
      setCount(Math.round(p*100))
      if (p>=1) clearInterval(ci)
    }, 16)

    /* ─── 9. MASTER GSAP TIMELINE ─── */
    const masterTL = gsap.timeline()

    /* Phase 1: Fragments appear (Anime.js fades, GSAP drives) */
    masterTL.to(frags, {
      opacity: 0.65,
      duration: 1.5,
      stagger: { amount:0.8, from:'random' },
      ease:'power2.out',
    }, 0.3)

    /* Phase 2: 3D scatter orbit (continuous slow rotation via GSAP) */
    frags.forEach((el, i) => {
      gsap.to(el, {
        rotationZ: `+=${(Math.random()>0.5?1:-1)*180}`,
        duration: 3+Math.random()*2,
        ease:'none',
        repeat:-1,
        yoyo:true,
      })
    })

    /* Phase 3: Convergence — fragments slam inward */
    masterTL.to(frags, {
      x: () => (Math.random()-0.5)*40,
      y: () => (Math.random()-0.5)*40,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 0.05+Math.random()*0.08,
      filter:'blur(2px) hue-rotate(0deg) saturate(100%)',
      duration: 2.8,
      ease:'power4.in',
      stagger: { amount:0.7, from:'random' },
    }, 1.8)

    /* Phase 4: Symbol grows through convergence (GSAP drives FM values) */
    masterTL.add(() => {
      animate(outerScale, 1, { type:'spring', stiffness:180, damping:18 })
      animate(outerOp, 0.28, { duration:0.9 })
      animate(auraScale, 1, { type:'spring', stiffness:200, damping:20, delay:0.05 })
      animate(auraOp, 0.5, { duration:0.8, delay:0.05 })
      animate(glowScale, 1, { type:'spring', stiffness:240, damping:22, delay:0.1 })
      animate(glowOp, 0.85, { duration:0.7, delay:0.1 })
    }, 3.5)

    /* Phase 5: THE IMPACT */
    masterTL.add(() => {
      /* GSAP: White flash */
      gsap.to(flashRef.current, {
        opacity:1, duration:0.05, yoyo:true, repeat:3, ease:'none',
      })

      /* GSAP: Vanta waves explode */
      if (vanta.waves) {
        gsap.to(vanta.waves.options, {
          waveHeight:55, waveSpeed:5.5, duration:0.25,
          yoyo:true, repeat:2,
          onComplete:() => {
            gsap.to(vanta.waves.options, { waveHeight:14, waveSpeed:1.2, duration:2 })
          },
        })
      }

      /* GSAP: Birds multiply */
      if (vanta.birds) {
        gsap.to(vanta.birds.options, {
          quantity:18, wingSpan:55, speedLimit:8, duration:0.3,
          onComplete:() => {
            gsap.to(vanta.birds.options, { quantity:6, wingSpan:32, speedLimit:3, duration:3 })
          },
        })
      }

      /* GSAP: Net flares */
      if (vanta.net) {
        gsap.to(vanta.net.options, {
          maxDistance:45, points:16, duration:0.2, yoyo:true, repeat:1,
        })
      }

      /* GSAP: Fragment wipeout */
      gsap.to(frags, { opacity:0, scale:0, duration:0.12, stagger:{ amount:0.15, from:'center' } })

      /* Camera shake (custom rAF) */
      shakeRef.current = 3.5

      /* Framer: Logo slam */
      animate(symScale, 1, { type:'spring', stiffness:200, damping:12, mass:2.5, delay:0.06 })
      animate(symOp, 1, { duration:0.5, delay:0.06 })
      animate(symRot, 0, { type:'spring', stiffness:180, damping:15, mass:2, delay:0.06 })
      animate(symYoff, 0, { type:'spring', stiffness:200, damping:12, mass:2.5, delay:0.06 })

      /* Framer: Flares + Nova */
      setTimeout(() => {
        setFlares(true)
        setNova(true)
        setTimeout(() => { setFlares(false); setNova(false) }, 2000)
      }, 80)

      setShineKey(k=>k+1)
      setPhase('genesis')

    }, 4.6)

    /* Phase 6: Birds layer fades in */
    masterTL.to(birdsRef.current, { opacity:1, duration:0.5 }, 4.7)
    masterTL.to(netRef.current, { opacity:0.3, duration:0.5 }, 4.8)

    /* Phase 7: Glow settles (GSAP + Framer coordinated) */
    masterTL.add(() => {
      animate(glowScale, [1,1.6,1], { duration:3, ease:'easeInOut', repeat:Infinity })
      animate(glowOp, [0.85,1,0.85], { duration:3, ease:'easeInOut', repeat:Infinity })
      animate(auraScale, [1,1.3,1], { duration:4, ease:'easeInOut', repeat:Infinity })
      animate(outerScale, [1,1.45,1], { duration:5, ease:'easeInOut', repeat:Infinity })
      setPhase('float')
    }, 6.0)

    /* Phase 8: Eternal float via GSAP (infinite) */
    masterTL.add(() => {
      /* GSAP float for precise control */
      gsap.to(logoRef.current, {
        y: -28, duration:3.2, ease:'sine.inOut', yoyo:true, repeat:-1,
      })
      gsap.to(logoRef.current, {
        rotation: 3, duration:5.5, ease:'sine.inOut', yoyo:true, repeat:-1,
      })

      /* Anime.js: Ambient glow pulse on logo */
      if (window.anime) {
        window.anime({
          targets: logoRef.current,
          filter: [
            'drop-shadow(0 0 35px rgba(96,165,250,0.6)) drop-shadow(0 0 70px rgba(139,92,246,0.25))',
            'drop-shadow(0 0 80px rgba(96,165,250,0.9)) drop-shadow(0 0 160px rgba(139,92,246,0.5))',
          ],
          duration: 2800,
          direction: 'alternate',
          easing: 'easeInOutSine',
          loop: true,
        })
      }

      setPhase('eternal')
    }, 7.5)

    return () => {
      masterTL.kill()
      clearInterval(ci)
      timers.forEach(clearTimeout)
      frags.forEach(el => el.parentNode?.removeChild(el))
      if (vanta.waves) vanta.waves.destroy()
      if (vanta.birds) vanta.birds.destroy()
      if (vanta.net)   vanta.net.destroy()
      if (typedRef.current) typedRef.current.destroy()
      if (animeRef.current?.pause) animeRef.current.pause()
    }
  }, [])

  /* ── ANIME.JS: Rings rotate on charge ── */
  useEffect(() => {
    if (!window.anime || phase!=='charge') return
    window.anime({
      targets: '.shesha-ring',
      rotateZ: '+=360',
      duration: 800,
      easing: 'easeInOutQuad',
    })
  }, [phase])

  /* ── CS helper ── */
  const CS = { position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)' }

  /* ── SHINE component ── */
  function Shine({ trigger }) {
    const ctrl = useAnimationControls()
    useEffect(() => {
      if (trigger===0) return
      ctrl.set({ x:-350, opacity:0.95 })
      ctrl.start({ x:350, opacity:0, transition:{ duration:0.75, ease:[0.16,1,0.3,1] } })
    }, [trigger, ctrl])
    return (
      <motion.div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
        background:'linear-gradient(108deg,transparent 28%,rgba(255,255,255,0.92) 50%,transparent 72%)' }}
        initial={{ x:-350, opacity:0 }}
        animate={ctrl}
      />
    )
  }

  /* ── SCAN LINES component ── */
  function ScanLine({ delay, thickness, intensity, dir }) {
    return (
      <motion.div style={{
        position:'absolute', left:0, right:0, top:dir==='down'?0:undefined,
        bottom:dir==='up'?0:undefined, height:thickness, zIndex:60, pointerEvents:'none',
        background:`linear-gradient(90deg,transparent,rgba(139,92,246,${intensity}) 20%,rgba(255,255,255,${intensity*1.3}) 50%,rgba(139,92,246,${intensity}) 80%,transparent)`,
        boxShadow:`0 0 ${thickness*10}px rgba(139,92,246,${intensity*0.5})`,
      }}
        initial={{ opacity:0, y:dir==='down'?'-100vh':'100vh' }}
        animate={{ opacity:[0,intensity,intensity,0], y:dir==='down'?['-100vh','120vh']:['120vh','-100vh'] }}
        transition={{ duration:dir==='down'?2.2:3.0, delay, ease:[0.16,1,0.3,1], times:[0,0.05,0.85,1] }}
      />
    )
  }

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div
      ref={mountRef}
      style={{
        position:'relative', width:'100vw', height:'100vh',
        background:COLORS.void, overflow:'hidden',
        perspective:'2000px', transformStyle:'preserve-3d',
      }}
    >
      {/* ── VANTA: Ocean Waves ── */}
      <div ref={wavesRef} style={{ position:'absolute', inset:0, zIndex:1 }}/>

      {/* ── VANTA: Net Overlay ── */}
      <motion.div ref={netRef}
        style={{ position:'absolute', inset:0, zIndex:2 }}
        initial={{ opacity:0 }}
      />

      {/* ── VANTA: Birds ── */}
      <div ref={birdsRef} style={{ position:'absolute', inset:0, zIndex:3, opacity:0 }}/>

      {/* ── PARTICLES.JS ── */}
      <div
        ref={particleRef}
        style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none' }}
      />

      {/* ── FILM GRAIN ── */}
      <FilmGrain/>

      {/* ── COLOR GRADE ── */}
      <motion.div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none',
        background:'linear-gradient(135deg,rgba(8,3,24,0.6),rgba(26,10,62,0.4) 50%,rgba(8,3,24,0.6))' }}
        initial={{ opacity:0.7 }}
        animate={{ opacity:['charge','converge','peak'].includes(phase)?0.5:0 }}
        transition={{ duration:4, ease:[0.16,1,0.3,1] }}
      />

      {/* ── SCAN LINES ── */}
      <ScanLine delay={0.3} thickness={2} intensity={0.7} dir="down"/>
      <ScanLine delay={0.8} thickness={1.5} intensity={0.45} dir="down"/>
      <ScanLine delay={1.3} thickness={1} intensity={0.3} dir="up"/>

      {/* ── GRID OVERLAY (Framer CRT flicker) ── */}
      <motion.div style={{ position:'absolute', inset:0, zIndex:7, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(139,92,246,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(139,92,246,0.04) 40px)' }}
        initial={{ opacity:0 }}
        animate={{ opacity:[0,1,0,0.8,0,0.6,0] }}
        transition={{ duration:2.8, times:[0,0.1,0.18,0.24,0.3,0.4,1], ease:'linear', delay:0.3 }}
      />

      {/* ── CHROMA ABERRATION ── */}
      <AnimatePresence>
        {['genesis','charge','peak'].includes(phase) && (
          <motion.div style={{ position:'absolute', inset:0, zIndex:8, pointerEvents:'none',
            boxShadow:'inset 9px 0 0 rgba(255,0,0,0.13),inset -9px 0 0 rgba(0,0,255,0.13),inset 0 5px 0 rgba(0,255,0,0.04)' }}
            initial={{ opacity:0 }}
            animate={{ opacity:[0,1,0.4,1,0] }}
            exit={{ opacity:0 }}
            transition={{ duration:0.65, times:[0,0.05,0.15,0.25,1], ease:'linear' }}
          />
        )}
      </AnimatePresence>

      {/* ── HUD CORNERS ── */}
      {[
        { pos:{top:22,left:22}, bs:{borderTop:'2px solid',borderLeft:'2px solid'}, br:'5px 0 0 0' },
        { pos:{top:22,right:22}, bs:{borderTop:'2px solid',borderRight:'2px solid'}, br:'0 5px 0 0' },
        { pos:{bottom:22,left:22}, bs:{borderBottom:'2px solid',borderLeft:'2px solid'}, br:'0 0 0 5px' },
        { pos:{bottom:22,right:22}, bs:{borderBottom:'2px solid',borderRight:'2px solid'}, br:'0 0 5px 0' },
      ].map((cfg,i) => (
        <motion.div key={i} style={{
          position:'absolute', width:44, height:44, ...cfg.bs, ...cfg.pos,
          borderColor:'rgba(139,92,246,0.55)', borderRadius:cfg.br, zIndex:80, pointerEvents:'none',
        }}
          initial={{ opacity:0, scale:0 }}
          animate={{ opacity:showHUD?1:0, scale:showHUD?1:0 }}
          transition={{ type:'spring', stiffness:500, damping:30, delay:showHUD?0.4+i*0.1:0 }}
        />
      ))}

      {/* ── HUD BARS ── */}
      {[
        { style:{top:22,left:70,right:70,height:1}, origin:'left', delay:0.8 },
        { style:{bottom:22,left:70,right:70,height:1}, origin:'right', delay:0.9 },
      ].map((b,i) => (
        <motion.div key={i} style={{
          position:'absolute', ...b.style, zIndex:80, pointerEvents:'none', transformOrigin:b.origin,
          background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.4) 15%,rgba(139,92,246,0.4) 85%,transparent)',
        }}
          initial={{ opacity:0, scaleX:0 }}
          animate={{ opacity:showHUD?1:0, scaleX:showHUD?1:0 }}
          transition={{ duration:0.7, ease:[0.16,1,0.3,1], delay:showHUD?b.delay:0 }}
        />
      ))}
      {[
        { style:{left:22,top:70,bottom:70,width:1}, origin:'top', delay:1.0 },
        { style:{right:22,top:70,bottom:70,width:1}, origin:'bottom', delay:1.1 },
      ].map((b,i) => (
        <motion.div key={i} style={{
          position:'absolute', ...b.style, zIndex:80, pointerEvents:'none', transformOrigin:b.origin,
          background:'linear-gradient(180deg,transparent,rgba(139,92,246,0.28) 15%,rgba(139,92,246,0.28) 85%,transparent)',
        }}
          initial={{ opacity:0, scaleY:0 }}
          animate={{ opacity:showHUD?1:0, scaleY:showHUD?1:0 }}
          transition={{ duration:0.5, ease:[0.16,1,0.3,1], delay:showHUD?b.delay:0 }}
        />
      ))}

      {/* ── HUD DATA READOUTS ── */}
      {[
        { text:'SYS.CORE v4.0.1', pos:{top:36,left:32}, align:'left', delay:1.2 },
        { text:'PROTOCOL: ACTIVE', pos:{bottom:36,left:32}, align:'left', delay:1.4 },
        { text:'FREQ: 144.8 Hz', pos:{top:36,right:32}, align:'right', delay:1.6 },
        { text:'LAT: 0.000ms', pos:{bottom:36,right:32}, align:'right', delay:1.8 },
      ].map((d,i) => (
        <ScrambleText key={i} text={d.text} visible={showHUD} style={{
          position:'absolute', ...d.pos, textAlign:d.align, zIndex:82, pointerEvents:'none',
          fontFamily:"'Space Grotesk',monospace", fontSize:'0.45rem',
          fontWeight:400, letterSpacing:'0.18rem',
          color:'rgba(139,92,246,0.45)', textTransform:'uppercase',
        }}/>
      ))}

      {/* ── COUNTER (Typed.js + Framer) ── */}
      <AnimatePresence>
        {phase==='void' && (
          <motion.div style={{
            position:'absolute', bottom:'6vh', left:'50%', zIndex:85, pointerEvents:'none',
            display:'flex', flexDirection:'column', alignItems:'center', gap:10,
          }}
            initial={{ opacity:0, y:30, x:'-50%' }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-28 }}
            transition={{ type:'spring', stiffness:280, damping:22 }}
          >
            {/* Typed.js injects here */}
            <span style={{
              fontFamily:"'Space Grotesk'", fontSize:'0.5rem', fontWeight:500,
              letterSpacing:'0.3rem', color:'rgba(139,92,246,0.6)', textTransform:'uppercase',
            }}>
              <span ref={typedEl}/>
            </span>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{
                fontFamily:"'Space Grotesk',monospace", fontSize:'2.4rem', fontWeight:700,
                letterSpacing:'0.05rem', color:'rgba(96,165,250,0.45)', lineHeight:1,
                fontVariantNumeric:'tabular-nums',
              }}>
                {String(count).padStart(3,'0')}
              </span>
              <span style={{ fontFamily:"'Space Grotesk'", fontSize:'0.9rem', fontWeight:300,
                color:'rgba(96,165,250,0.22)' }}>%</span>
            </div>
            <div style={{ width:160, height:2.5, background:'rgba(139,92,246,0.07)', borderRadius:2, overflow:'hidden' }}>
              <motion.div style={{
                height:'100%', borderRadius:2,
                background:'linear-gradient(90deg,rgba(59,130,246,0.6),rgba(139,92,246,0.6))',
              }}
                animate={{ width:`${count}%` }}
                transition={{ duration:0.08, ease:'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RETICLE (Framer) ── */}
      <AnimatePresence>
        {showTarget && (
          <motion.div style={{ ...CS, width:90, height:90, marginLeft:-45, marginTop:-45,
            borderRadius:'50%', border:'1px solid rgba(139,92,246,0.55)',
            boxShadow:'0 0 28px rgba(139,92,246,0.22)', zIndex:83, pointerEvents:'none' }}
            initial={{ opacity:0, scale:4 }}
            animate={{ opacity:0.7, scale:1 }}
            exit={{ opacity:0, scale:0.3 }}
            transition={{ type:'spring', stiffness:260, damping:20 }}
          >
            <div style={{ position:'absolute', top:'50%', left:-22, right:-22, height:1,
              background:'rgba(139,92,246,0.45)', marginTop:-0.5 }}/>
            <div style={{ position:'absolute', left:'50%', top:-22, bottom:-22, width:1,
              background:'rgba(139,92,246,0.45)', marginLeft:-0.5 }}/>
            <motion.div style={{ position:'absolute', inset:8, borderRadius:'50%',
              border:'1px dashed rgba(139,92,246,0.22)' }}
              animate={{ rotate:360 }}
              transition={{ duration:3, ease:'linear', repeat:Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TARGETING LINES ── */}
      <AnimatePresence>
        {showTarget && (
          <>
            <motion.div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, zIndex:81,
              background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.22) 8%,rgba(139,92,246,0.22) 92%,transparent)',
              transformOrigin:'center' }}
              initial={{ opacity:0, scaleX:0 }}
              animate={{ opacity:0.5, scaleX:1 }}
              exit={{ opacity:0, scaleX:0 }}
              transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            />
            <motion.div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, zIndex:81,
              background:'linear-gradient(180deg,transparent,rgba(139,92,246,0.22) 8%,rgba(139,92,246,0.22) 92%,transparent)',
              transformOrigin:'center' }}
              initial={{ opacity:0, scaleY:0 }}
              animate={{ opacity:0.5, scaleY:1 }}
              exit={{ opacity:0, scaleY:0 }}
              transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── PULSE WAVES ── */}
      {Array.from({length:7},(_,i) => <PulseWave key={i} index={i} active={pulsesActive}/>)}

      {/* ── ENERGY RINGS ── */}
      {Array.from({length:RING_COUNT},(_,i) => (
        <EnergyRing key={i} index={i} visible={ringsVisible} blazing={ringsBlaze}/>
      ))}

      {/* ── ORBIT DOTS ── */}
      {Array.from({length:ORBIT_COUNT},(_,i) => (
        <OrbitDot key={i} index={i} active={orbitsActive}/>
      ))}

      {/* ── FRAMER SHARDS ── */}
      <AnimatePresence>
        {showShards && (
          <motion.div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none', overflow:'hidden' }}
            animate={{ rotate:phase==='peak'?34:0 }}
            transition={{ duration:1, ease:[0.87,0,0.13,1] }}
            exit={{ opacity:0, transition:{ duration:0.15 } }}
          >
            {shards.map(s => <FramerShard key={s.id} data={s} active={showShards}/>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OUTER AURA ── */}
      <AnimatePresence>
        {showLayers && (
          <motion.div style={{ ...CS, width:700, height:700, marginLeft:-350, marginTop:-350,
            borderRadius:'50%',
            background:'radial-gradient(circle,rgba(59,130,246,0.06) 0%,rgba(45,27,105,0.04) 40%,transparent 70%)',
            filter:'blur(55px)', zIndex:7.5, pointerEvents:'none', x:glowX, y:glowY,
            scale:outerScale, opacity:outerOp }}
            exit={{ opacity:0, scale:0, transition:{ duration:0.2 } }}
          />
        )}
      </AnimatePresence>

      {/* ── AURA ── */}
      <AnimatePresence>
        {showLayers && (
          <motion.div style={{ ...CS, width:500, height:500, marginLeft:-250, marginTop:-250,
            borderRadius:'50%',
            background:'radial-gradient(circle,rgba(139,92,246,0.18) 0%,rgba(45,27,105,0.1) 35%,transparent 70%)',
            filter:'blur(38px)', zIndex:8, pointerEvents:'none', x:glowX, y:glowY,
            scale:auraScale, opacity:auraOp }}
            exit={{ opacity:0, scale:0, transition:{ duration:0.2 } }}
          />
        )}
      </AnimatePresence>

      {/* ── GLOW ── */}
      <AnimatePresence>
        {showLayers && (
          <motion.div style={{ ...CS, width:400, height:400, marginLeft:-200, marginTop:-200,
            borderRadius:'50%',
            background:'radial-gradient(circle,rgba(96,165,250,0.28) 0%,rgba(139,92,246,0.18) 28%,transparent 70%)',
            filter:'blur(24px)', zIndex:9, pointerEvents:'none', x:glowX, y:glowY,
            scale:glowScale, opacity:glowOp }}
            exit={{ opacity:0, scale:0, transition:{ duration:0.2 } }}
          />
        )}
      </AnimatePresence>

      {/* ── HALO ── */}
      <AnimatePresence>
        {showLayers && (
          <motion.div style={{ ...CS, width:310, height:310, marginLeft:-155, marginTop:-155,
            borderRadius:'50%', border:'1px solid rgba(96,165,250,0.22)',
            boxShadow:'0 0 40px rgba(96,165,250,0.08),inset 0 0 40px rgba(96,165,250,0.04)',
            zIndex:10, pointerEvents:'none' }}
            initial={{ opacity:0, scale:0.3 }}
            animate={{ opacity:0.42, scale:1 }}
            exit={{ opacity:0, transition:{ duration:0.2 } }}
            transition={{ type:'spring', stiffness:240, damping:22 }}
          >
            <motion.div style={{ position:'absolute', inset:0, borderRadius:'50%' }}
              animate={{ rotate:360 }}
              transition={{ duration:14, ease:'linear', repeat:Infinity }}>
              <div style={{ position:'absolute', top:0, left:'50%', width:6, height:6,
                borderRadius:'50%', background:'#60a5fa', marginLeft:-3, marginTop:-3,
                boxShadow:'0 0 14px rgba(96,165,250,0.95)' }}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SYMBOL: THE LOGO (All motion values from animate()) ── */}
      <AnimatePresence>
        {showLayers && (
          <motion.div style={{
            ...CS,
            width:'clamp(220px,22vw,380px)', height:'clamp(220px,22vw,380px)',
            marginLeft:'calc(clamp(220px,22vw,380px)/-2)',
            marginTop:'calc(clamp(220px,22vw,380px)/-2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:12, pointerEvents:'none', overflow:'visible',
            x:symX, y:symY,
            scale:symScale, opacity:symOp, rotate:symRot,
          }}
            exit={{ opacity:0, scale:0.05, transition:{ duration:0.15 } }}
          >
            {/* Core radiance */}
            <motion.div style={{ position:'absolute', inset:-30, borderRadius:'50%',
              background:'radial-gradient(circle,rgba(255,255,255,0.92) 0%,transparent 60%)',
              filter:'blur(18px)', zIndex:1, pointerEvents:'none' }}
              animate={phase==='eternal'?{
                opacity:[0.75,1,0.75], scale:[1,1.22,1],
              }:{ opacity:1, scale:1 }}
              transition={phase==='eternal'?{ duration:2.8, ease:'easeInOut', repeat:Infinity }:{ duration:0.3 }}
            />

            {/* Shine sweep */}
            <Shine trigger={shineKey}/>

            {/* THE LOGO (final ref for GSAP float + anime.js glow) */}
            <img
              ref={logoRef}
              src='/logo1.png'
              alt='SHESHA'
              draggable={false}
              style={{
                width:'100%', height:'100%', objectFit:'contain',
                position:'relative', zIndex:2, userSelect:'none',
                filter:'drop-shadow(0 0 35px rgba(96,165,250,0.7)) drop-shadow(0 0 70px rgba(139,92,246,0.3))',
                WebkitUserDrag:'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LENS FLARES ── */}
      {[
        { size:160, dx:120, dy:-120, delay:0.05, blur:5 },
        { size:115, dx:-95, dy:95,   delay:0.12, blur:4 },
        { size:90,  dx:75,  dy:75,   delay:0.2,  blur:3 },
        { size:65,  dx:-55, dy:-55,  delay:0.28, blur:2 },
      ].map((f,i) => (
        <LensFlare key={i} active={showFlares} size={f.size} dx={f.dx} dy={f.dy} delay={f.delay} blur={f.blur}/>
      ))}

      {/* ── NOVA SHOCKWAVES ── */}
      {[1500,2100,2900,3800].map((size,i) => (
        <ShockwaveRing key={i} active={showNova} maxSize={size} delay={i*0.1}
          thickness={[2,1.5,1,0.5][i]} maxOp={[0.22,0.15,0.1,0.05][i]}/>
      ))}

      {/* ── NOVA ENERGY BURST ── */}
      <AnimatePresence>
        {showNova && (
          <motion.div style={{ ...CS, width:400, height:400, marginLeft:-200, marginTop:-200,
            borderRadius:'50%',
            background:'radial-gradient(circle,rgba(255,255,255,0.95),rgba(96,165,250,0.5) 30%,rgba(139,92,246,0.2) 60%,transparent)',
            filter:'blur(25px)', zIndex:55, pointerEvents:'none' }}
            initial={{ opacity:0, scale:0 }}
            animate={{ opacity:[0,1,0], scale:[0,5,9] }}
            transition={{ duration:1.1, ease:[0.16,1,0.3,1] }}
          />
        )}
      </AnimatePresence>

      {/* ── NOVA DOUBLE FLASH (Framer + GSAP ref) ── */}
      <div ref={flashRef} style={{
        position:'absolute', inset:0, background:'#fff', zIndex:100,
        opacity:0, pointerEvents:'none',
      }}/>

      {/* ── VIGNETTE ── */}
      <motion.div style={{ position:'absolute', inset:0, zIndex:95, background:'#020617', pointerEvents:'none' }}
        initial={{ opacity:1 }}
        animate={{ opacity:0 }}
        transition={{ duration:3.5, ease:[0.16,1,0.3,1], delay:0.2 }}
      />

      <h1 style={{ position:'absolute', opacity:0, pointerEvents:'none' }}>
        SHESHA — Sovereign Financial Intelligence
      </h1>
    </div>
  )
}