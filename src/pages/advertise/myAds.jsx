import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router';
import {updateBaseStore} from "../../store/actions/baseActions";
import {getBannerAds, updateAdvertiseStore} from "../../store/actions/advertiseAction";
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip} from '@mui/material';
import CountryFlag from 'react-country-flag';
import "./advertise.css"

const stripeBackend = import.meta.env.VITE_BACKEND;

const MyAds = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bannerAds = useSelector(state => state.advertise.bannerAds);

  useEffect(() => {
    dispatch(getBannerAds());
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    const ad_id = urlParams.get('id');

    if (sessionId) {
      fetch(`${stripeBackend}/stripe/session-status?session_id=${sessionId}`)
        .then((res) => res.json())
        .then(async data => {
          if (data.status == 'complete') {
            try {
              dispatch(getBannerAds());
              dispatch(updateBaseStore({ paymentModal: false }));
            } catch (err) {
              console.error("Stripe session fetch error:", err);
            }
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
              <TableCell align="left" sx={{ width: "20%", textOverflow: "ellipsis", p: 1 }}>Description</TableCell>
              <TableCell align="left" sx={{ width: "25%", textOverflow: "ellipsis", p: 1 }}>Link</TableCell>
              <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>Image</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Country</TableCell>
              <TableCell align="left" sx={{ width: "17%", textOverflow: "ellipsis", p: 1 }}>
                <div className='border-b border-b-[#BEBEBE]'>Budget</div>
                <div className='border-b border-b-[#BEBEBE]'>Publish Date</div>
                <div>Days</div>
              </TableCell>
              <TableCell align="left" sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }}>Status</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Billing Status</TableCell>
              <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bannerAds.map((ad, index) => (
              <TableRow key={ad.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ width: "2%", p: 1 }}>{index + 1}</TableCell>
                <TableCell align="left" sx={{ width: "20%", textOverflow: "ellipsis", p: 1 }}>{ad.description || ad.title}</TableCell>
                <TableCell align="left" sx={{ width: "25%", textOverflow: "ellipsis", p: 1 }}>
                  <a href={ad.productLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {ad.productLink}
                  </a>
                </TableCell>
                <TableCell align="left" sx={{ width: "10%", textOverflow: "ellipsis", p: 1 }}>
                  <div className="relative group inline-block cursor-pointer">
                    <img src={ad.imageUrl} className="w-12 h-12 object-cover rounded" alt="ad" />
                    <div className="absolute z-50 left-full top-0 ml-2 w-[180px] h-auto object-cover hidden group-hover:block">
                      <img src={ad.imageUrl ? ad.imageUrl : null} className="w-[180px] h-auto object-cover" />
                    </div>
                  </div>
                </TableCell>
                <TableCell align="left" sx={{ width: "6%", textOverflow: "ellipsis", p: 1 }}>
                  <Tooltip title={ad.country?.label || ''} arrow>
                    <span className="flex items-center justify-center h-full cursor-pointer">
                      {ad.country && ad.country.countryCode ? (
                        <CountryFlag
                          countryCode={ad.country.countryCode}
                          svg
                          style={{ fontSize: '2em', verticalAlign: 'middle' }}
                        />
                      ) : ad.countryCode}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left" sx={{ width: "17%", textOverflow: "ellipsis", p: 1 }}>
                  <div className='border-b border-b-[#BEBEBE]'>{ad.currencySymbol}{ad.budget}</div>
                  <div className='border-b border-b-[#BEBEBE]'>{ad.pubDate && ad.pubDate.toDate ? ad.pubDate.toDate().toLocaleDateString() : ''}</div>
                  <div>{ad.days}</div>
                </TableCell>
                <TableCell align="left" sx={{ width: "8%", textOverflow: "ellipsis", p: 1 }}><div>{ad.state}</div></TableCell>
                <TableCell sx={{ width: '6%', textOverflow: "ellipsis", p: 1 }}>
                  <div className="table-cell-none-ellipsis">{ad.billed ? "Billed" : "UnBilled"}</div>
                </TableCell>
                <TableCell sx={{ width: '6%', textOverflow: "ellipsis", p: 1 }}>
                  {!ad.billed && <div onClick={() => { 
                    dispatch(updateAdvertiseStore({ paymentId: ad.id, paymentType: 'ads', paymentAd: ad })); navigate(`/publish/payment`); }}
                    className="text-sm text-red-600 font-medium cursor-pointer">Billing</div>}
                  {ad.state != "Approved" && <div onClick={() => { 
                    dispatch(updateAdvertiseStore({ selectedAd: { ...ad, type: 'banner' } }));
                    navigate(`/publish/ads`); }}
                    className="text-sm text-green-600 font-medium cursor-pointer"
                  > Edit </div>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
    {/* {paymentModal && (<ConnectedCheckoutModal />)} */}
  </>);
}

export default MyAds;