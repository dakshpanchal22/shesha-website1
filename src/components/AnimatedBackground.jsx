// src/components/AnimatedBackground.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import BIRDS from 'vanta/dist/vanta.birds.min';

const AnimatedBackground = () => {
  const wavesEffect = useRef(null);
  const birdsEffect = useRef(null);
  const wavesContainer = useRef(null);
  const birdsContainer = useRef(null);

  // Initialize WAVES effect
  useEffect(() => {
    if (!wavesEffect.current && wavesContainer.current) {
      wavesEffect.current = WAVES({
        el: wavesContainer.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xc0c8cc,        // Soft silver for a clean tech look
        shininess: 60.00,
        waveHeight: 15.00,
        waveSpeed: 0.60,
        zoom: 1.00,
        backgroundColor: 0xffffff // Pure white canvas base
      });
    }
    return () => {
      if (wavesEffect.current) {
        wavesEffect.current.destroy();
        wavesEffect.current = null;
      }
    };
  }, []);

  // Initialize BIRDS effect (subtle, low opacity overlay)
  useEffect(() => {
    if (!birdsEffect.current && birdsContainer.current) {
      birdsEffect.current = BIRDS({
        el: birdsContainer.current,
        THREE: THREE,
        mouseControls: false,    // Keep mouse control only on waves to avoid double movement
        touchControls: false,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: 0x0,    // Transparent canvas (black with opacity 0)
        color1: 0xd4d4d4,        // Light gray birds
        color2: 0xffffff,        // White birds
        birdSize: 1.20,
        wingSpan: 20.00,
        speedLimit: 3.00,
        separation: 30.00,
        alignment: 30.00,
        cohesion: 20.00,
        quantity: 2.50           // Fewer birds for subtlety
      });
    }
    return () => {
      if (birdsEffect.current) {
        birdsEffect.current.destroy();
        birdsEffect.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* Waves Layer (bottom) */}
      <div
        ref={wavesContainer}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Birds Layer (top) with reduced opacity for blend */}
      <div
        ref={birdsContainer}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0.35,          // Blends birds softly into the waves
          mixBlendMode: 'multiply' // Helps birds integrate with white background
        }}
      />
    </>
  );
};

export default AnimatedBackground;