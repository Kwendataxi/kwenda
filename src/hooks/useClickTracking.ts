/**
 * Hook pour tracker les clics utilisateurs pour heatmaps
 * Utilise un buffer pour optimiser les envois vers Supabase
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClickData {
  page: string;
  element_type: string;
  element_id?: string;
  element_class?: string;
  element_text?: string;
  x: number;
  y: number;
  relative_x: number;
  relative_y: number;
  viewport_width: number;
  viewport_height: number;
  device_type: 'mobile' | 'tablet' | 'desktop';
}

const BATCH_SIZE = 20;
const BATCH_INTERVAL = 10000; // 10 secondes

let clickBuffer: ClickData[] = [];
let sessionId: string = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getElementText = (element: HTMLElement): string => {
  // Récupérer le texte visible (max 100 chars)
  const text = element.textContent || element.innerText || '';
  return text.trim().substring(0, 100);
};

const sendClickBatch = async () => {
  if (clickBuffer.length === 0) return;

  const batch = [...clickBuffer];
  clickBuffer = []; // Reset buffer

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const records = batch.map(click => ({
      user_id: user?.id || null,
      session_id: sessionId,
      ...click
    }));

    const { error } = await supabase
      .from('heatmap_clicks')
      .insert(records);

    if (error) throw error;
    
    console.log(`📊 ${batch.length} clics envoyés au heatmap`);
  } catch (error) {
    console.error('Erreur envoi clics heatmap:', error);
    // Remettre dans le buffer en cas d'erreur
    clickBuffer = [...batch, ...clickBuffer];
  }
};

export const useClickTracking = (options: { enabled?: boolean; ignoredSelectors?: string[] } = {}) => {
  const { enabled = true, ignoredSelectors = ['.no-track', '[data-no-track]'] } = options;
  const intervalRef = useRef<NodeJS.Timeout>();

  const shouldIgnoreElement = useCallback((element: HTMLElement): boolean => {
    // Vérifier si l'élément ou un parent doit être ignoré
    return ignoredSelectors.some(selector => element.closest(selector) !== null);
  }, [ignoredSelectors]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    if (!target || shouldIgnoreElement(target)) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const clickData: ClickData = {
      page: window.location.pathname,
      element_type: target.tagName.toLowerCase(),
      element_id: target.id || undefined,
      element_class: target.className || undefined,
      element_text: getElementText(target),
      x: e.clientX,
      y: e.clientY,
      relative_x: Math.round((e.clientX / viewportWidth) * 10000) / 100, // 2 décimales
      relative_y: Math.round((e.clientY / viewportHeight) * 10000) / 100,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      device_type: detectDeviceType()
    };

    clickBuffer.push(clickData);

    // Envoyer immédiatement si buffer plein
    if (clickBuffer.length >= BATCH_SIZE) {
      sendClickBatch();
    }
  }, [enabled, shouldIgnoreElement]);

  useEffect(() => {
    if (!enabled) return;

    // Écouter les clics
    document.addEventListener('click', handleClick, true);

    // Envoyer le buffer périodiquement
    intervalRef.current = setInterval(() => {
      sendClickBatch();
    }, BATCH_INTERVAL);

    // Envoyer avant de quitter la page
    const handleBeforeUnload = () => {
      sendClickBatch();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Envoyer le buffer restant
      sendClickBatch();
    };
  }, [enabled, handleClick]);

  return {
    sessionId,
    flushBuffer: sendClickBatch,
    getBufferSize: () => clickBuffer.length
  };
};
