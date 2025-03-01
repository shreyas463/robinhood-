'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, CircularProgress } from '@mui/material';
import SearchBar from '../components/SearchBar';
import StockChart from '../components/StockChart';
import CandlestickChart from '../components/CandlestickChart';
import NewsSection from '../components/NewsSection';
import TradingPanel from '../components/TradingPanel';
import TopGainers from '../components/TopGainers';
import Discussion from '@/components/Discussion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:5001';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'market' | 'discussion'>('market');
  const router = useRouter();

  const fetchStockData = async (symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/stock/${symbol}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setStockData(data);
      setSelectedStock(symbol);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: 'grey.900'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#1E2132' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            bgcolor: '#2A2D3E',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                color: '#69f0ae', 
                fontWeight: 'bold',
                letterSpacing: '-0.5px'
              }}
            >
              Stockerr Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveTab('market')}
                sx={{
                  bgcolor: activeTab === 'market' ? '#69f0ae' : '#3A3D4E',
                  color: activeTab === 'market' ? '#1E2132' : '#fff',
                  '&:hover': { bgcolor: activeTab === 'market' ? '#4caf50' : '#4A4D5E' }
                }}
              >
                Market
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveTab('discussion')}
                sx={{
                  bgcolor: activeTab === 'discussion' ? '#69f0ae' : '#3A3D4E',
                  color: activeTab === 'discussion' ? '#1E2132' : '#fff',
                  '&:hover': { bgcolor: activeTab === 'discussion' ? '#4caf50' : '#4A4D5E' }
                }}
              >
                Discussion
              </Button>
              <Button 
                variant="outlined" 
                onClick={logout}
                sx={{ 
                  borderColor: '#ff5252',
                  color: '#ff5252',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  '&:hover': { 
                    bgcolor: 'rgba(255, 82, 82, 0.1)',
                    borderColor: '#ff5252'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
          <SearchBar onStockSelect={(symbol: string) => setSelectedStock(symbol)} />
        </Paper>

        {activeTab === 'market' ? (
          <>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '2 1 600px', minWidth: 0 }}>
                {selectedStock ? (
                  <>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 4, 
                        mb: 4, 
                        borderRadius: 2, 
                        bgcolor: '#2A2D3E',
                        border: '1px solid',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: '#69f0ae', 
                          fontWeight: 'medium',
                          mb: 3
                        }}
                      >
                        {selectedStock} Candlestick Chart
                      </Typography>
                      <CandlestickChart symbol={selectedStock} />
                    </Paper>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 4, 
                        borderRadius: 2, 
                        bgcolor: '#2A2D3E',
                        border: '1px solid',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: '#69f0ae', 
                          fontWeight: 'medium',
                          mb: 3
                        }}
                      >
                        Latest News
                      </Typography>
                      <NewsSection symbol={selectedStock} />
                    </Paper>
                  </>
                ) : (
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 6, 
                      borderRadius: 2, 
                      bgcolor: '#2A2D3E',
                      border: '1px solid',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#9e9e9e' }}>
                      Search for a stock to view its chart and news
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    mb: 4, 
                    borderRadius: 2, 
                    bgcolor: '#2A2D3E',
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      color: '#69f0ae', 
                      fontWeight: 'medium',
                      mb: 3
                    }}
                  >
                    Top Gainers
                  </Typography>
                  <TopGainers />
                </Paper>
              </Box>
            </Box>

            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2, 
                bgcolor: '#2A2D3E',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <TradingPanel />
            </Paper>
          </>
        ) : (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2, 
              bgcolor: '#2A2D3E',
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Discussion />
          </Paper>
        )}
      </Box>
    </Container>
  );
} 