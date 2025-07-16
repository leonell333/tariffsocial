import {useEffect, useRef, useState} from 'react'
import {Box} from '@mui/material';
import {useDispatch, useSelector} from 'react-redux'
import Slider from 'react-slick'
import logo from '../../assets/images/loading-logo.webp'
import {ChevronLeft, ChevronRight} from 'lucide-react';

const endpoint = `${import.meta.env.VITE_SHOPIFY_STORE_DOMAIN}/api/${
  import.meta.env.VITE_SHOPIFY_STOREFRONT_API_VERSION
}/graphql.json`

const ProductAds = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  
  const [products, setProducts] = useState([])

  const query1 = `
  {
    products(first: 100) {
    edges {
      cursor
      node {
        id
        title
        description
        handle
        featuredImage
        {
          url
        }
        category
        {
            id
            name
        }
        images(first:10)
        {
          edges{
              cursor
              node{
                  url
              }
          }
        }
        variants(first: 20) {
          edges {
            cursor
            node {
              id
              title
              quantityAvailable
              price {
                amount
                currencyCode
              }
              image{
                url
              }
            }
          }
        }
      }
    }
  }
  }
  `
  const loadProducts = async () => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': import.meta.env.VITE_SHOPIFY_STOREFRONT_API_TOKEN,
      },
      body: JSON.stringify({ query: query1 }),
    })

    const json = await res.json()
    const edges = json?.data?.products?.edges || []
    let _products = []

    for (var i = 0; i < edges.length; i++) {
      let node = edges[i].node
      // let gid=node.id
      // const res1 = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-Shopify-Storefront-Access-Token': import.meta.env.VITE_SHOPIFY_STOREFRONT_API_TOKEN,
      //   },
      //   body: JSON.stringify({ query:`{
      //     node(id: "${gid}") {
      //         ... on Product {
      //           title
      //           handle
      //         }
      //       }
      //   }`}),

      // });
      // const json1 = await res1.json();
      let country = node?.metafield?.references?.nodes[0] || ''
      if (country) {
        country = country.fields[0].value
      }

      let images = node?.images?.edges || []
      let variants = node?.variants?.edges || []
      let imageUrl = node.featuredImage.url

      let productLink = `${
        import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
      }/products/${node.handle}`

      if (
        node.category != null &&
        (node.category.name == 'Baseball Caps' ||
          node.category.name == 'Bucket Hats')
      ) {
        let idx = variants.findIndex(
          (v) => v.node.title == user.countryCode
        )
        if (idx >= 0) {
          let gid = variants[idx].node.id
          let arr = gid.split('/')
          imageUrl = variants[idx].node.image.url
          productLink += `?variant=${arr[arr.length - 1]}`
          // console.log(node.category.name,idx,props.user.countryCode,imageUrl,productLink);
        }
      }
      let product = {
        handle: node.handle,
        title: node.title,
        description: node.description,
        images,
        imageUrl,
        productLink,
      }
      _products.push(product)
    }
    setProducts(_products)
  }

  useEffect(() => {
    loadProducts()
  }, [])
  
  // useEffect(() => {
  //   loadProducts()
  //   if (containerRef.current) {
  //     setWidth(containerRef.current.offsetWidth)
  //   }

  //   const handleResize = () => {
  //     if (containerRef.current) {
  //       setWidth(containerRef.current.offsetWidth)
  //     }
  //   }

  //   window.addEventListener('resize', handleResize)
  //   return () => window.removeEventListener('resize', handleResize)
  // }, [])

  const [activeSlide, setActiveSlide] = useState(0)

  const NextArrow = ({ onClick }) => (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        right: -20,
        transform: 'translateY(-50%)',
        zIndex: 1,
        cursor: 'pointer',
        fontSize: 20,
        color: 'gray',
      }}
    >
      <ChevronRight />
    </div>
  );

  const PrevArrow = ({ onClick }) => (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        left: -20,
        transform: 'translateY(-50%)',
        zIndex: 1,
        cursor: 'pointer',
        fontSize: 20,
        color: 'gray',
      }}
    >
      <ChevronLeft />
    </div>
  );
  
  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 5000,
    afterChange: (current) => setActiveSlide(current),
    beforeChange: (current, next) => {
      setActiveSlide(next)
    },
    variableWidth: true,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  }
  const containerRef = useRef(null)

  return (

    
    <div className="bg-[#fff] border border-[#EBEBEB] rounded-xl p-4 mb-2 shadow-none">
        <div className="flex flex-row items-center product-ads-header">
          <Box>
            <img src={logo} className="h-[48px] object-contain" />
          </Box>
          <div className="text-[22px] pl-3 text-[#181818]" style={{ fontFamily: 'poppins', fontWeight: 700 }}>
            Tariff Social Shop
          </div>
        </div>
      <div ref={containerRef} className="overflow-hidden w-full flex justify-center">
        <Slider {...settings} style={{ width: 230 }} >
          {products.map((p, index) => (
            <div key={index} style={{ width: 230 }}>
              <img
                crossOrigin="anonymous"
                style={{ width: 230, height: 230 }}
                src={p.imageUrl}
              />
            </div>
          ))}
        </Slider>
      </div>
      <div className="w-full text-center">
        <button
          type="button"
          style={{ fontFamily: 'poppins' }}
          className="bg-[#0e2841] text-white px-4 hover:bg-[#1c3b63] cursor-pointer w-3/4 h-[35px] text-[22px] rounded-[50px]"
          onClick={() => {
            let p = products[activeSlide]
            if (!p) return
            window.open(p.productLink)
          }}>
          Shop
        </button>
      </div>
    </div>
  )
}

export default ProductAds;
