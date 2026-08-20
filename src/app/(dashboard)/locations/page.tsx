'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import {
  getLocationProfiles,
  createLocationProfile,
  deleteLocationProfile,
  haversineDistance,
  LocationProfile,
} from '@/lib/location-profile-service';
import { useToast } from '@/hooks/useToast';

const RADIUS_OPTIONS = [50, 100, 200, 500, 1000, 2000];

function radiusLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export default function LocationsPage() {
  const { selectedChildId, children, family } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<LocationProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState(200);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      setProfiles(await getLocationProfiles(selectedChildId));
    } catch {
      toast.error('Failed to load location profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
        toast.success('Location captured');
      },
      () => {
        toast.error('Could not get your location');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !family) return;
    if (!name.trim()) { toast.error('Name is required'); return; }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) { toast.error('Invalid coordinates'); return; }
    setSaving(true);
    try {
      await createLocationProfile(selectedChildId, name.trim(), latNum, lngNum, radius, family.id);
      toast.success(`"${name}" saved`);
      setName(''); setLat(''); setLng(''); setRadius(200); setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: LocationProfile) => {
    if (!confirm(`Delete "${p.name}"? Rules scoped to this location will become global.`)) return;
    try {
      await deleteLocationProfile(p.id, family?.id ?? '', selectedChildId ?? '', p.name);
      toast.success(`"${p.name}" deleted`);
      setProfiles((prev) => prev.filter((x) => x.id !== p.id));
    } catch {
      toast.error('Failed to delete location');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Location Awareness</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">📍 Location Profiles</h1>
        {selectedChild && (
          <p className="mt-1 text-text-muted text-sm">
            Rules that activate automatically based on where <strong>{selectedChild.name}</strong> is.
          </p>
        )}
      </div>

      {/* Info callout */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300/80 leading-relaxed">
          <strong className="text-emerald-400">How it works:</strong> Define named places (e.g. "School",
          "Home") with a GPS coordinate and radius. Then scope any time limit or block rule to a location
          — it will only be enforced when {selectedChild?.name ?? 'the child'} is inside that zone.
          Rules without a location scope apply everywhere.
        </p>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all"
        >
          + Add Location
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-emerald-500/25 bg-bg-card p-5 space-y-4"
        >
          <p className="text-sm font-semibold text-emerald-400">New Location Profile</p>

          <div>
            <label className="text-xs text-text-muted block mb-1">Location Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. School, Home, Grandma's"
              className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
            >
              {geoLoading ? '⏳ Getting location…' : '📍 Use My Current Location'}
            </button>
          </div>

          {(lat || lng) && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
              📌 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Latitude</label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="51.505"
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Longitude</label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-0.09"
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-2">
              Radius: <span className="text-accent font-semibold">{radiusLabel(radius)}</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    radius === r
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-bg-elevated border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {radiusLabel(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Location'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setName(''); setLat(''); setLng(''); setRadius(200); }}
              className="rounded-xl border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Profiles list */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
          🗺️ Saved Locations{' '}
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{profiles.length}</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-bg-elevated animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-slate-600 text-sm py-8 rounded-2xl border border-dashed border-border">
            No location profiles yet. Add one above to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card px-5 py-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xl flex-shrink-0">
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)} · {radiusLabel(p.radius_meters)} radius
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(p)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
