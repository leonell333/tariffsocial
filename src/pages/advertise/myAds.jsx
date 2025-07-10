import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { auth, db, storage, storageBucket } from '../../firebase';
import { doc,addDoc, updateDoc, getDoc, collection , where, query, getDocs, getCountFromServer , limit ,orderBy, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, uploadString } from "firebase/storage";
import {updateBaseStore } from "../../store/actions/baseActions"
import {updatePostStore } from "../../store/actions/postActions"
import { Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Tooltip } from '@mui/material';
import { extractKeywords } from '../../utils';
import "./advertise.css"
import { toast } from 'react-toastify';

const stripeBackend = import.meta.env.VITE_BACKEND;

const MyAds = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const paymentModal = useSelector(state => state.base.paymentModal)
  
  const [ads, setAds] = useState([]);
  const [billedStatus, setBilledStatus] = useState("all");
  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  useEffect(()=>{
    search()
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    const ad_id = urlParams.get('id');

    if(sessionId) {
      fetch(`${import.meta.env.VITE_BACKEND}/stripe/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then(async data => {
        if(data.status == 'complete') {
          try {
            const ad_id = urlParams.get('id');
            const adRef = doc(db, "ads", ad_id);

            getDoc(adRef).then(async ad => {
              const ad_ = doc(db, "ads", ad.id);
              updateDoc(ad_, { billed:true, billedAt: serverTimestamp(), sessionId })
              const coll = collection(db, "payments");
              let q = query(coll, where("sessionId", "==", sessionId));
              let snapshot = await getCountFromServer(q);
              if (snapshot.data().count === 0) {
                await addDoc(collection(db, "payments"), {
                    adId:ad_id, sessionId, ownerId:user.id, createdAt: serverTimestamp(),
                });
              }
              await search();
              dispatch(updateBaseStore({ paymentModal: false }));
              toast.success("Payment completed and ad marked as billed!", {
                position: "top-right",
                autoClose: 3000,
              });
              navigate('/advertise/ads', { replace: true });

            });
          } catch (err) {
            console.error("Stripe session fetch error:", err);
            toast.error("Could not verify payment session. Please refresh the page.", {
              position: "top-right",
              autoClose: 5000,
            });
          }
        }
      });
    }
  },[])

  const search=async ()=>{
    dispatch(updateBaseStore({ loading: true }));
    let ads_ = [];
    const conditions = [where("ownerId", "==", user.id)];

    if (billedStatus === "billed") conditions.push(where("billed", "==", true));
    if (billedStatus === "not billed") conditions.push(where("billed", "==", false));
    if (status !== "all") conditions.push(where("state", "==", status));

    let keys = extractKeywords(keyword);
    if(keys.length!=0)  
      for(let i=0;i<keys.length;i++) conditions.push(where("keywords","array-contains",keys[i]))
    conditions.push(orderBy("createdAt", "desc"));
  
    //conditions.push(limit(4))
    let coll = collection(db, "ads")
    const q = query(coll, ...conditions);
    const snap = await getDocs(q);

    snap.forEach(doc => {
      let data = doc.data();
      const formatter = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: data.currency,
        currencyDisplay: 'symbol',
      });
      const parts = formatter.formatToParts(1);
      const symbol = parts.find(p => p.type === 'currency')?.value || data.currency;
      data.currencySymbol = symbol;
      ads_.push({ id:doc.id, ...data })
    })

    setAds(ads_);
    dispatch(updateBaseStore({ loading: false }))
  }
  
  return (<>
      <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
        <input type="hidden" id="jsonData" name="jsonPayload" />
      </form>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', p: 2, }}>
        <Table sx={{ }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ p: 1 }}>No</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Description</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Link</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Image</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Country</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>
                <div className='border-b border-b-[#BEBEBE]'>Budget</div>
                <div className='border-b border-b-[#BEBEBE]'>Publish Date</div>
                <div>Days</div>
              </TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Status</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Billing Status</TableCell>
              <TableCell align="left" sx={{ p: 1 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ads.map((ad, index) => (
              <TableRow key={ad.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ p: 1 }}>{index+1}</TableCell>
                <TableCell align="left" sx={{ p: 1 }}>{ad.description || ad.title}</TableCell>
                <TableCell align="left" sx={{ p: 1 }}>{ad.productLink}</TableCell>
                <TableCell align="left" sx={{ p: 1 }}>
                  <div className="relative group inline-block">
                    <img src={ad.imageUrl} className="w-12 h-12 object-cover rounded" alt="ad" />
                      <div className="absolute z-50 hidden group-hover:block left-full top-0 ml-2 w-48 h-15">
                        <img src={ad.imageUrl ? ad.imageUrl : null} className="h-15" />
                      </div>
                  </div>
                </TableCell>
                <TableCell align="left" sx={{ p: 1 }}>{ad.countryCode}</TableCell>
                <TableCell align="left" sx={{ p: 1 }}>
                  <div className='border-b border-b-[#BEBEBE]'>{ad.currencySymbol}{ad.budget}</div>
                  <div className='border-b border-b-[#BEBEBE]'>{ad.pubDate.toDate().toLocaleDateString()}</div>
                  <div>{ad.days}</div>
                </TableCell>
                <TableCell align="left" sx={{ p: 1 }}><div>{ad.state}</div></TableCell>
                <TableCell sx={{ width: '5%', p: 1 }}>
                    <Tooltip title={ad.billed ? "Billed" : "UnBilled"} arrow>
                        <div className="table-cell-none-ellipsis">{ad.billed ? "Billed" : "UnBilled"}</div>
                    </Tooltip>
                </TableCell>
                 <TableCell sx={{ width: '5%', p: 1 }}>
                    {!ad.billed && <div onClick={() => navigate(`/payment?id=${ad.id}&type=ads`) } 
                            className="text-sm text-red-600 font-medium cursor-pointer">Billing</div>}
                    {ad.state != "Approved" && <div onClick={() => navigate(`/publish/ads?edit=${ad.id}`)}
                            className="text-sm text-green-600 font-medium cursor-pointer"
                        >Edit</div>}
                    {/* {ad.state == "Expired" && <div onClick={() => { setSelectedCampaign(ad); setRenewModalOpen(true); } }
                            className="text-sm text-blue-600 font-medium cursor-pointer">Renew</div>} */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {paymentModal && (<ConnectedCheckoutModal />)}
    </>)
}

export default MyAds;
  

