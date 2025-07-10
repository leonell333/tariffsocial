
import { useSelector, useDispatch } from 'react-redux'
import Colleagues from '../net/recentColleagues'
import ProductAds from '../../components/shopify/productAds'

const RightSide = () => {
  const dispatch = useDispatch()
  return (
    <div className="w-full">
      <Colleagues />
      <ProductAds />
    </div>
  )
}

export default RightSide
