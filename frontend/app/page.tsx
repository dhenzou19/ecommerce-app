// frontend/app/page.tsx
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-10">🛒 Our Collection</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map((product: any) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
            {/* Actual image now! */}
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="h-48 w-full rounded-lg mb-4 object-cover"
            />
            <h2 className="text-lg font-semibold text-black">{product.name}</h2>
            <p className="text-gray-700 text-sm">{product.description}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xl font-bold text-black">${product.price}</span>
              <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}