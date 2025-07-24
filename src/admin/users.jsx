import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {useSelector, useDispatch} from 'react-redux';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, 
  PaginationItem, IconButton, Tooltip, Popover, Typography} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Spinner from '../components/ui/Spinner';
import CloseIcon from '@mui/icons-material/Close';
import CountryFlag from "react-country-flag";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {getAllUsers, getTotalUsers, deleteUser} from '../store/actions/adminAction';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const users = useSelector(state => state.admin.user) || [];
  const { page, pageSize, total } = useSelector(state => state.admin.pagination);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [keyword, setKeyword] = useState('');
  const location = useLocation();

  useEffect(() => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { page: 1, pageSize: 10, total: 0 } }
    });
  }, [location.pathname]);

  useEffect(() => {
    dispatch(getTotalUsers());
    dispatch(getAllUsers({ page, pageSize, keyword }));
  }, [dispatch, page, pageSize, keyword]);

  const handleView = (user) => {
    // TODO: Implement view user
    alert(`View user: ${user.username}`);
  };
  const handleEdit = (user) => {
  };
  const handleDeleteClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setUserToDelete(user);
  };
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setLoadingDelete(true);
    try {
      await dispatch(deleteUser(userToDelete.id));
      setAnchorEl(null);
      setUserToDelete(null);
    } finally {
      setLoadingDelete(false);
    }
  };
  const handleCancelDelete = () => {
    setAnchorEl(null);
    setUserToDelete(null);
  };

  const handlePageChange = (event, value) => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { page: value, pageSize, total } }
    });
    dispatch(getAllUsers({ page: value, pageSize, keyword }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <Tooltip title="Online"><CheckCircleIcon color="success" fontSize="small" /></Tooltip>;
      case 'offline':
        return <Tooltip title="Offline"><CancelIcon color="error" fontSize="small" /></Tooltip>;
      default:
        return <Tooltip title={status || 'Unknown'}><HourglassEmptyIcon color="disabled" fontSize="small" /></Tooltip>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 my-4 w-full justify-end">
        <TextField
          label=""
          sx={{ width: 220, '& .MuiInputBase-input': { padding: '5px' } }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyUp={(e) => {
            if (e.keyCode === 13) setKeyword(e.target.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className="responsive-table-wrapper w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
        <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto', p: 2, maxWidth: '100%' }}>
          <Table sx={{ width: '100%', boxSizing: 'border-box', tableLayout: 'fixed' }} aria-label="responsive table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '5%', p: 1 }}>No</TableCell>
                <TableCell sx={{ width: '7%', p: 1 }}>Photo</TableCell>
                <TableCell sx={{ width: '15%', p: 1 }}>Username</TableCell>
                <TableCell sx={{ width: '17%', p: 1 }}>Email</TableCell>
                <TableCell sx={{ width: '10%', p: 1 }}>Country</TableCell>
                <TableCell sx={{ width: '8%', p: 1 }}>Followers</TableCell>
                <TableCell sx={{ width: '8%', p: 1 }}>Posts</TableCell>
                <TableCell sx={{ width: '10%', p: 1 }}>Role</TableCell>
                <TableCell sx={{ width: '7%', p: 1 }}>Status</TableCell>
                <TableCell sx={{ width: '13%', p: 1 }}>Created At</TableCell>
                <TableCell sx={{ width: '10%', p: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ width: '5%', p: 1 }}>
                    <div className="table-cell-ellipsis">{index + 1 + (page - 1) * pageSize}</div>
                  </TableCell>
                  <TableCell sx={{ width: '7%', p: 1 }}>
                    <img
                      src={user.photoUrl}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell sx={{ width: '15%', textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={user.username || ''} arrow>
                      <div className="table-cell-ellipsis">{user.username}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: '17%', textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={user.email || ''} arrow>
                      <div className="table-cell-ellipsis">{user.email}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: '10%', textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={user.country?.label || user.countryCode || ''} arrow>
                      <span className="flex items-center justify-center h-full cursor-pointer table-cell-ellipsis">
                        {user.country && user.country.countryCode ? (
                          <CountryFlag countryCode={user.country.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : user.countryCode ? (
                          <CountryFlag countryCode={user.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : (
                          user.countryCode
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: '8%', p: 1 }}>{user.followerCount || 0}</TableCell>
                  <TableCell sx={{ width: '8%', p: 1 }}>{user.postCount || 0}</TableCell>
                  <TableCell sx={{ width: '10%', textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={user.role && typeof user.role === 'object' ? (user.role.admin ? 'admin' : user.role.moderator ? 'moderator' : 'user') : (user.role || 'user')} arrow>
                      <div className="table-cell-ellipsis">{user.role && typeof user.role === 'object' ? (user.role.admin ? 'admin' : user.role.moderator ? 'moderator' : 'user') : (user.role || 'user')}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: '7%', textOverflow: 'ellipsis', p: 1 }}>
                    {getStatusIcon(user.status)}
                  </TableCell>
                  <TableCell sx={{ width: '13%', textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={user.createdAt && user.createdAt.toDate ? user.createdAt.toDate().toLocaleString() : ''} arrow>
                      <div className="table-cell-ellipsis">{user.createdAt && user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString() : ''}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: '10%', p: 1 }}>
                    <div className="flex items-center gap-1.5">
                      <IconButton className="admin-ads-action-btn" size="small" onClick={() => handleEdit(user)}>
                      <EditIcon fontSize="small" /></IconButton>
                      <IconButton className="admin-ads-action-btn" size="small" onClick={(e) => handleDeleteClick(e, user)}>
                      <DeleteIcon fontSize="small" /></IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
       
        {total > 0 && (
          <div className="flex justify-center my-4">
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={handlePageChange}
              renderItem={(item) => (
                <PaginationItem
                  slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                  {...item}
                />
              )}
            />
          </div>
        )}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCancelDelete}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <div style={{ padding: 12, maxWidth: 220 }}>
            <Typography>Delete this user?</Typography>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8 }}>
              <IconButton onClick={handleCancelDelete} size="small"><CloseIcon fontSize="small" /></IconButton>
              <IconButton onClick={handleConfirmDelete} color="error" size="small" disabled={loadingDelete}>
                {loadingDelete ? <Spinner size={18} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default AdminUsers; 
