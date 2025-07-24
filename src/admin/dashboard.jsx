
import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {getTotalUsers, getUserAndPostGrowthData, getAllTotals} from '../store/actions/adminAction';
// import AdAnalytics from '../../components/advertise/AdAnalytics';
import {motion} from 'framer-motion';
import StatCard from '../components/ui/StatCard';
import { Users, TrendingUp, DollarSign, Eye, ArrowUpRight, ArrowDownRight, Calendar, Filter } from 'lucide-react';
import UserGrowthChart from '../components/charts/UserGrowthChart';
import EngagementChart from '../components/charts/EngagementChart';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const totalUser = useSelector(state => state.admin.totalUser);
  const totalPost = useSelector(state => state.admin.totalPost);
  const totalAd = useSelector(state => state.admin.totalAd);
  const totalSponsored = useSelector(state => state.admin.totalSponsored);
  const [growthData, setGrowthData] = useState([]);
  const [unit, setUnit] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    dispatch(getTotalUsers());
    dispatch(getAllTotals());
    (async () => {
      const data = await dispatch(getUserAndPostGrowthData(unit));
      setGrowthData(data);
    })();
  }, [dispatch, unit]);

  // Handler for date selection from calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (unit === 'day' && date) {
      // Format: 'Thu 6' (matching label in growthData)
      const label = `${date.format('ddd')} ${date.date()}`;
      const filtered = growthData.filter(item => item.label === label);
      setGrowthData(filtered.length > 0 ? filtered : []);
    } else {
      // Refetch all data for other units or if date is cleared
      (async () => {
        const data = await dispatch(getUserAndPostGrowthData(unit));
        setGrowthData(data);
      })();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-108px)] bg-white rounded-xl p-6 text-black space-y-6 overflow-y-auto" style={{ fontFamily: 'poppins' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          className="admin-card"
          title="Total Users"
          value={totalUser}
          change={"+5%"}
          isPositive={true}
          icon={<ArrowUpRight size={16} />}
          description="Since last week"
        />
        <StatCard
          className="admin-card"
          title="Active Ads"
          value={45}
          change={"-2%"}
          isPositive={false}
          icon={<ArrowDownRight size={16} />}
          description="Active this week"
        />
        <StatCard
          className="admin-card"
          title="Revenue Today"
          value={"$234"}
          change={"+8%"}
          isPositive={true}
          icon={<ArrowUpRight size={16} />}
          description="Compared to yesterday"
        />
        <StatCard
          className="admin-card"
          title="Growth Rate"
          value={"+12%"}
          change={"+1.2%"}
          isPositive={true}
          icon={<ArrowUpRight size={16} />}
          description="This month"
        />
      </div>

      <UserGrowthChart 
        data={growthData} 
        totalUser={totalUser}
        totalPost={totalPost}
        totalAd={totalAd}
        totalSponsored={totalSponsored}
        unit={unit}
        onUnitChange={setUnit}
        onDateChange={handleDateChange}
      />
        {/* <EngagementChart /> */}
    </div>
    
  );
};

export default AdminDashboard;
