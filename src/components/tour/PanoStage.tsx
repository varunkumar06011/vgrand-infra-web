'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@photo-sphere-viewer/core/index.css';
import type { Viewer } from '@photo-sphere-viewer/core';
import type { TourScene } from '@/data/tours';
import { Loader2 } from 'lucide-react';

interface GyroApi {
  start(): void | Promise<void>;
  stop(): void;
}

/**
 * 360° scene renderer — Photo Sphere Viewer.
 *
 * This module is only ever loaded through `next/dynamic` inside
 * TourViewer when a scene with kind:'pano' is first entered, so
 * three.js stays out of the bundle while every scene is a flat photo.
 *
 * `scene.heading` is used as the initial yaw (compass bearing in
 * degrees, 0 = north). For a real equirectangular 360, set the
 * scene's heading/northOffset so the bearing lines up with the plan.
 */
export default function PanoStage({ scene, gyro }: { scene: TourScene; gyro: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const gyroRef = useRef<GyroApi | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;
    let viewer: Viewer | null = null;

    (async () => {
      const [{ Viewer: PSVViewer }, { GyroscopePlugin }] = await Promise.all([
        import('@photo-sphere-viewer/core'),
        import('@photo-sphere-viewer/gyroscope-plugin'),
      ]);
      if (destroyed || !holder.current) return;

      viewer = new PSVViewer({
        container: holder.current,
        panorama: scene.src,
        defaultYaw: `${scene.heading}deg`,
        defaultZoomLvl: 40,
        moveInertia: true,
        navbar: false,
        plugins: [GyroscopePlugin],
      });
      viewerRef.current = viewer;
      gyroRef.current = viewer.getPlugin(GyroscopePlugin) as unknown as GyroApi | null;
      setReady(true);
    })();

    return () => {
      destroyed = true;
      try {
        viewer?.destroy();
      } catch {
        /* noop */
      }
      viewerRef.current = null;
    };
  }, [scene.src, scene.heading]);

  /* tilt toggle -> gyroscope plugin */
  useEffect(() => {
    const g = gyroRef.current;
    if (!g) return;
    if (gyro) {
      void g.start();
    } else {
      g.stop();
    }
  }, [gyro, ready]);

  return (
    <div className="absolute inset-0">
      <div ref={holder} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      )}
    </div>
  );
}
