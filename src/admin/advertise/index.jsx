import {useEffect, useState} from "react";
import {useLocation} from 'react-router';
import {useSelector, useDispatch} from "react-redux";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, MenuItem, Select, TextField, InputAdornment, Tooltip,
  Pagination, PaginationItem, Popover, IconButton, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CountryFlag from "react-country-flag";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Spinner from "../../components/ui/Spinner";
import {getAllAds, getTotalAds, updateAdStatus} from "../../store/actions/adminAction";

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

const AdminAds = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const ads = useSelector((state) => state.admin.advertise) || [];
  const { page, pageSize, total } = useSelector((state) => state.admin.adsPagination);
  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [adToDelete, setAdToDelete] = useState(null);
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });

  useEffect(() => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { adsPagination: { page: 1, pageSize: 10, total: 0 } }
    });
  }, [location.pathname]);

  useEffect(() => {
    dispatch(getTotalAds());
    if (page === 1) {
      dispatch(getAllAds({ page: 1, status, keyword }));
    }
  }, [dispatch]);

  const handlePageChange = (event, value) => {
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: { adsPagination: { page: value, pageSize, total } }
    });
    dispatch(getAllAds({ page: value, status, keyword }));
  };

  const handleStateChange = (ad, newState) => {
    return dispatch(updateAdStatus({ id: ad.id, state: newState }));
  };

  // updateDoc(adSnap, { expire, state: newState }).then((res) => {
  //   sendRequest("/cron/send_email", "POST", {
  //     email: ad.email,
  //     subject: "Advertisement was published.",
  //     text: `Your advertisement ${ad.name} was publised.`,
  //     html: `Your advertisement <b>${ad.name}</b>  was publised.`,
  //   });
  // });
  const handleDeleteClick = (event, ad) => {
    setAnchorEl(event.currentTarget);
    setAdToDelete(ad);
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    setLoadingAction({ id: adToDelete.id, type: "delete" });
    try {
      await dispatch(deleteAd(adToDelete.id));
      setAnchorEl(null);
      setAdToDelete(null);
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const handleCancelDelete = () => {
    setAnchorEl(null);
    setAdToDelete(null);
  };

  const handleApproveAd = async (ad) => {
    setLoadingAction({ id: ad.id, type: "approve" });
    try {
      await handleStateChange(ad, 'Approved');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const handleRejectAd = async (ad) => {
    setLoadingAction({ id: ad.id, type: "reject" });
    try {
      await handleStateChange(ad, 'Rejected');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  return (
    <>
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
            <MenuItem value={"all"}>All</MenuItem>
            <MenuItem value={"Pending"}>Pending</MenuItem>
            <MenuItem value={"Approved"}>Approved</MenuItem>
            <MenuItem value={"Rejected"}>Rejected</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Search"
          sx={{ width: 220, '& .MuiInputBase-input': { padding: '5px' } }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyUp={(e) => {
            if (e.keyCode === 13) {
              dispatch(getAllAds({ page: 1, status, keyword }));
              dispatch(getTotalAds({ status, keyword }));
            }
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
        <TableContainer component={Paper} elevation={0} sx={{ overflowX: "auto", p: 2, maxWidth: "100%" }}>
          <Table sx={{ width: "100%", boxSizing: "border-box", tableLayout: "fixed" }} aria-label="responsive table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "4%", p: 1 }}>No</TableCell>
                <TableCell align="left" sx={{ width: "6%", p: 1 }}>Status</TableCell>
                <TableCell align="left" sx={{ width: "12%", p: 1 }}>Email</TableCell>
                <TableCell align="left" sx={{ width: "14%", p: 1 }}>Name</TableCell>
                <TableCell align="left" sx={{ width: "18%", p: 1 }}>Link</TableCell>
                <TableCell align="left" sx={{ width: "10%", p: 1 }}>Media</TableCell>
                <TableCell align="left" sx={{ width: "7%", p: 1 }}>Country</TableCell>
                <TableCell align="left" sx={{ width: "12%", p: 1 }}>
                  <div className="border-b border-b-[#BEBEBE]">Budget</div>
                  <div className="border-b border-b-[#BEBEBE]">Publish Date</div>
                  <div>Days</div>
                </TableCell>
                <TableCell align="left" sx={{ width: "7%", p: 1 }}>Billing Status</TableCell>
                <TableCell align="left" sx={{ width: "10%", p: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ads.map((ad, index) => (
                <TableRow key={ad.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ width: "4%", p: 1 }}>
                    {index + 1 + (page - 1) * pageSize}
                  </TableCell>
                  <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={ad.state || ""} arrow>
                      <span>
                        {getStatusIcon(ad.state)}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={ad.email || ""} arrow>
                      <div className="table-cell-ellipsis">{ad.email}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "14%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={ad.name || ad.title || ""} arrow>
                      <div className="table-cell-ellipsis">{ad.name || ad.title}</div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "18%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={ad.productLink || ""} arrow>
                      <div className="table-cell-ellipsis">
                        <a
                          href={ad.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          {ad.productLink}
                        </a>
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="relative group inline-block cursor-pointer" style={{ width: "100%" }}>
                      <img
                        src={ad.imageUrl}
                        className="w-12 h-12 object-cover rounded"
                        alt="ad"
                      />
                      <div className="absolute z-50 left-full top-0 ml-2 w-[180px] h-auto object-cover hidden group-hover:block">
                        <img
                          src={ad.imageUrl}
                          className="w-[180px] h-auto object-cover"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "7%", textOverflow: "ellipsis", p: 1 }}>
                    <Tooltip title={ad.country?.label || ad.countryCode || ""} arrow>
                      <span className="flex items-center justify-center h-full cursor-pointer table-cell-ellipsis">
                        {ad.country && ad.country.countryCode ? (
                          <CountryFlag countryCode={ad.country.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : ad.countryCode ? (
                          <CountryFlag countryCode={ad.countryCode} svg style={{ fontSize: "2em", verticalAlign: "middle" }} />
                        ) : (
                          ad.countryCode
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="table-cell-ellipsis">
                      <div className="border-b border-b-[#BEBEBE]">
                        {ad.currencySymbol}
                        {ad.budget}
                      </div>
                      <div className="border-b border-b-[#BEBEBE]">
                        {ad.pubDate && ad.pubDate.toDate ? ad.pubDate.toDate().toLocaleDateString() : ""}
                      </div>
                      <div>{ad.days}</div>
                    </div>
                  </TableCell>
                  <TableCell sx={{ width: "7%", textOverflow: "ellipsis", p: 1 }}>
                    {getBilledIcon(ad.billed)}
                  </TableCell>
                  <TableCell sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>
                    <div className="flex gap-1.5 items-center">
                      <Tooltip title="Approve">
                        <IconButton
                          onClick={() => handleApproveAd(ad)}
                          size="small"
                          color="success"
                          className="admin-ads-action-btn"
                          disabled={ad.state === 'Approved' || (loadingAction.id === ad.id && loadingAction.type)}
                        >
                          {loadingAction.id === ad.id && loadingAction.type === "approve" ? (
                            <Spinner size={18} />
                          ) : (
                            <ThumbUpIcon fontSize="small" className="admin-ads-action-svg" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          onClick={() => handleRejectAd(ad)}
                          size="small"
                          color="error"
                          className="admin-ads-action-btn"
                          disabled={ad.state === 'Rejected' || (loadingAction.id === ad.id && loadingAction.type)}
                        >
                          {loadingAction.id === ad.id && loadingAction.type === "reject" ? (
                            <Spinner size={18} />
                          ) : (
                            <ThumbDownIcon fontSize="small" className="admin-ads-action-svg" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        onClick={(e) => handleDeleteClick(e, ad)}
                        size="small"
                        className="admin-ads-action-btn"
                        disabled={loadingAction.id === ad.id && loadingAction.type}
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
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCancelDelete}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <div style={{ padding: 12, maxWidth: 220 }}>
            <Typography>Delete this ad?</Typography>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8 }}>
              <IconButton onClick={handleCancelDelete} size="small"><CloseIcon fontSize="small" /></IconButton>
              <IconButton onClick={handleConfirmDelete} color="error" size="small" disabled={loadingAction.id === adToDelete?.id && loadingAction.type === "delete"}>
                {loadingAction.id === adToDelete?.id && loadingAction.type === "delete" ? <Spinner size={18} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </div>
          </div>
        </Popover>
      </div>
    </>
  );
};

export default AdminAds;
