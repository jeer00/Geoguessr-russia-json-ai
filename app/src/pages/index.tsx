import { useState } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Initializing Map...</div>
});

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);
  const [activePoint, setActivePoint] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState<any>(null);

  const search = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setLastIntent(data.intent);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#121212', color: '#eee', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <header style={{ 
        padding: '12px 25px', 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '28px' }}>🇷🇺</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
              Russia Coverage <span style={{ color: '#4a90e2' }}>AI Analyzer</span>
            </h1>
            {lastIntent && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                Active Tags: {lastIntent.tags?.join(', ') || 'None'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search e.g. 'Short B Type Antenna'..." 
            style={{ 
              width: 380, 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #444', 
              background: '#2d2d2d',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          <button 
            onClick={search} 
            disabled={loading}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none',
              background: loading ? '#444' : '#4a90e2', 
              color: 'white', 
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Analyzing...' : 'Search'}
          </button>
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <section style={{ flex: 1, position: 'relative', borderRight: '1px solid #333' }}>
          <Map 
            points={results} 
            onPointClick={(lat: number, lon: number) => setActivePoint({lat, lon})} 
          />
          {results.length > 0 && (
            <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid #444' }}>
              Showing {results.length} coverage points
            </div>
          )}
        </section>
        
        <section style={{ flex: 1.4, background: '#000', display: 'flex', flexDirection: 'column' }}>
          {activePoint ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&location=${activePoint.lat},${activePoint.lon}&fov=90`}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>👁️‍🗨️</div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0' }}>Street View Explorer</h3>
              <p style={{ maxWidth: '300px', fontSize: '14px' }}>Select a marker on the map to inspect visual coverage at that coordinate.</p>
            </div>
          )}
        </section>

      </main>
{/* Some weird vercel hack */}
      <style jsx global>{`
        button:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        input:focus {
          border-color: #4a90e2 !parse;
        }
      `}</style>
    </div>
  );
}