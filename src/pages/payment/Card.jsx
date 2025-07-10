import React from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'react-toastify'

const CardForm = () => {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      toast.error('Stripe.js has not yet loaded.')
      return
    }
    console.log(elements.getElement(CardElement))

    const { error: backendError, clientSecret } = await fetch(
      '/api/create-payment-intent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodType: 'card',
          currency: 'usd',
        }),
      }
    ).then((r) => r.json())

    if (backendError) {
      toast.error(backendError.message)
      return
    }

    toast('Client secret returned')

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Jenny Rosen',
          },
        },
      })

    if (stripeError) {
      // Show error to your customer (e.g., insufficient funds)
      toast.error(stripeError.message)
      return
    }

    // Show a success message to your customer
    // There's a risk of the customer closing the window before callback
    // execution. Set up a webhook or plugin to listen for the
    // payment_intent.succeeded event that handles any business critical
    // post-payment actions.
    toast(`Payment ${paymentIntent.status}: ${paymentIntent.id}`)
  }

  return (
    <>
      <h1>Card</h1>

      <p>
        <h4>
          Try a{' '}
          <a
            href="https://stripe.com/docs/testing#cards"
            target="_blank"
            rel="noopener noreferrer">
            test card
          </a>
          :
        </h4>
        <div>
          <code>4242424242424242</code> (Visa)
        </div>
        <div>
          <code>5555555555554444</code> (Mastercard)
        </div>
        <div>
          <code>4000002500003155</code> (Requires{' '}
          <a
            href="https://www.youtube.com/watch?v=2kc-FjU2-mY"
            target="_blank"
            rel="noopener noreferrer">
            3DSecure
          </a>
          )
        </div>
      </p>

      <form id="payment-form" onSubmit={handleSubmit}>
        <label htmlFor="card">Card</label>
        <CardElement id="card" />

        <button type="submit">Pay</button>
      </form>

      <p>
        {' '}
        <a href="https://youtu.be/IhvtIbfDZJI" target="_blank">
          Watch a demo walkthrough
        </a>{' '}
      </p>
    </>
  )
}

export default CardForm
