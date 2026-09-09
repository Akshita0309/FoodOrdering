import React, { useState, useEffect } from "react";
import { preferencesService } from "../services/api";
import toast from "react-hot-toast";

const CUISINES = [
  "Indian",
  "Italian",
  "Japanese",
  "American",
  "Chinese",
  "Thai",
  "Mexican",
  "Greek",
  "French",
  "Spanish",
  "Continental",
];
const DIETARY = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",

  "Kosher",
  "Nut-free",
];

function normalizePrefs(data) {
  return {
    favouriteCuisines: Array.isArray(data?.favouriteCuisines)
      ? data.favouriteCuisines
      : [],
    dietaryRestrictions: Array.isArray(data?.dietaryRestrictions)
      ? data.dietaryRestrictions
      : [],
  };
}

function getErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim())
    return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (typeof err?.message === "string" && err.message.trim())
    return err.message;
  return fallback;
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState({
    favouriteCuisines: [],
    dietaryRestrictions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    preferencesService
      .get()
      .then((res) => setPrefs(normalizePrefs(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field, value) => {
    setPrefs((p) => ({
      ...p,
      [field]: (p[field] || []).includes(value)
        ? (p[field] || []).filter((v) => v !== value)
        : [...(p[field] || []), value],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await preferencesService.save({
        favouriteCuisines: prefs.favouriteCuisines || [],
        dietaryRestrictions: prefs.dietaryRestrictions || [],
      });
      toast.success("Preferences saved!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save preferences"));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="spinner" />
        </div>
      </div>
    );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 className="section-heading">Your preferences</h1>
        <p className="section-subheading">
          Help us personalise your food discovery experience.
        </p>

        <div className="card p-3 mb-2">
          <h3
            style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: 16 }}
          >
            Favourite cuisines
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CUISINES.map((c) => (
              <button
                key={c}
                className={`pill ${prefs.favouriteCuisines.includes(c) ? "active" : ""}`}
                onClick={() => toggle("favouriteCuisines", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-3 mb-2">
          <h3
            style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: 16 }}
          >
            Dietary restrictions
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DIETARY.map((d) => (
              <button
                key={d}
                className={`pill ${prefs.dietaryRestrictions.includes(d) ? "active" : ""}`}
                onClick={() => toggle("dietaryRestrictions", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {prefs.favouriteCuisines.length > 0 && (
          <div
            className="card p-3 mb-2"
            style={{ background: "#FFF5F2", border: "1px solid #FED7C7" }}
          >
            <p style={{ fontSize: 13 }}>
              <strong>Recommendations:</strong> Based on your preferences, we'd
              suggest restaurants serving{" "}
              {prefs.favouriteCuisines.slice(0, 2).join(" and ")} cuisine.
            </p>
          </div>
        )}

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
