import React, { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useSelector, useDispatch } from "react-redux";
import { EmbeddedCheckoutProvider, EmbeddedCheckout, useCheckout } from "@stripe/react-stripe-js";
import "./checkout.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY);
const stripeBackend = import.meta.env.VITE_BACKEND;

const validateEmail = async (email, checkout) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";
  return { isValid, message: !isValid ? updateResult.error.message : null };
};

const EmailInput = ({ email, setEmail, error, setError }) => {
  const checkout = useCheckout();
  const handleBlur = async () => {
    if (!email) {
      return;
    }
    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
    }
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
    </div>
  );
};

const CheckoutInnerForm = () => {
  const checkout = useCheckout();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setEmailError(message);
      setMessage(message);
      setIsLoading(false);
      return;
    }
    if (!checked) {
      setMessage("Please check terms and conditions. ");
      setIsLoading(false);
      return;
    }
    const { error } = await checkout.confirm();
    setMessage(error.message);
    setIsLoading(false);
  };

  return (
    <div className="checkout-form">
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
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
            }}
          ></input>{" "}
          Terms and conditions acknowledgment.
        </div>
        <button disabled={isLoading} id="submit">
          <span id="button-text">
            {isLoading ? (
              <div className="spinner" id="spinner"></div>
            ) : (
              `Pay ${checkout.total.total.amount} now`
            )}
          </span>
        </button>
        {message && <div id="payment-message">{message}</div>}
      </form>
    </div>
  );
};

const CheckoutForm1 = (props) => {
  const { paymentData } = props;
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    fetch(
      `${stripeBackend}/stripe/create-checkout-session?data=${JSON.stringify(paymentData)}`,
      { method: "POST" }
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
      });
  }, [paymentData]);

  useEffect(() => {
  }, [clientSecret]);

  const options = { clientSecret };

  if (!clientSecret) return <div>Loading...</div>;

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
};

export default CheckoutForm1;