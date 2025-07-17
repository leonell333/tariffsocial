
import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigate} from 'react-router';
import {getSponsoredAds, updateAdvertiseStore, deleteSponsoredAd} from "../../store/actions/advertiseAction";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip} from '@mui/material';
import CountryFlag from 'react-country-flag';
import "./advertise.css";
import Spinner from '../../components/ui/Spinner';
import { useState } from 'react';

const stripeBackend = import.meta.env.VITE_BACKEND;

const MySponsoreds = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const sponsoredAds = useSelector(state => state.advertise.sponsoredAds);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(getSponsoredAds());
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      fetch(`${import.meta.env.VITE_BACKEND}/stripe/session-status?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status == 'complete') {
            dispatch(getSponsoredAds());
          }
        });
    }
  }, []);

  return (<>
    <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
      <input type="hidden" id="jsonData" name="jsonPayload" />
    </form>
    <div className="responsive-table-wrapper">
      <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto', p: 2, maxWidth: "100%", }}>
        <Table sx={{ width: "100%", boxSizing: "border-box", }} aria-label="responsive table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "2%", textOverflow: "ellipsis", p: 1 }}>No</TableCell>
              <TableCell align="left" sx={{ width: "20%", textOverflow: "ellipsis", p: 1 }}>Title</TableCell>
              <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>Budget for a day</TableCell>
              <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>days</TableCell>
              <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>Publish Date</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Country</TableCell>
              <TableCell align="left" sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }}>Status</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Billing Status</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sponsoredAds.map((sponsored, index) => (
              <TableRow key={sponsored.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ width: "2%", p: 1 }}>{index + 1}</TableCell>
                <TableCell align="left" sx={{ width: "20%", textOverflow: "ellipsis", p: 1 }}>{sponsored.title}</TableCell>
                <TableCell align="left" sx={{ width: "12%", textOverflow: "ellipsis", p: 1 }}>{sponsored.currencySymbol}{sponsored.budget}</TableCell>
                <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>{sponsored.days}</TableCell>
                <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>{sponsored.pubDate && sponsored.pubDate.toDate ? sponsored.pubDate.toDate().toLocaleDateString() : ''}</TableCell>
                <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>
                  <Tooltip title={sponsored.country?.label || ''} arrow>
                    <span className="flex items-center justify-center h-full cursor-pointer">
                      {sponsored.country && sponsored.country.countryCode ? (
                        <CountryFlag
                          countryCode={sponsored.country.countryCode}
                          svg
                          style={{ fontSize: '2em', verticalAlign: 'middle' }}
                        />
                      ) : sponsored.countryCode}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left" sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }}>{sponsored.state}</TableCell>
                <TableCell sx={{ width: '6%', textOverflow: "ellipsis", p: 1 }}>
                  <Tooltip title={sponsored.billed ? "Billed" : "UnBilled"} arrow>
                    <div className="table-cell-none-ellipsis">{sponsored.billed ? "Billed" : "UnBilled"}</div>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ width: '6%', textOverflow: "ellipsis", p: 1 }}>
                  <div onClick={() => { 
                    dispatch(updateAdvertiseStore({ paymentId: sponsored.id, paymentType: 'sponsored', paymentAd: sponsored })); navigate(`/publish/payment`); }}
                    className="text-sm text-red-600 font-medium cursor-pointer hover:text-red-800">Billing</div>
                  {sponsored.state != "Approved" && <div onClick={() => { 
                    dispatch(updateAdvertiseStore({ selectedAd: { ...sponsored, type: 'sponsored' } }));
                    navigate(`/publish/sponsored`);
                  }}
                    className="text-sm text-green-600 font-medium cursor-pointer hover:text-green-800"
                  >Edit</div>}
                  <button
                    className="text-sm text-red-500 font-medium cursor-pointer flex items-center hover:text-red-700"
                    onClick={async () => {
                      setDeletingId(sponsored.id);
                      const success = await dispatch(deleteSponsoredAd(sponsored.id));
                      if (success) {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === sponsored.id}
                    style={deletingId === sponsored.id ? { pointerEvents: 'none' } : {}}
                  >
                    {deletingId === sponsored.id ? (
                      <Spinner size={16} className="mr-1" />
                    ) : (
                      'Delete'
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  </>);
}

export default MySponsoreds;
