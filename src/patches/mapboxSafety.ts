
import mapboxgl from 'mapbox-gl';

// Defensive global patch to avoid crashes when map.style is not ready or map is removed.
(() => {
  const MapCtor = (mapboxgl as any)?.Map;
  if (!MapCtor || !MapCtor.prototype) return;

  const proto = MapCtor.prototype as any;
  if (proto.__kwenda_mapbox_safety_patched) return;

  const safeWrap = (fn: Function | undefined, fallback?: any) => {
    return function (this: any, ...args: any[]) {
      const style = this?.style;
      // If style isn't ready, avoid calling into Mapbox internals
      if (!style || typeof style.getOwnLayer !== 'function') {
        return fallback;
      }
      try {
        return fn?.apply(this, args);
      } catch (e) {
        // Silently return fallback to prevent hard crashes
        return fallback;
      }
    };
  };

  const originalGetLayer = proto.getLayer;
  const originalGetSource = proto.getSource;
  const originalRemoveLayer = proto.removeLayer;
  const originalRemoveSource = proto.removeSource;

  proto.getLayer = safeWrap(originalGetLayer, undefined);
  proto.getSource = safeWrap(originalGetSource, undefined);
  proto.removeLayer = safeWrap(originalRemoveLayer, undefined);
  proto.removeSource = safeWrap(originalRemoveSource, undefined);

  proto.__kwenda_mapbox_safety_patched = true;
  // console.log('[Kwenda] Mapbox safety patch applied');
})();
