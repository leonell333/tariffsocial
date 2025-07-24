import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {useSelector, useDispatch} from 'react-redux';
import {db, storage, storageBucket} from "../../firebase";
import {doc, updateDoc} from "firebase/firestore";
import {sendRequest} from '../../utils';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import {FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip, IconButton, Popover, 
  Typography} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import DeleteIcon from '@mui/icons-material/Delete';
import Spinner from '../../components/ui/Spinner';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import CountryFlag from "react-country-flag";
import {getAllSponsored, getTotalSponsored, deleteSponsored} from '../../store/actions/adminAction';

const stripeBackend = import.meta.env.VITE_BACKEND;

const AdminSponsored = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const sponsoreds = useSelector(state => state.admin.sponsored) || [];
  const pagination = useSelector(state => state.admin.pagination);
  const { page, pageSize, total } = pagination;
  const [billedStatus, setBilledStatus] = useState("all");
  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [sponsoredToDelete, setSponsoredToDelete] = useState(null);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { page: 1, pageSize: 10, total: 0 } }
    });
  }, [location.pathname]);

  useEffect(() => {
    dispatch(getTotalSponsored());
    if (page === 1) {
      dispatch(getAllSponsored({ page: 1, status, keyword }));
    }
  }, [dispatch]);

  const handlePageChange = (event, value) => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { pagination: { ...pagination, page: value } }
    });
    dispatch(getAllSponsored({ page: value, status, keyword }));
  };

  const handleStateChange = (sponsored, newState) => {
    if (newState === "Approved") {
      let expire = new Date(sponsored.pubDate.toDate());
      expire.setDate(expire.getDate() + 7);
      const sponsoredSnap = doc(db, "sponsored", sponsored.id);
      updateDoc(sponsoredSnap, { expire, state: newState }).then(() => {
        sendRequest('/cron/send_email', 'POST', {
          email: sponsored.email,
          subject: 'Sponsored content was published.',
          text: `Your sponsored content ${sponsored.title} was publised.`,
          html: `Your sponsored content <b>${sponsored.title}</b>  was publised.`
        });
        // Optionally, refresh the list
        dispatch(getAllSponsored());
      });
    } else {
      const sponsoredSnap = doc(db, "sponsored", sponsored.id);
      updateDoc(sponsoredSnap, { state: newState }).then(() => {
        dispatch(getAllSponsored());
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <Tooltip title="Approved"><CheckCircleIcon fontSize="small" sx={{ color: 'green' }} /></Tooltip>;
      case 'Rejected':
        return <Tooltip title="Rejected"><CancelIcon fontSize="small" sx={{ color: 'red' }} /></Tooltip>;
      default:
        return <Tooltip title={status || 'Pending'}><HourglassEmptyIcon fontSize="small" sx={{ color: 'green' }} /></Tooltip>;
    }
  };

  const getBilledIcon = (billed) => (
    billed
      ? <Tooltip title="Billed"><CheckCircleIcon sx={{ color: 'green' }} fontSize="small" /></Tooltip>
      : <Tooltip title="UnBilled"><CancelIcon sx={{ color: 'gray' }} fontSize="small" /></Tooltip>
  );

  const handleApproveSponsored = async (sponsored) => {
    setLoadingAction({ id: sponsored.id, type: 'approve' });
    try {
      await handleStateChange(sponsored, 'Approved');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };
  const handleRejectSponsored = async (sponsored) => {
    setLoadingAction({ id: sponsored.id, type: 'reject' });
    try {
      await handleStateChange(sponsored, 'Rejected');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };
  const handleDeleteClick = (event, sponsored) => {
    setAnchorEl(event.currentTarget);
    setSponsoredToDelete(sponsored);
  };
  const handleConfirmDelete = async () => {
    if (!sponsoredToDelete) return;
    setLoadingAction({ id: sponsoredToDelete.id, type: 'delete' });
    try {
      await dispatch(deleteSponsored(sponsoredToDelete.id));
      setAnchorEl(null);
      setSponsoredToDelete(null);
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };
  const handleCancelDelete = () => {
    setAnchorEl(null);
    setSponsoredToDelete(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 my-4 w-full justify-end">
        <FormControl sx={{ width: 100 }}>
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
            <MenuItem value={"Pending"} sx={{ fontSize: '15px' }}>Pending</MenuItem>
            <MenuItem value={"Approved"} sx={{ fontSize: '15px' }}>Approved</MenuItem>
            <MenuItem value={"Rejected"} sx={{ fontSize: '15px' }}>Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ width: 100 }}>
          <InputLabel id="billing-status-label">Billing Status</InputLabel>
          <Select
            labelId="billing-status-label"
            id="billing-status"
            value={billedStatus}
            label="Billing Status"
            onChange={(e) => setBilledStatus(e.target.value)}
            sx={{
              '& .MuiSelect-select': { padding: '5px' },
              '& .MuiInputBase-root': { padding: '5px' },
              padding: '0px'
            }}
          >
            <MenuItem value={"all"} sx={{ fontSize: '15px' }}>All</MenuItem>
            <MenuItem value={"Billed"} sx={{ fontSize: '15px' }}>Billed</MenuItem>
            <MenuItem value={"UnBilled"} sx={{ fontSize: '15px' }}>UnBilled</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label=""
          sx={{ width: 200, '& .MuiInputBase-input': { padding: '5px' } }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyUp={(e) => {
            if (e.keyCode === 13) setKeyword(keyword);
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
      <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
        <input type="hidden" id="jsonData" name="jsonPayload" />
      </form>
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
                <TableCell sx={{ width: "4%", p: 1 }}>No</TableCell>
                <TableCell align="left" sx={{ width: "6%", p: 1 }}>Status</TableCell>
                <TableCell align="left" sx={{ width: "12%", p: 1 }}>Email</TableCell>
                <TableCell align="left" sx={{ width: "14%", p: 1 }}>Title</TableCell>
                <TableCell align="left" sx={{ width: "18%", p: 1 }}>Link</TableCell>
                <TableCell align="left" sx={{ width: "12%", p: 1 }}>Media</TableCell>
                <TableCell align="left" sx={{ width: "7%", p: 1 }}>Country</TableCell>
                <TableCell align="left" sx={{ width: "12%", p: 1 }}>
                  <div className="border-b border-b-[#BEBEBE]">Budget/Day</div>
                  <div className="border-b border-b-[#BEBEBE]">Publish Date</div>
                  <div>Days</div>
                </TableCell>
                <TableCell align="left" sx={{ width: "7%", p: 1 }}>Billing Status</TableCell>
                <TableCell align="left" sx={{ width: "8%", p: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsoreds.map((sponsored, index) => (
                <TableRow key={sponsored.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ width: "4%", p: 1 }}>
                    {index + 1 + (page - 1) * pageSize}
                  </TableCell>
                  <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={sponsored.state || ""} arrow>
                      <span>{getStatusIcon(sponsored.state)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={sponsored.email || ""} arrow>
                      <div className="table-cell-ellipsis">{sponsored.email}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "14%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={sponsored.title || ""} arrow>
                      <div className="table-cell-ellipsis">{sponsored.title}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "18%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={sponsored.link || ""} arrow>
                      <div className="table-cell-ellipsis">
                        <a
                          href={sponsored.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          {sponsored.link}
                        </a>
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="relative group inline-block cursor-pointer" style={{ width: "100%" }}>
                      {sponsored.imageFile && (
                        <img
                          src={sponsored.imageFile}
                          className="w-12 h-12 object-cover rounded"
                          alt="sponsored"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "7%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={sponsored.country?.label || sponsored.countryCode || ""} arrow>
                      <span className="flex items-center justify-center h-full cursor-pointer table-cell-ellipsis">
                        {sponsored.country && sponsored.country.countryCode ? (
                          <CountryFlag countryCode={sponsored.country.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : sponsored.countryCode ? (
                          <CountryFlag countryCode={sponsored.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : (
                          sponsored.countryCode
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="table-cell-ellipsis">
                      <div className="border-b border-b-[#BEBEBE]">
                        {sponsored.currencySymbol || '$'}
                        {sponsored.budget}
                      </div>
                      <div className="border-b border-b-[#BEBEBE]">
                        {sponsored.pubDate && sponsored.pubDate.toDate ? sponsored.pubDate.toDate().toLocaleDateString() : ""}
                      </div>
                      <div>{sponsored.days}</div>
                    </div>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "7%", textOverflow: "ellipsis", p: 1 }}>
                    {getBilledIcon(sponsored.billed)}
                  </TableCell>
                  <TableCell align="left" sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="flex gap-1.5 items-center">
                      <Tooltip title="Approve">
                        <span>
                          <IconButton
                            onClick={() => handleApproveSponsored(sponsored)}
                            size="small"
                            color="success"
                            className="admin-ads-action-btn"
                            disabled={sponsored.state === 'Approved' || (loadingAction.id === sponsored.id && loadingAction.type)}
                          >
                            {loadingAction.id === sponsored.id && loadingAction.type === 'approve' ? (
                              <Spinner size={18} />
                            ) : (
                              <ThumbUpIcon fontSize="small" className="admin-ads-action-svg" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span>
                          <IconButton
                            onClick={() => handleRejectSponsored(sponsored)}
                            size="small"
                            color="error"
                            className="admin-ads-action-btn"
                            disabled={sponsored.state === 'Rejected' || (loadingAction.id === sponsored.id && loadingAction.type)}
                          >
                            {loadingAction.id === sponsored.id && loadingAction.type === 'reject' ? (
                              <Spinner size={18} />
                            ) : (
                              <ThumbDownIcon fontSize="small" className="admin-ads-action-svg" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <IconButton
                        onClick={(e) => handleDeleteClick(e, sponsored)}
                        size="small"
                        className="admin-ads-action-btn"
                        disabled={loadingAction.id === sponsored.id && loadingAction.type}
                      >
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
      </div>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCancelDelete}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <div style={{ padding: 12, maxWidth: 220 }}>
          <Typography>Delete this sponsored?</Typography>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8 }}>
            <IconButton onClick={handleCancelDelete} size="small"><CloseIcon fontSize="small" /></IconButton>
            <IconButton onClick={handleConfirmDelete} color="error" size="small" disabled={loadingAction.id === sponsoredToDelete?.id && loadingAction.type === 'delete'}>
              {loadingAction.id === sponsoredToDelete?.id && loadingAction.type === 'delete' ? <Spinner size={18} /> : <DeleteIcon fontSize="small" />}
            </IconButton>
          </div>
        </div>
      </Popover>
    </>
  );
};

export default AdminSponsored;
