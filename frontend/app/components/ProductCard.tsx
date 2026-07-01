// frontend/app/components/ProductCard.tsx
'use client'; // <-- This line makes it a Client Component!

export default function ProductCard({ product }: { product: any }) {
  const handleAddToCart = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
          credentials: 'include', // <-- THIS IS THE FIX
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Item added to cart!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Network error!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className="h-48 w-full rounded-lg mb-4 object-cover"
      />
      <h2 className="text-lg font-semibold text-black">{product.name}</h2>
      <p className="text-gray-700 text-sm">{product.description}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xl font-bold text-black">${product.price}</span>
        <button 
          onClick={handleAddToCart}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}