import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { db } from "../../firebase";
import { updateBaseStore } from "../../store/actions/baseActions";
import { updatePostStore } from "../../store/actions/postActions";
import "./advertise.css";

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';


const stripeBackend = import.meta.env.VITE_BACKEND;


const MySponsoreds = (props) => {
  const [sponsoreds, setSponsoreds] = useState([]);
  const [billedStatus,setBilledStatus] = useState("all")
  const [status,setStatus] = useState("all")
  const [keyword,setKeyword] = useState("")

  const navigate = useNavigate(); 
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
          const adRef = doc(db, "sponsored",ad_id);
          getDoc(adRef).then(async sponsored=>{
            const ad_ = doc(db, "sponsored", sponsored.id);
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
    let ads_=[]
    const conditions = [where("ownerId","==",props.user.id)];
    if(billedStatus=="billed") conditions.push(where("billed","==",true))
    if(billedStatus=="not billed") conditions.push(where("billed","==",false))
    if(status!="all") conditions.push(where("state","==",status))
    conditions.push(orderBy("createdAt", "desc"))
    //conditions.push(limit(4))
    let coll=collection(db, "sponsored")
    const q=query(coll, ...conditions);
    const snap = await getDocs(q);
    snap.forEach(doc=>{
      let data=doc.data();
      const formatter = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: data.currency,
        currencyDisplay: 'symbol',
      });
      const parts = formatter.formatToParts(1);
      const symbol = parts.find(p => p.type === 'currency')?.value || data.currency;
      data.currencySymbol=symbol;
      ads_.push({id:doc.id,...data})
    })
    setSponsoreds(ads_);
  }
  
  return (<>
      <form action={`${stripeBackend}/stripe/create-checkout-session`} method="POST" id='payment_form'>
        <input type="hidden" id="jsonData" name="jsonPayload" />
      </form>
      <TableContainer component={Paper}>
        <Table sx={{  }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell align="left">Status</TableCell>
              <TableCell align="left">Title</TableCell>
              <TableCell align="left">Budget for a day</TableCell>
              <TableCell align="left">Number of days</TableCell>
              <TableCell align="left">Publish Date</TableCell>
              <TableCell align="left">Billing Status</TableCell>
              <TableCell align="left">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sponsoreds.map((sponsored,index) => (
              <TableRow
                key={sponsored.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {index+1}
                </TableCell>
                <TableCell align="left">{sponsored.state}</TableCell>
                <TableCell align="left">{sponsored.title}</TableCell>
                <TableCell align="left">{sponsored.currencySymbol}{sponsored.budget}</TableCell>
                <TableCell align="left">{sponsored.days}</TableCell>
                <TableCell align="left">{sponsored.pubDate.toDate().toLocaleDateString()}</TableCell>
                <TableCell sx={{ width: '5%', p: 1 }}>
                    <Tooltip title={sponsored.billed ? "Billed" : "UnBilled"} arrow>
                        <div className="table-cell-none-ellipsis">{sponsored.billed ? "Billed" : "UnBilled"}</div>
                    </Tooltip>
                </TableCell>
                 <TableCell sx={{ width: '5%', p: 1 }}>
                    {!sponsored.billed && <div onClick={() => navigate(`/payment?id=${sponsored.id}&type=sponsored`) } 
                            className="text-sm text-red-600 font-medium cursor-pointer">Billing</div>}
                    {sponsored.state != "Approved" && <div onClick={() => navigate(`/publish/sponsored?edit=${sponsored.id}`)}
                            className="text-sm text-green-600 font-medium cursor-pointer"
                        >Edit</div>}
                    {/* {sponsored.state == "Expired" && <div onClick={() => { setSelectedCampaign(sponsored); setRenewModalOpen(true); } }
                            className="text-sm text-blue-600 font-medium cursor-pointer">Renew</div>} */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {props.paymentModal && <ConnectedCheckoutModal/>}
    </>)
}

const mapStateToProps = (state) => ({
    user: state.user,
    paymentModal: state.base.paymentModal
  });
  
export default connect(
    mapStateToProps,
    { updateBaseStore, updatePostStore }
)(MySponsoreds);
  

