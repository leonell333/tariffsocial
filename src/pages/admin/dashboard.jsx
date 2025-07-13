import React from 'react';
import { useSelector } from 'react-redux';
import AdAnalytics from '../../components/advertise/AdAnalytics';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Users, TrendingUp, DollarSign, Eye } from 'lucide-react';

const AdminDashboard = () => {
  const user = useSelector(state => state.user);

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome back, {user.name || user.email}
        </Typography>
      </div>

      {/* Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    1,234
                  </Typography>
                </Box>
                <Users size={24} color="#666" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Ads
                  </Typography>
                  <Typography variant="h4" component="div">
                    45
                  </Typography>
                </Box>
                <Eye size={24} color="#666" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Revenue Today
                  </Typography>
                  <Typography variant="h4" component="div">
                    $234
                  </Typography>
                </Box>
                <DollarSign size={24} color="#666" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Growth Rate
                  </Typography>
                  <Typography variant="h4" component="div">
                    +12%
                  </Typography>
                </Box>
                <TrendingUp size={24} color="#666" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ad Analytics */}
      <AdAnalytics />
    </div>
  );
};

export default AdminDashboard; 