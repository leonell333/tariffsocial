import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {Box, Button, TextField, Typography, useMediaQuery, useTheme} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import dayjs from "dayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import {currencies} from "../../consts";
import {
  getCampaigns,
  handlePaymentSession,
  renewCampaign,
  updateAdvertiseStore
} from "../../store/actions/advertiseAction";
import "./advertise.css";
import MyAds from './myAds';
import MySponsoreds from './mySponsored';
import CountryFlag from 'react-country-flag';

const stripeBackend = import.meta.env.VITE_BACKEND;

const MyCampaigns = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const paymentModal = useSelector((state) => state.base.paymentModal);
  const [campaigns, setCampaigns] = useState([]);
  const [billedStatus, setBilledStatus] = useState("all");
  const [status, setStatus] = useState("all");
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewType, setViewType] = useState('');

  let currencyList = currencies.map((c) => {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: c,
      currencyDisplay: "symbol",
    });
    const parts = formatter.formatToParts(1);
    const symbol = parts.find((p) => p.type === "currency")?.value || c;
    return { code: c, symbol };
  });

  useEffect(() => {
    getBannerAndSponsored();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("session_id");
    if (sessionId) {
      fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/stripe/session-status?session_id=${sessionId}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "complete") {
            const ad_id = urlParams.get("id");
            dispatch(handlePaymentSession(sessionId, ad_id, user.id))
              .then(() => {
                getBannerAndSponsored();
              })
              .catch((error) => {
                console.error("Error handling payment session:", error);
              });
          }
        });
    }
  }, []);

  const getBannerAndSponsored = async () => {
    try {
      const filters = {
        ownerId: user.id,
        billedStatus,
        status,
      };
      const campaignsData = await dispatch(getCampaigns(filters));
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const isExpired = (pubDate, days) => {
    if (!pubDate || !days) return false;
    const start = dayjs(pubDate.toDate ? pubDate.toDate() : pubDate);
    const end = start.add(Number(days), "day");
    return dayjs().isAfter(end, "day");
  };

  return (
    <div className="w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
      <div className="mx-5 pt-[15px] flex flex-row justify-end text-[16px] border-none">
        <div
          className={` px-6 rounded-lg cursor-pointer ${viewType === 'banner' ? ' bg-[#0e2841] border-none text-white' : 'text-[#161722] border border-[#0e2841]'}`}
          onClick={() => setViewType(viewType === 'banner' ? '' : 'banner')}
        >
          Banner
        </div>
        <div
          className={`ml-5 px-6 rounded-lg cursor-pointer ${viewType === 'sponsored' ? 'bg-[#0e2841] border-none text-white' : 'text-[#161722] border border-[#0e2841]'}`}
          onClick={() => setViewType(viewType === 'sponsored' ? '' : 'sponsored')}
        >
          Sponsored
        </div>
      </div>
      {viewType === 'banner' && <MyAds />}
      {viewType === 'sponsored' && <MySponsoreds />}
      {viewType !== 'banner' && viewType !== 'sponsored' && (
        <div>
          <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id="payment_form">
            <input type="hidden" id="jsonData" name="jsonPayload" />
          </form>

          <div className="responsive-table-wrapper">
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: "auto", p: "10px", maxWidth: "100%", }}>
              <Table sx={{ tableLayout: isMobile ? "auto" : "fixed", width: "100%", }}
                aria-label="responsive table"
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "2%", textOverflow: "ellipsis", p: 1 }} align="left">ID</TableCell>
                    <TableCell sx={{ width: "15%", textOverflow: "ellipsis", p: 1 }} align="left">Description</TableCell>
                    <TableCell sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }} align="left">Category</TableCell>
                    <TableCell sx={{ width: "18%", textOverflow: "ellipsis", p: 1 }} align="left">Link</TableCell>
                    <TableCell sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }} align="left">Image</TableCell>
                    <TableCell sx={{ width: "7%", textOverflow: "ellipsis", p: 1 }} align="left">Country</TableCell>
                    <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>
                      <div className='border-b border-b-[#BEBEBE]'>Publish Date</div>
                      <div className='border-b border-b-[#BEBEBE]'>Rate/Day</div>
                      <div>Days</div>
                    </TableCell>
                    <TableCell sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }} align="left">Total</TableCell>
                    <TableCell sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }} align="left">Status</TableCell>
                    <TableCell sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }} align="left">Billing Status</TableCell>
                    <TableCell sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }} align="left">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ width: "2%", p: 1 }}>
                        <div>{index + 1}</div>
                      </TableCell>
                      <TableCell sx={{ width: "17%", p: 1 }}>
                        <Tooltip title={item.description || item.title || ""} arrow>
                          <div className="table-cell-ellipsis">
                            {item.description || item.title}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "10%", p: 1 }}>
                        <Tooltip title={item.type === "ads" ? "Banner" : "Sponsored"} arrow>
                          <div className="table-cell-ellipsis">
                            {item.type === "ads" ? "Banner" : "Sponsored"}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "16%", p: 1 }}>
                        <Tooltip title={item.productLink || ""} arrow>
                          <div className="table-cell-ellipsis">
                            <a href={item.productLink} target="_blank" rel="noopener noreferrer">
                              {item.productLink}
                            </a>
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "8%", p: 1 }}>
                        <div className="relative group inline-block">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              className="w-12 h-12 object-cover rounded"
                              alt="ad"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No image
                            </div>
                          )}
                          <div className="absolute z-50 hidden group-hover:block left-full top-0 ml-2 w-48 h-15">
                            <img
                              src={item.imageUrl ? item.imageUrl : null}
                              className="h-15"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell sx={{ width: "6%", p: 1 }}>
                        <Tooltip title={item.country && item.country.label ? item.country.label : (item.countryCode || "N/A")} arrow>
                          <span className="flex items-center justify-center h-full cursor-pointer">
                            {item.countryCode ? (
                              <CountryFlag
                                countryCode={item.countryCode}
                                svg
                                style={{ fontSize: '2em', verticalAlign: 'middle' }}
                              />
                            ) : item.countryCode || "N/A"}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "12%", p: 1 }}>
                        <div className="flex flex-col">
                          <div className="border-b border-b-[#BEBEBE]">
                            {item.pubDate && item.pubDate.toDate ?
                              item.pubDate.toDate().toLocaleDateString("en-US") :
                              "-"}
                          </div>
                          <div className="border-b border-b-[#BEBEBE]">
                            {item.currencySymbol}{item.budget ?? "n/a"}
                          </div>
                          <div>
                            {item.days}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell sx={{ width: "8%", p: 1 }}>
                        <Tooltip title={String(item.budget * item.days || 0)} arrow>
                          <div className="table-cell-ellipsis">
                            {item.budget && item.days
                              ? `${item.currencySymbol}${(
                                  item.budget * item.days
                                ).toFixed(2)}`
                              : 0}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "4%", p: 1 }}>
                        <Tooltip title={item.state} arrow>
                          <div className="table-cell-none-ellipsis">
                            {item.state}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "5%", p: 1 }}>
                        <Tooltip title={item.billed ? "Billed" : "UnBilled" || ""} arrow>
                          <div className="table-cell-none-ellipsis">
                            {item.billed ? "Billed" : "UnBilled"}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: "5%", p: 1 }}>
                        {!item.billed && (
                          <div
                            onClick={() => {
                              dispatch(updateAdvertiseStore({ paymentId: item.id, paymentType: item.type, paymentAd: item }));
                              navigate(`/publish/payment`);
                            }}
                            className="text-sm text-red-600 font-medium cursor-pointer"
                          >
                            Billing
                          </div>
                        )}
                        {item.state !== "Approved" ? (
                          <div className="text-sm text-gray-500 font-medium">
                            Check
                          </div>
                        ) : item.billed &&
                          item.state === "Approved" &&
                          isExpired(item.pubDate, item.days) ? (
                          <div
                            onClick={() => {
                              setSelectedCampaign(item);
                              setRenewModalOpen(true);
                            }}
                            className="text-sm text-blue-600 font-medium cursor-pointer"
                          >
                            Renew
                          </div>
                        ) : item.billed && item.state === "Approved" ? (
                          <div
                            onClick={() =>
                              navigate(`/publish/${item.type}?edit=${item.id}`)
                            }
                            className="text-sm text-green-600 font-medium cursor-pointer"
                          >
                            Edit
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {paymentModal && <CheckOut />}
          {renewModalOpen && selectedCampaign && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setRenewModalOpen(false)}
            >
              <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: "#fff",
                  padding: 4,
                  borderRadius: 2,
                  width: "90%",
                  maxWidth: "500px",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Select New Expire Date
                </Typography>

                <div className="flex flex-col gap-4 w-full mt-5 mb-5">
                  <div className="basis-1/3 pl-5 pr-5">
                    <TextField
                      variant="outlined"
                      value={selectedCampaign.budget || ""}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          budget: e.target.value,
                        })
                      }
                      className="w-full"
                      size="small"
                      label="Budget"
                      InputProps={{
                        classes: {
                          notchedOutline: "custom-outline",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "gray",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "gray",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976d2",
                          },
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <TextField
                                id="outlined-select-currency"
                                fullWidth
                                select
                                hiddenLabel
                                size="small"
                                classes={{ border: "none" }}
                                value={selectedCampaign.currency || "USD"}
                                onChange={(e) =>
                                  setSelectedCampaign({
                                    ...selectedCampaign,
                                    currency: e.target.value,
                                  })
                                }
                                variant="outlined"
                                placeholder="Minimal"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": { border: "none" },
                                    backgroundColor: "transparent",
                                  },
                                }}
                              >
                                {currencyList.map((option) => (
                                  <MenuItem key={option.code} value={option.code}>
                                    {option.symbol}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="start">
                              {" "}
                              per a day
                            </InputAdornment>
                          ),
                        },

                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  </div>

                  <div className="basis-1/3 pl-5 pr-5">
                    <DatePicker
                      label="Publish Date"
                      value={dayjs(selectedCampaign.pubDate.toDate())}
                      onChange={(newValue) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          pubDate: newValue,
                        })
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          InputLabelProps: {
                            shrink: true,
                          },
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              fontSize: "14px",
                              borderRadius: "4px",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "gray",
                            },
                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                              {
                                borderColor: "gray",
                              },
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                              {
                                borderColor: "#1976d2 !important",
                              },
                            "& .MuiInputLabel-root": {
                              backgroundColor: "#F9FBFC",
                              padding: "0 4px",
                              transform: "translate(14px, -9px) scale(0.75)",
                              color: "gray",
                            },
                          },
                        },
                        popper: {
                          sx: {
                            zIndex: 10000,
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="basis-1/3 pl-5 pr-5">
                    <TextField
                      variant="outlined"
                      label="Number of days"
                      value={selectedCampaign.days || ""}
                      onChange={(e) =>
                        setSelectedCampaign({
                          ...selectedCampaign,
                          days: e.target.value,
                        })
                      }
                      className="w-full"
                      size="small"
                      InputProps={{
                        classes: {
                          notchedOutline: "custom-outline",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "gray",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "gray",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976d2",
                          },
                        },
                      }}
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={async () => {
                    try {
                      const campaignData = {
                        ...selectedCampaign,
                        pubDate: dayjs(selectedCampaign.pubDate).toDate(),
                        ownerId: user.id,
                      };
                      const newDocId = await dispatch(renewCampaign(campaignData));
                      setRenewModalOpen(false);
                      navigate(`/payment?id=${newDocId}&type=${selectedCampaign.type}`);
                    } catch (error) {
                      console.error("Error renewing campaign:", error);
                    }
                  }}
                >
                  Renew
                </Button>
              </Box>
            </Box>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCampaigns;
