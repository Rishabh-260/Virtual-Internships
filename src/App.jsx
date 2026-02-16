// import { useState, useEffect, useRef, useCallback } from 'react'
// import './App.css'

// const LIMIT = 10

// function App() {
//   const [products, setProducts] = useState([])
//   const [skip, setSkip] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);

//   const observer = useRef()

//   const fetchProducts = async () => {
//     if (loading || !hasMore) return;
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `https://dummyjson.com/products?limit=${LIMIT}&skip=${skip}`
//       );
//       const data = await res.json();
//       if (data.products.length === 0) {
//         setHasMore(false);
//       } else {
//         setProducts((prev) => [...prev, ...data.products]);
//         setSkip((prev) => prev + LIMIT);
//       }
//     } catch (err) {
//       console.error("Error fetching products:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const lastRowRef = useCallback(
//     (node) => {
//       if (loading) return;
//       if (observer.current) observer.current.disconnect();
//       observer.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasMore) {
//           fetchProducts();
//         }
//       });
//       if (node) observer.current.observe(node);
//     },
//     [loading, hasMore]
//   );

//   const handleTitleChange = (id, value) => {
//     setProducts((prev) =>
//       prev.map((p) => (p.id === id ? { ...p, title: value } : p))
//     );
//   };


//   return (
//     <div className="container">
//       <h1>Products Table</h1>
//       <table>
//         <thead>
//           <tr>
//             <th>Title (Editable)</th>
//             <th>Brand</th>
//             <th>Category</th>
//             <th>Price</th>
//             <th>Rating</th>
//           </tr>
//         </thead>
//         <tbody>
//           {products.map((product, index) => {
//             const isLast = index === products.length - 1;
//             return (
//               <tr key={product.id} ref={isLast ? lastRowRef : null}>
//                 <td>
//                   <input
//                     value={product.title}
//                     onChange={(e) =>
//                       handleTitleChange(product.id, e.target.value)
//                     }
//                   />
//                 </td>
//                 <td>{product.brand}</td>
//                 <td>{product.category}</td>
//                 <td>${product.price}</td>
//                 <td>{product.rating}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//       {loading && <p className="loading">Loading more products...</p>}
//       {!hasMore && <p className="loading">No more products</p>}
//     </div>
//   );
// }

// export default App
















































import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const LIMIT = 20

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)

  // We need a ref to hold the IntersectionObserver instance
  const observer = useRef()

  // This callback ref attaches to the very last element in the list.
  // When that element becomes visible, we update 'skip', which triggers the useEffect.
  const lastElementRef = useCallback(
    (node) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setSkip((prevSkip) => prevSkip + LIMIT)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  // This effect handles the actual data fetching whenever 'skip' changes.
  // This separation of concerns prevents "stale closure" bugs.
  useEffect(() => {
    let ignore = false

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://dummyjson.com/products?limit=${LIMIT}&skip=${skip}`
        )
        const data = await response.json()

        if (!ignore) {
          if (data.products.length === 0) {
            setHasMore(false)
          } else {
            setProducts((prev) => {
              // Deduplicate products to handle React StrictMode double-invocations
              const existingIds = new Set(prev.map((p) => p.id))
              const newProducts = data.products.filter(
                (p) => !existingIds.has(p.id)
              )
              return [...prev, ...newProducts]
            })

            // If we've reached the total count, stop trying to load more
            if (data.total && skip + LIMIT >= data.total) {
              setHasMore(false)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      ignore = true
    }
  }, [skip])

  const handleTitleChange = (id, newTitle) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, title: newTitle } : product
      )
    )
  }

  return (
    <div className="app-container">
      <h1>Product List</h1>
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Title (Editable)</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const isLastElement = products.length === index + 1
              return (
                <tr
                  key={product.id}
                  ref={isLastElement ? lastElementRef : null}
                >
                  <td>
                    <input
                      type="text"
                      value={product.title}
                      onChange={(e) =>
                        handleTitleChange(product.id, e.target.value)
                      }
                      className="editable-input"
                    />
                  </td>
                  <td>{product.brand || '-'}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
                  <td>{product.rating}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="status-area">
        {loading && <p>Loading more products...</p>}
        {!hasMore && <p>End of results.</p>}
      </div>
    </div>
  )
}

export default App