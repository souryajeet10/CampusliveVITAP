import { useState, useEffect, useMemo } from 'react';
import { subscribeActivePins } from '../services/lostFoundService';

/**
 * Custom hook to manage Lost & Found pins state, filtering, search, and clustering.
 * @param {string} filterType - 'All' | 'Lost' | 'Found'
 * @param {string} searchQuery - Search input value
 * @param {number} zoomLevel - Current map zoom level
 */
export const useLostFoundPins = (filterType, searchQuery, zoomLevel) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to pins in real-time
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeActivePins(
      (activePins) => {
        setPins(activePins);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and search pins
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      // 1. Filter by type
      if (filterType !== 'All') {
        const typeMatch = pin.type.toLowerCase() === filterType.toLowerCase();
        if (!typeMatch) return false;
      }

      // 2. Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = pin.title?.toLowerCase().includes(query);
        const descMatch = pin.description?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });
  }, [pins, filterType, searchQuery]);

  // Cluster pins when zoomed out
  const clusteredPins = useMemo(() => {
    // Zoom levels below 16 will cluster nearby markers
    if (zoomLevel >= 16) {
      return filteredPins.map(pin => ({ isCluster: false, ...pin }));
    }

    // Distance threshold in degrees (approximate for campus size)
    // Scale threshold based on zoom level: zoom 15 -> 0.0006, zoom 14 -> 0.0012, etc.
    const threshold = 0.0003 * Math.pow(2, 16 - zoomLevel);
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < filteredPins.length; i++) {
      if (visited.has(filteredPins[i].id)) continue;

      const currentPin = filteredPins[i];
      const clusterMembers = [currentPin];
      visited.add(currentPin.id);

      for (let j = i + 1; j < filteredPins.length; j++) {
        if (visited.has(filteredPins[j].id)) continue;

        const otherPin = filteredPins[j];
        const latDiff = Math.abs(currentPin.latitude - otherPin.latitude);
        const lngDiff = Math.abs(currentPin.longitude - otherPin.longitude);

        if (latDiff < threshold && lngDiff < threshold) {
          clusterMembers.push(otherPin);
          visited.add(otherPin.id);
        }
      }

      if (clusterMembers.length > 1) {
        // Calculate centroid coordinates for the cluster
        const avgLat = clusterMembers.reduce((sum, p) => sum + p.latitude, 0) / clusterMembers.length;
        const avgLng = clusterMembers.reduce((sum, p) => sum + p.longitude, 0) / clusterMembers.length;

        // Group types in cluster
        const lostCount = clusterMembers.filter(p => p.type === 'lost').length;
        const foundCount = clusterMembers.filter(p => p.type === 'found').length;

        clusters.push({
          id: `cluster-${currentPin.id}`,
          isCluster: true,
          latitude: avgLat,
          longitude: avgLng,
          pins: clusterMembers,
          count: clusterMembers.length,
          lostCount,
          foundCount
        });
      } else {
        clusters.push({
          isCluster: false,
          ...currentPin
        });
      }
    }

    return clusters;
  }, [filteredPins, zoomLevel]);

  return {
    pins: filteredPins,
    clusteredPins,
    loading,
    error
  };
};
