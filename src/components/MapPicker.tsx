'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  latitude: number
  longitude: number
  onLocationSelect: (lat: number, lng: number) => void
}

export default function MapPicker({ latitude, longitude, onLocationSelect }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Fix default marker icon issue with webpack
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    // Initialize map
    const map = L.map(containerRef.current).setView([latitude, longitude], 13)
    mapRef.current = map

    // Add Google Maps tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    }).addTo(map)

    // Add draggable marker
    const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map)
    markerRef.current = marker

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onLocationSelect(pos.lat, pos.lng)
    })

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    }
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className="h-64 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-600"
      style={{ zIndex: 0 }}
    />
  )
}
