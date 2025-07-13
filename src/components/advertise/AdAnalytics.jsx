import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../firebase';
import { Card, CardContent, Typography, Box, Grid, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Eye, MousePointer } from 'lucide-react';

const AdAnalytics = () => {
  const user = useSelector(state => state.user);
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalClicks: 0,
    clickThroughRate: 0,
    directAdViews: 0,
    adsenseViews: 0,
    directAdClicks: 0,
    adsenseClicks: 0,
    revenue: 0
  });

  useEffect(() => {
    // Load analytics data from localStorage and calculate metrics
    const loadAnalyticsData = () => {
      const recentDirectAds = localStorage.getItem('recentDirectAds') || '[]';
      const recentClicks = localStorage.getItem('recentAdClicks') || '[]';
      
      const directAds = JSON.parse(recentDirectAds);
      const clicks = JSON.parse(recentClicks);
      
      const now = Date.now();
      const last24Hours = now - (24 * 60 * 60 * 1000);
      
      // Filter data for last 24 hours
      const recentDirectAdViews = directAds.filter(ad => 
        ad.type === 'direct' && ad.timestamp > last24Hours
      ).length;
      
      const recentAdsenseViews = directAds.filter(ad => 
        ad.type === 'adsense' && ad.timestamp > last24Hours
      ).length;
      
      const recentDirectClicks = clicks.filter(click => 
        click.type === 'direct' && click.timestamp > last24Hours
      ).length;
      
      const recentAdsenseClicks = clicks.filter(click => 
        click.type === 'adsense' && click.timestamp > last24Hours
      ).length;
      
      const totalViews = recentDirectAdViews + recentAdsenseViews;
      const totalClicks = recentDirectClicks + recentAdsenseClicks;
      const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      
      // Estimate revenue (this would normally come from your payment system)
      const estimatedRevenue = (recentDirectClicks * 0.50) + (recentAdsenseClicks * 0.01);
      
      setAnalyticsData({
        totalViews,
        totalClicks,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        directAdViews: recentDirectAdViews,
        adsenseViews: recentAdsenseViews,
        directAdClicks: recentDirectClicks,
        adsenseClicks: recentAdsenseClicks,
        revenue: Math.round(estimatedRevenue * 100) / 100
      });
    };

    loadAnalyticsData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend = null }) => (
    <Card sx={{ minWidth: 200, height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Icon size={24} color="#666" />
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend > 0 ? (
              <TrendingUp size={16} color="green" />
            ) : (
              <TrendingDown size={16} color="red" />
            )}
            <Typography 
              variant="body2" 
              color={trend > 0 ? "green" : "red"}
              ml={0.5}
            >
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Ad Performance Analytics
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={3}>
        Last 24 hours performance metrics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Views"
            value={analyticsData.totalViews}
            subtitle="Ad impressions"
            icon={Eye}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Clicks"
            value={analyticsData.totalClicks}
            subtitle="User interactions"
            icon={MousePointer}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CTR"
            value={`${analyticsData.clickThroughRate}%`}
            subtitle="Click-through rate"
            icon={TrendingUp}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value={`$${analyticsData.revenue}`}
            subtitle="Estimated earnings"
            icon={TrendingUp}
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ad Type Performance
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Direct Ads</Typography>
                  <Typography variant="body2">
                    {analyticsData.directAdViews} views, {analyticsData.directAdClicks} clicks
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={analyticsData.totalViews > 0 ? (analyticsData.directAdViews / analyticsData.totalViews) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">AdSense</Typography>
                  <Typography variant="body2">
                    {analyticsData.adsenseViews} views, {analyticsData.adsenseClicks} clicks
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={analyticsData.totalViews > 0 ? (analyticsData.adsenseViews / analyticsData.totalViews) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Insights
              </Typography>
              
              <Box>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  Direct Ad CTR: {analyticsData.directAdViews > 0 ? 
                    Math.round((analyticsData.directAdClicks / analyticsData.directAdViews) * 100 * 100) / 100 : 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  AdSense CTR: {analyticsData.adsenseViews > 0 ? 
                    Math.round((analyticsData.adsenseClicks / analyticsData.adsenseViews) * 100 * 100) / 100 : 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Revenue per click: ${analyticsData.totalClicks > 0 ? 
                    Math.round((analyticsData.revenue / analyticsData.totalClicks) * 100) / 100 : 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdAnalytics; 