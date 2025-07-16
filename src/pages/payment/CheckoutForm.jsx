import React, {useCallback, useState} from 'react'
import {loadStripe} from '@stripe/stripe-js'
import {CheckoutProvider, PaymentElement, useCheckout} from '@stripe/react-stripe-js'
import {updateBaseStore} from '../../store/actions/baseActions'
import {useDispatch, useSelector} from 'react-redux'
import './checkout.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY)
const stropeBackend = import.meta.env.VITE_BACKEND

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70vw',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  padding: 1,
}

const appearance = {
  theme: 'night', // or 'flat', 'night', 'none'
  variables: {
    colorPrimary: '#FF5722',
    colorBackground: '#ffffff',
    colorText: '#000000',
    fontFamily: 'Roboto, sans-serif',
  },
}

const validateEmail = async (email, checkout) => {
  const updateResult = await checkout.updateEmail(email)
  const isValid = updateResult.type !== 'error'

  return { isValid, message: !isValid ? updateResult.error.message : null }
}

const EmailInput = ({ email, setEmail, error, setError }) => {
  const checkout = useCheckout()
  const handleBlur = async () => {
    if (!email) {
      return
    }

    const { isValid, message } = await validateEmail(email, checkout)
    if (!isValid) {
      setError(message)
    }
  }

  const handleChange = (e) => {
    setError(null)
    setEmail(e.target.value)
  }

  return (
    <>
      <label>
        Email
        <input
          id="email"
          type="text"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="you@example.com"
        />
      </label>
      {error && <div id="email-errors">{error}</div>}
    </>
  )
}

const CheckoutInnerForm = () => {
  const checkout = useCheckout()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [message, setMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsLoading(true)

    const { isValid, message } = await validateEmail(email, checkout)
    if (!isValid) {
      setEmailError(message)
      setMessage(message)
      setIsLoading(false)
      return
    }
    if (!checked) {
      setMessage('Please check terms and conditions. ')
      setIsLoading(false)
      return
    }
    const { error } = await checkout.confirm()

    setMessage(error.message)

    setIsLoading(false)
  }

  return (
    <div className="checkout-form">
      <form id="payment-form" onSubmit={handleSubmit}>
        <EmailInput
          email={email}
          setEmail={setEmail}
          error={emailError}
          setError={setEmailError}
        />
        <h4>Payment</h4>
        <PaymentElement id="payment-element" />
        <div className="mb-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked)
            }}></input>{' '}
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
        {/* Show any error or success messages */}
        {message && <div id="payment-message">{message}</div>}
      </form>
    </div>
  )
}

const CheckoutForm = (props) => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const paymentModal = useSelector(state => state.base.paymentModal)
  
  const [clientSecret, setClientSecret] = useState(null)

  const fetchClientSecret = useCallback(() => {
    dispatch(updateBaseStore({ loading: true }))
    return fetch(
      `${stropeBackend}/stripe/create-checkout-session?data=${JSON.stringify(
        props.paymentData
      )}`,
      {
        method: 'POST',
      }
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(updateBaseStore({ loading: false }))
        return data.clientSecret
      }).catch(err=>{
        dispatch(updateBaseStore({ loading: false }))
        console.log(err);
      })
  }, [])

  const appearance = {
    theme: 'stripe',
  }

  const options = { fetchClientSecret, elementsOptions: { appearance } }

  if (!fetchClientSecret) return null

  return (
    <CheckoutProvider stripe={stripePromise} options={options}>
      <CheckoutInnerForm />
    </CheckoutProvider>
  )
}

export default CheckoutForm
