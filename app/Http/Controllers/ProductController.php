<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Obtener todos los productos.
     */
    public function index(): JsonResponse
    {
        $products = Product::with('category')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Crear un nuevo producto.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Producto creado correctamente.',
            'data' => $product,
        ], 201);
    }

    /**
     * Obtener un producto específico.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Actualizar un producto.
     */
    public function update(
        ProductRequest $request,
        Product $product
    ): JsonResponse {
        $product->update($request->validated());

        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado correctamente.',
            'data' => $product,
        ]);
    }

    /**
     * Eliminar un producto.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Producto eliminado correctamente.',
        ]);
    }
}
