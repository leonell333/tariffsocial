import {useDispatch, useSelector} from "react-redux";
import CheckoutForm from "./CheckoutForm";

const Payment = () => {
  const dispatch = useDispatch();
  // const navigate = useNavigate();
  // const location = useLocation();
  // const queryString = location.search;
  // const urlParams = new URLSearchParams(queryString);
  // const id = urlParams.get("id");
  // const type = urlParams.get("type");
  const { paymentId, paymentType, paymentAd } = useSelector((state) => state.advertise);

  const zeroDecimalCurrencies = [
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "ugx",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf",
  ];

  let paymentData = {
    id: paymentId,
    type: paymentType,
    price_data: {
      currency: paymentAd.currency,
      product_data: {
        name: paymentAd.name,
      },
      unit_amount: zeroDecimalCurrencies.includes(
        paymentAd.currency?.toLowerCase()
      )
        ? paymentAd.budget * paymentAd.days
        : paymentAd.budget * paymentAd.days * 100,
    },
  };

  return (
    <div>
      <div className="w-full min-h-[calc(100vh-170px)] border border-[#EBEBEB] rounded-xl bg-white">
        {paymentAd.billed ? (
          <div>This payment was already done.</div>
        ) : (
          <div>
            <CheckoutForm paymentData={paymentData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
