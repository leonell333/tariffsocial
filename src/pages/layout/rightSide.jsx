
import { useSelector, useDispatch } from 'react-redux'
import Colleagues from '../net/recentColleagues'
import ProductAds from '../../components/shopify/productAds'
import AdSlot from '../../components/advertise/AdSlot'

const RightSide = () => {
  const dispatch = useDispatch()
  return (
    <div className="w-full">
      <Colleagues />
      <ProductAds />
      <AdSlot />
    </div>
  )
}

export default RightSide;