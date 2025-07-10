import { useState, useEffect, useRef, useMemo } from 'react'
import { connect } from 'react-redux';
import { auth, db, storage , storageBucket } from "../../firebase"
import { doc,addDoc, updateDoc, getDoc, collection , where, query, getDocs, getCountFromServer , limit ,orderBy, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, uploadString } from "firebase/storage";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { updateBaseStore } from "../../store/actions/baseActions"
import { updatePostStore } from "../../store/actions/postActions"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Checkbox,FormControlLabel, FormControl,InputLabel, useTheme, useMediaQuery } from '@mui/material';
import { TextField, Button, Container, Typography, Box, } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import { getFireStoreUrl } from '../../utils';
import { extractKeywords } from '../../utils';
import CountryFlag from 'react-country-flag';
import { isValidEmail } from '../../utils';
import { currencies } from '../../consts';

import "./advertise.css"

const stripeBackend = import.meta.env.VITE_BACKEND;

const MyCampaigns = (props) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState([]);
    const [billedStatus, setBilledStatus] = useState("all")
    const [status, setStatus] = useState("all")
    const [keyword, setKeyword] = useState("")
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    let currencyList = currencies.map(c=>{
        const formatter = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: c,
            currencyDisplay: 'symbol',
        });
        const parts = formatter.formatToParts(1);
        const symbol = parts.find(p => p.type === 'currency')?.value || c;
        return {code:c,symbol}
    })

    useEffect(()=>{
        search()
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const sessionId = urlParams.get('session_id');
        if(sessionId)
        {
            fetch(`${import.meta.env.VITE_BACKEND}/stripe/session-status?session_id=${sessionId}`)
            .then((res) => res.json())
            .then((data) => {
                if(data.status=='complete')
                {
                const ad_id = urlParams.get('id');
                const adRef = doc(db, "ads",ad_id);
                getDoc(adRef).then(async ad=>{
                    const ad_ = doc(db, "ads", ad.id);
                    updateDoc(ad_, { billed:true,billedAt:serverTimestamp(),sessionId })
                    const coll = collection(db, "payments");
                    let q = query(coll, where("sessionId", "==", sessionId));
                    let snapshot = await getCountFromServer(q);
                    if(snapshot.data().count==0)
                    {
                    await addDoc(collection(db, "payments"), {
                        adId:ad_id, sessionId, ownerId:props.user.id,createdAt: serverTimestamp(), // 👈 sets to current server time
                    });
                    }
                    search();
                });
                }
            });
            }
    },[])

    const search=async ()=>{
        props.updateBaseStore({ loading: true });
        let combined = [];

        const baseConditions = [
            where("ownerId", "==", props.user.id),
        ];

        if (billedStatus === "billed") baseConditions.push(where("billed", "==", true));
        if (billedStatus === "not billed") baseConditions.push(where("billed", "==", false));
        if (status !== "all") baseConditions.push(where("state", "==", status));

        let keys = extractKeywords(keyword);
        if (keys.length !== 0) {
            for (let k of keys) baseConditions.push(where("keywords", "array-contains", k));
        }

        baseConditions.push(orderBy("createdAt", "desc"));

        const [adsSnap, sponsoredSnap] = await Promise.all([
            getDocs(query(collection(db, "ads"), ...baseConditions)),
            getDocs(query(collection(db, "sponsored"), ...baseConditions))
        ]);

        const formatDocs = async (snap, type) => {
            const list = [];

            for (const doc_ of snap.docs) {
            const data = doc_.data();
            const formatter = new Intl.NumberFormat("en", {
                style: "currency",
                currency: data.currency,
                currencyDisplay: "symbol",
            });
            const symbol = formatter.formatToParts(1).find(p => p.type === "currency")?.value || data.currency;

            list.push({
                ...data,
                id: doc_.id,
                type,
                currencySymbol: symbol,
            });
            }

            return list;
        };

        const adsList = await formatDocs(adsSnap, "ads");
        const sponsoredList = await formatDocs(sponsoredSnap, "sponsored");
        combined = [...adsList, ...sponsoredList];
        setCampaigns(combined);
        props.updateBaseStore({ loading: false });
    }

    const formatDate = (date) => {
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    }

    const isExpired = (pubDate, days) => {
        if (!pubDate || !days) return false;

        const start = dayjs(pubDate.toDate ? pubDate.toDate() : pubDate); // handles Firestore Timestamp or JS Date
        const end = start.add(Number(days), 'day');
        return dayjs().isAfter(end, 'day');
    };

    return (<>
        <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
            <input type="hidden" id="jsonData" name="jsonPayload" />
        </form>

        <div className="responsive-table-wrapper">
            <TableContainer component={Paper} sx={{ overflowX: 'auto', p: 2, maxWidth: '100%', }}>
               <Table sx={{ tableLayout: isMobile ? 'auto' : 'fixed', width: '100%', boxSizing: 'border-box' }} aria-label="responsive table">
                  <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: '2%', textOverflow: 'ellipsis', p: 1 }} align="left">ID</TableCell>
                        <TableCell sx={{ width: '17%', textOverflow: 'ellipsis', p: 1 }} align="left">Description</TableCell>
                        <TableCell sx={{ width: '10%', textOverflow: 'ellipsis', p: 1 }} align="left">Category</TableCell>
                        <TableCell sx={{ width: '16%', textOverflow: 'ellipsis', p: 1 }} align="left">Link</TableCell>
                        <TableCell sx={{ width: '8%', textOverflow: 'ellipsis', p: 1 }} align="left">Image</TableCell>
                        <TableCell sx={{ width: '6%', textOverflow: 'ellipsis', p: 1 }} align="left">Country</TableCell>
                        <TableCell sx={{ width: '6%', textOverflow: 'ellipsis', p: 1 }} align="left">
                           <Tooltip title="Publish Date" arrow>Date</Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '8%', textOverflow: 'ellipsis', p: 1 }} align="left">Rate/Day</TableCell>
                        <TableCell sx={{ width: '5%', textOverflow: 'ellipsis', p: 1 }} align="left">Days</TableCell>
                        <TableCell sx={{ width: '8%', textOverflow: 'ellipsis', p: 1 }} align="left">Total</TableCell>
                        <TableCell sx={{ width: '5%', textOverflow: 'ellipsis', p: 1 }} align="left">Status</TableCell>
                        <TableCell sx={{ width: '5%', textOverflow: 'ellipsis', p: 1 }} align="left">Billing Status</TableCell>
                        <TableCell sx={{ width: '5%', textOverflow: 'ellipsis', p: 1 }} align="left">Action</TableCell>
                     </TableRow>
                </TableHead>
                <TableBody>
                    {campaigns.map((item, index) => (
                        <TableRow key={item.id}>
                        <TableCell sx={{ width: '2%', p: 1 }}>
                            <div>{index + 1}</div>
                        </TableCell>
                        <TableCell sx={{ width: '17%', p: 1 }}>
                            <Tooltip title={item.description || item.title || ""} arrow>
                                <div className="table-cell-ellipsis">{item.description || item.title}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '10%', p: 1 }}>
                            <Tooltip title={item.type === "ads" ? "Banner" : "Sponsored"} arrow>
                                <div className="table-cell-ellipsis">{item.type === "ads" ? "Banner" : "Sponsored"}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '16%', p: 1 }}>
                            <Tooltip title={item.productLink || ""} arrow>
                                <div className="table-cell-ellipsis">
                                    <a href={item.productLink} target="_blank" rel="noopener noreferrer">{item.productLink}</a>
                                </div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '8%', p: 1 }}>
                            <div className="relative group inline-block">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} className="w-12 h-12 object-cover rounded" alt="ad" />
                                    ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                        No image
                                    </div>
                                    )}
                                <div className="absolute z-50 hidden group-hover:block left-full top-0 ml-2 w-48 h-15">
                                    <img src={item.imageUrl ? item.imageUrl : null} className="h-15" />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell sx={{ width: '6%', p: 1 }}>
                            <Tooltip title={item.countryCode || "N/A"} arrow>
                                <div className="table-cell-ellipsis">{item.countryCode || "N/A"}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '6%', p: 1 }}>
                            <Tooltip title={formatDate(item.pubDate.toDate())} arrow>
                                <div>{item.pubDate.toDate().toLocaleDateString('en-US', {
                                    month: 'numeric', day: 'numeric' })}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '8%', p: 1 }}>
                            <Tooltip title={`${item.budget ?? "n/a"}`} arrow>
                                <div>{item.currencySymbol}{item.budget ?? "n/a"}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '5%', p: 1 }}>
                            <Tooltip title={String(item.days)} arrow>
                                <div className="table-cell-ellipsis">{item.days}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '8%', p: 1 }}>
                            <Tooltip title={String(item.budget * item.days || 0)} arrow>
                                <div className="table-cell-ellipsis">{item.budget && item.days ? `${item.currencySymbol}${(item.budget * item.days).toFixed(2)}` : 0}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '4%', p: 1 }}>
                            <Tooltip title={item.state} arrow>
                                <div className="table-cell-none-ellipsis">{item.state}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '5%', p: 1 }}>
                            <Tooltip title={item.billed ? "Billed" : "UnBilled" || ""} arrow>
                                <div className="table-cell-none-ellipsis">{item.billed ? "Billed" : "UnBilled"}</div>
                            </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: '5%', p: 1 }}>
                            {!item.billed && <div onClick={() => navigate(`/payment?id=${item.id}&type=${item.type}`) } 
                                    className="text-sm text-red-600 font-medium cursor-pointer">Billing</div>}
                            {item.state !== "Approved" ? (
                                <div className="text-sm text-gray-500 font-medium">Check</div>
                            ) : item.billed && item.state === "Approved" && isExpired(item.pubDate, item.days) ? (
                                <div onClick={() => { setSelectedCampaign(item); setRenewModalOpen(true); } }
                                    className="text-sm text-blue-600 font-medium cursor-pointer">Renew</div>
                            ) : item.billed && item.state === "Approved" ? (
                                <div onClick={() => navigate(`/publish/${item.type}?edit=${item.id}`)}
                                    className="text-sm text-green-600 font-medium cursor-pointer"
                                >Edit</div>
                            ) : null}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
        
        {props.paymentModal && <CheckOut/>}

        {renewModalOpen && selectedCampaign && (
            <Box
                sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                }}
                onClick={() => setRenewModalOpen(false)}
            >
                <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    backgroundColor: '#fff',
                    padding: 4,
                    borderRadius: 2,
                    width: '90%',
                    maxWidth: '500px', // was 400px
                }}
                >
                <Typography variant="h6" gutterBottom>
                    Select New Expire Date
                </Typography>

                <div className='flex flex-col gap-4 w-full mt-5 mb-5'>
                    <div className='basis-1/3 pl-5 pr-5'>
                        <TextField variant="outlined" value={selectedCampaign.budget || ''} onChange={(e) => setSelectedCampaign({ ...selectedCampaign, budget: e.target.value })} 
                        className='w-full' size='small' label='Budget' 
                        InputProps={{
                        classes: {
                            notchedOutline: 'custom-outline',
                        },
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'gray',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'gray',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                            },
                            },
                        }}
                        slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start">
                            <TextField id="outlined-select-currency" fullWidth
                                select hiddenLabel  size='small' classes={{border:'none'}}
                                value={selectedCampaign.currency || 'USD'} 
                                onChange={(e) => setSelectedCampaign({ ...selectedCampaign, currency: e.target.value })}
                                variant="outlined"
                                placeholder="Minimal"
                                sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { border: 'none' },
                                    backgroundColor: 'transparent',
                                },
                                }}
                            >
                                {currencyList.map((option) => (
                                <MenuItem key={option.code} value={option.code}>
                                    {option.symbol}
                                </MenuItem>
                                ))}
                            </TextField>
                            </InputAdornment>,
                            endAdornment: <InputAdornment position="start"> per a day</InputAdornment>,
                        },

                        inputLabel: {
                            shrink: true,
                        },
                        }}/>
                    </div>

                    <div className='basis-1/3 pl-5 pr-5'>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                            label="Publish Date"
                            value={dayjs(selectedCampaign.pubDate.toDate())}
                            onChange={(newValue) =>
                                setSelectedCampaign({ ...selectedCampaign, pubDate: newValue })
                            }
                            slotProps={{
                                textField: {
                                size: 'small',
                                fullWidth: true,
                                InputLabelProps: {
                                    shrink: true,
                                },
                                sx: {
                                    '& .MuiOutlinedInput-root': {
                                    fontSize: '14px',
                                    borderRadius: '4px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'gray',
                                    },
                                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'gray',
                                    },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#1976d2 !important',
                                    },
                                    '& .MuiInputLabel-root': {
                                    backgroundColor: '#F9FBFC',
                                    padding: '0 4px',
                                    transform: 'translate(14px, -9px) scale(0.75)',
                                    color: 'gray',
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
                        </LocalizationProvider>
                    </div>
                    
                    <div className='basis-1/3 pl-5 pr-5'>
                        <TextField variant="outlined" label="Number of days" value={selectedCampaign.days || ''} onChange={(e) => setSelectedCampaign({ ...selectedCampaign, days: e.target.value })}
                        className='w-full' size='small' 
                        InputProps={{
                        classes: {
                            notchedOutline: 'custom-outline',
                        },
                        }}
                        sx={{
                        '& .MuiOutlinedInput-root': {
                            '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'gray',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'gray',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            },
                        },
                        }}
                        slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                        }}/>
                    </div>
                </div>
          
                <Button
                    variant="contained"
                    fullWidth
                    onClick={async () => {
                        const { pubDate, days, budget, currency, type, imageFile } = selectedCampaign;
                        const newDocRef = await addDoc(collection(db, type), {
                            ...selectedCampaign,
                            ownerId: props.user.id,
                            pubDate: dayjs(pubDate).toDate(),
                            days: Number(days),
                            budget: Number(budget),
                            currency: currency || 'USD',
                            billed: false,
                            state: "Pending",
                            createdAt: serverTimestamp(),
                        });

                        if (imageFile) {
                            const imageRef = ref(storage, `${type}/${newDocRef.id}`);
                            await uploadString(imageRef, imageFile, 'data_url');
                        }
                        setRenewModalOpen(false);
                        navigate(`/payment?id=${newDocRef.id}&type=${type}`);
                    }}
                >
                    Renew
                </Button>
                </Box>
            </Box>
        )}
    </>)
}

const mapStateToProps = (state) => ({
    user: state.user,
    paymentModal: state.base.paymentModal
  });
  
export default connect(
    mapStateToProps,
    { updateBaseStore, updatePostStore }
)(MyCampaigns);
  

