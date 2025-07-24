import React, {useState, useRef} from 'react';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {Calendar} from 'lucide-react';
import {Select, MenuItem, OutlinedInput, InputAdornment} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';

export default function UserGrowthChart({ data, totalUser, totalPost, totalAd, totalSponsored, unit = 'month', onUnitChange, onDateChange }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const calendarIconRef = useRef(null);

  const legendFormatter = (value, entry) => {
    let total = 0;
    if (entry.dataKey === 'users') total = totalUser;
    if (entry.dataKey === 'posts') total = totalPost;
    if (entry.dataKey === 'ads') total = totalAd;
    if (entry.dataKey === 'sponsored') total = totalSponsored;
    return <span>{value} <span style={{ color: '#000' }}>({total})</span></span>;
  };

  const handleChange = (e) => {
    if (onUnitChange) onUnitChange(e.target.value);
  };


  const handleCalendarClick = (e) => {
    e.stopPropagation();
    setCalendarOpen((prev) => !prev);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    if (onDateChange) onDateChange(date);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-800">Basic Analysis ({unit})</h3>
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <Select 
              value={unit}
              onChange={handleChange}
              className="select rounded pl-2 pr-10 appearance-none focus:outline-none focus:ring-0 focus:border-none custom-select-root"
              MenuProps={{
                PaperProps: {
                  className: 'custom-dropdown-menu',
                },
              }}
              size="small"
              IconComponent={() => null}
            >
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
            <span
              ref={calendarIconRef}
              onClick={handleCalendarClick}
              className="absolute top-1/2 right-0 p-2 -translate-y-1/2 flex items-center cursor-pointer z-20"
            >
              <Calendar className="text-gray-400" size={20} />
            </span>
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                textField: { style: { display: 'none' } },
                popper: {
                  anchorEl: calendarIconRef.current,
                },
              }}
              disableFuture={false}
              PopperProps={{
                placement: 'bottom-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [-50, 8],
                    },
                  },
                ],
              }}
            />
          </LocalizationProvider>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }} 
          />
          <Legend formatter={legendFormatter} />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Users" 
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="posts" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Posts" 
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="ads" 
            stroke="#f59e42" 
            strokeWidth={3}
            name="Banners"
            dot={{ fill: '#f59e42', strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="sponsored" 
            stroke="#a855f7" 
            strokeWidth={3}
            name="Sponsored"
            dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
