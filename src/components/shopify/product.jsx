
const ShopifyProduct = (props) => {
  return (
    <>
      <div className="w-full relative">
        <div>
          <img src={props.imageUrl}></img>
        </div>
        <div>
          <button
            type="button"
            className="bg-[#0e2841] text-white px-4 py-2 rounded hover:bg-[#1c3b63] cursor-pointer w-full"
            onClick={() => {
              window.open(
                `${import.meta.env.VITE_SHOPIFY_STORE_DOMAIN}/products/${
                  props.handle
                }`
              )
            }}>
            Go to Shop
          </button>
        </div>
        <div className="absolute bottom-10 right-2 color-blue text-lg font-extrabold bg-white rounded-3xl px-4 py-2">
          {props.title}
        </div>
      </div>
    </>
  )
}

export default ShopifyProduct
