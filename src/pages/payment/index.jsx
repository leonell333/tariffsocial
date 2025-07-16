import {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import LeftSide from '../layout/leftSide'
import {doc, getDoc,} from 'firebase/firestore'
import {db} from '../../firebase'
import {loadStripe} from '@stripe/stripe-js'
import CheckoutForm from './CheckoutForm'

const Payment = () => {
    const dispatch = useDispatch()
    const user = useSelector(state => state.user)

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({})
    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY)
    const stropeBackend = import.meta.env.VITE_BACKEND

    useEffect(() => {
        const queryString = window.location.search
        const urlParams = new URLSearchParams(queryString)
        const id = urlParams.get('id')
        const type = urlParams.get('type')
        if (id && type) {
            const adRef = doc(db, type, id)
            getDoc(adRef).then((ad) => {
                let data = ad.data()
                setData({...data, id, type})
                setLoading(false)
            })
        }
    }, [])
    if (loading) return <></>
    const zeroDecimalCurrencies = [
        'bif',
        'clp',
        'djf',
        'gnf',
        'jpy',
        'kmf',
        'krw',
        'mga',
        'pyg',
        'rwf',
        'ugx',
        'vnd',
        'vuv',
        'xaf',
        'xof',
        'xpf',
    ]
    let paymentData = {
        id: data.id,
        type: data.type,
        price_data: {
            currency: data.currency,
            product_data: {
                name: data.name,
            },
            unit_amount: zeroDecimalCurrencies.includes(data.currency.toLowerCase())
                ? data.budget * data.days
                : data.budget * data.days * 100, // in cents ($20.00)
        },
    }

    return (
        <div className=" bg-[#F9FBFC] flex justify-center w-full">
            <div className="bg-[#F9FBFC] w-full max-w-[1440px] relative px-4 flex">
                <div className="flex flex-col lg:flex-row gap-6 w-full mt-4">
                    <div className="w-full lg:w-1/4">
                        <LeftSide/>
                    </div>
                    <div className="w-full lg:w-10 lg:flex-auto payment">
                        {data.billed ? (
                            <div>This payment was already done.</div>
                        ) : (
                            <div>
                                <CheckoutForm paymentData={paymentData}/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Payment