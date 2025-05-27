import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [genres, setGenres] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const userId = 'demo-user'; // In production, this would come from authentication

  useEffect(() => {
    loadPopularStations();
    loadFilters();
    loadFavorites();
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (currentStation && audioRef.current) {
      setupAudioVisualization();
    }
  }, [currentStation, isPlaying]);

  const loadPopularStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/stations/popular?limit=50`);
      setStations(response.data);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [countriesRes, languagesRes, tagsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/countries`),
        axios.get(`${API_BASE_URL}/api/languages`),
        axios.get(`${API_BASE_URL}/api/tags`)
      ]);
      
      setCountries(countriesRes.data.slice(0, 50)); // Limit for performance
      setLanguages(languagesRes.data.slice(0, 50));
      setGenres(tagsRes.data.slice(0, 100));
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/favorites/${userId}`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/playlists/${userId}`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const searchStations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.name = searchQuery;
      if (selectedCountry) params.country = selectedCountry;
      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedGenre) params.tag = selectedGenre;
      
      const response = await axios.get(`${API_BASE_URL}/api/stations/search`, { params });
      setStations(response.data);
    } catch (error) {
      console.error('Error searching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const playStation = (station) => {
    if (currentStation?.station_uuid === station.station_uuid && isPlaying) {
      pauseStation();
      return;
    }

    setCurrentStation(station);
    if (audioRef.current) {
      audioRef.current.src = station.url;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing station:', error);
          setIsPlaying(false);
        });
    }
  };

  const pauseStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const addToFavorites = async (station) => {
    try {
      const favorite = {
        user_id: userId,
        station_uuid: station.station_uuid,
        station_name: station.name,
        station_url: station.url,
        country: station.country,
        favicon: station.favicon
      };
      
      await axios.post(`${API_BASE_URL}/api/favorites`, favorite);
      loadFavorites();
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (stationUuid) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/favorites/${userId}/${stationUuid}`);
      loadFavorites();
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    try {
      await axios.post(`${API_BASE_URL}/api/playlists/${userId}`, {
        name: newPlaylistName,
        description: `Custom playlist: ${newPlaylistName}`
      });
      
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
      loadPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const setupAudioVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = () => {
      if (!isPlaying) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create animated waveform effect
      const time = Date.now() * 0.001;
      const centerY = canvas.height / 2;
      
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 2) {
        const amplitude = Math.sin(x * 0.02 + time * 2) * 20 + 
                         Math.sin(x * 0.01 + time * 3) * 10;
        const y = centerY + amplitude;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    }
  };

  const isFavorite = (stationUuid) => {
    return favorites.some(fav => fav.station_uuid === stationUuid);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('');
    setSelectedLanguage('');
    setSelectedGenre('');
    loadPopularStations();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Radio Globe</h1>
            </div>
            
            <nav className="flex space-x-8">
              {['discover', 'favorites', 'playlists'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1534518009634-c05d08f02867" 
            alt="Radio waves"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Discover Radio
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Around the World
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Stream live radio stations from every corner of the globe. Find music, news, and culture from over 30,000 stations worldwide.
          </p>
        </div>
      </div>

      {/* Current Playing Station */}
      {currentStation && (
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {currentStation.favicon ? (
                    <img src={currentStation.favicon} alt="" className="w-10 h-10 rounded" />
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{currentStation.name}</h3>
                  <p className="text-blue-200 text-sm">{currentStation.country}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <canvas 
                  ref={canvasRef}
                  className="w-32 h-8 opacity-75"
                />
                <button
                  onClick={() => isPlaying ? pauseStation() : playStation(currentStation)}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        {activeTab === 'discover' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  placeholder="Search stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country.name} value={country.name} className="bg-blue-900">
                    {country.name} ({country.stationcount})
                  </option>
                ))}
              </select>
              
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Languages</option>
                {languages.map((language) => (
                  <option key={language.name} value={language.name} className="bg-blue-900">
                    {language.name} ({language.stationcount})
                  </option>
                ))}
              </select>
              
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.name} value={genre.name} className="bg-blue-900">
                    {genre.name} ({genre.stationcount})
                  </option>
                ))}
              </select>
              
              <div className="flex space-x-2">
                <button
                  onClick={searchStations}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Playlists</h2>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Playlist
              </button>
            </div>
            
            {showCreatePlaylist && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Playlist</h3>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={createPlaylist}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreatePlaylist(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-2">{playlist.name}</h3>
                  <p className="text-blue-200 text-sm mb-4">{playlist.description}</p>
                  <p className="text-blue-300 text-sm">{playlist.stations.length} stations</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'discover' ? stations : activeTab === 'favorites' ? favorites : []).map((station) => (
            <div
              key={station.station_uuid || station.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {station.favicon ? (
                      <img src={station.favicon} alt="" className="w-8 h-8 rounded" />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
                      {station.name || station.station_name}
                    </h3>
                    <p className="text-blue-200 text-sm">{station.country}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const stationUuid = station.station_uuid || station.station_uuid;
                    if (isFavorite(stationUuid)) {
                      removeFromFavorites(stationUuid);
                    } else {
                      addToFavorites(station);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isFavorite(station.station_uuid || station.station_uuid)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-blue-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-blue-300 mb-2">
                  <span>{station.language}</span>
                  <span>{station.codec} {station.bitrate}kbps</span>
                </div>
                {station.tags && (
                  <p className="text-blue-200 text-sm truncate">{station.tags}</p>
                )}
              </div>
              
              <button
                onClick={() => playStation(station)}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  currentStation?.station_uuid === (station.station_uuid || station.station_uuid) && isPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                }`}
              >
                {currentStation?.station_uuid === (station.station_uuid || station.station_uuid) && isPlaying
                  ? 'Stop Playing'
                  : 'Play Station'
                }
              </button>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-blue-200 mt-4">Loading stations...</p>
          </div>
        )}

        {!loading && stations.length === 0 && activeTab === 'discover' && (
          <div className="text-center py-12">
            <p className="text-blue-200 text-lg">No stations found. Try adjusting your search criteria.</p>
          </div>
        )}

        {!loading && favorites.length === 0 && activeTab === 'favorites' && (
          <div className="text-center py-12">
            <p className="text-blue-200 text-lg">No favorite stations yet. Start exploring to add some!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
