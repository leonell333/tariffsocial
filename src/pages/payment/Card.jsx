import React, { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const CardForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [formVisible, setFormVisible] = useState(false)
  const [formData, setFormData] = useState({
    number: '4242424242424242',
    exp_month: '11/28',
    exp_year: '2025',
    cvc: '123',
    name: 'Daniel Zummen',
    email: 'danielza310@gmail.com',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!stripe) return

    const { token, error } = await stripe.createToken({
      card: {
        number: formData.number,
        exp_month: parseInt(formData.exp_month),
        exp_year: parseInt(formData.exp_year),
        cvc: formData.cvc,
        name: formData.name,
      },
    })

    if (error) {
      console.error(error.message)
    } else {
      console.log('Token created:', token.id)
    }
  }

  return (
    <>
      <form onSubmit={handlePayment} className="border p-6 rounded space-y-4">
        <h2 className="font-semibold text-lg">Add Payment Method</h2>
        <input
          name="number"
          placeholder="1111 1111 1111 1111"
          className="w-full border p-2 rounded"
          value={formData.number}
          onChange={handleChange}
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="exp_month"
            placeholder="MM"
            className="border p-2 rounded"
            value={formData.exp_month}
            onChange={handleChange}
          />
          <input
            name="exp_year"
            placeholder="YY"
            className="border p-2 rounded"
            value={formData.exp_year}
            onChange={handleChange}
          />
        </div>
        <input
          name="cvc"
          placeholder="CVV"
          className="w-full border p-2 rounded"
          value={formData.cvc}
          onChange={handleChange}
        />
        <input
          name="name"
          placeholder="Full Name"
          className="w-full border p-2 rounded"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="E-mail"
          className="w-full border p-2 rounded"
          value={formData.email}
          onChange={handleChange}
        />

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded">
            Pay now
          </button>
          <button
            type="button"
            onClick={() => setFormVisible(false)}
            className="border px-6 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}

export default CardForm
