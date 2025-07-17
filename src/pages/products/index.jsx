import {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import Product from '../../components/shopify/product'
import {useLocation, useNavigate} from 'react-router'

const endpoint = `${import.meta.env.VITE_SHOPIFY_STORE_DOMAIN}/api/${
    import.meta.env.VITE_SHOPIFY_STOREFRONT_API_VERSION
}/graphql.json`

// metafield(namespace: "shopify", key: "country-of-origin") {
//   references(first:5) {
//       nodes {
//           ... on Metaobject {
//               type
//               fields {
//                   key
//                   value
//               }
//           }
//       }
//   }
// }
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
      
      images(first:1)
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

let lastVisible = null
const Products = () => {
    const dispatch = useDispatch()
    const keyword = useSelector(state => state.post.keyword)
    const unReadMessages = useSelector(state => state.base.unReadMessages)
    const user = useSelector(state => state.user)

    let location = useLocation()
    const [products, setProducts] = useState([])
    const [trendPosts, setTrendPosts] = useState([])
    const navigate = useNavigate()
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        search()
    }, [])

    useEffect(() => {
        setProducts([])
        setIsFetching(false)
        lastVisible = null
    }, [location.pathname, keyword])

    const handleScroll = () => {
        // console.log("scroll",window.innerHeight,document.documentElement.scrollTop,document.documentElement.offsetHeight,isFetching );
        if (
            window.innerHeight + document.documentElement.scrollTop >=
            document.documentElement.offsetHeight - 100 &&
            !isFetching
        ) {
            setIsFetching(true)
        }
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isFetching])

    useEffect(() => {
        if (isFetching) {
            search()
        }
    }, [isFetching])

    const search = async () => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': import.meta.env
                    .VITE_SHOPIFY_STOREFRONT_API_TOKEN,
            },
            body: JSON.stringify({query: query1}),
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
            let imageUrl = node?.images?.edges[0].node.url || ''
            let price = node?.variants?.edges[0].node.price || ''
            let product = {
                handle: node.handle,
                title: node.title,
                description: node.description,
                country,
                imageUrl,
                price,
            }
            _products.push(product)
        }
        setProducts(_products)
    }
    console.log(products)
    return (
        <>
            <div className="grid grid-cols-4 md:flex-row w-full px-4 py-20 gap-6 ">
                {products.map((p, i) => (
                    <Product key={i} {...p}></Product>
                ))}
            </div>
        </>
    )
}

export default Products
