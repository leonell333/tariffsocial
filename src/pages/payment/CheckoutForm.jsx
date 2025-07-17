
import React, {useState, useEffect} from "react";
import {loadStripe} from "@stripe/stripe-js";
import {PaymentElement, Elements, useStripe, useElements} from "@stripe/react-stripe-js";
import "./checkout.css";
import Spinner from '../../components/ui/Spinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY);
const stripeBackend = import.meta.env.VITE_BACKEND;

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  const isValid = re.test(String(email).toLowerCase());
  return { isValid, message: isValid ? null : "Invalid email address." };
};

const EmailInput = ({ email, setEmail, error, setError }) => {
  const handleBlur = () => {
    if (!email) return;
    const { isValid, message } = validateEmail(email);
    if (!isValid) setError(message);
  };
  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };
  return (
    <div className="p-Input">
      <input
        id="email"
        type="text"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="you@example.com"
        className="p-Input-input Input Input--empty"
      />
      {error && (
        <div style={{ color: 'red', fontSize: '0.9em', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
};

const CheckoutInnerForm = ({ amount, currency }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const zeroDecimalCurrencies = [
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
  ];
  const isZeroDecimal = zeroDecimalCurrencies.includes((currency || '').toLowerCase());
  const displayAmount = isZeroDecimal ? amount : amount / 100;
  const formattedAmount = displayAmount.toLocaleString(undefined, {
    style: 'currency',
    currency: (currency || 'USD').toUpperCase(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { isValid, message: emailMsg } = validateEmail(email);
    if (!isValid) {
      setEmailError(emailMsg);
      setIsLoading(false);
      return;
    }
    if (!checked) {
      setMessage("Please check terms and conditions. ");
      setIsLoading(false);
      return;
    }
    if (!stripe || !elements) {
      setMessage("Stripe is not loaded yet.");
      setIsLoading(false);
      return;
    }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: email,
      },
      redirect: "if_required",
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Payment successful!");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center checkout-form">
      <form id="payment-form" onSubmit={handleSubmit}>
        <EmailInput
          email={email}
          setEmail={setEmail}
          error={emailError}
          setError={setEmailError}
        />
        <PaymentElement id="payment-element" />

        <div className="mb-2">
          <input
            id="terms-checkbox"
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
            }}
          />
          <label
            htmlFor="terms-checkbox"
            style={{ cursor: 'pointer', marginLeft: 8 }}
          >
            Terms and conditions acknowledgment.
          </label>
        </div>
        <button disabled={isLoading || !stripe || !elements} id="submit">
          <span id="button-text">
            {isLoading ? (
              <Spinner size={20} />
            ) : (
              `Pay ${formattedAmount} now`
            )}
          </span>
        </button>
        {message && <div id="payment-message">{message}</div>}
      </form>
    </div>
  );
};

const CheckoutForm = (props) => {
  const { paymentData } = props;
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    fetch(`${stripeBackend}/stripe/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: paymentData }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`HTTP ${res.status}: ${errorData.error || 'Server error'}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data.clientSecret) {
          throw new Error('No client secret received from server');
        }
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        console.error('Payment Intent Error:', err);
      });
  }, [paymentData]);

  const options = { clientSecret };

  if (!clientSecret) return (
    <div className="flex justify-center items-center min-h-[200px]">
      <Spinner size={32} style={{ marginRight: 0 }} />
    </div>
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutInnerForm
        amount={paymentData.price_data.unit_amount}
        currency={paymentData.price_data.currency}
      />
    </Elements>
  );
};

export default CheckoutForm;
