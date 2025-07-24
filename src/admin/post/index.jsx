import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { useLocation } from 'react-router';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, MenuItem, Select, TextField, InputAdornment, Tooltip, Pagination, PaginationItem} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Spinner from '../../components/ui/Spinner';
import {deletePost as deletePostAction} from '../../store/actions/postActions';
import {getAllPost, updatePostStatus, getTotalPosts} from '../../store/actions/adminAction';

const AdminPosts = () => {
  const dispatch = useDispatch();
  const posts = useSelector(state => state.admin.post);
  const { page, pageSize, total } = useSelector(state => state.admin.pagination);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  // Removed loadingDelete, use loadingAction instead
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });

  
  useEffect(() => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { page: 1, pageSize: 10, total: 0 } }
    });
  }, [location.pathname]);

  useEffect(() => {
    dispatch(getTotalPosts());
    if (page === 1) {
      dispatch(getAllPost({ page: 1 }));
    }
  }, [dispatch]);

  const handlePageChange = (event, value) => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { page: value, pageSize, total } }
    });
    dispatch(getAllPost({ page: value }));
  };

  const TABLE_HEAD = [
    { label: 'No', value: '', width: '4%' },
    { label: 'Photo', value: '', width: '5%' },
    { label: 'Name', value: 'username', width: '15%' },
    { label: 'Email', value: 'email', width: '14%' },
    { label: 'Content', value: 'contentText', width: '23%' },
    { label: 'Time', value: 'createdAt', width: '12%' },
    { label: 'Status', value: 'state', width: '10%' },
    { label: 'Action', value: '', width: '17%' },
  ];

  const updatePostState = (post, state) => {
    dispatch(updatePostStatus({ id: post.id, state }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <Tooltip title="Approved"><CheckCircleIcon fontSize="small" sx={{ color: 'green' }} /></Tooltip>;
      case 'Rejected':
        return <Tooltip title="Rejected"><CancelIcon fontSize="small" sx={{ color: 'red' }} /></Tooltip>;
      default:
        return <Tooltip title={status || 'Pending'}><CheckCircleIcon fontSize="small" sx={{ color: 'green' }} /></Tooltip>;
    }
  };

  const handleDeleteClick = (event, post) => {
    setAnchorEl(event.currentTarget);
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      setLoadingAction({ id: postToDelete.id, type: 'delete' });
      try {
        await dispatch(deletePostAction({ id: postToDelete.id, ownerId: postToDelete.ownerId }));
      } catch (err) {
        console.error('Delete error:', err);
      }
      setLoadingAction({ id: null, type: null });
    }
    setAnchorEl(null);
    setPostToDelete(null);
  };

  const handleCancelDelete = () => {
    setAnchorEl(null);
    setPostToDelete(null);
  };

  const handleApprovePost = async (post) => {
    setLoadingAction({ id: post.id, type: 'approve' });
    try {
      await dispatch(updatePostStatus({ id: post.id, state: 'Approved' }));
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };
  const handleRejectPost = async (post) => {
    setLoadingAction({ id: post.id, type: 'reject' });
    try {
      await dispatch(updatePostStatus({ id: post.id, state: 'Rejected' }));
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 my-4 w-full justify-end">
        <FormControl sx={{ width: 120 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
            sx={{
              '& .MuiSelect-select': { padding: '5px' },
              '& .MuiInputBase-root': { padding: '5px' },
              padding: '0px'
            }}
          >
            <MenuItem value={"all"} sx={{ fontSize: '15px' }}>All</MenuItem>
            <MenuItem value={"Approved"} sx={{ fontSize: '15px' }}>Approved</MenuItem>
            <MenuItem value={"Rejected"} sx={{ fontSize: '15px' }}>Rejected</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label=""
          sx={{ width: 220, '& .MuiInputBase-input': { padding: '5px' } }}
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.keyCode === 13) setKeyword(keywordInput);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ pl: '0px', mr: 0 }}>
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>
      <div className="responsive-table-wrapper w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ overflowX: "auto", p: 2, maxWidth: "100%" }}
        >
          <Table
            sx={{ width: "100%", boxSizing: "border-box", tableLayout: "fixed" }}
            aria-label="responsive table"
          >
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((head) => (
                  <TableCell key={head.label} sx={{ width: head.width, p: 1 }}>{head.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post, index) => (
                <TableRow key={post.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ width: TABLE_HEAD[0].width, p: 1 }}>
                    <div className="table-cell-ellipsis">{index + 1 + (page - 1) * pageSize}</div>
                  </TableCell>
                  {/* Photo */}
                  <TableCell sx={{ width: TABLE_HEAD[1].width, p: 1 }}>
                    <img
                      src={post.userPhoto}
                      alt={post.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </TableCell>
                  {/* Name */}
                  <TableCell sx={{ width: TABLE_HEAD[2].width, textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={post.username || ''} arrow>
                      <div className="table-cell-ellipsis">{post.username}</div>
                    </Tooltip>
                  </TableCell>
                  {/* Email */}
                  <TableCell sx={{ width: TABLE_HEAD[3].width, textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={post.email || ''} arrow>
                      <div className="table-cell-ellipsis">{post.email}</div>
                    </Tooltip>
                  </TableCell>
                  {/* Content */}
                  <TableCell sx={{ width: TABLE_HEAD[4].width, textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={post.contentText || ''} arrow>
                      <div className="table-cell-ellipsis">{post.contentText}</div>
                    </Tooltip>
                  </TableCell>
                  {/* Time */}
                  <TableCell sx={{ width: TABLE_HEAD[5].width, textOverflow: 'ellipsis', p: 1 }}>
                    <Tooltip title={post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : ''} arrow>
                      <div className="table-cell-ellipsis">
                        {post.createdAt?.toDate ?
                          new Date(post.createdAt.toDate()).toLocaleDateString() :
                          ''}
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ width: TABLE_HEAD[6].width, textOverflow: 'ellipsis', p: 1 }}>
                    <div className="table-cell-ellipsis">
                      {getStatusIcon(post.state)}
                    </div>
                  </TableCell>
                  <TableCell sx={{ width: TABLE_HEAD[7].width, textOverflow: 'ellipsis', p: 1 }}>
                    <div className="flex items-center">
                      <Tooltip title="Reject">
                        <IconButton
                          onClick={() => handleRejectPost(post)}
                          size="small"
                          color="error"
                          disabled={loadingAction.id === post.id && loadingAction.type === 'reject'}
                        >
                          {loadingAction.id === post.id && loadingAction.type === 'reject' ? (
                            <Spinner size={18} />
                          ) : (
                            <ThumbDownIcon fontSize="small" className="admin-ads-action-svg" />
                          )}
                        </IconButton>
                      </Tooltip>
                      {post.state === "Rejected" && (
                        <Tooltip title="Approve">
                          <IconButton
                            onClick={() => handleApprovePost(post)}
                            size="small"
                            color="success"
                            disabled={loadingAction.id === post.id && loadingAction.type === 'approve'}
                          >
                            {loadingAction.id === post.id && loadingAction.type === 'approve' ? (
                              <Spinner size={18} />
                            ) : (
                              <ThumbUpIcon fontSize="small" className="admin-ads-action-svg" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton onClick={(e) => handleDeleteClick(e, post)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <div className="flex justify-center my-4">
            <Pagination color="primary"
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
            <Typography>Delete this post?</Typography>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8 }}>
              <IconButton onClick={handleCancelDelete} size="small"><CloseIcon fontSize="small" /></IconButton>
              <IconButton onClick={handleConfirmDelete} color="error" size="small" disabled={loadingAction.type === 'delete' && loadingAction.id === postToDelete?.id}>
                {loadingAction.type === 'delete' && loadingAction.id === postToDelete?.id ? <Spinner size={18} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default AdminPosts;
