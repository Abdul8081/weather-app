'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import React from 'react';

const API_KEY = process.env.OPENWEATHER_API_KEY || 'd1845658f92b31c64bd94f06f7188c9c';

interface WeatherData {
  name: string;
  sys: { country: string };
  weather: { description: string; icon: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
  clouds: { all: number };
  cod: string | number;
  message?: string;
}

export default function WeatherPage() {
  const [currentTab, setCurrentTab] = useState<'user' | 'search'>('user');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [showGrantAccess, setShowGrantAccess] = useState(false);

  useEffect(() => {
    const localCoordinates = sessionStorage.getItem('user-coordinates');
    if (!localCoordinates) {
      setShowGrantAccess(true);
    } else {
      try {
        const coordinates = JSON.parse(localCoordinates);
        if (typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
          fetchUserWeatherInfo(coordinates);
        } else {
          console.error('Invalid coordinates format:', coordinates);
          setError('Stored location data is invalid. Please grant access again.');
          setShowGrantAccess(true);
        }
      } catch (err) {
        console.error('Error parsing coordinates:', err);
        setError('Failed to load saved location. Please grant access again.');
        setShowGrantAccess(true);
      }
    }
  }, []);

  const switchTab = (tab: 'user' | 'search') => {
    if (tab !== currentTab) {
      setError(null);
      setCurrentTab(tab);
      setWeatherData(null);
      setSearchCity('');
      if (tab === 'user') {
        const localCoordinates = sessionStorage.getItem('user-coordinates');
        if (localCoordinates) {
          try {
            const coordinates = JSON.parse(localCoordinates);
            if (typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
              fetchUserWeatherInfo(coordinates);
            } else {
              setShowGrantAccess(true);
            }
          } catch (err) {
            console.error('Error parsing coordinates:', err);
            setShowGrantAccess(true);
          }
        } else {
          setShowGrantAccess(true);
        }
      }
    }
  };

  const fetchUserWeatherInfo = async (coordinates: { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${API_KEY}&units=metric`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: WeatherData = await response.json();
      if (data.cod !== 200 && data.cod !== '200') {
        throw new Error(data.message || 'Failed to fetch weather data');
      }
      setWeatherData(data);
      setShowGrantAccess(false);
    } catch (err: any) {
      console.error('Fetch user weather error:', err);
      setError(
        err.message.includes('401')
          ? 'Invalid API key. Please check your OpenWeather API key.'
          : err.message || 'Unable to fetch weather data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchWeatherInfo = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setError('Please input a valid city name!');
          return;
        }
        if (response.status === 401) {
          setError('Invalid API key. Please check your OpenWeather API key.');
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: WeatherData = await response.json();
      if (data.cod === 200 || data.cod === '200') {
        setWeatherData(data);
      } else {
        setError('Please input a valid city name!');
      }
    } catch (err: any) {
      console.error('Fetch search weather error:', err);
      setError(err.message || 'Unable to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoordinates = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          sessionStorage.setItem('user-coordinates', JSON.stringify(userCoordinates));
          fetchUserWeatherInfo(userCoordinates);
        },
        (err) => {
          console.error('Geolocation error:', err);
          let errorMessage = 'Unable to access location.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access in your browser settings.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An error occurred while accessing location.';
          }
          setError(errorMessage);
          setLoading(false);
          setShowGrantAccess(true);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setShowGrantAccess(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCity = searchCity.trim();
    if (!trimmedCity) {
      setError('Please input a valid city name!');
      return;
    }
    fetchSearchWeatherInfo(trimmedCity);
    setSearchCity('');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Weather App</h1>

      <div className={styles.tabContainer}>
        <p
          className={`${styles.tab} ${currentTab === 'user' ? styles.activeTab : ''}`}
          onClick={() => switchTab('user')}
        >
          Your Weather
        </p>
        <p
          className={`${styles.tab} ${currentTab === 'search' ? styles.activeTab : ''}`}
          onClick={() => switchTab('search')}
        >
          Search Weather
        </p>
      </div>

      <div className={styles.weatherContainer}>
        {showGrantAccess && currentTab === 'user' && (
          <div className={styles.grantAccess}>
            <Image
              src="/location.png"
              alt="Location"
              width={80}
              height={80}
              className={styles.locationIcon}
            />
            <p className={styles.grantAccessTitle}>Grant Location Access</p>
            <p className={styles.grantAccessText}>
              Allow access to get weather information for your location.
            </p>
            <button onClick={getLocation} className={styles.grantAccessButton}>
              Grant Access
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        )}

        {currentTab === 'search' && (
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search for City..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <Image src="/search.png" alt="Search" width={20} height={20} />
            </button>
          </form>
        )}

        {loading && (
          <div className={styles.loading}>
            <Image
              src="/loading.gif"
              alt="Loading"
              width={150}
              height={150}
              unoptimized
              onError={() => console.error('Loading image failed to load')}
            />
            <p className={styles.loadingText}>Loading...</p>
          </div>
        )}

        {error && !showGrantAccess && currentTab === 'search' && (
          <div className={styles.error}>
            <Image
              src="/not-found.png"
              alt="Error"
              width={250}
              height={250}
              className={styles.errorImage}
            />
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {weatherData && !loading && !error && (
          <div className={styles.weatherInfo}>
            <div className={styles.cityContainer}>
              <p className={styles.cityName}>{weatherData.name}</p>
              <Image
                src={`https://flagcdn.com/144x108/${weatherData.sys.country.toLowerCase()}.png`}
                alt="Country Flag"
                width={30}
                height={30}
              />
            </div>

            <p className={styles.weatherDescription}>{weatherData.weather[0].description}</p>

            <Image
              src={`http://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`}
              alt="Weather icon"
              width={50}
              height={50}
            />

            <p className={styles.temperature}>{`${weatherData.main.temp} °C`}</p>

            <div className={styles.parameterContainer}>
              <div className={styles.parameterCard}>
                <Image src="/wind.png" alt="Wind" width={50} height={50} />
                <p className={styles.parameterTitle}>Windspeed</p>
                <p>{`${weatherData.wind.speed} m/s`}</p>
              </div>

              <div className={styles.parameterCard}>
                <Image src="/humidity.png" alt="Humidity" width={50} height={50} />
                <p className={styles.parameterTitle}>Humidity</p>
                <p>{`${weatherData.main.humidity}%`}</p>
              </div>

              <div className={styles.parameterCard}>
                <Image src="/cloud.png" alt="Cloud" width={50} height={50} />
                <p className={styles.parameterTitle}>Clouds</p>
                <p>{`${weatherData.clouds.all}%`}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}